import type { IUser } from "@lumieducation/h5p-server";
import { H5PAjaxEndpoint } from "@lumieducation/h5p-server";
import { ContentMetadata } from "@lumieducation/h5p-server/build/src/ContentMetadata";
import {
  contentUserDataExpressRouter,
  finishedDataExpressRouter,
  h5pAjaxExpressRouter
} from "@lumieducation/h5p-express";
import { promises as fs } from "fs";
import multer from "multer";
import { Router, type Request } from "express";
import type { AuditRepository } from "../audit/repository";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { requirePermission, setFlash } from "../../shared/middleware/auth";
import { HttpError } from "../../shared/http-error";
import { H5PRepository } from "./repository";
import { extractWrappedH5PMetadata, isWrappedH5PContentParams, unwrapH5PContentParams } from "./content-params";
import { buildH5PSaveMetadata } from "./save-metadata";
import type { H5PRuntime } from "./setup";
import type { LearningRepository } from "../learning/repository";

function toH5PUser(user: AuthenticatedUser): IUser {
  return {
    email: user.email,
    id: user.id,
    name: user.displayName || user.name,
    type: "local"
  };
}

function normalizeHubContentTypeCache(contentTypeCache: any) {
  const normalizedLibraries = Array.isArray(contentTypeCache?.libraries)
    ? contentTypeCache.libraries.map((library: any) => {
        const majorVersion = Number(library.localMajorVersion ?? library.majorVersion ?? 1);
        const minorVersion = Number(library.localMinorVersion ?? library.minorVersion ?? 0);
        const patchVersion = Number(library.localPatchVersion ?? library.patchVersion ?? 0);
        const machineName = String(library.machineName ?? "");
        const title = String(library.title ?? machineName);
        const summary = String(library.summary ?? library.description ?? "");
        const description = String(library.description ?? summary);

        return {
          ...library,
          id: String(library.id ?? `${machineName}-${majorVersion}-${minorVersion}`),
          machineName,
          title,
          summary,
          description,
          owner: String(library.owner || "Local library"),
          reviewed: typeof library.reviewed === "boolean" ? library.reviewed : true,
          content_type: String(library.content_type ?? title),
          language: String(library.language ?? "en"),
          disciplines: Array.isArray(library.disciplines)
            ? library.disciplines.map((discipline: any) =>
                typeof discipline === "string"
                  ? { id: discipline, name: discipline }
                  : {
                      id: String(discipline?.id ?? discipline?.name ?? "general"),
                      name: String(discipline?.name ?? discipline?.id ?? "General")
                    }
              )
            : [],
          categories: Array.isArray(library.categories) ? library.categories : [],
          keywords: Array.isArray(library.keywords) ? library.keywords : [],
          screenshots: Array.isArray(library.screenshots) ? library.screenshots : [],
          icon: String(library.icon ?? ""),
          localMajorVersion: majorVersion,
          localMinorVersion: minorVersion,
          localPatchVersion: patchVersion,
          majorVersion: Number(library.majorVersion ?? majorVersion),
          minorVersion: Number(library.minorVersion ?? minorVersion),
          patchVersion,
          popularity: Number(library.popularity ?? 0),
          createdAt: Number(library.createdAt ?? 0),
          updatedAt: Number(library.updatedAt ?? 0)
        };
      })
    : [];

  return {
    ...contentTypeCache,
    libraries: normalizedLibraries,
    outdated:
      normalizedLibraries.length > 0 && Boolean(contentTypeCache?.user)
        ? false
        : Boolean(contentTypeCache?.outdated)
  };
}

function normalizeAjaxSuccessPayload(action: string, payload: any) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (action === "content-type-cache") {
    return normalizeHubContentTypeCache(payload);
  }

  if (
    (action === "library-upload" || action === "library-install" || action === "get-content") &&
    payload.data?.contentTypes
  ) {
    return {
      ...payload,
      data: {
        ...payload.data,
        contentTypes: normalizeHubContentTypeCache(payload.data.contentTypes)
      }
    };
  }

  return payload;
}

function normalizeVerb(verb: string): string {
  return String(verb || "").trim().toLowerCase();
}

function getSafeRedirectPath(candidate: unknown, fallback: string): string {
  const value = String(candidate ?? "").trim();
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

function isMissingH5PContentError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "httpStatusCode" in error &&
      Number((error as { httpStatusCode?: number }).httpStatusCode) === 404
  );
}

function getRequestOrigin(req: Request): string {
  const forwardedProto = String(req.headers["x-forwarded-proto"] ?? "").split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol || "http";
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0]?.trim();
  return host ? `${protocol}://${host}` : "";
}

const H5P_CLEAN_STYLES = `
<style>
  /* Remove H5P download link and other technical chrome */
  html.h5p-iframe body > a { display: none !important; }
  /* Hide H5P copyright/reuse/embed action bar if present */
  .h5p-actions { display: none !important; }
  /* Hide content-type title label rendered by some H5P libraries */
  .h5p-content-type-title,
  .h5p-content-copyrights,
  .h5p-embed-code-container { display: none !important; }
</style>`;

function normalizeRenderedHtmlForRequest(html: string, req: Request, runtime: H5PRuntime): string {
  const configuredBaseUrl = String((runtime.config as any).baseUrl ?? "").trim().replace(/\/+$/, "");
  const requestOrigin = getRequestOrigin(req).replace(/\/+$/, "");

  let normalized = configuredBaseUrl && requestOrigin && configuredBaseUrl !== requestOrigin
    ? html.split(configuredBaseUrl).join(requestOrigin)
    : html;

  // Inject styles to strip technical H5P chrome visible to learners
  normalized = normalized.replace("</head>", `${H5P_CLEAN_STYLES}\n</head>`);
  return normalized;
}

async function syncLearningProgress(
  learningRepository: LearningRepository,
  unitId: string,
  userId: string,
  resourceIds: string[],
  verb: string
): Promise<void> {
  const normalizedVerb = normalizeVerb(verb);
  const nextStatus =
    normalizedVerb.includes("completed") || normalizedVerb.includes("passed")
      ? "completed"
      : normalizedVerb.includes("answered") || normalizedVerb.includes("progressed")
        ? "in_progress"
        : null;

  if (!nextStatus) {
    return;
  }

  await Promise.all(resourceIds.map((resourceId) => learningRepository.markProgress(userId, unitId, resourceId, nextStatus)));
}

export function buildH5PApiRouter(
  runtime: H5PRuntime,
  h5pRepository: H5PRepository,
  learningRepository: LearningRepository,
  auditRepository: AuditRepository
): Router {
  const router = Router();
  const upload = multer({ dest: runtime.paths.imports });
  const ajaxUpload = upload.fields([
    { name: "h5p", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]);
  const ajaxBodyOnly = upload.none();
  const ajaxEndpoint = new H5PAjaxEndpoint(runtime.editor);

  const attachH5PUser = (req: any, _res: any, next: any) => {
    req.user = toH5PUser(req.session.user);
    next();
  };

  const buildLegacyLibraryOverview = async (user: IUser) => {
    const contentTypeCache = await runtime.editor.getContentTypeCache(user, "en");
    return (contentTypeCache?.libraries ?? []).map((library: any) => ({
      uberName: `${library.machineName} ${library.localMajorVersion ?? library.majorVersion}.${library.localMinorVersion ?? library.minorVersion}`,
      name: library.machineName,
      title: library.title ?? library.machineName,
      majorVersion: library.localMajorVersion ?? library.majorVersion,
      minorVersion: library.localMinorVersion ?? library.minorVersion,
      restricted: Boolean(library.restricted),
      isOld: Boolean(library.isOld),
      runnable: true,
      tutorialUrl: library.tutorial ?? undefined,
      exampleUrl: library.example ?? undefined
    }));
  };

  router.get("/api/h5p/ajax", requirePermission("learning:manage"), attachH5PUser, async (req: any, res, next) => {
    try {
      if (String(req.query.action ?? "") === "content-type-cache") {
        const contentTypeCache = await runtime.editor.getContentTypeCache(req.user as IUser, String(req.query.language ?? "en"));
        res.json(normalizeAjaxSuccessPayload("content-type-cache", contentTypeCache));
        return;
      }

      if (String(req.query.action ?? "") !== "libraries" || req.query.machineName) {
        return next();
      }

      const libraries = await buildLegacyLibraryOverview(req.user as IUser);
      res.json(libraries);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    "/api/h5p/ajax",
    requirePermission("learning:manage"),
    attachH5PUser,
    (req, res, next) => {
      const action = String(req.query.action ?? "");
      if (action !== "library-upload" && action !== "files" && action !== "filter") {
        return next();
      }

      const parser = action === "filter" ? ajaxBodyOnly : ajaxUpload;
      parser(req, res, (error) => {
        if (error) {
          next(error);
          return;
        }
        next();
      });
    },
    async (req: any, res, next) => {
      const action = String(req.query.action ?? "");
      if (action !== "library-upload" && action !== "files" && action !== "filter") {
        return next();
      }

      const uploadedGroups = req.files as Record<string, Express.Multer.File[]> | undefined;
      const uploadedH5p = uploadedGroups?.h5p?.[0];
      const uploadedFile = uploadedGroups?.file?.[0];

      const toAjaxFile = (file?: Express.Multer.File) =>
        file
          ? {
              name: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              tempFilePath: file.path
            }
          : undefined;

      try {
        const result = await ajaxEndpoint.postAjax(
          action,
          req.body ?? {},
          String(req.query.language ?? req.language ?? "en"),
          req.user,
          toAjaxFile(uploadedFile) as any,
          String(req.query.id ?? ""),
          req.t,
          toAjaxFile(uploadedH5p) as any,
          String(req.query.hubId ?? "")
        );
        res.status(200).send(normalizeAjaxSuccessPayload(action, result));
      } catch (error) {
        next(error);
      } finally {
        await Promise.all(
          [uploadedH5p?.path, uploadedFile?.path]
            .filter((filepath): filepath is string => Boolean(filepath))
            .map(async (filepath) => {
              try {
                await fs.unlink(filepath);
              } catch (_error) {
              }
            })
        );
      }
    }
  );

  const publicAjaxRouter = h5pAjaxExpressRouter(runtime.editor, runtime.paths.core, runtime.paths.editor, {
    routeContentUserData: false,
    routeCoreFiles: true,
    routeEditorCoreFiles: true,
    routeFinishedData: false,
    routeGetAjax: false,
    routeGetContentFile: true,
    routeGetDownload: true,
    routeGetLibraryFile: true,
    routeGetParameters: false,
    routeGetTemporaryContentFile: false,
    routePostAjax: false
  });

  const editorAjaxRouter = h5pAjaxExpressRouter(runtime.editor, runtime.paths.core, runtime.paths.editor, {
    routeContentUserData: false,
    routeCoreFiles: false,
    routeEditorCoreFiles: false,
    routeFinishedData: false,
    routeGetAjax: true,
    routeGetContentFile: false,
    routeGetDownload: false,
    routeGetLibraryFile: false,
    routeGetParameters: true,
    routeGetTemporaryContentFile: true,
    routePostAjax: true
  });

  // Guard: only apply these path-less router.use() calls when the request is
  // actually targeting an H5P asset path. Without this guard the permission
  // checks run on every route in the app (including /profile, /logbook, etc.)
  // and 403 users who don't have the H5P permission.
  const onlyIfH5PPath = (req: any, _res: any, next: any) => {
    if (req.path.startsWith("/api/h5p") || req.path.startsWith("/h5p")) {
      return next();
    }
    return next("router");
  };

  router.use(onlyIfH5PPath, requirePermission("learning:view"), attachH5PUser, publicAjaxRouter);
  router.use(
    runtime.config.contentUserDataUrl,
    requirePermission("learning:view"),
    attachH5PUser,
    contentUserDataExpressRouter(runtime.editor.contentUserDataManager, runtime.config)
  );
  router.use(
    runtime.config.setFinishedUrl,
    requirePermission("learning:view"),
    attachH5PUser,
    finishedDataExpressRouter(runtime.editor.contentUserDataManager, runtime.config)
  );

  router.get(
    `${runtime.config.paramsUrl}/:contentId`,
    requirePermission("learning:manage"),
    attachH5PUser,
    async (req: any, res, next) => {
      try {
        const user = req.session.user!;
        const contentId = await h5pRepository.resolveCanonicalContentId(user.unitId, String(req.params.contentId));
        if (!contentId) {
          throw new HttpError(404, "That H5P content item could not be found.");
        }

        const content = await runtime.editor.getContent(contentId, req.user as IUser);
        res.json({
          ...content,
          params: {
            metadata: content.h5p,
            params: unwrapH5PContentParams(content.params?.params)
          }
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.use(onlyIfH5PPath, requirePermission("learning:manage"), attachH5PUser, editorAjaxRouter);

  router.get("/api/h5p/play/:contentId", requirePermission("learning:view"), async (req, res, next) => {
    try {
      const user = req.session.user!;
      const contentId = await h5pRepository.resolveCanonicalContentId(user.unitId, String(req.params.contentId));
      if (!contentId) {
        throw new HttpError(404, "That H5P content item could not be found.");
      }

      const content = await runtime.editor.getContent(contentId, toH5PUser(user));
      const html = await runtime.player.render(contentId, toH5PUser(user), "en", {
        metadataOverride: content.h5p,
        parametersOverride: unwrapH5PContentParams(content.params?.params)
      });
      res.type("html").send(normalizeRenderedHtmlForRequest(html, req, runtime));
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/h5p/edit/new", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const html = await runtime.editor.render(undefined as unknown as string, "en", toH5PUser(req.session.user!));
      res.type("html").send(normalizeRenderedHtmlForRequest(html, req, runtime));
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/h5p/edit/:contentId", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const user = req.session.user!;
      const contentId = await h5pRepository.resolveCanonicalContentId(user.unitId, String(req.params.contentId));
      if (!contentId) {
        throw new HttpError(404, "That H5P content item could not be found.");
      }

      const html = await runtime.editor.render(contentId, "en", toH5PUser(user));
      res.type("html").send(normalizeRenderedHtmlForRequest(html, req, runtime));
    } catch (error) {
      next(error);
    }
  });

  const saveHandler = async (req: any, res: any, next: any, currentContentId?: string) => {
    try {
      const user = req.session.user!;
      const h5pUser = toH5PUser(user);
      const canonicalContentId =
        currentContentId ? await h5pRepository.resolveCanonicalContentId(user.unitId, currentContentId) : null;

      const library = String(req.body.library ?? "").trim();
      const wrappedMetadata = extractWrappedH5PMetadata(req.body.params);
      const params = unwrapH5PContentParams(req.body.params);
      const rawTitle = String(req.body?.metadata?.title ?? wrappedMetadata.title ?? "").trim();
      const rawDescription = String(req.body?.metadata?.metaDescription ?? wrappedMetadata.metaDescription ?? "").trim();
      const title = rawTitle || String(wrappedMetadata.title ?? "").trim() || "Untitled H5P activity";
      const description = rawDescription || "";

      if (!library) {
        throw new HttpError(400, "A main H5P library is required before saving.");
      }

      const existingMetadata = canonicalContentId ? (await runtime.editor.getContent(canonicalContentId, h5pUser)).h5p : {};
      const metadata = buildH5PSaveMetadata(
        {
          ...wrappedMetadata,
          ...(existingMetadata as unknown as Record<string, unknown>)
        },
        {
          title,
          metaDescription: rawDescription || undefined,
          mainLibrary: library.split(" ")[0]
        }
      );

      const saved = await runtime.editor.saveOrUpdateContentReturnMetaData(
        (canonicalContentId ?? undefined) as unknown as string,
        params,
        metadata,
        library,
        h5pUser
      );

      if (canonicalContentId && canonicalContentId !== saved.id) {
        await h5pRepository.createAlias(canonicalContentId, saved.id);
      }

      await h5pRepository.upsertContent({
        contentId: saved.id,
        unitId: user.unitId,
        title: metadata.title,
        libraryName: library,
        parametersJson: params,
        metadataJson: saved.metadata,
        createdByUserId: user.id
      });

      await h5pRepository.ensureLearningResource({
        unitId: user.unitId,
        createdByUserId: user.id,
        contentId: saved.id,
        title: metadata.title,
        description,
        metadataJson: saved.metadata
      });

      await auditRepository.record({
        actorUserId: user.id,
        action: canonicalContentId ? "h5p.content_updated" : "h5p.content_created",
        entityType: "h5p_content",
        entityId: saved.id,
        metadata: { title: metadata.title, library }
      });

      res.json({ contentId: saved.id });
    } catch (error) {
      next(error);
    }
  };

  router.post("/api/h5p/edit/new", requirePermission("learning:manage"), (req, res, next) => saveHandler(req, res, next));
  router.post("/api/h5p/edit/:contentId", requirePermission("learning:manage"), (req, res, next) =>
    saveHandler(req, res, next, String(req.params.contentId))
  );

  router.post("/api/h5p/import", requirePermission("learning:manage"), upload.single("h5pPackage"), async (req, res, next) => {
    try {
      const user = req.session.user!;
      const h5pUser = toH5PUser(user);
      if (!req.file?.path) {
        throw new HttpError(400, "Choose a .h5p package to import.");
      }

      const imported = await runtime.editor.uploadPackage(req.file.path, h5pUser);
      if (!imported.parameters || !imported.metadata) {
        throw new HttpError(400, "The package installed libraries but did not include importable content.");
      }

      const importedMetadata = buildH5PSaveMetadata(imported.metadata as unknown as Record<string, unknown>);
      const saved = await runtime.editor.saveOrUpdateContentReturnMetaData(
        undefined as unknown as string,
        imported.parameters,
        importedMetadata,
        ContentMetadata.toUbername(importedMetadata),
        h5pUser
      );

      await h5pRepository.upsertContent({
        contentId: saved.id,
        unitId: user.unitId,
        title: saved.metadata.title,
        libraryName: ContentMetadata.toUbername(saved.metadata),
        parametersJson: imported.parameters,
        metadataJson: saved.metadata,
        createdByUserId: user.id
      });

      await h5pRepository.ensureLearningResource({
        unitId: user.unitId,
        createdByUserId: user.id,
        contentId: saved.id,
        title: saved.metadata.title,
        description: saved.metadata.metaDescription ?? "",
        metadataJson: saved.metadata
      });

      await auditRepository.record({
        actorUserId: user.id,
        action: "h5p.package_imported",
        entityType: "h5p_content",
        entityId: saved.id,
        metadata: { title: saved.metadata.title }
      });

      setFlash(req, "success", "H5P package imported and linked to the learning library.");
      res.redirect("/h5p/studio");
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/h5p/content-list", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      res.json({ items: await h5pRepository.listContent(req.session.user!.unitId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/h5p/xapi", requirePermission("learning:view"), async (req, res, next) => {
    try {
      const user = req.session.user!;
      const contentId = await h5pRepository.resolveCanonicalContentId(user.unitId, String(req.body.contentId ?? ""));
      if (!contentId) {
        throw new HttpError(404, "Unknown H5P content reference.");
      }

      await h5pRepository.recordXapiEvent({
        unitId: user.unitId,
        userId: user.id,
        contentId,
        verb: String(req.body.verb ?? "unknown"),
        resultJson: req.body.result ?? {},
        statementJson: req.body.statement ?? {}
      });

      await learningRepository.recordAcademyItemXapiAttempt({
        unitId: user.unitId,
        userId: user.id,
        academyItemId: String(req.body.academyItemId ?? "").trim() || null,
        contentId,
        verb: String(req.body.verb ?? "unknown"),
        resultJson: req.body.result ?? {},
        statementJson: req.body.statement ?? {}
      });

      const linkedResourceIds = await h5pRepository.getLinkedLearningResourceIds(user.unitId, contentId);
      await syncLearningProgress(learningRepository, user.unitId, user.id, linkedResourceIds, String(req.body.verb ?? ""));

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/h5p/diag/health", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const health = await h5pRepository.getHealth(req.session.user!.unitId);
      const installedLibraries = await runtime.editor.libraryStorage.getInstalledLibraryNames();
      const contentTypeCache = await runtime.editor.getContentTypeCache(toH5PUser(req.session.user!), "en");
      res.json({
        ok: true,
        ...health,
        paths: {
          root: runtime.paths.root,
          coreExists: true,
          editorExists: true,
          librariesPath: runtime.paths.libraries,
          contentPath: runtime.paths.content
        },
        installedLibraryCount: installedLibraries.length,
        installedContentTypeCount: Array.isArray(contentTypeCache?.libraries) ? contentTypeCache.libraries.length : 0
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/h5p/diag/dependencies/:contentId", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const user = req.session.user!;
      const contentId = await h5pRepository.resolveCanonicalContentId(user.unitId, String(req.params.contentId));
      if (!contentId) {
        throw new HttpError(404, "That H5P content item could not be found.");
      }

      const content = await runtime.editor.getContent(contentId, toH5PUser(user));
      res.json({
        ok: true,
        contentId,
        library: content.library,
        title: content.h5p.title,
        metadata: content.h5p,
        hasParameters: Boolean(unwrapH5PContentParams(content.params?.params)),
        isWrappedParameters: isWrappedH5PContentParams(content.params?.params)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/h5p/diag/xapi-unknown", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      res.json({
        ok: true,
        items: await h5pRepository.listUnknownXapiReferences(req.session.user!.unitId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function buildH5PStudioRouter(
  h5pRepository: H5PRepository,
  runtime: H5PRuntime,
  auditRepository: AuditRepository
): Router {
  const router = Router();

  router.get("/studio", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const contentTypeCache = await runtime.editor.getContentTypeCache(toH5PUser(req.session.user!), "en");
      const installedLibraryCount = Array.isArray(contentTypeCache?.libraries) ? contentTypeCache.libraries.length : 0;
      res.render("pages/h5p-studio", {
        title: "H5P Studio",
        items: await h5pRepository.listContent(req.session.user!.unitId),
        installedLibraryCount
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/studio/:contentId/resource", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const status = String(req.body.status ?? "published");
      await h5pRepository.updateLinkedResourceStatus(req.session.user!.unitId, String(req.params.contentId), status);
      setFlash(req, "success", "Linked learning-resource status updated.");
      res.redirect("/h5p/studio");
    } catch (error) {
      next(error);
    }
  });

  router.post("/studio/:contentId/delete", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const user = req.session.user!;
      const requestedContentId = String(req.params.contentId);
      const canonicalContentId = await h5pRepository.resolveCanonicalContentId(user.unitId, requestedContentId);
      if (!canonicalContentId) {
        throw new HttpError(404, "That H5P content item could not be found.");
      }

      const deletionScope = await h5pRepository.getDeletionScope(user.unitId, canonicalContentId);
      if (!deletionScope) {
        throw new HttpError(404, "That H5P content item could not be found.");
      }

      for (const relatedContentId of deletionScope.relatedContentIds) {
        try {
          await runtime.editor.deleteContent(relatedContentId, toH5PUser(user));
        } catch (error) {
          if (!isMissingH5PContentError(error)) {
            throw error;
          }
        }
      }

      const deletedCounts = await h5pRepository.deleteContentGraph(user.unitId, deletionScope.relatedContentIds);

      await auditRepository.record({
        actorUserId: user.id,
        action: "h5p.content_deleted",
        entityType: "h5p_content",
        entityId: canonicalContentId,
        metadata: {
          title: deletionScope.title,
          deletedContentCount: deletedCounts.deletedContentCount,
          deletedLearningResourceCount: deletedCounts.deletedLearningResourceCount,
          deletedXapiEventCount: deletedCounts.deletedXapiEventCount
        }
      });

      setFlash(req, "success", `Deleted "${deletionScope.title}" and its linked learning-library item.`);
      res.redirect(getSafeRedirectPath(req.body.redirectTo, "/h5p/studio"));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
