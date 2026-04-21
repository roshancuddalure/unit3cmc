import { Router } from "express";
import { requireAuth, requirePermission, setFlash } from "../../shared/middleware/auth";
import { ReviewsService } from "./service";

export function buildReviewsRouter(reviewsService: ReviewsService): Router {
  const router = Router();

  router.get("/", requirePermission("logbook:review"), async (req, res, next) => {
    try {
      const model = await reviewsService.list(req.session.user!);
      res.render("pages/reviews", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/submit", requirePermission("logbook:write"), async (req, res, next) => {
    try {
      await reviewsService.submitWeeklySummary(req.session.user!, req.body.weekStartDate, req.body.weekEndDate);
      setFlash(req, "success", "Weekly summary submitted for review.");
      res.redirect("/logbook");
    } catch (error) {
      next(error);
    }
  });

  router.post("/:submissionId/decision", requireAuth, requirePermission("logbook:review"), async (req, res, next) => {
    try {
      await reviewsService.reviewSubmission(
        req.session.user!,
        String(req.params.submissionId),
        req.body.decision === "returned" ? "returned" : "approved",
        String(req.body.comments ?? "")
      );
      setFlash(req, "success", "Review decision recorded.");
      res.redirect("/reviews");
    } catch (error) {
      next(error);
    }
  });

  return router;
}
