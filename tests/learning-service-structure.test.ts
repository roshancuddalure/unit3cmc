import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/shared/http-error";
import { LearningService } from "../src/modules/learning/service";

function createService() {
  const learningRepository = {
    updateProgram: vi.fn(),
    moveChapter: vi.fn(),
    updateAcademyItem: vi.fn()
  };
  const auditRepository = {
    record: vi.fn()
  };

  const service = new LearningService(learningRepository as any, auditRepository as any);
  const user = {
    id: "user-1",
    unitId: "unit-1",
    role: "unit_admin_or_faculty"
  } as any;

  return { service, user, learningRepository, auditRepository };
}

describe("LearningService curriculum structure actions", () => {
  it("trims program settings before saving", async () => {
    const { service, user, learningRepository, auditRepository } = createService();

    await service.updateProgram(user, "program-1", "  Unit 3 Academy  ", "  Overview  ", "published");

    expect(learningRepository.updateProgram).toHaveBeenCalledWith(
      "unit-1",
      "program-1",
      "Unit 3 Academy",
      "Overview",
      "published"
    );
    expect(auditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academy.program_updated",
        entityId: "program-1"
      })
    );
  });

  it("rejects unsupported move directions", async () => {
    const { service, user } = createService();

    await expect(service.moveChapter(user, "chapter-1", "left")).rejects.toBeInstanceOf(HttpError);
  });

  it("normalizes item placement updates before passing them to the repository", async () => {
    const { service, user, learningRepository, auditRepository } = createService();

    await service.updateAcademyItem(user, "item-1", {
      titleOverride: "  Mock viva  ",
      isRequired: "false",
      isAssessment: "true",
      estimatedMinutes: "-15",
      status: "published",
      subchapterId: "  subchapter-9  "
    });

    expect(learningRepository.updateAcademyItem).toHaveBeenCalledWith({
      unitId: "unit-1",
      academyItemId: "item-1",
      titleOverride: "Mock viva",
      isRequired: false,
      isAssessment: true,
      estimatedMinutes: 0,
      status: "published",
      subchapterId: "subchapter-9"
    });
    expect(auditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academy.item_updated",
        entityId: "item-1"
      })
    );
  });
});
