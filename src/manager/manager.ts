import { Database } from "../database";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  formatISO,
  isBefore,
  isAfter,
  getDay,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import config from "../config/default";

class Manager {
  private db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  public async resolve(): Promise<void> {
    const ballotStart = addDays(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      7
    );
    const ballotEnd = addDays(ballotStart, 7);

    const ballots = await this.db.getBallotsByTime(ballotStart, ballotEnd);
    await this.db.delBallotsByTime(ballotStart, ballotEnd);

    const shuffled = this.shuffle(ballots);
    for (const ballot of shuffled) {
      try {
        await this.book({
          userTelegramId: ballot.telegram_id,
          startTime: ballot.time_begin,
          endTime: ballot.time_end,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already booked")
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
    const startOfWeekInUTC = zonedTimeToUtc(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      "Asia/Singapore"
    );
    const endOfWeekInUTC = zonedTimeToUtc(
      endOfWeek(new Date(), { weekStartsOn: 1 }),
      "Asia/Singapore"
    );

    if (isBefore(endTime, startTime)) {
      throw new Error(
        "End time cannot be before start time! We've logged this incident."
      );
    }

    const startTimeInGMT8 = utcToZonedTime(startTime, "Asia/Singapore");
    if (
      config.weekendsDisallowed &&
      (getDay(startTimeInGMT8) === 6 || getDay(startTimeInGMT8) === 0)
    ) {
      throw new Error(
        "Booking cannot be done on weekends! We've logged this incident."
      );
    }

    const bookingStart = zonedTimeToUtc(
      `${formatISO(startTime, { representation: "date" })}T${
        config.startingTime
      }:00`,
      "Asia/Singapore"
    );
    const bookingEnd = zonedTimeToUtc(
      `${formatISO(endTime, { representation: "date" })}T${
        config.endingTime
      }:00`,
      "Asia/Singapore"
    );

    if (isBefore(startTime, bookingStart) || isAfter(endTime, bookingEnd)) {
      throw new Error(
        "Book timings must be within the configured start and end times!"
      );
    }

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

    const duration = differenceInMinutes(endTime, startTime);
    if (duration > config.maxLength) {
      throw new Error(
        `Booking exceeds max length of ${config.maxLength} minutes! We've logged this incident.`
      );
    }

    if (
      isBefore(startTime, startOfWeekInUTC) ||
      isAfter(startTime, endOfWeekInUTC)
    ) {
      throw new Error(
        "Booking can only be done for the current week! We've logged this incident."
      );
    }

    const isUserRegistered = await this.db.isRegistered(telegramId);
    if (!isUserRegistered) {
      throw new Error("User is not registered");
    }

    const user = await this.db.getUserId(telegramId);
    await this.db.bookSlot({
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
    const nextWeekStartInUTC = zonedTimeToUtc(
      startOfWeek(addDays(new Date(), 7), { weekStartsOn: 1 }),
      "Asia/Singapore"
    );
    const twoWeeksFromNowInUTC = zonedTimeToUtc(
      startOfWeek(addDays(new Date(), 14), { weekStartsOn: 1 }),
      "Asia/Singapore"
    );

    if (isAfter(startTime, endTime)) {
      throw new Error(
        "End time cannot be before start time! We've logged this incident."
      );
    }

    const startTimeInGMT8 = utcToZonedTime(startTime, "Asia/Singapore");
    if (
      config.weekendsDisallowed &&
      (getDay(startTimeInGMT8) === 6 || getDay(startTimeInGMT8) === 0)
    ) {
      throw new Error(
        "Balloting cannot be done on weekends! We've logged this incident."
      );
    }

    const bookingStart = zonedTimeToUtc(
      `${formatISO(startTime, { representation: "date" })}T${
        config.startingTime
      }:00`,
      "Asia/Singapore"
    );
    const bookingEnd = zonedTimeToUtc(
      `${formatISO(endTime, { representation: "date" })}T${
        config.endingTime
      }:00`,
      "Asia/Singapore"
    );

    if (isBefore(startTime, bookingStart) || isAfter(endTime, bookingEnd)) {
      throw new Error(
        "Ballot timings must be within the configured start and end times!"
      );
    }

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

    const isUserRegistered = await this.db.isRegistered(telegramId);
    if (!isUserRegistered) {
      throw new Error("User is not registered");
    }

    await this.db.addBallot(telegramId, startTime, endTime);
  }

  public async book(booking: {
    userTelegramId: string;
    startTime: string;
    endTime: string;
  }): Promise<void> {
    const startTime = new Date(booking.startTime);
    if (
      startTime >= addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7) ||
      startTime < startOfWeek(new Date(), { weekStartsOn: 1 })
    ) {
      throw new Error("Booking can only be done for the current week!");
    }

    const isUserRegistered = await this.db.isRegistered(booking.userTelegramId);
    if (!isUserRegistered) {
      throw new Error("User is not registered");
    }

    await this.db.bookSlot(booking);
  }

  private shuffle<T>(array: T[]): T[] {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }
}

export default Manager;
