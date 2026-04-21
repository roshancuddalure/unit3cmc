import { describe, expect, it } from "vitest";
import { buildH5PSaveMetadata } from "../src/modules/h5p/save-metadata";

describe("buildH5PSaveMetadata", () => {
  it("removes blank optional fields so Lumi save-schema validation can pass", () => {
    const metadata = buildH5PSaveMetadata(
      {
        title: "Existing title",
        metaDescription: "Old description",
        authors: [],
        changes: []
      },
      {
        title: "Updated title",
        metaDescription: undefined
      }
    );

    expect(metadata.title).toBe("Updated title");
    expect(metadata.metaDescription).toBeUndefined();
    expect(metadata.authors).toBeUndefined();
    expect(metadata.changes).toBeUndefined();
  });

  it("keeps non-empty optional fields when they are provided", () => {
    const metadata = buildH5PSaveMetadata(
      {},
      {
        title: "Question set",
        mainLibrary: "H5P.QuestionSet",
        metaDescription: "Short summary"
      }
    );

    expect(metadata.mainLibrary).toBe("H5P.QuestionSet");
    expect(metadata.metaDescription).toBe("Short summary");
  });
});
