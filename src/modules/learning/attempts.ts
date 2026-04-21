export interface AcademyAttemptSummary {
  attemptKind: "manual_progress" | "h5p_xapi";
  progressStatus: "not_started" | "in_progress" | "completed" | null;
  scoreRaw: number | null;
  scoreMax: number | null;
  scoreScaled: number | null;
  passed: boolean | null;
  timeSpentSeconds: number | null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function clampScaled(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.min(1, value));
}

export function summarizeManualAcademyProgress(status: string): AcademyAttemptSummary {
  const normalizedStatus = String(status ?? "").trim().toLowerCase();
  const progressStatus =
    normalizedStatus === "completed" ? "completed" : normalizedStatus === "in_progress" ? "in_progress" : "not_started";

  return {
    attemptKind: "manual_progress",
    progressStatus,
    scoreRaw: null,
    scoreMax: null,
    scoreScaled: null,
    passed: progressStatus === "completed" ? true : null,
    timeSpentSeconds: null
  };
}

export function summarizeH5PXapiAttempt(verb: string, result: unknown): AcademyAttemptSummary {
  const normalizedVerb = String(verb ?? "").trim().toLowerCase();
  const safeResult = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
  const safeScore = safeResult.score && typeof safeResult.score === "object" ? (safeResult.score as Record<string, unknown>) : {};

  const raw = toFiniteNumber(safeScore.raw);
  const max = toFiniteNumber(safeScore.max);
  const scaledFromResult = clampScaled(toFiniteNumber(safeScore.scaled));
  const passed =
    typeof safeResult.success === "boolean"
      ? safeResult.success
      : normalizedVerb.includes("passed")
        ? true
        : normalizedVerb.includes("failed")
          ? false
          : null;
  const completion =
    typeof safeResult.completion === "boolean"
      ? safeResult.completion
      : normalizedVerb.includes("completed")
        ? true
        : null;

  const derivedScaled =
    scaledFromResult !== null ? scaledFromResult : raw !== null && max !== null && max > 0 ? clampScaled(raw / max) : null;

  const progressStatus =
    completion || passed === true
      ? "completed"
      : normalizedVerb.includes("answered") ||
          normalizedVerb.includes("progressed") ||
          normalizedVerb.includes("interacted") ||
          raw !== null ||
          derivedScaled !== null
        ? "in_progress"
        : null;

  return {
    attemptKind: "h5p_xapi",
    progressStatus,
    scoreRaw: raw,
    scoreMax: max,
    scoreScaled: derivedScaled,
    passed,
    timeSpentSeconds: toFiniteNumber(safeResult.duration)
  };
}
