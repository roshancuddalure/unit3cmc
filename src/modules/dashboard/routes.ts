import { Router } from "express";
import { requirePermission } from "../../shared/middleware/auth";
import { DashboardService } from "./service";

export function buildDashboardRouter(dashboardService: DashboardService): Router {
  const router = Router();

  router.get("/", requirePermission("dashboard:view"), async (req, res, next) => {
    try {
      const model = await dashboardService.getHome(req.session.user!);
      res.render("pages/dashboard", model);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
