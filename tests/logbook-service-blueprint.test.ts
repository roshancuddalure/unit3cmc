import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../src/shared/http-error";
import { LogbookService } from "../src/modules/logbook/service";

function createService() {
  const logbookRepository = {
    create: vi.fn().mockResolvedValue("entry-1")
  };
  const auditRepository = {
    record: vi.fn().mockResolvedValue(undefined)
  };

  const service = new LogbookService(logbookRepository as any, auditRepository as any);
  const user = {
    id: "user-1",
    unitId: "unit-1",
    role: "postgraduate",
    name: "Test User",
    username: "test-user",
    displayName: "Test User",
    email: "test@example.com",
    status: "active",
    mustChangePassword: false
  } as any;

  return { service, user, logbookRepository, auditRepository };
}

function buildValidInput(overrides: Record<string, unknown> = {}) {
  return {
    activityDate: "2026-04-21",
    caseType: "Elective",
    otNumber: "OT-3",
    surgicalDepartment: "Unit 3 - HPB, Urology",
    surgeryName: "Whipple procedure",
    surgeryStartTime: "09:00",
    surgeryEndTime: "11:15",
    ageYears: "52",
    gender: "Male",
    asaPhysicalStatus: "3",
    bmi: "26.4",
    supervisionLevel: "Senior in OT (1:1)",
    anaestheticPlanned: "GA - Inhalational/TIVA",
    airwayManagement: "ETT",
    scopyTechnique: "Video laryngoscope",
    intraoperativeEvents: "",
    comorbidities: ["Diabetes"],
    otherComorbidity: "",
    procedures: ["Airway - Intubation", "Arterial line"],
    analgesiaOptions: ["Epidural - Thoracic"],
    blockCatheterNames: ["Continuous femoral catheter"],
    singleShotBlockNames: ["TAP block"],
    postOperativeCare: ["Ward"],
    learningPoints: ["Anticipate blood loss early"],
    ...overrides
  };
}

describe("LogbookService blueprint capture", () => {
  it("requires at least one learning point", async () => {
    const { service, user } = createService();

    await expect(
      service.createForUser(user, {
        ...buildValidInput(),
        learningPoints: []
      } as any)
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("requires airway details for GA and scopy technique for ETT", async () => {
    const { service, user } = createService();

    await expect(
      service.createForUser(user, {
        ...buildValidInput(),
        airwayManagement: ""
      } as any)
    ).rejects.toBeInstanceOf(HttpError);

    await expect(
      service.createForUser(user, {
        ...buildValidInput(),
        scopyTechnique: ""
      } as any)
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("stores fixed-unit blueprint fields and derived legacy analytics fields", async () => {
    const { service, user, logbookRepository, auditRepository } = createService();

    await service.createForUser(user, {
      ...buildValidInput(),
      learningPoints: ["Review airway plan before induction", "Use early arterial line setup"],
      postOperativeCare: ["ICU/HDU (Planned)", "Ward"],
      comorbidities: ["Diabetes", "Others - Specify"],
      otherComorbidity: "OSA"
    } as any);

    expect(logbookRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        unitId: "unit-1",
        caseType: "Elective",
        anaesthesiaUnit: "Unit 3",
        urgency: "elective",
        patientAgeBand: "adult_18_64",
        durationMinutes: 135,
        reflectionNotes: "Review airway plan before induction\nUse early arterial line setup",
        postOperativeCare: ["ICU/HDU (Planned)", "Ward"],
        learningPoints: ["Review airway plan before induction", "Use early arterial line setup"]
      })
    );
    expect(logbookRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        comorbidities: expect.arrayContaining([
          expect.objectContaining({ label: "Diabetes" }),
          expect.objectContaining({ label: "Others - Specify", details: "OSA" })
        ])
      })
    );
    expect(auditRepository.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "logbook.entry_created",
        entityId: "entry-1"
      })
    );
  });
});
