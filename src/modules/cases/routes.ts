import { Router } from "express";
import { requirePermission, setFlash } from "../../shared/middleware/auth";
import { CasesService } from "./service";

export function buildCasesRouter(casesService: CasesService): Router {
  const router = Router();

  const toArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (typeof value === "string" && value.trim()) {
      return [value];
    }

    return [];
  };

  router.get("/", requirePermission("cases:view"), async (req, res, next) => {
    try {
      const model = await casesService.list(req.session.user!, {
        search: typeof req.query.search === "string" ? req.query.search : "",
        specialtyArea: typeof req.query.specialtyArea === "string" ? req.query.specialtyArea : "",
        anaesthesiaTechnique: typeof req.query.anaesthesiaTechnique === "string" ? req.query.anaesthesiaTechnique : "",
        urgency: typeof req.query.urgency === "string" ? req.query.urgency : "",
        complexityLevel: typeof req.query.complexityLevel === "string" ? req.query.complexityLevel : "",
        contributorUserId: typeof req.query.contributorUserId === "string" ? req.query.contributorUserId : ""
      });
      res.render("pages/cases", model);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:caseId", requirePermission("cases:view"), async (req, res, next) => {
    try {
      const model = await casesService.detail(req.session.user!, String(req.params.caseId));
      res.render("pages/case-detail", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requirePermission("cases:write"), async (req, res, next) => {
    try {
      const tags = (req.body.tags ?? "")
        .split(",")
        .map((tag: string) => tag.trim())
        .filter(Boolean);

      await casesService.create(req.session.user!, {
        title: String(req.body.title ?? ""),
        subtitle: String(req.body.subtitle ?? ""),
        summary: String(req.body.summary ?? ""),
        learningPoints: String(req.body.learningPoints ?? ""),
        whyThisCaseMatters: String(req.body.whyThisCaseMatters ?? ""),
        keyDecisionPoints: String(req.body.keyDecisionPoints ?? ""),
        whatWentWell: String(req.body.whatWentWell ?? ""),
        whatCouldImprove: String(req.body.whatCouldImprove ?? ""),
        takeHomePoints: String(req.body.takeHomePoints ?? ""),
        specialtyArea: String(req.body.specialtyArea ?? "other"),
        anaesthesiaTechnique: String(req.body.anaesthesiaTechnique ?? "other"),
        urgency: String(req.body.urgency ?? "elective"),
        patientAgeBand: String(req.body.patientAgeBand ?? "not_recorded"),
        complexityLevel: String(req.body.complexityLevel ?? "routine"),
        setting: String(req.body.setting ?? "other"),
        hadCriticalEvent: String(req.body.hadCriticalEvent ?? "no") === "yes",
        status: req.body.action === "save_draft" ? "draft" : "submitted",
        tags,
        contributorUserIds: toArray(req.body.contributorUserIds),
        relatedDocumentIds: toArray(req.body.relatedDocumentIds),
        relatedLearningResourceIds: toArray(req.body.relatedLearningResourceIds)
      });
      setFlash(req, "success", req.body.action === "save_draft" ? "Case draft saved." : "Case submitted.");
      res.redirect("/cases");
    } catch (error) {
      next(error);
    }
  });

  router.post("/:caseId/comments", requirePermission("cases:view"), async (req, res, next) => {
    try {
      await casesService.addComment(req.session.user!, String(req.params.caseId), {
        comment: String(req.body.comment ?? ""),
        commentType: req.body.commentType === "suggestion" ? "suggestion" : "note"
      });
      setFlash(req, "success", "Comment saved.");
      res.redirect(`/cases/${String(req.params.caseId)}`);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:caseId/status", requirePermission("cases:view"), async (req, res, next) => {
    try {
      await casesService.updateStatus(req.session.user!, String(req.params.caseId), String(req.body.status ?? ""));
      setFlash(req, "success", "Case status updated.");
      res.redirect(`/cases/${String(req.params.caseId)}`);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:caseId/featured", requirePermission("cases:view"), async (req, res, next) => {
    try {
      await casesService.updateFeatured(
        req.session.user!,
        String(req.params.caseId),
        String(req.body.isFeatured ?? "false") === "true"
      );
      setFlash(req, "success", "Featured status updated.");
      res.redirect(`/cases/${String(req.params.caseId)}`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
