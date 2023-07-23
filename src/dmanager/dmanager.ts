import { DDatabase, Ballot } from "../database";
import { shuffle } from "./algorithms";
import { weekStart, addDays } from "../timeutils";
import {
  isBefore,
  isAfter,
  isEqual,
  startOfWeek,
  addWeeks,
  formatISO,
  getDay,
  format,
  differenceInMinutes,
  endOfWeek,
} from "date-fns";
import config from "../config/config";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

export class DManager {
  private database: DDatabase;
  public constructor(database: DDatabase) {
    this.database = database;
  }

  /**
   * Resolves the next week of ballots.
   */
  public async resolve(): Promise<void> {
    // Start of balloting period - next week
    const ballotStart = addDays(weekStart(), 7);
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

  public async tryBook(
    telegramId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Get the start and end of current week in GMT+8, but expressed in UTC
    const startOfWeekInUTC = zonedTimeToUtc(
      formatISO(startOfWeek(new Date(), { weekStartsOn: 1 })),
      "Asia/Singapore"
    );
    const endOfWeekInUTC = zonedTimeToUtc(
      formatISO(endOfWeek(new Date(), { weekStartsOn: 1 })),
      "Asia/Singapore"
    );

    if (isBefore(endTime, startTime)) {
      throw new Error(
        "End time cannot be before start time! We've logged this incident."
      );
    }

    // Disallow bookings on weekends in GMT+8
    const startTimeInGMT8 = utcToZonedTime(startTime, "Asia/Singapore");
    if (
      config.weekendsDisallowed &&
      (getDay(startTimeInGMT8) === 6 || getDay(startTimeInGMT8) === 0)
    ) {
      throw new Error(
        "Booking cannot be done on weekends! We've logged this incident."
      );
    }

    // Ensure the ballot timings are within the start and end times
    const bookingStart = zonedTimeToUtc(
      `${format(startTime, "yyyy-MM-dd")}T${config.startingTime}:00`,
      "Asia/Singapore"
    );
    const bookingEnd = zonedTimeToUtc(
      `${format(endTime, "yyyy-MM-dd")}T${config.endingTime}:00`,
      "Asia/Singapore"
    );

    if (isBefore(startTime, bookingStart) || isAfter(endTime, bookingEnd)) {
      throw new Error(
        "Book timings must be within the configured start and end times!"
      );
    }

    // Ensure ballot timings are aligned with the interval
    const startMinutesFromBookingStart = differenceInMinutes(
      startTime,
      bookingStart
    );
    const endMinutesFromBookingStart = differenceInMinutes(
      endTime,
      bookingStart
    );

    if (
      startMinutesFromBookingStart % config.timeInterval !== 0 ||
      endMinutesFromBookingStart % config.timeInterval !== 0
    ) {
      throw new Error(
        "Book timings must be aligned with the configured time interval!"
      );
    }

    // Ensure ballot doesn't exceed max length
    const duration = differenceInMinutes(endTime, startTime);
    if (duration > config.maxLength) {
      throw new Error(
        `Booking exceeds max length of ${config.maxLength} minutes! We've logged this incident.`
      );
    }

    // Ensure ballot can only be done for the current week
    if (
      isBefore(startTime, startOfWeekInUTC) ||
      isAfter(startTime, endOfWeekInUTC)
    ) {
      throw new Error(
        "Booking can only be done for the current week! We've logged this incident."
      );
    }

    await this.database.bookSlot({
      userTelegramId: telegramId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });
  }

  public async ballot(
    telegramId: string,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    // Get the start of next week and two weeks from now in GMT+8, but expressed in UTC
    const nextWeekStartInUTC = zonedTimeToUtc(
      formatISO(startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 })),
      "Asia/Singapore"
    );
    const twoWeeksFromNowInUTC = zonedTimeToUtc(
      formatISO(startOfWeek(addWeeks(new Date(), 2), { weekStartsOn: 1 })),
      "Asia/Singapore"
    );

    if (isAfter(startTime, endTime)) {
      throw new Error(
        "End time cannot be before start time! We've logged this incident."
      );
    }

    // Disallow bookings on weekends in GMT+8
    const startTimeInGMT8 = utcToZonedTime(startTime, "Asia/Singapore");
    if (
      config.weekendsDisallowed &&
      (getDay(startTimeInGMT8) === 6 || getDay(startTimeInGMT8) === 0)
    ) {
      throw new Error(
        "Balloting cannot be done on weekends! We've logged this incident."
      );
    }

    // Ensure the ballot timings are within the start and end times
    const bookingStart = zonedTimeToUtc(
      `${format(startTime, "yyyy-MM-dd")}T${config.startingTime}:00`,
      "Asia/Singapore"
    );
    const bookingEnd = zonedTimeToUtc(
      `${format(endTime, "yyyy-MM-dd")}T${config.endingTime}:00`,
      "Asia/Singapore"
    );

    if (isBefore(startTime, bookingStart) || isAfter(endTime, bookingEnd)) {
      throw new Error(
        "Ballot timings must be within the configured start and end times!"
      );
    }

    // Ensure ballot timings are aligned with the interval
    const startMinutesFromBookingStart = differenceInMinutes(
      startTime,
      bookingStart
    );
    const endMinutesFromBookingStart = differenceInMinutes(
      endTime,
      bookingStart
    );

    if (
      startMinutesFromBookingStart % config.timeInterval !== 0 ||
      endMinutesFromBookingStart % config.timeInterval !== 0
    ) {
      throw new Error(
        "Ballot timings must be aligned with the configured time interval!"
      );
    }

    // Ensure ballot doesn't exceed max length
    const duration = differenceInMinutes(endTime, startTime);
    if (duration > config.maxLength) {
      throw new Error(
        `Booking exceeds max length of ${config.maxLength} minutes! We've logged this incident.`
      );
    }

    if (
      isBefore(startTime, nextWeekStartInUTC) ||
      isAfter(startTime, twoWeeksFromNowInUTC)
    ) {
      throw new Error(
        "Balloting can only be done for the next week! We've logged this incident."
      );
    }
    await this.database.addBallot(telegramId, startTime, endTime);
  }
  public async book(booking: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<void> {
    const startTime = new Date(booking.startTime);
    if (startTime >= addDays(weekStart(), 7) || startTime < weekStart()) {
      throw new Error("Booking can only be done for the current week!");
    }
    const res = await this.database.bookSlot(booking);
    if (res.isErr()) {
      throw res.unwrapErr();
    }
  }
}
