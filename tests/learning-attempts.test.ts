import { describe, expect, it } from "vitest";
import { summarizeH5PXapiAttempt, summarizeManualAcademyProgress } from "../src/modules/learning/attempts";

describe("academy attempt summarizers", () => {
  it("normalizes manual progress updates into academy-friendly status signals", () => {
    expect(summarizeManualAcademyProgress("completed")).toMatchObject({
      attemptKind: "manual_progress",
      progressStatus: "completed",
      passed: true
    });

    expect(summarizeManualAcademyProgress("in_progress")).toMatchObject({
      progressStatus: "in_progress"
    });
  });

  it("extracts score and pass state from H5P xAPI result payloads", () => {
    expect(
      summarizeH5PXapiAttempt("passed", {
        score: { raw: 8, max: 10 },
        success: true,
        completion: true
      })
    ).toMatchObject({
      attemptKind: "h5p_xapi",
      progressStatus: "completed",
      scoreRaw: 8,
      scoreMax: 10,
      scoreScaled: 0.8,
      passed: true
    });
  });

  it("treats answered events as in-progress even when completion is absent", () => {
    expect(
      summarizeH5PXapiAttempt("answered", {
        score: { raw: 2, max: 5 }
      })
    ).toMatchObject({
      progressStatus: "in_progress",
      scoreScaled: 0.4
    });
  });
});
