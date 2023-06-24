import { start } from "repl";
import { DDatabase, Ballot } from "../database";
import { shuffle } from "./algorithms";
import { previousSunday, addDays } from "date-fns";

export class DManager {
  private database: DDatabase;
  public constructor(database: DDatabase) {
    this.database = database;
  }

  /**
   * Using the current time, get the start of what we define
   * as the "previous week" - Monday to Sunday.
   *
   * @returns The start of the current week, Monday.
   */
  private weekStart(): Date {
    const start = previousSunday(Date.now());
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    return addDays(start, 1);
  }

  /**
   * Resolves the next week of ballots.
   */
  public async resolve(): Promise<void> {
    // Start of balloting period - next week
    const ballotStart = addDays(this.weekStart(), 7);
    // End of balloting period - next next week
    const ballotEnd = addDays(ballotStart, 7);
    const ballots = await this.database.getBallotsByTime(
      ballotStart,
      ballotEnd
    );
    // If there are no issues getting the ballots, delete them from the database
    await this.database.delBallotsByTime(ballotStart, ballotEnd);
    // placeholder algorithm. not the best.
    const shuffled = shuffle(ballots);
    for (let x = 0; x < shuffled.length; x++) {
      try {
        await this.book({
          userTelegramId: shuffled[x].telegram_id,
          startTime: shuffled[x].time_begin,
          endTime: shuffled[x].time_end,
        });
      } catch (error) {
        // If there's an error from conflicting bookings, no issue!
        if (
          error instanceof Error &&
          error.message ==
            "Unable to book the entire slot, part/all of it is already booked"
        ) {
          continue;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Wrapper over the D-Database ballot method.
   * Prevents ballots for the current week, or 2 weeks from now.
   */
  public async ballot(
    telegramId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    if (
      startTime < addDays(this.weekStart(), 7) ||
      startTime >= addDays(this.weekStart(), 14)
    ) {
      throw new Error("Balloting can only be done for the next week!");
    }
    await this.database.addBallot(telegramId, startTime, endTime);
  }

  /**
   * Wrapper over the D-Database book method.
   * Prevents bookings beyond the current week.
   */
  public async book(booking: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<void> {
    const startTime = new Date(booking.startTime);
    if (
      startTime >= addDays(this.weekStart(), 7) ||
      startTime < this.weekStart()
    ) {
      throw new Error("Booking can only be done for the current week!");
    }
    const res = await this.database.bookSlot(booking);
    if (res.isErr()) {
      throw res.unwrapErr();
    }
  }
}
