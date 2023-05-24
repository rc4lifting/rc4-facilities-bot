import { DDatabase } from "..";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

let test_URL: string;
let test_Key: string;

let test_database: DDatabase;

// Needed if we want to test
// for errors or cleanup stuff
let test_client: SupabaseClient;

beforeAll(async () => {
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
  test_client = createClient(test_URL, test_Key);
  test_database = await DDatabase.build({
    supabaseUrl: test_URL,
    supabaseKey: test_Key,
  });
});

describe("Dplatform Database", () => {
  describe("build() factory method", () => {
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
  describe("instance", () => {
    let test_id: number;
    beforeAll(async () => {
      // We initialize a test user.
      test_client.from("USERS").insert({
        name: "test",
        telegram_id: "test",
        nus_email: "test",
        room: "test",
      });
      const { data, error } = await test_client
        .from("USERS")
        .select("id")
        .eq("telegram_id", "test");
      test_id = data![0].id;
    });
    afterAll(async () => {
      // Delete all data entries
      // pertaining to our test account
      test_client.from("SLOTS").delete().eq("booked_by", test_id);
      test_client.from("USERS").delete().eq("telegram_id", "test");
    });
    describe("isUser method", () => {
      beforeAll(async () => {
        // Create an invalid situation in which 2 users share a telegram account
        test_client.from("USERS").insert({
          name: "test2",
          telegram_id: "test2",
          nus_email: "test",
          room: "test",
        });
        test_client.from("USERS").insert({
          name: "test3",
          telegram_id: "test2",
          nus_email: "test",
          room: "test",
        });
      });
      afterAll(async () => {
        test_client.from("USERS").delete().eq("telegram_id", "test2");
      });
      it("detects that a user is in the database", () => {
        return expect(test_database.isUser("test")).resolves.toBeTruthy();
      });
      it("detects that a user is not in the database", () => {
        return expect(test_database.isUser("foo")).resolves.toBeFalsy();
      });
      it("detects the illegal state in which 2 users share a telegram account", () => {
        return expect(test_database.isUser("test2")).rejects.toThrow(
          "Illegal State"
        );
      });
    });
    describe("addUser method", () => {
      it("initializes a new user as expected", () => {});
      it("returns an error if the user intended to add has a duplicate telegram account", () => {});
    });
    describe("delUser method", () => {
      it("deletes a user as expected", () => {});
      it("returns an error on attempt to delete nonexistent user", () => {});
    });
    describe("isBooked method", () => {
      it("detects that specified time is booked", () => {});
      it("detects that specified time is free", () => {});
    });
    describe("bookSlot method", () => {
      it("books a free slot", () => {});
      it("returns an error if booking a taken slot", () => {});
      it("returns an error booking a slot for a nonexistent user", () => {});
    });
    describe("delSlot method", () => {
      it("deletes a booked slot", () => {});
      it("returns an error attempting to delete a slot for a nonexistent user", () => {});
    });
    describe("getSlots method", () => {
      it("can access all bookings for a user", () => {});
      it("returns an error attempting to access a nonexistent user's bookings", () => {});
    });
  });
});
