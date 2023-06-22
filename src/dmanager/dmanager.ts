import { DDatabase, Ballot } from "../database";
import { shuffle } from "./algorithms";
import { previousSunday } from "date-fns";

export class DManager {
  private database: DDatabase;
  public constructor(database: DDatabase) {
    this.database = database;
  }

  /**
   * Resolves the next week of ballots.
   */
  public async resolve(): Promise<void> {
    const weekStart = previousSunday(Date.now());
    // Start of balloting period - next week
    const ballotStart = new Date(weekStart.getDate() + 7);
    // End of balloting period - next next week
    const ballotEnd = new Date(ballotStart.getDate() + 7);
    const ballots = await this.database.getBallotsByTime(ballotStart, ballotEnd);
    // If there are no issues getting the ballots, delete them from the database
    await this.database.delBallotsByTime(ballotStart, ballotEnd);
    // placeholder algorithm. not the best.
    const shuffled = shuffle(ballots);
    for (let x = 0; x < shuffled.length; x++) {
      await this.book({
        userTelegramId: shuffled[x].telegram_id,
        startTime: shuffled[x].time_begin,
        endTime: shuffled[x].time_end,
      });
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
    const weekStart = previousSunday(Date.now());
    if (
      startTime < new Date(weekStart.getDate() + 7) ||
      startTime >= new Date(weekStart.getDate() + 14)
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
    const weekStart = previousSunday(Date.now());
    const startTime = new Date(booking.startTime);
    if (startTime >= new Date(weekStart.getDate() + 7)) {
      throw new Error("Booking can only be done for the current week!");
    }
    const res = await this.database.bookSlot(booking);
    if (res.isErr()) {
      throw res.unwrapErr();
    }
  }
}
