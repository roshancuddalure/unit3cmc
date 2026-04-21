import { NextFunction, Request, Response } from "express";
import { HttpError } from "../http-error";

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, "The page you were looking for was not found."));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  const statusCode =
    error instanceof HttpError
      ? error.statusCode
      : typeof (error as { statusCode?: unknown })?.statusCode === "number"
        ? Number((error as { statusCode?: number }).statusCode)
        : typeof (error as { status?: unknown })?.status === "number"
          ? Number((error as { status?: number }).status)
          : 500;
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const wantsJson =
    req.originalUrl.startsWith("/api/") ||
    req.xhr ||
    req.is("application/json") === "application/json" ||
    req.accepts(["json", "html"]) === "json";

  if (statusCode >= 500 || !(error instanceof HttpError)) {
    console.error(error);
  }

  if (!wantsJson && req.accepts("html")) {
    res.status(statusCode).render("pages/error", {
      title: "Error",
      statusCode,
      message,
      currentUser: res.locals.currentUser ?? null,
      flash: res.locals.flash ?? null
    });
    return;
  }

  res.status(statusCode).json({ error: message });
}
