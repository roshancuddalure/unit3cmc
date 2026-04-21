import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import type { AppEnv } from "../../config/env";
import { getPool } from "../../db/pool";
import { query } from "../../db/query";
import type { AuthenticatedUser } from "../../shared/types/domain";

export interface LogbookEntryRecord {
  id: string;
  caseNumber: number | null;
  activityDate: string;
  caseType: string;
  anaesthesiaUnit: string;
  otNumber: string;
  clinicalDomain: string;
  procedureCategory: string;
  procedureName: string;
  specialtyArea: string;
  location: string;
  urgency: string;
  patientAgeBand: string;
  asaPhysicalStatus: string;
  anaesthesiaTechnique: string;
  supervisionLevel: string;
  participationLevel: string;
  complexityLevel: string;
  surgicalDepartment: string;
  surgeryStartTime: string | null;
  surgeryEndTime: string | null;
  durationMinutes: number | null;
  ageYears: number | null;
  gender: string;
  bmi: number | null;
  anaestheticPlanned: string;
  airwayManagement: string;
  scopyTechnique: string;
  intraoperativeEvents: string;
  hadComplication: boolean;
  complicationSummary: string;
  reflectionNotes: string;
  comorbidities: string[];
  procedures: string[];
  analgesiaItems: string[];
  postOperativeCare: string[];
  learningPoints: string[];
  createdAt: string;
}

export interface UnitMemberOption {
  id: string;
  name: string;
  displayName: string;
  role: string;
  designation: string;
  status: string;
}

export interface BreakdownItem {
  label: string;
  count: number;
}

export interface LogbookPeriodSummary {
  userId: string;
  userName: string;
  periodStart: string;
  periodEnd: string;
  totalCases: number;
  directCareCases: number;
  complicationCount: number;
  totalDurationMinutes: number;
  domainCoverage: number;
  supervisionMix: BreakdownItem[];
  domainMix: BreakdownItem[];
  procedureCategoryMix: BreakdownItem[];
  specialtyMix: BreakdownItem[];
  locationMix: BreakdownItem[];
  urgencyMix: BreakdownItem[];
  techniqueMix: BreakdownItem[];
  complexityMix: BreakdownItem[];
  recentEntries: LogbookEntryRecord[];
  reflectionHighlights: string[];
}

export interface LogbookBrowseFilters {
  periodStart: string;
  periodEnd: string;
  searchText: string;
  caseType: string;
  surgicalDepartment: string;
  flaggedOnly: boolean;
  limit?: number;
}

export interface UnitBrowseEntryRecord extends LogbookEntryRecord {
  userId: string;
  userName: string;
  roleKey: string;
  designation: string;
}

interface EntryRow {
  id: string;
  case_number: number | null;
  activity_date: string;
  case_type: string | null;
  anaesthesia_unit: string | null;
  ot_number: string | null;
  clinical_domain: string;
  procedure_category: string;
  procedure_name: string;
  specialty_area: string;
  location: string;
  urgency: string;
  patient_age_band: string;
  asa_physical_status: string;
  anaesthesia_technique: string;
  supervision_level: string;
  participation_level: string;
  complexity_level: string;
  surgical_department: string | null;
  surgery_start_time: string | null;
  surgery_end_time: string | null;
  duration_minutes: number | null;
  age_years: number | null;
  gender: string | null;
  bmi: string | null;
  anaesthetic_planned: string | null;
  airway_management: string | null;
  scopy_technique: string | null;
  intraoperative_events: string | null;
  had_complication: boolean;
  complication_summary: string;
  reflection_notes: string;
  created_at: string;
}

interface BreakdownRow {
  label: string;
  count: string;
}

interface ChildRow {
  logbook_entry_id: string;
  label: string;
  details: string | null;
  position: number;
}

interface PostOperativeCareRow {
  logbook_entry_id: string;
  label: string;
  position: number;
}

interface LearningPointRow {
  logbook_entry_id: string;
  point_text: string;
  position: number;
}

interface UnitBrowseRow extends EntryRow {
  user_id: string;
  user_name: string;
  role_key: string;
  designation: string | null;
}

function mapBreakdown(rows: BreakdownRow[]): BreakdownItem[] {
  return rows.map((row) => ({
    label: row.label,
    count: Number(row.count)
  }));
}

function normalizeClockTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value.slice(0, 5);
}

function withDetails(label: string, details: string | null | undefined): string {
  const trimmedDetails = String(details ?? "").trim();
  return trimmedDetails ? `${label}: ${trimmedDetails}` : label;
}

function groupChildLabels(rows: ChildRow[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const row of rows.sort((left, right) => left.position - right.position)) {
    const items = grouped.get(row.logbook_entry_id) ?? [];
    items.push(withDetails(row.label, row.details));
    grouped.set(row.logbook_entry_id, items);
  }

  return grouped;
}

function groupCareLabels(rows: PostOperativeCareRow[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const row of rows.sort((left, right) => left.position - right.position)) {
    const items = grouped.get(row.logbook_entry_id) ?? [];
    items.push(row.label);
    grouped.set(row.logbook_entry_id, items);
  }

  return grouped;
}

function groupLearningPoints(rows: LearningPointRow[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const row of rows.sort((left, right) => left.position - right.position)) {
    const items = grouped.get(row.logbook_entry_id) ?? [];
    items.push(row.point_text);
    grouped.set(row.logbook_entry_id, items);
  }

  return grouped;
}

function mapEntry(row: EntryRow): LogbookEntryRecord {
  return {
    id: row.id,
    caseNumber: row.case_number,
    activityDate: row.activity_date,
    caseType: row.case_type ?? (row.urgency === "emergency" ? "Emergency" : "Elective"),
    anaesthesiaUnit: row.anaesthesia_unit ?? "Unit 3",
    otNumber: row.ot_number ?? "",
    clinicalDomain: row.clinical_domain,
    procedureCategory: row.procedure_category,
    procedureName: row.procedure_name,
    specialtyArea: row.specialty_area,
    location: row.location,
    urgency: row.urgency,
    patientAgeBand: row.patient_age_band,
    asaPhysicalStatus: row.asa_physical_status,
    anaesthesiaTechnique: row.anaesthesia_technique,
    supervisionLevel: row.supervision_level,
    participationLevel: row.participation_level,
    complexityLevel: row.complexity_level,
    surgicalDepartment: row.surgical_department ?? "",
    surgeryStartTime: normalizeClockTime(row.surgery_start_time),
    surgeryEndTime: normalizeClockTime(row.surgery_end_time),
    durationMinutes: row.duration_minutes,
    ageYears: row.age_years,
    gender: row.gender ?? "",
    bmi: row.bmi === null ? null : Number(row.bmi),
    anaestheticPlanned: row.anaesthetic_planned ?? "",
    airwayManagement: row.airway_management ?? "",
    scopyTechnique: row.scopy_technique ?? "",
    intraoperativeEvents: row.intraoperative_events ?? "",
    hadComplication: row.had_complication,
    complicationSummary: row.complication_summary,
    reflectionNotes: row.reflection_notes,
    comorbidities: [],
    procedures: [],
    analgesiaItems: [],
    postOperativeCare: [],
    learningPoints: [],
    createdAt: row.created_at
  };
}

export class LogbookRepository {
  constructor(private readonly env: AppEnv) {}

  async listSurgeryNameSuggestions(unitId: string, limit = 40): Promise<string[]> {
    const result = await query<{ procedure_name: string }>(
      this.env,
      `
        select procedure_name
        from logbook_entries
        where unit_id = $1
          and coalesce(trim(procedure_name), '') <> ''
        group by procedure_name
        order by max(created_at) desc, procedure_name asc
        limit $2
      `,
      [unitId, limit]
    );

    return result.rows.map((row) => row.procedure_name);
  }

  async listByUser(userId: string, limit = 12): Promise<LogbookEntryRecord[]> {
    const result = await query<EntryRow>(
      this.env,
      `
        select
          id,
          case_number,
          activity_date::text,
          case_type,
          anaesthesia_unit,
          ot_number,
          clinical_domain,
          procedure_category,
          procedure_name,
          specialty_area,
          location,
          urgency,
          patient_age_band,
          asa_physical_status,
          anaesthesia_technique,
          supervision_level,
          participation_level,
          complexity_level,
          surgical_department,
          surgery_start_time::text,
          surgery_end_time::text,
          duration_minutes,
          age_years,
          gender,
          bmi::text,
          anaesthetic_planned,
          airway_management,
          scopy_technique,
          intraoperative_events,
          had_complication,
          complication_summary,
          reflection_notes,
          created_at::text
        from logbook_entries
        where user_id = $1
        order by activity_date desc, created_at desc
        limit $2
      `,
      [userId, limit]
    );

    return this.hydrateEntries(result.rows);
  }

  async listEntriesForPeriod(userId: string, periodStart: string, periodEnd: string, limit = 10): Promise<LogbookEntryRecord[]> {
    const result = await query<EntryRow>(
      this.env,
      `
        select
          id,
          case_number,
          activity_date::text,
          case_type,
          anaesthesia_unit,
          ot_number,
          clinical_domain,
          procedure_category,
          procedure_name,
          specialty_area,
          location,
          urgency,
          patient_age_band,
          asa_physical_status,
          anaesthesia_technique,
          supervision_level,
          participation_level,
          complexity_level,
          surgical_department,
          surgery_start_time::text,
          surgery_end_time::text,
          duration_minutes,
          age_years,
          gender,
          bmi::text,
          anaesthetic_planned,
          airway_management,
          scopy_technique,
          intraoperative_events,
          had_complication,
          complication_summary,
          reflection_notes,
          created_at::text
        from logbook_entries
        where user_id = $1
          and activity_date between $2::date and $3::date
        order by activity_date desc, created_at desc
        limit $4
      `,
      [userId, periodStart, periodEnd, limit]
    );

    return this.hydrateEntries(result.rows);
  }

  async browseByUser(userId: string, filters: LogbookBrowseFilters): Promise<LogbookEntryRecord[]> {
    const result = await query<EntryRow>(
      this.env,
      `
        select
          id,
          case_number,
          activity_date::text,
          case_type,
          anaesthesia_unit,
          ot_number,
          clinical_domain,
          procedure_category,
          procedure_name,
          specialty_area,
          location,
          urgency,
          patient_age_band,
          asa_physical_status,
          anaesthesia_technique,
          supervision_level,
          participation_level,
          complexity_level,
          surgical_department,
          surgery_start_time::text,
          surgery_end_time::text,
          duration_minutes,
          age_years,
          gender,
          bmi::text,
          anaesthetic_planned,
          airway_management,
          scopy_technique,
          intraoperative_events,
          had_complication,
          complication_summary,
          reflection_notes,
          created_at::text
        from logbook_entries
        where user_id = $1
          and activity_date between $2::date and $3::date
          and ($4 = '' or case_type = $4)
          and ($5 = '' or surgical_department = $5)
          and ($6::boolean = false or had_complication is true)
          and (
            $7 = ''
            or procedure_name ilike '%' || $7 || '%'
            or surgical_department ilike '%' || $7 || '%'
            or ot_number ilike '%' || $7 || '%'
            or anaesthetic_planned ilike '%' || $7 || '%'
            or supervision_level ilike '%' || $7 || '%'
            or complication_summary ilike '%' || $7 || '%'
            or case_number::text ilike '%' || $7 || '%'
          )
        order by activity_date desc, created_at desc
        limit $8
      `,
      [
        userId,
        filters.periodStart,
        filters.periodEnd,
        filters.caseType,
        filters.surgicalDepartment,
        filters.flaggedOnly,
        filters.searchText,
        filters.limit ?? 60
      ]
    );

    return this.hydrateEntries(result.rows);
  }

  async browseByUnit(unitId: string, filters: LogbookBrowseFilters): Promise<UnitBrowseEntryRecord[]> {
    const result = await query<UnitBrowseRow>(
      this.env,
      `
        select
          le.id,
          le.case_number,
          le.activity_date::text,
          le.case_type,
          le.anaesthesia_unit,
          le.ot_number,
          le.clinical_domain,
          le.procedure_category,
          le.procedure_name,
          le.specialty_area,
          le.location,
          le.urgency,
          le.patient_age_band,
          le.asa_physical_status,
          le.anaesthesia_technique,
          le.supervision_level,
          le.participation_level,
          le.complexity_level,
          le.surgical_department,
          le.surgery_start_time::text,
          le.surgery_end_time::text,
          le.duration_minutes,
          le.age_years,
          le.gender,
          le.bmi::text,
          le.anaesthetic_planned,
          le.airway_management,
          le.scopy_technique,
          le.intraoperative_events,
          le.had_complication,
          le.complication_summary,
          le.reflection_notes,
          le.created_at::text,
          u.id as user_id,
          coalesce(u.display_name, u.name) as user_name,
          r.key as role_key,
          u.designation
        from logbook_entries le
        inner join users u on u.id = le.user_id
        inner join roles r on r.id = u.role_id
        where le.unit_id = $1
          and le.activity_date between $2::date and $3::date
          and ($4 = '' or le.case_type = $4)
          and ($5 = '' or le.surgical_department = $5)
          and ($6::boolean = false or le.had_complication is true)
          and (
            $7 = ''
            or le.procedure_name ilike '%' || $7 || '%'
            or le.surgical_department ilike '%' || $7 || '%'
            or le.ot_number ilike '%' || $7 || '%'
            or le.anaesthetic_planned ilike '%' || $7 || '%'
            or le.supervision_level ilike '%' || $7 || '%'
            or le.complication_summary ilike '%' || $7 || '%'
            or le.case_number::text ilike '%' || $7 || '%'
            or coalesce(u.display_name, u.name) ilike '%' || $7 || '%'
          )
        order by le.activity_date desc, le.created_at desc
        limit $8
      `,
      [
        unitId,
        filters.periodStart,
        filters.periodEnd,
        filters.caseType,
        filters.surgicalDepartment,
        filters.flaggedOnly,
        filters.searchText,
        filters.limit ?? 80
      ]
    );

    return this.hydrateUnitRows(result.rows);
  }

  async browseInvolvingUser(user: AuthenticatedUser, filters: LogbookBrowseFilters): Promise<UnitBrowseEntryRecord[]> {
    const involvementPatterns = this.buildInvolvementPatterns(user);
    const result = await query<UnitBrowseRow>(
      this.env,
      `
        select
          le.id,
          le.case_number,
          le.activity_date::text,
          le.case_type,
          le.anaesthesia_unit,
          le.ot_number,
          le.clinical_domain,
          le.procedure_category,
          le.procedure_name,
          le.specialty_area,
          le.location,
          le.urgency,
          le.patient_age_band,
          le.asa_physical_status,
          le.anaesthesia_technique,
          le.supervision_level,
          le.participation_level,
          le.complexity_level,
          le.surgical_department,
          le.surgery_start_time::text,
          le.surgery_end_time::text,
          le.duration_minutes,
          le.age_years,
          le.gender,
          le.bmi::text,
          le.anaesthetic_planned,
          le.airway_management,
          le.scopy_technique,
          le.intraoperative_events,
          le.had_complication,
          le.complication_summary,
          le.reflection_notes,
          le.created_at::text,
          u.id as user_id,
          coalesce(u.display_name, u.name) as user_name,
          r.key as role_key,
          u.designation
        from logbook_entries le
        inner join users u on u.id = le.user_id
        inner join roles r on r.id = u.role_id
        where le.unit_id = $1
          and le.activity_date between $2::date and $3::date
          and ($4 = '' or le.case_type = $4)
          and ($5 = '' or le.surgical_department = $5)
          and ($6::boolean = false or le.had_complication is true)
          and (
            le.user_id = $7
            or coalesce(le.intraoperative_events, '') ilike any($8::text[])
            or coalesce(le.complication_summary, '') ilike any($8::text[])
            or coalesce(le.reflection_notes, '') ilike any($8::text[])
            or exists (
              select 1
              from logbook_entry_learning_points lep
              where lep.logbook_entry_id = le.id
                and lep.point_text ilike any($8::text[])
            )
          )
          and (
            $9 = ''
            or le.procedure_name ilike '%' || $9 || '%'
            or le.surgical_department ilike '%' || $9 || '%'
            or le.ot_number ilike '%' || $9 || '%'
            or le.anaesthetic_planned ilike '%' || $9 || '%'
            or le.supervision_level ilike '%' || $9 || '%'
            or le.complication_summary ilike '%' || $9 || '%'
            or le.case_number::text ilike '%' || $9 || '%'
            or coalesce(u.display_name, u.name) ilike '%' || $9 || '%'
          )
        order by le.activity_date desc, le.created_at desc
        limit $10
      `,
      [
        user.unitId,
        filters.periodStart,
        filters.periodEnd,
        filters.caseType,
        filters.surgicalDepartment,
        filters.flaggedOnly,
        user.id,
        involvementPatterns,
        filters.searchText,
        filters.limit ?? 80
      ]
    );

    return this.hydrateUnitRows(result.rows);
  }

  async isEntryInvolvingUser(user: AuthenticatedUser, entryId: string): Promise<boolean> {
    const involvementPatterns = this.buildInvolvementPatterns(user);
    const result = await query<{ exists: boolean }>(
      this.env,
      `
        select exists (
          select 1
          from logbook_entries le
          where le.unit_id = $1
            and le.id = $2
            and (
              le.user_id = $3
              or coalesce(le.intraoperative_events, '') ilike any($4::text[])
              or coalesce(le.complication_summary, '') ilike any($4::text[])
              or coalesce(le.reflection_notes, '') ilike any($4::text[])
              or exists (
                select 1
                from logbook_entry_learning_points lep
                where lep.logbook_entry_id = le.id
                  and lep.point_text ilike any($4::text[])
              )
            )
        ) as exists
      `,
      [user.unitId, entryId, user.id, involvementPatterns]
    );

    return result.rows[0]?.exists ?? false;
  }

  async getByIdForUnit(unitId: string, entryId: string): Promise<UnitBrowseEntryRecord | null> {
    const result = await query<UnitBrowseRow>(
      this.env,
      `
        select
          le.id,
          le.case_number,
          le.activity_date::text,
          le.case_type,
          le.anaesthesia_unit,
          le.ot_number,
          le.clinical_domain,
          le.procedure_category,
          le.procedure_name,
          le.specialty_area,
          le.location,
          le.urgency,
          le.patient_age_band,
          le.asa_physical_status,
          le.anaesthesia_technique,
          le.supervision_level,
          le.participation_level,
          le.complexity_level,
          le.surgical_department,
          le.surgery_start_time::text,
          le.surgery_end_time::text,
          le.duration_minutes,
          le.age_years,
          le.gender,
          le.bmi::text,
          le.anaesthetic_planned,
          le.airway_management,
          le.scopy_technique,
          le.intraoperative_events,
          le.had_complication,
          le.complication_summary,
          le.reflection_notes,
          le.created_at::text,
          u.id as user_id,
          coalesce(u.display_name, u.name) as user_name,
          r.key as role_key,
          u.designation
        from logbook_entries le
        inner join users u on u.id = le.user_id
        inner join roles r on r.id = u.role_id
        where le.unit_id = $1
          and le.id = $2
        limit 1
      `,
      [unitId, entryId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    const hydratedEntries = await this.hydrateEntries([row]);
    const entry = hydratedEntries[0];
    if (!entry) {
      return null;
    }

    return {
      ...entry,
      userId: row.user_id,
      userName: row.user_name,
      roleKey: row.role_key,
      designation: row.designation ?? ""
    };
  }

  async listUnitMembers(unitId: string): Promise<UnitMemberOption[]> {
    const result = await query<{
      id: string;
      name: string;
      display_name: string | null;
      role_key: string;
      designation: string | null;
      status: string;
    }>(
      this.env,
      `
        select
          u.id,
          u.name,
          u.display_name,
          r.key as role_key,
          u.designation,
          u.status
        from users u
        inner join roles r on r.id = u.role_id
        where u.unit_id = $1
          and u.status <> 'archived'
        order by coalesce(u.display_name, u.name)
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name ?? row.name,
      role: row.role_key,
      designation: row.designation ?? "",
      status: row.status
    }));
  }

  private async hydrateEntries(rows: EntryRow[]): Promise<LogbookEntryRecord[]> {
    const entries = rows.map(mapEntry);
    const entryIds = entries.map((entry) => entry.id);

    if (!entryIds.length) {
      return entries;
    }

    const [comorbidityResult, procedureResult, analgesiaResult, careResult, learningPointResult] = await Promise.all([
      query<ChildRow>(
        this.env,
        `
          select logbook_entry_id, label, details, position
          from logbook_entry_comorbidities
          where logbook_entry_id = any($1::uuid[])
          order by position asc, created_at asc
        `,
        [entryIds]
      ),
      query<ChildRow>(
        this.env,
        `
          select logbook_entry_id, label, details, position
          from logbook_entry_procedures
          where logbook_entry_id = any($1::uuid[])
          order by position asc, created_at asc
        `,
        [entryIds]
      ),
      query<ChildRow>(
        this.env,
        `
          select logbook_entry_id, label, details, position
          from logbook_entry_analgesia
          where logbook_entry_id = any($1::uuid[])
          order by position asc, created_at asc
        `,
        [entryIds]
      ),
      query<PostOperativeCareRow>(
        this.env,
        `
          select logbook_entry_id, label, position
          from logbook_entry_postoperative_care
          where logbook_entry_id = any($1::uuid[])
          order by position asc, created_at asc
        `,
        [entryIds]
      ),
      query<LearningPointRow>(
        this.env,
        `
          select logbook_entry_id, point_text, position
          from logbook_entry_learning_points
          where logbook_entry_id = any($1::uuid[])
          order by position asc, created_at asc
        `,
        [entryIds]
      )
    ]);

    const comorbiditiesByEntry = groupChildLabels(comorbidityResult.rows);
    const proceduresByEntry = groupChildLabels(procedureResult.rows);
    const analgesiaByEntry = groupChildLabels(analgesiaResult.rows);
    const careByEntry = groupCareLabels(careResult.rows);
    const learningPointsByEntry = groupLearningPoints(learningPointResult.rows);

    for (const entry of entries) {
      entry.comorbidities = comorbiditiesByEntry.get(entry.id) ?? [];
      entry.procedures = proceduresByEntry.get(entry.id) ?? [];
      entry.analgesiaItems = analgesiaByEntry.get(entry.id) ?? [];
      entry.postOperativeCare = careByEntry.get(entry.id) ?? [];
      entry.learningPoints =
        learningPointsByEntry.get(entry.id) ??
        entry.reflectionNotes
          .split(/\r?\n+/)
          .map((item) => item.trim())
          .filter(Boolean);
    }

    return entries;
  }

  private async hydrateUnitRows(rows: UnitBrowseRow[]): Promise<UnitBrowseEntryRecord[]> {
    const hydratedEntries = await this.hydrateEntries(rows);
    const metadataById = new Map(
      rows.map((row) => [
        row.id,
        {
          userId: row.user_id,
          userName: row.user_name,
          roleKey: row.role_key,
          designation: row.designation ?? ""
        }
      ])
    );

    return hydratedEntries.map((entry) => {
      const metadata = metadataById.get(entry.id);
      return {
        ...entry,
        userId: metadata?.userId ?? "",
        userName: metadata?.userName ?? "Unknown user",
        roleKey: metadata?.roleKey ?? "",
        designation: metadata?.designation ?? ""
      };
    });
  }

  private buildInvolvementPatterns(user: AuthenticatedUser): string[] {
    const identifiers = [user.displayName, user.name, user.username]
      .map((value) => String(value ?? "").trim())
      .filter((value) => value.length >= 3);

    return Array.from(new Set(identifiers)).map((value) => `%${value}%`);
  }

  private async insertRepeatableChildren(
    client: PoolClient,
    tableName:
      | "logbook_entry_comorbidities"
      | "logbook_entry_procedures"
      | "logbook_entry_analgesia",
    entryId: string,
    items: Array<{ label: string; details?: string }>
  ): Promise<void> {
    for (const [index, item] of items.entries()) {
      await client.query(
        `
          insert into ${tableName} (id, logbook_entry_id, label, details, position)
          values ($1, $2, $3, $4, $5)
        `,
        [randomUUID(), entryId, item.label, item.details?.trim() ?? "", index]
      );
    }
  }

  private async insertPostOperativeCare(client: PoolClient, entryId: string, items: string[]): Promise<void> {
    for (const [index, item] of items.entries()) {
      await client.query(
        `
          insert into logbook_entry_postoperative_care (id, logbook_entry_id, label, position)
          values ($1, $2, $3, $4)
        `,
        [randomUUID(), entryId, item, index]
      );
    }
  }

  private async insertLearningPoints(client: PoolClient, entryId: string, items: string[]): Promise<void> {
    for (const [index, item] of items.entries()) {
      await client.query(
        `
          insert into logbook_entry_learning_points (id, logbook_entry_id, point_text, position)
          values ($1, $2, $3, $4)
        `,
        [randomUUID(), entryId, item, index]
      );
    }
  }

  async create(input: {
    userId: string;
    unitId: string;
    activityDate: string;
    caseType: string;
    anaesthesiaUnit: string;
    otNumber: string;
    clinicalDomain: string;
    procedureCategory: string;
    procedureName: string;
    specialtyArea: string;
    location: string;
    urgency: string;
    patientAgeBand: string;
    asaPhysicalStatus: string;
    anaesthesiaTechnique: string;
    supervisionLevel: string;
    participationLevel: string;
    complexityLevel: string;
    surgicalDepartment: string;
    surgeryStartTime: string;
    surgeryEndTime: string;
    durationMinutes: number;
    ageYears: number;
    gender: string;
    bmi?: number | null;
    anaestheticPlanned: string;
    airwayManagement?: string;
    scopyTechnique?: string;
    intraoperativeEvents?: string;
    hadComplication: boolean;
    complicationSummary?: string;
    reflectionNotes?: string;
    comorbidities?: Array<{ label: string; details?: string }>;
    procedures?: Array<{ label: string; details?: string }>;
    analgesiaItems?: Array<{ label: string; details?: string }>;
    postOperativeCare?: string[];
    learningPoints?: string[];
  }): Promise<string> {
    const id = randomUUID();
    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock(hashtext($1))", [input.userId]);

      const caseNumberResult = await client.query<{ next_case_number: string }>(
        `
          select coalesce(max(case_number), 0)::text as next_case_number
          from logbook_entries
          where user_id = $1
        `,
        [input.userId]
      );

      const nextCaseNumber = Number(caseNumberResult.rows[0]?.next_case_number ?? 0) + 1;

      await client.query(
        `
          insert into logbook_entries (
            id,
            user_id,
            unit_id,
            case_number,
            activity_date,
            procedure_name,
            patient_reference,
            supervision_level,
            notes,
            clinical_domain,
            procedure_category,
            specialty_area,
            location,
            urgency,
            patient_age_band,
            asa_physical_status,
            anaesthesia_technique,
            participation_level,
            complexity_level,
            duration_minutes,
            had_complication,
            complication_summary,
            reflection_notes,
            case_type,
            anaesthesia_unit,
            ot_number,
            surgical_department,
            surgery_start_time,
            surgery_end_time,
            age_years,
            gender,
            bmi,
            anaesthetic_planned,
            airway_management,
            scopy_technique,
            intraoperative_events
          )
          values (
            $1, $2, $3, $4, $5, $6, null, $7, '', $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26::time, $27::time, $28, $29, $30, $31, $32, $33, $34
          )
        `,
        [
          id,
          input.userId,
          input.unitId,
          nextCaseNumber,
          input.activityDate,
          input.procedureName,
          input.supervisionLevel,
          input.clinicalDomain,
          input.procedureCategory,
          input.specialtyArea,
          input.location,
          input.urgency,
          input.patientAgeBand,
          input.asaPhysicalStatus,
          input.anaesthesiaTechnique,
          input.participationLevel,
          input.complexityLevel,
          input.durationMinutes,
          input.hadComplication,
          input.complicationSummary?.trim() ?? "",
          input.reflectionNotes?.trim() ?? "",
          input.caseType,
          input.anaesthesiaUnit,
          input.otNumber.trim(),
          input.surgicalDepartment,
          input.surgeryStartTime,
          input.surgeryEndTime,
          input.ageYears,
          input.gender,
          input.bmi ?? null,
          input.anaestheticPlanned,
          input.airwayManagement?.trim() ?? "",
          input.scopyTechnique?.trim() ?? "",
          input.intraoperativeEvents?.trim() ?? ""
        ]
      );

      await this.insertRepeatableChildren(client, "logbook_entry_comorbidities", id, input.comorbidities ?? []);
      await this.insertRepeatableChildren(client, "logbook_entry_procedures", id, input.procedures ?? []);
      await this.insertRepeatableChildren(client, "logbook_entry_analgesia", id, input.analgesiaItems ?? []);
      await this.insertPostOperativeCare(client, id, input.postOperativeCare ?? []);
      await this.insertLearningPoints(client, id, input.learningPoints ?? []);

      await client.query("commit");
      return id;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getPeriodSummary(userId: string, periodStart: string, periodEnd: string): Promise<LogbookPeriodSummary> {
    const [
      headlineResult,
      supervisionResult,
      domainResult,
      procedureCategoryResult,
      specialtyResult,
      locationResult,
      urgencyResult,
      techniqueResult,
      complexityResult,
      entryResult,
      reflectionResult
    ] = await Promise.all([
      query<{
        user_id: string;
        user_name: string;
        total_cases: string;
        direct_care_cases: string;
        complication_count: string;
        total_duration_minutes: string;
        domain_coverage: string;
      }>(
        this.env,
        `
          select
            u.id as user_id,
            coalesce(u.display_name, u.name) as user_name,
            count(le.id)::text as total_cases,
            count(le.id) filter (
              where le.participation_level in ('performed_under_supervision', 'performed_independently')
            )::text as direct_care_cases,
            count(le.id) filter (where le.had_complication is true)::text as complication_count,
            coalesce(sum(le.duration_minutes), 0)::text as total_duration_minutes,
            count(distinct le.clinical_domain)::text as domain_coverage
          from users u
          left join logbook_entries le
            on le.user_id = u.id
            and le.activity_date between $2::date and $3::date
          where u.id = $1
          group by u.id, coalesce(u.display_name, u.name)
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select supervision_level as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by supervision_level
          order by count(*) desc, supervision_level
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select clinical_domain as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by clinical_domain
          order by count(*) desc, clinical_domain
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select procedure_category as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by procedure_category
          order by count(*) desc, procedure_category
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select specialty_area as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by specialty_area
          order by count(*) desc, specialty_area
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select location as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by location
          order by count(*) desc, location
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select urgency as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by urgency
          order by count(*) desc, urgency
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select anaesthesia_technique as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by anaesthesia_technique
          order by count(*) desc, anaesthesia_technique
        `,
        [userId, periodStart, periodEnd]
      ),
      query<BreakdownRow>(
        this.env,
        `
          select complexity_level as label, count(*)::text as count
          from logbook_entries
          where user_id = $1 and activity_date between $2::date and $3::date
          group by complexity_level
          order by count(*) desc, complexity_level
        `,
        [userId, periodStart, periodEnd]
      ),
      query<EntryRow>(
        this.env,
        `
          select
            id,
            case_number,
            activity_date::text,
            case_type,
            anaesthesia_unit,
            ot_number,
            clinical_domain,
            procedure_category,
            procedure_name,
            specialty_area,
            location,
            urgency,
            patient_age_band,
            asa_physical_status,
            anaesthesia_technique,
            supervision_level,
            participation_level,
            complexity_level,
            surgical_department,
            surgery_start_time::text,
            surgery_end_time::text,
            duration_minutes,
            age_years,
            gender,
            bmi::text,
            anaesthetic_planned,
            airway_management,
            scopy_technique,
            intraoperative_events,
            had_complication,
            complication_summary,
            reflection_notes,
            created_at::text
          from logbook_entries
          where user_id = $1
            and activity_date between $2::date and $3::date
          order by activity_date desc, created_at desc
          limit 8
        `,
        [userId, periodStart, periodEnd]
      ),
      query<{ reflection_notes: string }>(
        this.env,
        `
          select reflection_notes
          from logbook_entries
          where user_id = $1
            and activity_date between $2::date and $3::date
            and reflection_notes <> ''
          order by activity_date desc, created_at desc
          limit 3
        `,
        [userId, periodStart, periodEnd]
      )
    ]);

    const headline = headlineResult.rows[0];
    const recentEntries = await this.hydrateEntries(entryResult.rows);

    return {
      userId,
      userName: headline?.user_name ?? "Unknown user",
      periodStart,
      periodEnd,
      totalCases: Number(headline?.total_cases ?? 0),
      directCareCases: Number(headline?.direct_care_cases ?? 0),
      complicationCount: Number(headline?.complication_count ?? 0),
      totalDurationMinutes: Number(headline?.total_duration_minutes ?? 0),
      domainCoverage: Number(headline?.domain_coverage ?? 0),
      supervisionMix: mapBreakdown(supervisionResult.rows),
      domainMix: mapBreakdown(domainResult.rows),
      procedureCategoryMix: mapBreakdown(procedureCategoryResult.rows),
      specialtyMix: mapBreakdown(specialtyResult.rows),
      locationMix: mapBreakdown(locationResult.rows),
      urgencyMix: mapBreakdown(urgencyResult.rows),
      techniqueMix: mapBreakdown(techniqueResult.rows),
      complexityMix: mapBreakdown(complexityResult.rows),
      recentEntries,
      reflectionHighlights: reflectionResult.rows.map((row) => row.reflection_notes).filter(Boolean)
    };
  }
}
