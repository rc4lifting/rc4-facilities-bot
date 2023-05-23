import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Result, Ok, Err } from "@sniptt/monads";

/**
 * A class that holds the Supabase SQL database.
 * Dplatform programs do not interface with the
 * client directly, but instead use this class.
 *
 * In the future (after Milestone 1), this class
 * is planned to interface diretly with NUS venue API.
 */
export class DDatabase {
  /** The Supabase client. */
  readonly client: SupabaseClient;

  /**
   * A private constructor for DDatabase.
   *
   * @param client Supabase Client
   * @param options Additional options, included for future extensions
   */
  private constructor(client: SupabaseClient, options: object) {
    this.client = client;
  }

  /**
   * Asynchronous factory method to create DDatabase instances.
   * Will reject invalid Supabase Client data.
   *
   * @param options Options given to the DDatabase instance
   * @param options.supabaseUrl URL for Supabase database
   * @param options.supabaseKey The public anonymous key
   * @returns A validated DDatabase instance
   */
  public static async build(options: {
    supabaseUrl: string;
    supabaseKey: string;
  }): Promise<DDatabase> {
    const { supabaseUrl, supabaseKey, ...classOptions } = options;
    const client = createClient(supabaseUrl, supabaseKey);

    // Test the given client
    // 1. It must be a valid Supabase client
    // 2. It must contain Dplatform data.
    //    We verify this by looking for the
    //    presence of the SLOTS table.
    return (
      client
        .from("SLOTS")
        .select("*")
        .then((query) => {
          if (query.error) {
            // If the error message exists,
            // format it into a JS error
            throw new Error(query.error.message);
          }
        })
        // If there is no error, we store a new
        // DDatabase instance in the promise
        .then((_) => new DDatabase(client, classOptions))
    );
  }

  public async isUser(telegramId: string): Promise<boolean> {
    return this.client.from("USERS").select("*").then(); //temporary
  }

  public async addUser(newUser: {
    name: string;
    telegramId: string;
    nusEmail: string;
    room: string;
  }): Promise<Result<void, Error>> {
    return this.isUser(newUser.telegramId).then(); //temporary
  }

  async getUserId(telegramId: string): Promise<Result<number, Error>> {
    return this.isUser(telegramId).then(); // temporary
  }

  public async isBooked(datetime: string): Promise<boolean> {
    return this.client.from("SLOTS").select("*").then(); //temporary
  }

  public async bookSlot(booking: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<Result<void, Error>> {
    return this.isBooked("placeholder").then(); //temporary;
  }
}
