import express from "express";
import path from "path";
import { loadEnv, type AppEnv } from "./config/env";
import { buildSessionMiddleware } from "./config/session";
import { AdminRepository } from "./modules/admin/repository";
import { AdminService } from "./modules/admin/service";
import { buildAdminRouter } from "./modules/admin/routes";
import { AuditRepository } from "./modules/audit/repository";
import { AuthRepository } from "./modules/auth/repository";
import { AuthService } from "./modules/auth/service";
import { buildAuthRouter } from "./modules/auth/routes";
import { LoginThrottleService } from "./modules/auth/login-throttle";
import { buildCasesRouter } from "./modules/cases/routes";
import { CasesRepository } from "./modules/cases/repository";
import { CasesService } from "./modules/cases/service";
import { DashboardRepository } from "./modules/dashboard/repository";
import { DashboardService } from "./modules/dashboard/service";
import { buildDashboardRouter } from "./modules/dashboard/routes";
import { buildDocumentsRouter } from "./modules/documents/routes";
import { DocumentsRepository } from "./modules/documents/repository";
import { DocumentsService } from "./modules/documents/service";
import { LocalDevStorage, S3ObjectStorage } from "./modules/documents/storage";
import { buildLearningRouter } from "./modules/learning/routes";
import { LearningRepository } from "./modules/learning/repository";
import { LearningService } from "./modules/learning/service";
import { H5PRepository } from "./modules/h5p/repository";
import { buildH5PApiRouter, buildH5PStudioRouter } from "./modules/h5p/routes";
import { createH5PRuntime } from "./modules/h5p/setup";
import { buildLogbookRouter } from "./modules/logbook/routes";
import { LogbookRepository } from "./modules/logbook/repository";
import { LogbookService } from "./modules/logbook/service";
import { buildReviewsRouter } from "./modules/reviews/routes";
import { ReviewsRepository } from "./modules/reviews/repository";
import { ReviewsService } from "./modules/reviews/service";
import { buildProfileRouter } from "./modules/profile/routes";
import { ProfileRepository } from "./modules/profile/repository";
import { ProfileService } from "./modules/profile/service";
import { attachViewLocals } from "./shared/middleware/auth";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler";

export function createApp(envOverrides?: Partial<NodeJS.ProcessEnv>) {
  return buildApp(loadEnv(envOverrides));
}

export function buildApp(env: AppEnv) {
  const app = express();
  const requestBodyLimit = "10mb";
  const auditRepository = new AuditRepository(env);
  const authRepository = new AuthRepository(env);
  const logbookRepository = new LogbookRepository(env);
  const learningRepository = new LearningRepository(env);
  const h5pRepository = new H5PRepository(env);
  const h5pRuntime = createH5PRuntime(env);
  const loginThrottleService = new LoginThrottleService(env);

  app.set("view engine", "ejs");
  app.set("views", path.join(process.cwd(), "src", "views"));

  app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
  app.use(express.json({ limit: requestBodyLimit }));
  app.use(buildSessionMiddleware(env));
  app.use(attachViewLocals);
  app.use(express.static(path.join(process.cwd(), "public")));

  app.get("/", (_req, res) => {
    res.render("pages/home", { title: env.APP_NAME });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true, app: env.APP_NAME });
  });

  app.use("/auth", buildAuthRouter(new AuthService(env, authRepository, auditRepository), loginThrottleService));
  app.use("/dashboard", buildDashboardRouter(new DashboardService(new DashboardRepository(env))));
  app.use("/logbook", buildLogbookRouter(new LogbookService(logbookRepository, auditRepository)));
  app.use("/reviews", buildReviewsRouter(new ReviewsService(new ReviewsRepository(env), logbookRepository, auditRepository)));
  app.use(
    "/documents",
    buildDocumentsRouter(
      new DocumentsService(
        new DocumentsRepository(env),
        auditRepository,
        env.NODE_ENV === "production" ? new S3ObjectStorage(env) : new LocalDevStorage()
      )
    )
  );
  app.use("/learning", buildLearningRouter(new LearningService(learningRepository, auditRepository)));
  app.use(buildH5PApiRouter(h5pRuntime, h5pRepository, learningRepository, auditRepository));
  app.use("/h5p", buildH5PStudioRouter(h5pRepository, h5pRuntime, auditRepository));
  app.use("/cases", buildCasesRouter(new CasesService(new CasesRepository(env), auditRepository)));
  app.use("/profile", buildProfileRouter(new ProfileService(new ProfileRepository(env), auditRepository, authRepository)));
  app.use("/admin", buildAdminRouter(new AdminService(new AdminRepository(env), auditRepository, authRepository)));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
