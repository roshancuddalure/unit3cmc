import { ContentMetadata } from "@lumieducation/h5p-server/build/src/ContentMetadata";

type LooseMetadata = Record<string, unknown>;

export function buildH5PSaveMetadata(
  existingMetadata: LooseMetadata = {},
  metadataPatch: LooseMetadata = {}
): ContentMetadata {
  const mergedMetadata: LooseMetadata = {
    ...existingMetadata,
    ...metadataPatch
  };

  for (const [key, value] of Object.entries(mergedMetadata)) {
    if (value === undefined || value === null) {
      delete mergedMetadata[key];
      continue;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      delete mergedMetadata[key];
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      delete mergedMetadata[key];
    }
  }

  return new ContentMetadata(mergedMetadata);
}
