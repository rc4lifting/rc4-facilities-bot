// live_updater/live_updater.ts
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { Database, Slot, Ballot } from "../database/";
import { weekStart, addDays } from "../utils/time_utils";
import config from "../config/default";

export class LiveUpdater {
  private doc!: GoogleSpreadsheet;
  private readonly db: Database;
  private readonly googleServiceAccountEmail: string;
  private readonly googleServiceAccountPrivateKey: string;
  private readonly googleSpreadsheetId: string;
  private readonly serviceAccountAuth: JWT;

  constructor(
    googleServiceAccountEmail: string,
    googleServiceAccountPrivateKey: string,
    googleSpreadsheetId: string,
    db: Database
  ) {
    this.googleServiceAccountEmail = googleServiceAccountEmail;
    this.googleServiceAccountPrivateKey = googleServiceAccountPrivateKey;
    this.googleSpreadsheetId = googleSpreadsheetId;
    this.db = db;

    // Initialize the JWT for authentication
    this.serviceAccountAuth = new JWT({
      email: this.googleServiceAccountEmail,
      key: this.googleServiceAccountPrivateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Pass the authenticated JWT to the GoogleSpreadsheet constructor
    this.doc = new GoogleSpreadsheet(
      this.googleSpreadsheetId,
      this.serviceAccountAuth
    );
  }

  async init() {
    await this.serviceAccountAuth.authorize();
    await this.doc.loadInfo();
    console.log("loaded!");
  }

  async updateSheets() {
    await this.doc.updateProperties({
      title: `RC4 Gym Booking (Last updated at ${new Date()})`,
    });

    const timeSlots = await this.db.getAllBookedSlots();
    const ballots = await this.db.getAllBallots();

    console.log(timeSlots);

    const firstSheet = this.doc.sheetsByIndex[0]; // in the order they appear on the sheets UI

    await firstSheet.clear();

    const intervalsPerDay =
      (new Date(`1970-01-01T${config.endingTime}Z`).getTime() -
        new Date(`1970-01-01T${config.startingTime}Z`).getTime()) /
      60000 /
      config.timeInterval;

    const headerRow = ["TIME SLOT"];
    const savedDate = weekStart();
    for (let i = 0; i < config.daysToPrint; i++) {
      const currentDate = new Date(savedDate);
      currentDate.setDate(currentDate.getDate() + i);

      const dateString = currentDate
        .toISOString()
        .split("T")[0]
        .split("-")
        .reverse()
        .join(" - ");
      headerRow.push(dateString);
    }
    console.log(headerRow);

    await firstSheet.setHeaderRow(headerRow);

    let rows = [];
    for (let j = 0; j < intervalsPerDay; j++) {
      const startTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          j * config.timeInterval * 60000
      );
      const endTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          (j + 1) * config.timeInterval * 60000
      );

      const timeForThisIntervalString =
        startTimeForThisInterval.toISOString().substring(11, 16) +
        " - " +
        endTimeForThisInterval.toISOString().substring(11, 16);

      const row: { [key: string]: string } = {
        "TIME SLOT": timeForThisIntervalString,
      };
      console.log(timeForThisIntervalString);

      for (let i = 0; i < config.daysToPrint; i++) {
        const currentDate = new Date(savedDate);
        currentDate.setDate(currentDate.getDate() + i);
        const dateString = currentDate.toISOString().split("T")[0];

        const bookedSlot = timeSlots.find((slot: Slot) => {
          const timeslotStart = new Date(
            `${dateString}T${startTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotStart.setHours(timeslotStart.getHours() - 8);
          const timeslotEnd = new Date(
            `${dateString}T${endTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotEnd.setHours(timeslotEnd.getHours() - 8);
          const slotStart = new Date(slot.time_begin);
          const slotEnd = new Date(slot.time_end);

          return (
            (slotStart >= timeslotStart && slotStart < timeslotEnd) ||
            (slotEnd > timeslotStart && slotEnd <= timeslotEnd) ||
            (slotStart <= timeslotStart && slotEnd >= timeslotEnd)
          );
        });

        console.log(currentDate);
        row[
          currentDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join(" - ")
        ] = bookedSlot
          ? "X - " + (await this.db.getUserById(bookedSlot.booked_by))
          : "FREE";
      }
      console.log(row);

      rows.push(row);
    }
    await firstSheet.addRows(rows);

    const secondSheet = this.doc.sheetsByIndex[1];

    await secondSheet.clear();

    rows = [];
    const bHeaderRow = ["TIME SLOT"];
    const bSavedDate = addDays(weekStart(), 7);
    for (let i = 0; i < config.daysToPrint; i++) {
      const currentDate = new Date(bSavedDate);
      currentDate.setDate(currentDate.getDate() + i);

      const dateString = currentDate
        .toISOString()
        .split("T")[0]
        .split("-")
        .reverse()
        .join(" - ");
      bHeaderRow.push(dateString);
    }
    console.log(bHeaderRow);
    await secondSheet.setHeaderRow(bHeaderRow);

    for (let j = 0; j < intervalsPerDay; j++) {
      const startTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          j * config.timeInterval * 60000
      );
      const endTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          (j + 1) * config.timeInterval * 60000
      );

      const timeForThisIntervalString =
        startTimeForThisInterval.toISOString().substring(11, 16) +
        " - " +
        endTimeForThisInterval.toISOString().substring(11, 16);

      const row: { [key: string]: string } = {
        "TIME SLOT": timeForThisIntervalString,
      };
      console.log(timeForThisIntervalString);

      for (let i = 0; i < config.daysToPrint; i++) {
        const currentDate = new Date(savedDate);
        currentDate.setDate(currentDate.getDate() + i + 7);
        const dateString = currentDate.toISOString().split("T")[0];

        const slotBallots = ballots.filter((ballot: Ballot) => {
          const timeslotStart = new Date(
            `${dateString}T${startTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotStart.setHours(timeslotStart.getHours() - 8);
          const timeslotEnd = new Date(
            `${dateString}T${endTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotEnd.setHours(timeslotEnd.getHours() - 8);
          const slotStart = new Date(ballot.time_begin);
          const slotEnd = new Date(ballot.time_end);

          return (
            (slotStart >= timeslotStart && slotStart < timeslotEnd) ||
            (slotEnd > timeslotStart && slotEnd <= timeslotEnd) ||
            (slotStart <= timeslotStart && slotEnd >= timeslotEnd)
          );
        });

        console.log(currentDate);
        row[
          currentDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join(" - ")
        ] = slotBallots.length.toString();
      }
      console.log(row);

      rows.push(row);
    }
    await secondSheet.addRows(rows);
  }
}

export default LiveUpdater;
