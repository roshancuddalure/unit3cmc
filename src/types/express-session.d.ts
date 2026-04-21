import "express-session";
import type { AuthenticatedUser } from "../shared/types/domain";

declare module "express-session" {
  interface SessionData {
    user?: AuthenticatedUser;
    flash?: {
      type: "success" | "error" | "info";
      message: string;
    };
  }
}
