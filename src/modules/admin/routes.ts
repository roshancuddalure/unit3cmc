import { Router } from "express";
import { requirePermission, setFlash } from "../../shared/middleware/auth";
import { AdminService } from "./service";

export function buildAdminRouter(adminService: AdminService): Router {
  const router = Router();

  router.get("/", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      const model = await adminService.getOverview(req.session.user!);
      res.render("pages/admin", model);
    } catch (error) {
      next(error);
    }
  });

  router.get("/users/:userId", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      const model = await adminService.getUserDetail(req.session.user!, String(req.params.userId));
      res.render("pages/admin-user-detail", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/role", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      await adminService.updateRole(
        req.session.user!,
        String(req.params.userId),
        String(req.body.roleKey ?? "")
      );
      setFlash(req, "success", "User role updated.");
      res.redirect("/admin");
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/status", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      const status =
        req.body.status === "active" || req.body.status === "suspended" || req.body.status === "archived"
          ? req.body.status
          : "active";
      await adminService.updateStatus(req.session.user!, String(req.params.userId), status);
      setFlash(req, "success", `User status updated to ${status}.`);
      res.redirect("/admin");
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/profile", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      await adminService.updateUserProfile(req.session.user!, String(req.params.userId), {
        displayName: String(req.body.displayName ?? ""),
        phone: String(req.body.phone ?? ""),
        designation: String(req.body.designation ?? ""),
        department: String(req.body.department ?? ""),
        trainingYear: String(req.body.trainingYear ?? ""),
        employeeOrStudentId: String(req.body.employeeOrStudentId ?? ""),
        joiningDate: String(req.body.joiningDate ?? ""),
        notes: String(req.body.notes ?? "")
      });
      setFlash(req, "success", "User profile updated.");
      res.redirect(`/admin/users/${String(req.params.userId)}`);
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/password", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      await adminService.setUserPassword(req.session.user!, String(req.params.userId), {
        newPassword: String(req.body.newPassword ?? ""),
        confirmPassword: String(req.body.confirmPassword ?? "")
      });
      setFlash(req, "success", "User password updated.");
      res.redirect(`/admin/users/${String(req.params.userId)}`);
    } catch (error) {
      next(error);
    }
  });

  router.post("/profile-requests/:requestId/review", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      const decision = req.body.decision === "approved" ? "approved" : "rejected";
      const reviewerNotes = String(req.body.reviewerNotes ?? "").trim();
      await adminService.reviewProfileRequest(req.session.user!, String(req.params.requestId), decision, reviewerNotes);
      setFlash(req, "success", decision === "approved" ? "Profile change approved and applied." : "Profile change request rejected.");
      res.redirect("/admin");
    } catch (error) {
      next(error);
    }
  });

  router.post("/users/:userId/case-review-access", requirePermission("admin:manage"), async (req, res, next) => {
    try {
      await adminService.updateCaseReviewAccess(
        req.session.user!,
        String(req.params.userId),
        String(req.body.canReviewCases ?? "") === "true"
      );
      setFlash(req, "success", "Case review access updated.");
      res.redirect(`/admin/users/${String(req.params.userId)}`);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
