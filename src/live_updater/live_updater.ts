import {
  GoogleSpreadsheetWorksheet,
  GoogleSpreadsheet,
} from "google-spreadsheet";
import { DDatabase, Slot, Ballot } from "../database/";
import { weekStart, addDays } from "../timeutils";
import config from "../config/config";
export class LiveUpdater {
  private doc!: GoogleSpreadsheet;
  private db!: DDatabase;
  private readonly googleServiceAccountEmail: string;
  private readonly googleServiceAccountPrivateKey: string;
  private readonly googleSpreadsheetId: string;
  private readonly supabaseUrl: string;
  private readonly supabaseKey: string;

  constructor(
    googleServiceAccountEmail: string,
    googleServiceAccountPrivateKey: string,
    googleSpreadsheetId: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.googleServiceAccountEmail = googleServiceAccountEmail;
    this.googleServiceAccountPrivateKey = googleServiceAccountPrivateKey;
    this.googleSpreadsheetId = googleSpreadsheetId;
    this.doc = new GoogleSpreadsheet(googleSpreadsheetId);
    this.supabaseKey = supabaseKey;
    this.supabaseUrl = supabaseUrl;
  }

  async init() {
    await this.doc.useServiceAccountAuth({
      client_email: this.googleServiceAccountEmail,
      private_key: this.googleServiceAccountPrivateKey,
    });
    await this.doc.loadInfo();
    this.db = await DDatabase.build({
      supabaseUrl: this.supabaseUrl,
      supabaseKey: this.supabaseKey,
    });

    console.log("loaded!");
  }

  async updateSheets() {
    //await this.doc.loadInfo();
    await this.doc.updateProperties({
      title: `RC4 Gym Booking (Last updated at ${new Date()})`,
    });

    const timeSlots = await this.db.getAllBookedSlots();
    const ballots = await this.db.getAllBallots();

    console.log(timeSlots);

    const firstSheet = this.doc.sheetsByIndex[0]; // in the order they appear on the sheets UI

    await firstSheet.clear();

    // Calculate the total number of intervals per day
    const intervalsPerDay =
      (new Date(`1970-01-01T${config.endingTime}Z`).getTime() -
        new Date(`1970-01-01T${config.startingTime}Z`).getTime()) /
      60000 /
      config.timeInterval;

    // Prepare the header row
    const headerRow = ["TIME SLOT"];
    const savedDate = weekStart();
    //let headerRow: { [key: string]: string } = { "TIME SLOT": "" };
    for (let i = 0; i < config.daysToPrint; i++) {
      const currentDate = new Date(savedDate);
      currentDate.setDate(currentDate.getDate() + i);

      // Get the current date in DD/MM/YY format
      const dateString = currentDate
        .toISOString()
        .split("T")[0]
        .split("-")
        .reverse()
        .join(" - ");
      headerRow.push(dateString);
    }
    console.log(headerRow);

    // Add the header row
    await firstSheet.setHeaderRow(headerRow);

    let rows = [];
    for (let j = 0; j < intervalsPerDay; j++) {
      // Calculate the time for this interval
      const startTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          j * config.timeInterval * 60000
      );
      const endTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          (j + 1) * config.timeInterval * 60000
      );

      // Format the time for this interval as HH:MM - HH:MM
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
        // Get the current date in YYYY-MM-DD format
        const dateString = currentDate.toISOString().split("T")[0];
        // console.log(dateString);

        // Check if there's a booking for this time
        const bookedSlot = timeSlots.find((slot: Slot) => {
          // Create Date objects for the start and end of this timeslot
          // Create Date objects for the start and end of this timeslot
          const timeslotStart = new Date(
            `${dateString}T${startTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotStart.setHours(timeslotStart.getHours() - 8); // Add 8 hours to convert to UTC
          const timeslotEnd = new Date(
            `${dateString}T${endTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotEnd.setHours(timeslotEnd.getHours() - 8); // Add 8 hours to convert to UTC
          // Create Date objects for the start and end of the booked slot
          const slotStart = new Date(slot.time_begin);
          const slotEnd = new Date(slot.time_end);

          // Check if the slot overlaps with the timeslot
          return (
            (slotStart >= timeslotStart && slotStart < timeslotEnd) ||
            (slotEnd > timeslotStart && slotEnd <= timeslotEnd) ||
            (slotStart <= timeslotStart && slotEnd >= timeslotEnd)
          );
        });

        //log currnetDate
        console.log(currentDate);
        row[
          currentDate
            .toISOString()
            .split("T")[0]
            .split("-")
            .reverse()
            .join(" - ")
          // ] = bookedSlot
          //   ? "Yes, booked by: " +
          //     (await this.db.getUserById(bookedSlot.booked_by))
          //   : "No";
        ] = bookedSlot
          ? "X" + (await this.db.getUserById(bookedSlot.booked_by))
          : "FREE";
      }
      console.log(row);

      // Add the row to the sheet
      rows.push(row);
    }
    await firstSheet.addRows(rows);

    // second sheet is for ballots

    const secondSheet = this.doc.sheetsByIndex[1]; // in the order they appear on the sheets UI

    await secondSheet.clear();

    rows = [];
    // Prepare the header row for ballots
    const bHeaderRow = ["TIME SLOT"];
    const bSavedDate = addDays(weekStart(), 7);
    //let headerRow: { [key: string]: string } = { "TIME SLOT": "" };
    for (let i = 0; i < config.daysToPrint; i++) {
      const currentDate = new Date(bSavedDate);
      currentDate.setDate(currentDate.getDate() + i);

      // Get the current date in DD/MM/YY format
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
      // Calculate the time for this interval
      const startTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          j * config.timeInterval * 60000
      );
      const endTimeForThisInterval = new Date(
        new Date(`1970-01-01T${config.startingTime}Z`).getTime() +
          (j + 1) * config.timeInterval * 60000
      );

      // Format the time for this interval as HH:MM - HH:MM
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
        // Get the current date in YYYY-MM-DD format
        const dateString = currentDate.toISOString().split("T")[0];
        // console.log(dateString);

        // Check if there are ballots for this time
        const slotBallots = ballots.filter((ballot: Ballot) => {
          // Create Date objects for the start and end of this slot
          const timeslotStart = new Date(
            `${dateString}T${startTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotStart.setHours(timeslotStart.getHours() - 8); // Add 8 hours to convert to UTC
          const timeslotEnd = new Date(
            `${dateString}T${endTimeForThisInterval
              .toISOString()
              .substring(11, 16)}:00Z`
          );
          timeslotEnd.setHours(timeslotEnd.getHours() - 8); // Add 8 hours to convert to UTC
          // Create Date objects for the start and end of the ballot
          const slotStart = new Date(ballot.time_begin);
          const slotEnd = new Date(ballot.time_end);

          // Check if the slot overlaps with the ballot
          return (
            (slotStart >= timeslotStart && slotStart < timeslotEnd) ||
            (slotEnd > timeslotStart && slotEnd <= timeslotEnd) ||
            (slotStart <= timeslotStart && slotEnd >= timeslotEnd)
          );
        });

        //log currnetDate
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

      // Add the row to the sheet
      rows.push(row);
    }
    await secondSheet.addRows(rows);
  }
}

export default LiveUpdater;
