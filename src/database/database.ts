import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { User, UserInsert, UserUpdate } from "./models/user";
import { Slot, SlotInsert, SlotUpdate } from "./models/slot";
import { Ballot, BallotInsert, BallotUpdate } from "./models/ballot";

export class Database {
  private readonly client: SupabaseClient<Database>;

  private constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  public static async build(options: {
    supabaseUrl: string;
    supabaseKey: string;
  }): Promise<Database> {
    const { supabaseUrl, supabaseKey } = options;
    const client = createClient<Database>(supabaseUrl, supabaseKey);
    return new Database(client);
  }

  public async isUser(telegramId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("USERS")
      .select("*")
      .eq("telegram_id", telegramId);

    if (error) {
      throw new Error(error.message);
    }

    return data.length > 0;
  }

  public async addUser(newUser: User): Promise<void> {
    const { data, error } = await this.client.from("USERS").insert(newUser);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async delUser(telegramId: string): Promise<void> {
    const { data, error } = await this.client
      .from("USERS")
      .delete()
      .eq("telegram_id", telegramId);

    if (error) {
      throw new Error(error.message);
    }
  }

  private async getUserId(telegramId: string): Promise<number> {
    const { data, error } = await this.client
      .from("USERS")
      .select("id")
      .eq("telegram_id", telegramId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.id;
  }

  private validateTime(startTime: string, endTime: string): boolean {
    return new Date(startTime) < new Date(endTime);
  }

  public async isBooked(startTime: string, endTime: string): Promise<boolean> {
    if (!this.validateTime(startTime, endTime)) {
      throw new Error("Start time must strictly be before end time!");
    }

    const { data, error } = await this.client
      .from("SLOTS")
      .select("*")
      .lt("time_begin", endTime)
      .gt("time_end", startTime);

    if (error) {
      throw new Error(error.message);
    }

    return data.length > 0;
  }

  public async bookSlot(booking: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<void> {
    const userId = await this.getUserId(booking.userTelegramId);

    if (!this.validateTime(booking.startTime, booking.endTime)) {
      throw new Error("Start time must strictly be before end time!");
    }

    const isBooked = await this.isBooked(booking.startTime, booking.endTime);

    if (isBooked) {
      throw new Error(
        "Unable to book the entire slot, part/all of it is already booked"
      );
    }

    const { data, error } = await this.client.from("SLOTS").insert({
      booked_by: userId,
      time_begin: booking.startTime,
      time_end: booking.endTime,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  public async delSlot(booking: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<void> {
    const userId = await this.getUserId(booking.userTelegramId);

    const { data, error } = await this.client
      .from("SLOTS")
      .delete()
      .eq("booked_by", userId)
      .eq("time_begin", booking.startTime)
      .eq("time_end", booking.endTime);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async getSlotsByUser(telegramId: string): Promise<Slot[]> {
    const userId = await this.getUserId(telegramId);

    const { data, error } = await this.client
      .from("SLOTS")
      .select()
      .eq("booked_by", userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async getSlotsByTime(startTime: Date, endTime: Date): Promise<Slot[]> {
    const { data, error } = await this.client
      .from("SLOTS")
      .select("*")
      .gte("time_begin", startTime.toISOString())
      .lt("time_end", endTime.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async getUserEmail(telegramId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("USERS")
      .select("nus_email")
      .eq("telegram_id", telegramId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.nus_email;
  }

  public async getUserById(id: number): Promise<string | null> {
    const { data, error } = await this.client
      .from("USERS")
      .select("name")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.name;
  }

  public async saveVerificationCode(
    telegramId: string,
    verificationCode: string
  ): Promise<void> {
    const { data, error } = await this.client
      .from("USERS")
      .update({ verification_code: verificationCode })
      .eq("telegram_id", telegramId);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async getVerificationCode(telegramId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("USERS")
      .select("verification_code")
      .eq("telegram_id", telegramId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.verification_code;
  }

  public async isRegistered(telegramId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("USERS")
      .select("telegram_id")
      .eq("telegram_id", telegramId);

    if (error) {
      throw new Error(error.message);
    }

    return data.length > 0;
  }

  public async isVerified(telegramId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("USERS")
      .select("is_auth")
      .eq("telegram_id", telegramId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.is_auth;
  }

  public async markUserAsVerified(telegramId: string): Promise<void> {
    const { data, error } = await this.client
      .from("USERS")
      .update({ is_auth: true })
      .eq("telegram_id", telegramId);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async isBalloted(
    telegramId: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    if (!this.validateTime(startTime, endTime)) {
      throw new Error("Start time must strictly be before end time!");
    }

    const { data, error } = await this.client
      .from("BALLOTS")
      .select("*")
      .lt("time_begin", endTime)
      .gt("time_end", startTime)
      .eq("telegram_id", telegramId);

    if (error) {
      throw new Error(error.message);
    }

    return data.length > 0;
  }

  public async addBallot(
    telegramId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    const userId = await this.getUserId(telegramId);
    const balloted = await this.isBalloted(
      telegramId,
      startTime.toISOString(),
      endTime.toISOString()
    );

    if (balloted) {
      throw new Error("Slot is already balloted!");
    }

    if (startTime >= endTime) {
      throw new Error("Start time must strictly be before end time!");
    }

    const { data, error } = await this.client.from("BALLOTS").insert({
      telegram_id: telegramId,
      user_id: userId,
      time_begin: startTime.toISOString(),
      time_end: endTime.toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  public async delBallot(ballot: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<void> {
    const userId = await this.getUserId(ballot.userTelegramId);

    const { data, error } = await this.client
      .from("BALLOTS")
      .delete()
      .eq("user_id", userId)
      .eq("time_begin", ballot.startTime)
      .eq("time_end", ballot.endTime);

    if (error) {
      throw new Error(error.message);
    }
  }

  public async getBallotsByTime(
    startTime: Date,
    endTime: Date
  ): Promise<Ballot[]> {
    const { data, error } = await this.client
      .from("BALLOTS")
      .select("*")
      .gte("time_begin", startTime.toISOString())
      .lt("time_end", endTime.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async delBallotsByTime(startTime: Date, endTime: Date): Promise<void> {
    const { data, error } = await this.client
      .from("BALLOTS")
      .delete()
      .gte("time_begin", startTime.toISOString())
      .lt("time_end", endTime.toISOString());

    if (error) {
      throw new Error(error.message);
    }
  }

  public async getBallotsFromUser(telegramId: string): Promise<Ballot[]> {
    const userId = await this.getUserId(telegramId);

    const { data, error } = await this.client
      .from("BALLOTS")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async getAllBookedSlotsSe(start: Date, end: Date): Promise<Slot[]> {
    const { data, error } = await this.client
      .from("SLOTS")
      .select("*")
      .gte("time_begin", start.toISOString())
      .lte("time_end", end.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async getAllBallotsSe(start: Date, end: Date): Promise<Ballot[]> {
    const { data, error } = await this.client
      .from("BALLOTS")
      .select("*")
      .gte("time_begin", start.toISOString())
      .lte("time_end", end.toISOString());

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async getAllBookedSlots(): Promise<Slot[]> {
    const currentTime = new Date().toISOString();

    const { data, error } = await this.client
      .from("SLOTS")
      .select("*")
      .gte("time_begin", currentTime);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  public async getAllBallots(): Promise<Ballot[]> {
    const currentTime = new Date().toISOString();

    const { data, error } = await this.client
      .from("BALLOTS")
      .select("*")
      .gte("time_begin", currentTime);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}
