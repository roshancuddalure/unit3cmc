import bcrypt from "bcrypt";
import type { AppEnv } from "../../config/env";
import { HttpError } from "../../shared/http-error";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { AuditRepository } from "../audit/repository";
import { AuthRepository } from "./repository";

export class AuthService {
  constructor(
    private readonly env: AppEnv,
    private readonly authRepository: AuthRepository,
    private readonly auditRepository: AuditRepository
  ) {}

  async signIn(identity: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.authRepository.findForLogin(identity);
    if (!user) {
      throw new HttpError(401, "Invalid username/email or password.");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new HttpError(401, "Invalid username/email or password.");
    }

    if (user.status === "pending") {
      throw new HttpError(403, "Your registration is pending approval. Please wait for Unit 3 administration to activate your account.");
    }

    if (user.status === "suspended") {
      throw new HttpError(403, "Your account is currently suspended. Please contact Unit 3 administration.");
    }

    if (user.status === "archived") {
      throw new HttpError(403, "This account has been archived and can no longer access the system.");
    }

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "auth.sign_in",
      entityType: "user",
      entityId: user.id
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      unitId: user.unitId,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword
    };
  }

  async register(input: {
    username: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    designation?: string;
    department?: string;
    trainingYear?: string;
    employeeOrStudentId?: string;
  }): Promise<void> {
    const passwordHash = await bcrypt.hash(input.password, 10);

    try {
      const user = await this.authRepository.createUser({
        username: input.username.trim().toLowerCase(),
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash,
        unitCode: this.env.DEFAULT_UNIT_CODE,
        roleKey: "postgraduate",
        phone: input.phone,
        designation: input.designation,
        department: input.department,
        trainingYear: input.trainingYear,
        employeeOrStudentId: input.employeeOrStudentId
      });

      await this.auditRepository.record({
        actorUserId: user.id,
        action: "auth.registration_submitted",
        entityType: "user",
        entityId: user.id
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new HttpError(409, "That username or email is already registered.");
      }

      throw error;
    }
  }
}
