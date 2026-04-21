import { HttpError } from "../../shared/http-error";
import { hasPermission } from "../../shared/permissions";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { AuditRepository } from "../audit/repository";
import type {
  BreakdownItem,
  LogbookBrowseFilters,
  LogbookEntryRecord,
  LogbookPeriodSummary,
  UnitBrowseEntryRecord,
  UnitMemberOption
} from "./repository";
import { LogbookRepository } from "./repository";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const FIXED_ANAESTHESIA_UNIT = "Unit 3";

const SURGICAL_DEPARTMENT_OPTIONS = [
  "Unit 1 - General Surgery, Endocrine Surgery, Pediatric Gastro",
  "Unit 2 - Orthopedics, Pediatric Orthopedics, HLRS, Spine surgery",
  "Unit 3 - HPB, Urology",
  "Unit 4 - ENT, Plastic Surgery",
  "Unit 5 - Pediatrics, Gynecology, Gyn - Oncology, MRI, DSA",
  "Unit 6 - Trauma, Gastroscopy",
  "Cardiac - Cardiac, Thoracic, Vascular, Cardiology",
  "Neuro - Neurosurgery, MRI, DSA",
  "Emergency - Free text"
] as const;

const CASE_TYPE_OPTIONS = ["Elective", "Emergency"] as const;
const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
const ASA_OPTIONS = ["1", "2", "3", "4", "5", "6"] as const;
const SUPERVISION_LEVEL_OPTIONS = [
  "Senior in OT (1:1)",
  "Senior in brackets (2:1)",
  "Remote supervision"
] as const;
const ANAESTHETIC_PLAN_OPTIONS = [
  "GA - Inhalational/TIVA",
  "Deep sedation",
  "Spinal",
  "Block",
  "Epidural",
  "Monitored anaesthesia care"
] as const;
const AIRWAY_MANAGEMENT_OPTIONS = ["Mask holding", "LMA", "ETT", "Jet ventilation"] as const;
const SCOPY_TECHNIQUE_OPTIONS = [
  "Conventional laryngoscope",
  "Video laryngoscope",
  "Awake fibreoptic",
  "Asleep FOB"
] as const;
const COMORBIDITY_OPTIONS = [
  "Diabetes",
  "Hypertension",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Obesity",
  "Elderly",
  "Past CVA",
  "Neurodegenerative disorders",
  "Intracranial Mass",
  "COPD",
  "Reactive airway disease",
  "Ischemic Heart disease",
  "Valvular heart disease",
  "Cardiac Conduction abnormalities",
  "Congenital cardiac disease",
  "Chronic Liver Disease",
  "Chronic Kidney disease",
  "Musculoskeletal and connective tissue disorder",
  "Hematological disorder",
  "Others - Specify"
] as const;
const PROCEDURE_OPTIONS = [
  "Airway - Intubation",
  "Airway - LMA insertion",
  "Arterial line",
  "PICC line",
  "Central line - IJV",
  "Central line - Subclavian",
  "Central line - Femoral"
] as const;
const FIXED_ANALGESIA_OPTIONS = ["Epidural - Thoracic", "Epidural - Lumbar", "Intrathecal"] as const;
const POST_OPERATIVE_CARE_OPTIONS = ["ICU/HDU (Planned)", "ICU/HDU (Unplanned)", "Unit HDU", "Ward"] as const;

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseIsoDate(rawValue: string | undefined, label: string): string {
  if (!rawValue || !/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    throw new HttpError(400, `${label} must be a valid date.`);
  }

  const date = new Date(`${rawValue}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${label} must be a valid date.`);
  }

  return rawValue;
}

function resolveDateRange(startInput: string | undefined, endInput: string | undefined, fallbackDays: number) {
  const today = new Date();
  const fallbackEnd = toIsoDate(today);
  const fallbackStart = toIsoDate(new Date(today.getTime() - (fallbackDays - 1) * DAY_IN_MS));
  const start = startInput && startInput.trim() ? parseIsoDate(startInput, "Start date") : fallbackStart;
  const end = endInput && endInput.trim() ? parseIsoDate(endInput, "End date") : fallbackEnd;

  if (start > end) {
    throw new HttpError(400, "Start date cannot be after end date.");
  }

  return { start, end };
}

function topBreakdownItem(items: BreakdownItem[]): BreakdownItem | undefined {
  return items[0];
}

function formatLabel(rawValue: string): string {
  return rawValue
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildNarrative(summary: LogbookPeriodSummary): string {
  if (summary.totalCases === 0) {
    return `No de-identified cases were recorded between ${summary.periodStart} and ${summary.periodEnd}.`;
  }

  const topDomain = topBreakdownItem(summary.domainMix);
  const topTechnique = topBreakdownItem(summary.techniqueMix);
  const topSupervision = topBreakdownItem(summary.supervisionMix);
  const durationHours = summary.totalDurationMinutes > 0
    ? `${(summary.totalDurationMinutes / 60).toFixed(summary.totalDurationMinutes >= 120 ? 1 : 0)} hours`
    : "duration not recorded";

  const parts = [
    `Between ${summary.periodStart} and ${summary.periodEnd}, ${summary.userName} logged ${summary.totalCases} de-identified clinical case${summary.totalCases === 1 ? "" : "s"}.`,
    `${summary.directCareCases} involved direct procedural performance, across ${summary.domainCoverage} clinical domain${summary.domainCoverage === 1 ? "" : "s"}.`,
    topDomain ? `The heaviest activity was in ${formatLabel(topDomain.label)} (${topDomain.count} case${topDomain.count === 1 ? "" : "s"}).` : "",
    topTechnique ? `Technique mix was led by ${formatLabel(topTechnique.label)}.` : "",
    topSupervision ? `Supervision was most often ${formatLabel(topSupervision.label)}.` : "",
    `Recorded clinical time totalled ${durationHours}.`,
    summary.complicationCount > 0
      ? `${summary.complicationCount} case${summary.complicationCount === 1 ? " was" : "s were"} flagged for complication or concern review.`
      : "No cases were flagged for complication review in this period."
  ];

  return parts.filter(Boolean).join(" ");
}

function deriveSuggestedWeekRange(entries: { activityDate: string }[]) {
  if (entries.length === 0) {
    const today = new Date();
    const weekStart = new Date(today.getTime() - 6 * DAY_IN_MS);
    return {
      start: toIsoDate(weekStart),
      end: toIsoDate(today)
    };
  }

  const newest = entries[0]?.activityDate;
  const oldest = entries[Math.min(entries.length - 1, 6)]?.activityDate ?? newest;
  return { start: oldest, end: newest };
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}

function buildProgressionSignals(summary: LogbookPeriodSummary) {
  const directCareRatio = ratio(summary.directCareCases, summary.totalCases);
  const emergencyCases = summary.urgencyMix.find((item) => item.label === "emergency")?.count ?? 0;
  const complexCases = summary.complexityMix.find((item) => item.label === "complex")?.count ?? 0;
  const independentCases = summary.supervisionMix.find((item) => item.label === "independent_with_review")?.count ?? 0;

  let stage = "emerging";
  if (summary.totalCases >= 12 && summary.domainCoverage >= 3 && directCareRatio >= 60) {
    stage = "developing";
  }
  if (summary.totalCases >= 24 && summary.domainCoverage >= 4 && directCareRatio >= 70 && complexCases >= 2) {
    stage = "consolidating";
  }

  const strengths: string[] = [];
  const watchPoints: string[] = [];

  if (summary.domainCoverage >= 4) {
    strengths.push("Good spread across multiple anaesthesia domains in the selected period.");
  }
  if (directCareRatio >= 70) {
    strengths.push("High proportion of direct participation rather than observation-only exposure.");
  }
  if (complexCases >= 2) {
    strengths.push("Meaningful exposure to higher-complexity work is visible.");
  }
  if (independentCases >= 2) {
    strengths.push("Independent practice with review is beginning to appear in the supervision mix.");
  }

  if (summary.totalCases < 6) {
    watchPoints.push("Overall volume in this period is low; review whether all eligible cases are being logged.");
  }
  if (summary.domainCoverage < 3) {
    watchPoints.push("Breadth is narrow; consider widening case exposure across more clinical domains.");
  }
  if (emergencyCases === 0) {
    watchPoints.push("No emergency exposure appears in this period.");
  }
  if (summary.complicationCount > 0) {
    watchPoints.push("Flagged cases need reviewer follow-up and reflective closure.");
  }

  return {
    stage,
    directCareRatio,
    emergencyCases,
    complexCases,
    independentCases,
    strengths,
    watchPoints
  };
}

function enrichSummary(summary: LogbookPeriodSummary) {
  return {
    ...summary,
    analysisNarrative: buildNarrative(summary),
    progression: buildProgressionSignals(summary)
  };
}

function buildPrintTitle(summary: ReturnType<typeof enrichSummary>, mode: "personal" | "team") {
  return mode === "team"
    ? `${summary.userName} - unit logbook review`
    : `${summary.userName} - personal logbook summary`;
}

function compareNumbersDescending(left: number, right: number): number {
  return right - left;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (value === undefined || value === null || value === "") {
    return [];
  }

  return [String(value)];
}

function requireOption(value: string, label: string, options: readonly string[]): string {
  if (!options.includes(value as (typeof options)[number])) {
    throw new HttpError(400, `Choose a valid ${label}.`);
  }

  return value;
}

function requireOptions(values: string[], label: string, options: readonly string[]): string[] {
  for (const value of values) {
    requireOption(value, label, options);
  }

  return values;
}

function parseWholeNumber(rawValue: string, label: string, min: number, max: number): number {
  if (!/^\d+$/.test(rawValue)) {
    throw new HttpError(400, `${label} must be a whole number.`);
  }

  const value = Number(rawValue);
  if (value < min || value > max) {
    throw new HttpError(400, `${label} must be between ${min} and ${max}.`);
  }

  return value;
}

function parseOptionalDecimal(rawValue: string, label: string): number | null {
  if (!rawValue) {
    return null;
  }

  const value = Number(rawValue);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new HttpError(400, `${label} must be a valid number.`);
  }

  return Math.round(value * 100) / 100;
}

function parseClockTime(rawValue: string, label: string): string {
  if (!/^\d{2}:\d{2}$/.test(rawValue)) {
    throw new HttpError(400, `${label} must be a valid time.`);
  }

  const [hour, minute] = rawValue.split(":").map(Number);
  if (hour > 23 || minute > 59) {
    throw new HttpError(400, `${label} must be a valid time.`);
  }

  return rawValue;
}

function calculateDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const rawDifference = endTotal - startTotal;
  return rawDifference >= 0 ? rawDifference : 24 * 60 + rawDifference;
}

function deriveAgeBand(ageYears: number): string {
  if (ageYears < 1) {
    return "infant";
  }
  if (ageYears < 13) {
    return "child";
  }
  if (ageYears < 18) {
    return "adolescent";
  }
  if (ageYears < 65) {
    return "adult_18_64";
  }

  return "older_adult_65_plus";
}

function mapAsaToLegacy(value: string): string {
  return `asa_${value.toLowerCase() === "1" ? "i" : value.toLowerCase() === "2" ? "ii" : value.toLowerCase() === "3" ? "iii" : value.toLowerCase() === "4" ? "iv" : value.toLowerCase() === "5" ? "v" : "vi"}`;
}

function mapAnaestheticPlanToTechnique(plan: string): string {
  switch (plan) {
    case "GA - Inhalational/TIVA":
      return "general_anaesthesia";
    case "Deep sedation":
      return "procedural_sedation";
    case "Spinal":
    case "Epidural":
      return "neuraxial";
    case "Block":
      return "regional_anaesthesia";
    case "Monitored anaesthesia care":
      return "monitored_anaesthesia_care";
    default:
      return "general_anaesthesia";
  }
}

function mapAnaestheticPlanToClinicalDomain(plan: string): string {
  switch (plan) {
    case "GA - Inhalational/TIVA":
      return "general_anaesthesia";
    case "Deep sedation":
    case "Monitored anaesthesia care":
      return "procedural_sedation";
    case "Spinal":
    case "Epidural":
    case "Block":
      return "regional_anaesthesia";
    default:
      return "general_anaesthesia";
  }
}

function mapSurgicalDepartmentToSpecialtyArea(department: string): string {
  const normalized = department.toLowerCase();

  if (normalized.includes("orthopedic")) {
    return "orthopaedics";
  }
  if (normalized.includes("neuro")) {
    return "neurosurgery";
  }
  if (normalized.includes("cardiac") || normalized.includes("thoracic")) {
    return "cardiothoracic";
  }
  if (normalized.includes("vascular")) {
    return "vascular";
  }
  if (normalized.includes("gyne")) {
    return "obstetrics_gynaecology";
  }
  if (normalized.includes("pediatric")) {
    return "paediatrics";
  }
  if (normalized.includes("emergency") || normalized.includes("trauma")) {
    return "emergency_procedure";
  }

  return "general_surgery";
}

function deriveProcedureCategory(
  anaestheticPlan: string,
  procedures: Array<{ label: string; details?: string }>,
  analgesiaItems: Array<{ label: string; details?: string }>
): string {
  const procedureLabels = procedures.map((item) => item.label.toLowerCase());
  const analgesiaLabels = analgesiaItems.map((item) => item.label.toLowerCase());

  if (procedureLabels.some((label) => label.includes("arterial") || label.includes("picc") || label.includes("central line"))) {
    return "vascular_access";
  }
  if (procedureLabels.some((label) => label.includes("airway") || label.includes("intubation") || label.includes("lma"))) {
    return "airway_device";
  }
  if (analgesiaLabels.some((label) => label.includes("epidural") || label.includes("intrathecal")) || anaestheticPlan === "Spinal") {
    return "neuraxial_block";
  }
  if (analgesiaLabels.some((label) => label.includes("block")) || anaestheticPlan === "Block") {
    return "peripheral_nerve_block";
  }
  if (anaestheticPlan === "Deep sedation" || anaestheticPlan === "Monitored anaesthesia care") {
    return "sedation_case";
  }

  return "general_anaesthetic";
}

function deriveComplexityLevel(caseType: string, department: string, asaStatus: string, postOperativeCare: string[]): string {
  const normalizedDepartment = department.toLowerCase();
  const escalatedCare = postOperativeCare.some((item) => item.toLowerCase().includes("icu") || item.toLowerCase().includes("hdu"));

  if (caseType === "Emergency" || normalizedDepartment.includes("cardiac") || normalizedDepartment.includes("neuro") || Number(asaStatus) >= 4 || escalatedCare) {
    return "complex";
  }
  if (Number(asaStatus) >= 3) {
    return "intermediate";
  }

  return "routine";
}

function normalizeBrowseSearch(value: string | undefined): string {
  return String(value ?? "").trim().slice(0, 80);
}

function normalizeBrowseOption(value: string | undefined, options: readonly string[]): string {
  const trimmedValue = String(value ?? "").trim();
  return options.includes(trimmedValue as (typeof options)[number]) ? trimmedValue : "";
}

function parseBrowseToggle(value: string | undefined): boolean {
  return value === "true" || value === "on" || value === "1";
}

function buildBrowseFilters(
  range: { start: string; end: string },
  input: {
    searchText?: string;
    caseType?: string;
    surgicalDepartment?: string;
    flaggedOnly?: string;
  },
  limit: number
): LogbookBrowseFilters {
  return {
    periodStart: range.start,
    periodEnd: range.end,
    searchText: normalizeBrowseSearch(input.searchText),
    caseType: normalizeBrowseOption(input.caseType, CASE_TYPE_OPTIONS),
    surgicalDepartment: normalizeBrowseOption(input.surgicalDepartment, SURGICAL_DEPARTMENT_OPTIONS),
    flaggedOnly: parseBrowseToggle(input.flaggedOnly),
    limit
  };
}

function buildBrowseSummary(entries: LogbookEntryRecord[]) {
  return {
    visibleCases: entries.length,
    flaggedCases: entries.filter((entry) => entry.hadComplication).length,
    emergencyCases: entries.filter((entry) => entry.caseType === "Emergency").length,
    complexCases: entries.filter((entry) => entry.complexityLevel === "complex").length
  };
}

function buildUnitBrowseSummary(entries: UnitBrowseEntryRecord[]) {
  return {
    ...buildBrowseSummary(entries),
    peopleVisible: new Set(entries.map((entry) => entry.userId)).size
  };
}

export class LogbookService {
  constructor(
    private readonly logbookRepository: LogbookRepository,
    private readonly auditRepository: AuditRepository
  ) {}

  async listWorkspace(
    user: AuthenticatedUser,
    filters: {
      periodStart?: string;
      periodEnd?: string;
      teamView?: string;
      memberId?: string;
      memberPeriodStart?: string;
      memberPeriodEnd?: string;
      entrySearch?: string;
      entryCaseType?: string;
      entryDepartment?: string;
      entryFlagged?: string;
      teamEntrySearch?: string;
      teamEntryCaseType?: string;
      teamEntryDepartment?: string;
      teamEntryFlagged?: string;
    }
  ) {
    const canReview = hasPermission(user.role, "logbook:review");
    const personalRange = resolveDateRange(filters.periodStart, filters.periodEnd, 28);
    const personalRecentEntries = await this.logbookRepository.listByUser(user.id, 12);
    const surgeryNameSuggestions = await this.logbookRepository.listSurgeryNameSuggestions(user.unitId);
    const personalSummary = enrichSummary(
      await this.logbookRepository.getPeriodSummary(user.id, personalRange.start, personalRange.end)
    );
    const personalBrowseFilters = buildBrowseFilters(
      personalRange,
      {
        searchText: filters.entrySearch,
        caseType: filters.entryCaseType,
        surgicalDepartment: filters.entryDepartment,
        flaggedOnly: filters.entryFlagged
      },
      80
    );
    const personalEntries = await this.logbookRepository.browseByUser(user.id, personalBrowseFilters);
    const personalBrowseSummary = buildBrowseSummary(personalEntries);
    const weeklySuggestion = deriveSuggestedWeekRange(personalRecentEntries);

    let teamMembers: UnitMemberOption[] = [];
    let teamView = "individual";
    let selectedMemberId = "";
    let selectedMemberSummary: ReturnType<typeof enrichSummary> | null = null;
    let teamRange = { start: "", end: "" };
    let teamBrowseFilters: LogbookBrowseFilters = buildBrowseFilters(
      teamRange,
      {
        searchText: filters.teamEntrySearch,
        caseType: filters.teamEntryCaseType,
        surgicalDepartment: filters.teamEntryDepartment,
        flaggedOnly: filters.teamEntryFlagged
      },
      80
    );
    let teamBrowseEntries: LogbookEntryRecord[] = [];
    let teamBrowseSummary = buildBrowseSummary(teamBrowseEntries);
    let unitBrowseEntries: UnitBrowseEntryRecord[] = [];
    let unitBrowseSummary = buildUnitBrowseSummary(unitBrowseEntries);
    let overviewMembers: Array<{
      userId: string;
      userName: string;
      roleLabel: string;
      designation: string;
      totalCases: number;
      directCareRatio: number;
      domainCoverage: number;
      complexCases: number;
      emergencyCases: number;
      flaggedEvents: number;
      stage: string;
      topDomain: string;
    }> = [];
    let overviewSnapshot: {
      totalMembers: number;
      membersWithCases: number;
      totalCases: number;
      averageCases: number;
      membersNeedingAttention: number;
    } | null = null;

    if (canReview) {
      teamMembers = await this.logbookRepository.listUnitMembers(user.unitId);
      teamRange = resolveDateRange(filters.memberPeriodStart, filters.memberPeriodEnd, 7);
      teamView = filters.teamView === "overview" ? "overview" : "individual";
      teamBrowseFilters = buildBrowseFilters(
        teamRange,
        {
          searchText: filters.teamEntrySearch,
          caseType: filters.teamEntryCaseType,
          surgicalDepartment: filters.teamEntryDepartment,
          flaggedOnly: filters.teamEntryFlagged
        },
        teamView === "overview" ? 100 : 80
      );
      selectedMemberId = filters.memberId && teamMembers.some((member) => member.id === filters.memberId)
        ? filters.memberId
        : teamMembers[0]?.id ?? "";

      if (teamView === "individual" && selectedMemberId) {
        selectedMemberSummary = enrichSummary(
          await this.logbookRepository.getPeriodSummary(selectedMemberId, teamRange.start, teamRange.end)
        );
        teamBrowseEntries = await this.logbookRepository.browseByUser(selectedMemberId, teamBrowseFilters);
        teamBrowseSummary = buildBrowseSummary(teamBrowseEntries);
      }

      if (teamView === "overview" && teamMembers.length > 0) {
        unitBrowseEntries = await this.logbookRepository.browseByUnit(user.unitId, teamBrowseFilters);
        unitBrowseSummary = buildUnitBrowseSummary(unitBrowseEntries);
        const summaryByMember = await Promise.all(
          teamMembers.map(async (member) => {
            const summary = enrichSummary(
              await this.logbookRepository.getPeriodSummary(member.id, teamRange.start, teamRange.end)
            );

            return {
              userId: member.id,
              userName: summary.userName,
              roleLabel: formatLabel(member.role),
              designation: member.designation || "-",
              totalCases: summary.totalCases,
              directCareRatio: summary.progression.directCareRatio,
              domainCoverage: summary.domainCoverage,
              complexCases: summary.progression.complexCases,
              emergencyCases: summary.progression.emergencyCases,
              flaggedEvents: summary.complicationCount,
              stage: summary.progression.stage,
              topDomain: summary.domainMix[0] ? formatLabel(summary.domainMix[0].label) : "No logged cases",
              watchPointsCount: summary.progression.watchPoints.length
            };
          })
        );

        overviewMembers = summaryByMember
          .sort((left, right) => {
            const byCases = compareNumbersDescending(left.totalCases, right.totalCases);
            if (byCases !== 0) {
              return byCases;
            }

            return compareNumbersDescending(left.domainCoverage, right.domainCoverage);
          })
          .map(({ watchPointsCount, ...member }) => member);

        const totalMembers = summaryByMember.length;
        const membersWithCases = summaryByMember.filter((member) => member.totalCases > 0).length;
        const totalCases = summaryByMember.reduce((sum, member) => sum + member.totalCases, 0);
        const membersNeedingAttention = summaryByMember.filter((member) => member.watchPointsCount > 0).length;

        overviewSnapshot = {
          totalMembers,
          membersWithCases,
          totalCases,
          averageCases: totalMembers > 0 ? Math.round((totalCases / totalMembers) * 10) / 10 : 0,
          membersNeedingAttention
        };
      }
    }

    return {
      title: "Clinical logbook",
      canReview,
      tabBadges: {
        capture: "New",
        analysis: personalSummary.totalCases > 0 ? String(personalSummary.totalCases) : "0",
        entries: personalEntries.length > 0 ? String(personalEntries.length) : "0",
        oversight: canReview
          ? teamView === "overview"
            ? String(overviewSnapshot?.membersWithCases ?? 0)
            : selectedMemberSummary
              ? String(selectedMemberSummary.totalCases)
              : "0"
          : ""
      },
      personal: {
        range: personalRange,
        entries: personalEntries,
        browseFilters: personalBrowseFilters,
        browseSummary: personalBrowseSummary,
        summary: personalSummary,
        weeklySuggestion,
        printHref: `/logbook/print?mode=personal&periodStart=${personalRange.start}&periodEnd=${personalRange.end}`
      },
      team: {
        members: teamMembers,
        view: teamView,
        selectedMemberId,
        range: teamRange,
        overviewMembers,
        overviewSnapshot,
        summary: selectedMemberSummary,
        browseEntries: teamBrowseEntries,
        browseFilters: teamBrowseFilters,
        browseSummary: teamBrowseSummary,
        unitBrowseEntries,
        unitBrowseSummary,
        printHref: selectedMemberSummary
          ? `/logbook/print?mode=team&memberId=${selectedMemberId}&periodStart=${teamRange.start}&periodEnd=${teamRange.end}`
          : ""
      },
      surgeryNameSuggestions,
      entryOptions: {
        fixedAnaesthesiaUnit: FIXED_ANAESTHESIA_UNIT,
        caseTypes: CASE_TYPE_OPTIONS,
        surgicalDepartments: SURGICAL_DEPARTMENT_OPTIONS,
        genders: GENDER_OPTIONS,
        asaPhysicalStatuses: ASA_OPTIONS,
        supervisionLevels: SUPERVISION_LEVEL_OPTIONS,
        anaestheticPlans: ANAESTHETIC_PLAN_OPTIONS,
        airwayManagements: AIRWAY_MANAGEMENT_OPTIONS,
        scopyTechniques: SCOPY_TECHNIQUE_OPTIONS,
        comorbidities: COMORBIDITY_OPTIONS,
        procedures: PROCEDURE_OPTIONS,
        fixedAnalgesiaOptions: FIXED_ANALGESIA_OPTIONS,
        postOperativeCareOptions: POST_OPERATIVE_CARE_OPTIONS
      }
    };
  }

  async getPrintReport(
    user: AuthenticatedUser,
    filters: {
      mode?: string;
      periodStart?: string;
      periodEnd?: string;
      memberId?: string;
    }
  ) {
    const mode = filters.mode === "team" ? "team" : "personal";
    const range = resolveDateRange(filters.periodStart, filters.periodEnd, mode === "team" ? 7 : 28);
    const targetUserId = mode === "team" ? String(filters.memberId ?? "") : user.id;

    if (mode === "team") {
      if (!hasPermission(user.role, "logbook:review")) {
        throw new HttpError(403, "You do not have permission to print unit-level logbook reports.");
      }

      const members = await this.logbookRepository.listUnitMembers(user.unitId);
      if (!targetUserId || !members.some((member) => member.id === targetUserId)) {
        throw new HttpError(404, "The selected unit member could not be found.");
      }
    }

    const summary = enrichSummary(
      await this.logbookRepository.getPeriodSummary(targetUserId, range.start, range.end)
    );
    const entries = await this.logbookRepository.listEntriesForPeriod(targetUserId, range.start, range.end, 50);

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "logbook.print_viewed",
      entityType: "logbook_report",
      entityId: summary.userId,
      metadata: {
        mode,
        periodStart: range.start,
        periodEnd: range.end
      }
    });

    return {
      title: buildPrintTitle(summary, mode),
      printMode: mode,
      generatedAt: new Date().toISOString(),
      summary,
      entries,
      showChrome: false
    };
  }

  async getCasePrintReport(user: AuthenticatedUser, entryId: string) {
    const entry = await this.logbookRepository.getByIdForUnit(user.unitId, entryId);
    if (!entry) {
      throw new HttpError(404, "The selected logbook case could not be found.");
    }

    const isOwnCase = entry.userId === user.id;
    if (!isOwnCase && !hasPermission(user.role, "logbook:review")) {
      throw new HttpError(403, "You do not have permission to print this logbook case.");
    }

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "logbook.case_print_viewed",
      entityType: "logbook_entry",
      entityId: entry.id,
      metadata: {
        activityDate: entry.activityDate,
        entryOwnerUserId: entry.userId,
        mode: isOwnCase ? "personal" : "team"
      }
    });

    const caseName = entry.caseNumber ? `Case ${entry.caseNumber}` : "Case";

    return {
      title: `${caseName} - ${entry.procedureName}`,
      generatedAt: new Date().toISOString(),
      entry,
      printMode: isOwnCase ? "personal" : "team",
      showChrome: false
    };
  }

  async createForUser(
    user: AuthenticatedUser,
    input: {
      activityDate: string;
      caseType: string;
      otNumber?: string;
      surgicalDepartment: string;
      surgeryName: string;
      surgeryStartTime: string;
      surgeryEndTime: string;
      ageYears: string;
      gender: string;
      asaPhysicalStatus: string;
      bmi?: string;
      supervisionLevel: string;
      anaestheticPlanned: string;
      airwayManagement?: string;
      scopyTechnique?: string;
      intraoperativeEvents?: string;
      comorbidities?: string | string[];
      otherComorbidity?: string;
      procedures?: string | string[];
      analgesiaOptions?: string | string[];
      blockCatheterNames?: string | string[];
      singleShotBlockNames?: string | string[];
      postOperativeCare?: string | string[];
      learningPoints?: string | string[];
    }
  ): Promise<void> {
    const activityDate = parseIsoDate(input.activityDate, "Activity date");
    const caseType = requireOption(String(input.caseType ?? ""), "case type", CASE_TYPE_OPTIONS);
    const surgicalDepartment = requireOption(
      String(input.surgicalDepartment ?? ""),
      "surgical department",
      SURGICAL_DEPARTMENT_OPTIONS
    );
    const procedureName = String(input.surgeryName ?? "").trim();
    const surgeryStartTime = parseClockTime(String(input.surgeryStartTime ?? ""), "Surgery start time");
    const surgeryEndTime = parseClockTime(String(input.surgeryEndTime ?? ""), "Surgery end time");
    const durationMinutes = calculateDurationMinutes(surgeryStartTime, surgeryEndTime);
    const ageYears = parseWholeNumber(String(input.ageYears ?? ""), "Age", 0, 120);
    const gender = requireOption(String(input.gender ?? ""), "gender", GENDER_OPTIONS);
    const asaPhysicalStatus = requireOption(String(input.asaPhysicalStatus ?? ""), "ASA physical status", ASA_OPTIONS);
    const bmi = parseOptionalDecimal(String(input.bmi ?? "").trim(), "BMI");
    const supervisionLevel = requireOption(
      String(input.supervisionLevel ?? ""),
      "supervision level",
      SUPERVISION_LEVEL_OPTIONS
    );
    const anaestheticPlanned = requireOption(
      String(input.anaestheticPlanned ?? ""),
      "anaesthetic planned",
      ANAESTHETIC_PLAN_OPTIONS
    );
    const requestedAirwayManagement = String(input.airwayManagement ?? "").trim();
    const requestedScopyTechnique = String(input.scopyTechnique ?? "").trim();
    const intraoperativeEvents = String(input.intraoperativeEvents ?? "").trim();
    const learningPoints = asStringArray(input.learningPoints)
      .map((item) => item.trim())
      .filter(Boolean);

    if (!procedureName) {
      throw new HttpError(400, "Surgery name is required.");
    }

    if (!learningPoints.length) {
      throw new HttpError(400, "Add at least one learning point before saving the log entry.");
    }

    const airwayManagement = anaestheticPlanned === "GA - Inhalational/TIVA" ? requestedAirwayManagement : "";
    const scopyTechnique = airwayManagement === "ETT" ? requestedScopyTechnique : "";

    if (anaestheticPlanned === "GA - Inhalational/TIVA" && !airwayManagement) {
      throw new HttpError(400, "Choose the airway management used for GA cases.");
    }

    requireOptions(airwayManagement ? [airwayManagement] : [], "airway management option", AIRWAY_MANAGEMENT_OPTIONS);

    if (airwayManagement === "ETT" && !scopyTechnique) {
      throw new HttpError(400, "Choose the scopy technique when ETT is selected.");
    }

    requireOptions(scopyTechnique ? [scopyTechnique] : [], "scopy technique", SCOPY_TECHNIQUE_OPTIONS);

    const comorbidityLabels = requireOptions(
      asStringArray(input.comorbidities)
      .map((item) => item.trim())
      .filter(Boolean),
      "comorbidity",
      COMORBIDITY_OPTIONS
    );
    const otherComorbidity = String(input.otherComorbidity ?? "").trim();
    const comorbidities = comorbidityLabels.map((label) => ({
      label,
      details: label === "Others - Specify" ? otherComorbidity : undefined
    }));
    if (otherComorbidity && !comorbidityLabels.includes("Others - Specify")) {
      comorbidities.push({ label: "Others - Specify", details: otherComorbidity });
    }

    const procedures = requireOptions(
      asStringArray(input.procedures)
      .map((item) => item.trim())
      .filter(Boolean),
      "procedure",
      PROCEDURE_OPTIONS
    )
      .map((label) => ({ label }));

    const analgesiaItems: Array<{ label: string; details?: string }> = requireOptions(
      asStringArray(input.analgesiaOptions)
        .map((item) => item.trim())
        .filter(Boolean),
      "analgesia option",
      FIXED_ANALGESIA_OPTIONS
    ).map((label) => ({ label }));

    for (const name of asStringArray(input.blockCatheterNames).map((item) => item.trim()).filter(Boolean)) {
      analgesiaItems.push({ label: "Block catheter", details: name });
    }
    for (const name of asStringArray(input.singleShotBlockNames).map((item) => item.trim()).filter(Boolean)) {
      analgesiaItems.push({ label: "Single shot block", details: name });
    }

    const postOperativeCare = requireOptions(
      asStringArray(input.postOperativeCare)
      .map((item) => item.trim())
      .filter(Boolean),
      "post operative care destination",
      POST_OPERATIVE_CARE_OPTIONS
    );

    const clinicalDomain = mapAnaestheticPlanToClinicalDomain(anaestheticPlanned);
    const procedureCategory = deriveProcedureCategory(anaestheticPlanned, procedures, analgesiaItems);
    const specialtyArea = mapSurgicalDepartmentToSpecialtyArea(surgicalDepartment);
    const urgency = caseType.toLowerCase();
    const patientAgeBand = deriveAgeBand(ageYears);
    const anaesthesiaTechnique = mapAnaestheticPlanToTechnique(anaestheticPlanned);
    const complexityLevel = deriveComplexityLevel(caseType, surgicalDepartment, asaPhysicalStatus, postOperativeCare);
    const hadComplication = Boolean(intraoperativeEvents);
    const reflectionNotes = learningPoints.join("\n");

    const entryId = await this.logbookRepository.create({
      userId: user.id,
      unitId: user.unitId,
      activityDate,
      caseType,
      anaesthesiaUnit: FIXED_ANAESTHESIA_UNIT,
      otNumber: String(input.otNumber ?? "").trim(),
      clinicalDomain,
      procedureCategory,
      procedureName,
      specialtyArea,
      location: "operating_theatre",
      urgency,
      patientAgeBand,
      asaPhysicalStatus: mapAsaToLegacy(asaPhysicalStatus),
      anaesthesiaTechnique,
      supervisionLevel,
      participationLevel: "performed_under_supervision",
      complexityLevel,
      durationMinutes,
      surgicalDepartment,
      surgeryStartTime,
      surgeryEndTime,
      ageYears,
      gender,
      bmi,
      anaestheticPlanned,
      airwayManagement,
      scopyTechnique,
      intraoperativeEvents,
      hadComplication,
      complicationSummary: intraoperativeEvents,
      reflectionNotes,
      comorbidities,
      procedures,
      analgesiaItems,
      postOperativeCare,
      learningPoints
    });

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "logbook.entry_created",
      entityType: "logbook_entry",
      entityId: entryId,
      metadata: {
        procedureName,
        activityDate,
        caseType,
        surgicalDepartment,
        anaestheticPlanned,
        hadComplication
      }
    });
  }
}

export type EnrichedLogbookSummary = ReturnType<typeof enrichSummary>;
export type PrintLogbookEntry = LogbookEntryRecord;
