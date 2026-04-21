import { describe, expect, it } from "vitest";
import {
  extractWrappedH5PMetadata,
  isWrappedH5PContentParams,
  unwrapH5PContentParams
} from "../src/modules/h5p/content-params";

describe("H5P content parameter normalization", () => {
  it("unwraps editor envelopes so upload-tab saves persist the real content body", () => {
    const wrappedParams = {
      params: {
        introPage: {
          title: "Uploaded question set"
        }
      },
      metadata: {
        title: "Uploaded question set",
        mainLibrary: "H5P.QuestionSet"
      }
    };

    expect(isWrappedH5PContentParams(wrappedParams)).toBe(true);
    expect(unwrapH5PContentParams(wrappedParams)).toEqual(wrappedParams.params);
    expect(extractWrappedH5PMetadata(wrappedParams)).toEqual(wrappedParams.metadata);
  });

  it("leaves regular content parameters untouched", () => {
    const plainParams = {
      introPage: {
        title: "Plain content"
      }
    };

    expect(isWrappedH5PContentParams(plainParams)).toBe(false);
    expect(unwrapH5PContentParams(plainParams)).toEqual(plainParams);
    expect(extractWrappedH5PMetadata(plainParams)).toEqual({});
  });
});
