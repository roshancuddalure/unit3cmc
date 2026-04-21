import { Router } from "express";
import { HttpError } from "../../shared/http-error";
import { setFlash } from "../../shared/middleware/auth";
import { AuthService } from "./service";
import { LoginThrottleService } from "./login-throttle";

export function buildAuthRouter(authService: AuthService, loginThrottleService: LoginThrottleService): Router {
  const router = Router();

  router.get("/login", (req, res) => {
    if (req.session.user) {
      if (req.session.user.status === "active") {
        res.redirect("/dashboard");
        return;
      }

      delete req.session.user;
    }

    res.render("pages/login", { title: "Sign in" });
  });

  router.get("/register", (req, res) => {
    if (req.session.user) {
      if (req.session.user.status === "active") {
        res.redirect("/dashboard");
        return;
      }

      delete req.session.user;
    }

    res.render("pages/register", { title: "Register" });
  });

  router.post("/login", async (req, res, next) => {
    try {
      const identity = String(req.body.identity ?? "");
      const ipAddress = req.ip || req.socket.remoteAddress || "unknown";

      loginThrottleService.assertCanAttempt(identity, ipAddress);

      const user = await authService.signIn(identity, req.body.password);
      loginThrottleService.recordSuccess(identity, ipAddress);
      req.session.user = user;
      if (user.mustChangePassword) {
        setFlash(req, "info", "Please set a new password before returning to the workspace.");
        res.redirect("/profile");
        return;
      }

      setFlash(req, "success", `Welcome back, ${user.displayName}.`);
      res.redirect("/dashboard");
    } catch (error) {
      if (error instanceof HttpError && error.statusCode === 401) {
        const identity = String(req.body.identity ?? "");
        const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
        loginThrottleService.recordFailure(identity, ipAddress);
      }
      next(error);
    }
  });

  router.post("/register", async (req, res, next) => {
    try {
      await authService.register({
        username: String(req.body.username ?? ""),
        name: String(req.body.name ?? ""),
        email: String(req.body.email ?? ""),
        password: String(req.body.password ?? ""),
        phone: String(req.body.phone ?? ""),
        designation: String(req.body.designation ?? ""),
        department: String(req.body.department ?? ""),
        trainingYear: String(req.body.trainingYear ?? ""),
        employeeOrStudentId: String(req.body.employeeOrStudentId ?? "")
      });
      setFlash(req, "success", "Registration submitted. Your account will be available after Unit 3 administration approves it.");
      res.redirect("/auth/login");
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", (req, res, next) => {
    req.session.destroy((error) => {
      if (error) {
        next(error);
        return;
      }

      res.clearCookie("unit3.sid");
      res.redirect("/auth/login");
    });
  });

  return router;
}
