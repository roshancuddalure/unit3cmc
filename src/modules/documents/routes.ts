import multer from "multer";
import { Router } from "express";
import { requirePermission, setFlash } from "../../shared/middleware/auth";
import { DocumentsService } from "./service";

const upload = multer({ storage: multer.memoryStorage() });

export function buildDocumentsRouter(documentsService: DocumentsService): Router {
  const router = Router();

  router.get("/", requirePermission("documents:view"), async (req, res, next) => {
    try {
      const model = await documentsService.list(req.session.user!, {
        search: typeof req.query.search === "string" ? req.query.search : "",
        category: typeof req.query.category === "string" ? req.query.category : "",
        status: typeof req.query.status === "string" ? req.query.status : ""
      });
      res.render("pages/documents", model);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:documentId", requirePermission("documents:view"), async (req, res, next) => {
    try {
      const model = await documentsService.detail(req.session.user!, String(req.params.documentId));
      res.render("pages/document-detail", model);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:documentId/view", requirePermission("documents:view"), async (req, res, next) => {
    try {
      const model = await documentsService.detail(req.session.user!, String(req.params.documentId));
      res.render("partials/document-modal-content", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requirePermission("documents:write"), upload.single("documentFile"), async (req, res, next) => {
    try {
      await documentsService.createSop(req.session.user!, {
        title: String(req.body.title ?? ""),
        subtitle: String(req.body.subtitle ?? ""),
        category: String(req.body.category ?? ""),
        scopeArea: String(req.body.scopeArea ?? ""),
        visibility: String(req.body.visibility ?? "unit_internal"),
        effectiveDate: String(req.body.effectiveDate ?? ""),
        reviewDueDate: String(req.body.reviewDueDate ?? ""),
        versionNotes: String(req.body.versionNotes ?? ""),
        changeSummary: String(req.body.changeSummary ?? ""),
        contentHtml: String(req.body.contentHtml ?? ""),
        action: String(req.body.action ?? "save_draft"),
        file: req.file ?? undefined
      });
      setFlash(req, "success", "SOP saved successfully.");
      res.redirect("/documents");
    } catch (error) {
      next(error);
    }
  });

  router.post("/:documentId/versions", requirePermission("documents:write"), upload.single("documentFile"), async (req, res, next) => {
    try {
      await documentsService.appendVersion(req.session.user!, {
        documentId: String(req.params.documentId),
        versionNotes: String(req.body.versionNotes ?? ""),
        changeSummary: String(req.body.changeSummary ?? ""),
        contentHtml: String(req.body.contentHtml ?? ""),
        action: String(req.body.action ?? "save_draft"),
        file: req.file ?? undefined
      });
      setFlash(req, "success", "SOP revision saved.");
      res.redirect(`/documents/${String(req.params.documentId)}`);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:documentId/review", requirePermission("documents:review"), async (req, res, next) => {
    try {
      await documentsService.reviewDecision(req.session.user!, {
        documentId: String(req.params.documentId),
        decision:
          req.body.decision === "changes_requested" ||
          req.body.decision === "approved" ||
          req.body.decision === "published" ||
          req.body.decision === "archived"
            ? req.body.decision
            : "changes_requested",
        comments: String(req.body.comments ?? "")
      });
      setFlash(req, "success", "SOP workflow decision recorded.");
      res.redirect(`/documents/${String(req.params.documentId)}`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
