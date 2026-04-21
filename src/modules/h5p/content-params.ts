function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function looksLikeH5PMetadata(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Object.keys(value).length === 0 ||
    typeof value.title === "string" ||
    typeof value.mainLibrary === "string" ||
    typeof value.license === "string" ||
    Array.isArray(value.authors) ||
    Array.isArray(value.changes)
  );
}

export function isWrappedH5PContentParams(value: unknown): value is {
  params: unknown;
  metadata: Record<string, unknown>;
} {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (!keys.includes("params") || !keys.includes("metadata")) {
    return false;
  }

  if (!keys.every((key) => key === "params" || key === "metadata")) {
    return false;
  }

  return looksLikeH5PMetadata(value.metadata);
}

export function unwrapH5PContentParams(value: unknown): unknown {
  return isWrappedH5PContentParams(value) ? value.params ?? {} : (value ?? {});
}

export function extractWrappedH5PMetadata(value: unknown): Record<string, unknown> {
  return isWrappedH5PContentParams(value) ? value.metadata : {};
}
