import { Request, Response, Router } from "express";
import { requirePermission, setFlash } from "../../shared/middleware/auth";
import { LearningService } from "./service";

function redirectBackToLearning(req: Request, res: Response): void {
  const referer = req.get("referer");
  if (!referer) {
    res.redirect("/learning");
    return;
  }

  try {
    const target = new URL(referer);
    res.redirect(`${target.pathname}${target.search}`.startsWith("/learning") ? `${target.pathname}${target.search}` : "/learning");
  } catch {
    res.redirect("/learning");
  }
}

export function buildLearningRouter(learningService: LearningService): Router {
  const router = Router();

  router.get("/", requirePermission("learning:view"), async (req, res, next) => {
    try {
      const model = await learningService.list(req.session.user!, {
        programId: typeof req.query.programId === "string" ? req.query.programId : undefined
      });
      res.render("pages/learning", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.create(req.session.user!, req.body.title, req.body.resourceType, req.body.url);
      setFlash(req, "success", "Learning resource published.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/programs", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      const programId = await learningService.createProgram(
        req.session.user!,
        String(req.body.title ?? ""),
        String(req.body.description ?? ""),
        String(req.body.status ?? "draft")
      );
      setFlash(req, "success", "Academy program created.");
      res.redirect(`/learning?programId=${encodeURIComponent(programId)}`);
    } catch (error) {
      next(error);
    }
  });

  router.post("/programs/:programId/update", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.updateProgram(
        req.session.user!,
        String(req.params.programId),
        String(req.body.title ?? ""),
        String(req.body.description ?? ""),
        String(req.body.status ?? "draft")
      );
      setFlash(req, "success", "Program settings updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/programs/:programId/delete", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.deleteProgram(req.session.user!, String(req.params.programId));
      setFlash(req, "success", "Academy program deleted.");
      res.redirect("/learning");
    } catch (error) {
      next(error);
    }
  });

  router.post("/programs/:programId/chapters", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.createChapter(
        req.session.user!,
        String(req.params.programId),
        String(req.body.title ?? ""),
        String(req.body.summary ?? ""),
        String(req.body.status ?? "draft")
      );
      setFlash(req, "success", "Chapter added to the academy structure.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/chapters/:chapterId/update", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.updateChapter(
        req.session.user!,
        String(req.params.chapterId),
        String(req.body.title ?? ""),
        String(req.body.summary ?? ""),
        String(req.body.status ?? "draft")
      );
      setFlash(req, "success", "Chapter updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/chapters/:chapterId/move", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.moveChapter(
        req.session.user!,
        String(req.params.chapterId),
        String(req.body.direction ?? "")
      );
      setFlash(req, "success", "Chapter order updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/chapters/:chapterId/delete", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.deleteChapter(req.session.user!, String(req.params.chapterId));
      setFlash(req, "success", "Chapter removed from the academy.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/chapters/:chapterId/subchapters", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.createSubchapter(
        req.session.user!,
        String(req.params.chapterId),
        String(req.body.title ?? ""),
        String(req.body.summary ?? ""),
        String(req.body.status ?? "draft")
      );
      setFlash(req, "success", "Subchapter added.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/subchapters/:subchapterId/update", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.updateSubchapter(
        req.session.user!,
        String(req.params.subchapterId),
        String(req.body.title ?? ""),
        String(req.body.summary ?? ""),
        String(req.body.status ?? "draft")
      );
      setFlash(req, "success", "Subchapter updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/subchapters/:subchapterId/move", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.moveSubchapter(
        req.session.user!,
        String(req.params.subchapterId),
        String(req.body.direction ?? "")
      );
      setFlash(req, "success", "Subchapter order updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/subchapters/:subchapterId/delete", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.deleteSubchapter(req.session.user!, String(req.params.subchapterId));
      setFlash(req, "success", "Subchapter removed.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/subchapters/:subchapterId/items", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.placeResource(
        req.session.user!,
        String(req.params.subchapterId),
        String(req.body.learningResourceId ?? ""),
        String(req.body.titleOverride ?? ""),
        String(req.body.isRequired ?? "true"),
        String(req.body.isAssessment ?? "false"),
        String(req.body.estimatedMinutes ?? "0")
      );
      setFlash(req, "success", "Learning item placed into the academy.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/items/:academyItemId/update", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.updateAcademyItem(req.session.user!, String(req.params.academyItemId), {
        titleOverride: String(req.body.titleOverride ?? ""),
        isRequired: String(req.body.isRequired ?? "true"),
        isAssessment: String(req.body.isAssessment ?? "false"),
        estimatedMinutes: String(req.body.estimatedMinutes ?? "0"),
        status: String(req.body.status ?? "draft"),
        subchapterId: String(req.body.subchapterId ?? "")
      });
      setFlash(req, "success", "Learning item updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/items/:academyItemId/move", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.moveAcademyItem(
        req.session.user!,
        String(req.params.academyItemId),
        String(req.body.direction ?? "")
      );
      setFlash(req, "success", "Learning item order updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/items/:academyItemId/delete", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.deleteAcademyItem(req.session.user!, String(req.params.academyItemId));
      setFlash(req, "success", "Learning item removed from the roadmap.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:resourceId/progress", requirePermission("learning:view"), async (req, res, next) => {
    try {
      await learningService.markProgress(req.session.user!, String(req.params.resourceId), String(req.body.status ?? ""));
      setFlash(req, "success", "Progress updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/items/:academyItemId/progress", requirePermission("learning:view"), async (req, res, next) => {
    try {
      await learningService.markAcademyItemProgress(
        req.session.user!,
        String(req.params.academyItemId),
        String(req.body.status ?? "")
      );
      setFlash(req, "success", "Roadmap item progress updated.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cohorts", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.createCohort(
        req.session.user!,
        String(req.body.title ?? ""),
        String(req.body.description ?? ""),
        String(req.body.audienceKind ?? "mixed"),
        String(req.body.status ?? "active")
      );
      setFlash(req, "success", "Cohort created.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cohorts/:cohortId/members", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.addCohortMember(
        req.session.user!,
        String(req.params.cohortId),
        String(req.body.userId ?? "")
      );
      setFlash(req, "success", "User added to cohort.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/cohorts/:cohortId/members/:userId/remove", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.removeCohortMember(
        req.session.user!,
        String(req.params.cohortId),
        String(req.params.userId)
      );
      setFlash(req, "success", "User removed from cohort.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/programs/:programId/audiences", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.assignProgramAudience(
        req.session.user!,
        String(req.params.programId),
        String(req.body.accessScope ?? "open"),
        String(req.body.roleKey ?? ""),
        String(req.body.cohortId ?? ""),
        String(req.body.userId ?? "")
      );
      setFlash(req, "success", "Program access rule saved.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  router.post("/program-audiences/:audienceId/remove", requirePermission("learning:manage"), async (req, res, next) => {
    try {
      await learningService.removeProgramAudience(req.session.user!, String(req.params.audienceId));
      setFlash(req, "success", "Program access rule removed.");
      redirectBackToLearning(req, res);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
