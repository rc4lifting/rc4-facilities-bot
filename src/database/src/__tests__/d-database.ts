import { DDatabase } from "..";

let test_URL: string;
let test_Key: string;

beforeAll(() => {
  // Tests depend on environment variables
  // TEST_URL and TEST_KEY, which should
  // hold the URL and public anonymous key for
  // a test API, not meant for production.
  if (process.env.TEST_URL == undefined || process.env.TEST_KEY == undefined) {
    throw new Error(
      "TEST_URL and TEST_KEY must be defined as environment variables for tests to work!"
    );
  }
  test_URL = process.env.TEST_URL;
  test_Key = process.env.TEST_KEY;
});

describe("Dplatform Database", () => {
  describe("DDatabase.build() factory method", () => {
    it("Throws an error given no URL", () => {
      return expect(
        DDatabase.build({
          supabaseUrl: "",
          supabaseKey: "lala",
        })
      ).rejects.toThrow("supabaseUrl is required");
    });
    it("Throws an error given non-URL", () => {
      return expect(
        DDatabase.build({
          supabaseUrl: "lala",
          supabaseKey: "lala",
        })
      ).rejects.toThrow("Invalid URL");
    });
    it("Throws an error given irrelevant URL", () => {
      return expect(
        DDatabase.build({
          supabaseUrl: "https://s-kybound.github.io/",
          supabaseKey: "lala",
        })
      ).rejects.toThrow();
    });
    it("Throws an error given valid URL but incorrect key", () => {
      return expect(
        DDatabase.build({
          supabaseUrl: test_URL,
          supabaseKey: "lala",
        })
      ).rejects.toThrow("Invalid API key");
    });
    it("Proceeds with no error if given valid URL and key", () => {
      return expect(
        // This is a dummy database that we won't use.
        DDatabase.build({
          supabaseUrl: test_URL,
          supabaseKey: test_Key,
        })
      ).resolves.toBeInstanceOf(DDatabase);
    });
  });
});
