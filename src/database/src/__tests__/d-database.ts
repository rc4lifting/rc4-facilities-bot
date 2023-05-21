import { DDatabase } from "..";

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
          supabaseUrl: "https://pivfcbapdsurtbwrkvqn.supabase.co",
          supabaseKey: "lala",
        })
      ).rejects.toThrow("Invalid API key");
    });
    it("Proceeds with no error if given valid URL and key", () => {
      return expect(
        // This is a dummy database that we won't use.
        DDatabase.build({
          supabaseUrl: "https://ruagihxyxiqypllejjhg.supabase.co",
          supabaseKey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1YWdpaHh5eGlxeXBsbGVqamhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODQ2OTQ2NjcsImV4cCI6MjAwMDI3MDY2N30.xezQqdycAmsaJAtcEFlbh1L_aB1le6L6hX66W58uuwE",
        })
      ).resolves.toBeInstanceOf(DDatabase);
    });
  });
});
