import { NextFunction, Request, Response } from "express";
import { HttpError } from "../http-error";
import { hasPermission } from "../permissions";
import type { UserStatus } from "../types/domain";

function ensureActive(userStatus: UserStatus | undefined, req: Request, res: Response, next: NextFunction): boolean {
  if (userStatus === "active") {
    return true;
  }

  const message =
    userStatus === "pending"
      ? "Your account is awaiting approval before you can access the workspace."
      : userStatus === "suspended"
        ? "Your account is currently suspended. Please contact Unit 3 administration."
        : "This account is inactive and cannot access the workspace.";

  req.session.flash = { type: "info", message };
  delete req.session.user;

  if (req.accepts("html")) {
    res.redirect("/auth/login");
    return false;
  }

  next(new HttpError(403, message));
  return false;
}

function ensurePasswordCurrent(
  mustChangePassword: boolean | undefined,
  req: Request,
  res: Response,
  next: NextFunction
): boolean {
  if (!mustChangePassword) {
    return true;
  }

  const isPasswordAllowedRoute =
    req.originalUrl.startsWith("/profile") || req.originalUrl.startsWith("/auth/logout");

  if (isPasswordAllowedRoute) {
    return true;
  }

  const message = "Please change the password set by administration before continuing to the workspace.";
  req.session.flash = { type: "info", message };

  if (req.accepts("html")) {
    res.redirect("/profile");
    return false;
  }

  next(new HttpError(403, message));
  return false;
}

export function attachViewLocals(req: Request, res: Response, next: NextFunction): void {
  res.locals.currentUser = req.session.user;
  res.locals.flash = req.session.flash;
  res.locals.currentPath = req.path;
  res.locals.hasPermission = (permission: string) =>
    Boolean(req.session.user && hasPermission(req.session.user.role, permission));
  delete req.session.flash;
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.session.user) {
    if (req.accepts("html")) {
      _res.redirect("/auth/login");
      return;
    }

    next(new HttpError(401, "Please sign in to continue."));
    return;
  }

  if (!ensureActive(req.session.user.status, req, _res, next)) {
    return;
  }

  if (!ensurePasswordCurrent(req.session.user.mustChangePassword, req, _res, next)) {
    return;
  }

  next();
}

export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.session.user;

    if (!user) {
      if (req.accepts("html")) {
        _res.redirect("/auth/login");
        return;
      }

      next(new HttpError(401, "Please sign in to continue."));
      return;
    }

    if (!ensureActive(user.status, req, _res, next)) {
      return;
    }

    if (!ensurePasswordCurrent(user.mustChangePassword, req, _res, next)) {
      return;
    }

    if (!hasPermission(user.role, permission)) {
      next(new HttpError(403, "You do not have permission to access this page."));
      return;
    }

    next();
  };
}

export function setFlash(req: Request, type: "success" | "error" | "info", message: string): void {
  req.session.flash = { type, message };
}
