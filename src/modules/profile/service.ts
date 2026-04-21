import bcrypt from "bcrypt";
import { HttpError } from "../../shared/http-error";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { AuditRepository } from "../audit/repository";
import { AuthRepository } from "../auth/repository";
import { ProfileRepository } from "./repository";

export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly auditRepository: AuditRepository,
    private readonly authRepository: AuthRepository
  ) {}

  async getProfile(user: AuthenticatedUser) {
    const profile = await this.profileRepository.getById(user.id);
    if (!profile) {
      throw new HttpError(404, "Profile not found.");
    }

    const pendingRequest = ["postgraduate", "reviewer"].includes(user.role)
      ? await this.profileRepository.getLatestChangeRequest(user.id)
      : null;

    return {
      title: "My Profile",
      profile,
      pendingRequest
    };
  }

  async updateProfile(
    user: AuthenticatedUser,
    input: {
      displayName: string;
      phone: string;
      designation: string;
      department: string;
      trainingYear: string;
      employeeOrStudentId: string;
      joiningDate: string;
      notes: string;
    }
  ): Promise<{ updatedUser: AuthenticatedUser; requestedApproval: boolean }> {
    const isPrivileged = user.role === "super_admin" || user.role === "unit_admin_or_faculty";

    if (isPrivileged) {
      // Admin/chief accounts update immediately; limited faculty follows the normal approval path.
      await this.profileRepository.updateOwnProfile(user.id, input);

      await this.auditRepository.record({
        actorUserId: user.id,
        action: "profile.updated_self",
        entityType: "user",
        entityId: user.id
      });

      return {
        updatedUser: { ...user, displayName: input.displayName.trim() || user.name },
        requestedApproval: false
      };
    }

    // Regular users submit a change request for admin/unit-chief approval
    const fields: Record<string, string> = {};
    if (input.displayName.trim()) fields.displayName = input.displayName.trim();
    if (input.phone.trim()) fields.phone = input.phone.trim();
    if (input.designation.trim()) fields.designation = input.designation.trim();
    if (input.department.trim()) fields.department = input.department.trim();
    if (input.trainingYear.trim()) fields.trainingYear = input.trainingYear.trim();
    if (input.employeeOrStudentId.trim()) fields.employeeOrStudentId = input.employeeOrStudentId.trim();
    if (input.joiningDate.trim()) fields.joiningDate = input.joiningDate.trim();
    if (input.notes.trim()) fields.notes = input.notes.trim();

    await this.profileRepository.createChangeRequest(user.id, fields);

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "profile.change_requested",
      entityType: "user",
      entityId: user.id
    });

    return {
      updatedUser: user,
      requestedApproval: true
    };
  }

  async changePassword(
    user: AuthenticatedUser,
    input: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    if (input.newPassword.trim().length < 8) {
      throw new HttpError(400, "New password must be at least 8 characters long.");
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new HttpError(400, "New password and confirmation do not match.");
    }

    const passwordHash = await this.authRepository.getPasswordHashByUserId(user.id);
    if (!passwordHash) {
      throw new HttpError(404, "Account credentials could not be found.");
    }

    const matches = await bcrypt.compare(input.currentPassword, passwordHash);
    if (!matches) {
      throw new HttpError(401, "Current password is incorrect.");
    }

    const nextHash = await bcrypt.hash(input.newPassword, 10);
    await this.authRepository.updatePasswordHash(user.id, nextHash);
    await this.authRepository.setMustChangePassword(user.id, false);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "profile.password_changed",
      entityType: "user",
      entityId: user.id
    });
  }
}
