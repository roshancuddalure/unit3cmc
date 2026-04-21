import bcrypt from "bcrypt";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { HttpError } from "../../shared/http-error";
import { AuditRepository } from "../audit/repository";
import { AuthRepository } from "../auth/repository";
import { AdminRepository } from "./repository";

export class AdminService {
  constructor(
    private readonly adminRepository: AdminRepository,
    private readonly auditRepository: AuditRepository,
    private readonly authRepository: AuthRepository
  ) {}

  async getOverview(user: AuthenticatedUser) {
    const [people, roles, profileRequests] = await Promise.all([
      this.adminRepository.getOverview(user.unitId),
      this.adminRepository.listRoles(),
      this.adminRepository.listPendingProfileRequests(user.unitId)
    ]);

    const peopleByStatus = {
      pending: people.filter((person) => person.status === "pending"),
      active: people.filter((person) => person.status === "active"),
      suspended: people.filter((person) => person.status === "suspended"),
      archived: people.filter((person) => person.status === "archived")
    };

    return {
      title: "Administration",
      people,
      peopleByStatus,
      roles,
      profileRequests,
      tabBadges: {
        pending: String(peopleByStatus.pending.length),
        active: String(peopleByStatus.active.length),
        suspended: String(peopleByStatus.suspended.length),
        archived: String(peopleByStatus.archived.length),
        profileRequests: String(profileRequests.length)
      }
    };
  }

  async updateRole(adminUser: AuthenticatedUser, targetUserId: string, roleKey: string): Promise<void> {
    await this.adminRepository.updateUserRole(targetUserId, roleKey, adminUser.unitId);
    await this.auditRepository.record({
      actorUserId: adminUser.id,
      action: "admin.role_updated",
      entityType: "user",
      entityId: targetUserId,
      metadata: { roleKey }
    });
  }

  async updateStatus(
    adminUser: AuthenticatedUser,
    targetUserId: string,
    status: "active" | "suspended" | "archived"
  ): Promise<void> {
    await this.adminRepository.updateUserStatus(targetUserId, adminUser.unitId, status, adminUser.id);
    await this.auditRepository.record({
      actorUserId: adminUser.id,
      action:
        status === "active"
          ? "admin.user_approved"
          : status === "suspended"
            ? "admin.user_suspended"
            : "admin.user_archived",
      entityType: "user",
      entityId: targetUserId,
      metadata: { status }
    });
  }

  async getUserDetail(adminUser: AuthenticatedUser, targetUserId: string) {
    const [person, roles, auditEvents] = await Promise.all([
      this.adminRepository.getUserDetail(targetUserId, adminUser.unitId),
      this.adminRepository.listRoles(),
      this.adminRepository.listUserAuditEvents(targetUserId)
    ]);

    if (!person) {
      throw new HttpError(404, "User not found.");
    }

    return {
      title: "User Detail",
      person,
      roles,
      auditEvents
    };
  }

  async updateUserProfile(
    adminUser: AuthenticatedUser,
    targetUserId: string,
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
  ): Promise<void> {
    await this.adminRepository.updateUserProfile(targetUserId, adminUser.unitId, input);
    await this.auditRepository.record({
      actorUserId: adminUser.id,
      action: "admin.profile_updated",
      entityType: "user",
      entityId: targetUserId
    });
  }

  async setUserPassword(
    adminUser: AuthenticatedUser,
    targetUserId: string,
    input: {
      newPassword: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    const person = await this.adminRepository.getUserDetail(targetUserId, adminUser.unitId);
    if (!person) {
      throw new HttpError(404, "User not found.");
    }

    if (input.newPassword.trim().length < 8) {
      throw new HttpError(400, "New password must be at least 8 characters long.");
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new HttpError(400, "New password and confirmation do not match.");
    }

    const nextHash = await bcrypt.hash(input.newPassword, 10);
    await this.authRepository.updatePasswordHash(targetUserId, nextHash);
    await this.authRepository.setMustChangePassword(targetUserId, true);
    await this.auditRepository.record({
      actorUserId: adminUser.id,
      action: "admin.password_reset",
      entityType: "user",
      entityId: targetUserId
    });
  }

  async updateCaseReviewAccess(
    adminUser: AuthenticatedUser,
    targetUserId: string,
    canReviewCases: boolean
  ): Promise<void> {
    await this.adminRepository.updateCaseReviewAccess(targetUserId, adminUser.unitId, canReviewCases);
    await this.auditRepository.record({
      actorUserId: adminUser.id,
      action: "admin.case_review_access_updated",
      entityType: "user",
      entityId: targetUserId,
      metadata: { canReviewCases }
    });
  }

  async reviewProfileRequest(
    adminUser: AuthenticatedUser,
    requestId: string,
    decision: "approved" | "rejected",
    reviewerNotes: string
  ): Promise<void> {
    const result = await this.adminRepository.reviewProfileRequest(
      requestId,
      adminUser.unitId,
      decision,
      adminUser.id,
      reviewerNotes
    );

    if (!result) {
      throw new HttpError(404, "Profile change request not found or already reviewed.");
    }

    await this.auditRepository.record({
      actorUserId: adminUser.id,
      action: decision === "approved" ? "admin.profile_request_approved" : "admin.profile_request_rejected",
      entityType: "user",
      entityId: result.userId,
      metadata: { requestId, reviewerNotes }
    });
  }
}
