import { Router } from "express";
import { requireAuth, setFlash } from "../../shared/middleware/auth";
import { ProfileService } from "./service";

export function buildProfileRouter(profileService: ProfileService): Router {
  const router = Router();

  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const model = await profileService.getProfile(req.session.user!);
      res.render("pages/profile", model);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireAuth, async (req, res, next) => {
    try {
      const { updatedUser, requestedApproval } = await profileService.updateProfile(req.session.user!, {
        displayName: String(req.body.displayName ?? ""),
        phone: String(req.body.phone ?? ""),
        designation: String(req.body.designation ?? ""),
        department: String(req.body.department ?? ""),
        trainingYear: String(req.body.trainingYear ?? ""),
        employeeOrStudentId: String(req.body.employeeOrStudentId ?? ""),
        joiningDate: String(req.body.joiningDate ?? ""),
        notes: String(req.body.notes ?? "")
      });

      req.session.user = updatedUser;
      setFlash(
        req,
        "success",
        requestedApproval
          ? "Your profile change request has been submitted. An admin or unit chief will review it shortly."
          : "Profile updated successfully."
      );
      res.redirect("/profile");
    } catch (error) {
      next(error);
    }
  });

  router.post("/password", requireAuth, async (req, res, next) => {
    try {
      await profileService.changePassword(req.session.user!, {
        currentPassword: String(req.body.currentPassword ?? ""),
        newPassword: String(req.body.newPassword ?? ""),
        confirmPassword: String(req.body.confirmPassword ?? "")
      });
      req.session.user = {
        ...req.session.user!,
        mustChangePassword: false
      };
      setFlash(req, "success", "Password changed successfully.");
      res.redirect("/profile");
    } catch (error) {
      next(error);
    }
  });

  return router;
}
