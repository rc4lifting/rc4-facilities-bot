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
  async updateSheets(): Promise<void> {
    await this.updateTitle();
    await this.updateBookedSlotsSheet();
    await this.updateBallotsSheet();
  }

  private async updateTitle(): Promise<void> {
    await this.doc.updateProperties({
      title: `RC4 Gym Booking (Last updated at ${new Date()})`,
    });
  }
  private async updateBookedSlotsSheet(): Promise<void> {
    const sheet = this.doc.sheetsByIndex[0];
    const startDate = weekStart();
    const endDate = addDays(weekStart(), config.daysToPrint);
    const data = await this.db.getAllBookedSlotsSe(startDate, endDate);
    //log all booked slots
    console.log(data);
    await this.updateSheet(sheet, data, this.getBookedSlotData);
  }

  private async updateBallotsSheet(): Promise<void> {
    const sheet = this.doc.sheetsByIndex[1];
    const startDate = addDays(weekStart(), 7);
    const endDate = addDays(startDate, config.daysToPrint);
    const data = await this.db.getAllBallotsSe(startDate, endDate);
    await this.updateSheet(sheet, data, this.getBallotData, 7);
  }

  private async updateSheet<T extends Slot | Ballot>(
    sheet: GoogleSpreadsheetWorksheet,
    data: T[],
    dataGetter: (date: Date, data: T[], timeSlot: string) => Promise<string>,
    dateOffset = 0
  ): Promise<void> {
    await sheet.clear();
    const headerRow = this.createHeaderRow(dateOffset);
    await sheet.setHeaderRow(headerRow);

    const intervalsPerDay = this.getIntervalsPerDay();
    const rows = [];

    for (let interval = 0; interval < intervalsPerDay; interval++) {
      const row = await this.createRow(interval, data, dataGetter, dateOffset);
      rows.push(row);
    }

    await sheet.addRows(rows);
  }

  private createHeaderRow(offsetDays = 0): string[] {
    const headerRow = ["TIME SLOT"];
    const startDate = addDays(weekStart(), offsetDays);

    for (let day = 0; day < config.daysToPrint; day++) {
      const date = addDays(startDate, day);
      const formattedDate = this.formatDate(date);
      headerRow.push(formattedDate);
    }

    return headerRow;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0].split("-").reverse().join(" - ");
  }

  private getIntervalsPerDay(): number {
    return (
      (new Date(`1970-01-01T${config.endingTime}Z`).getTime() -
        new Date(`1970-01-01T${config.startingTime}Z`).getTime()) /
      60000 /
      config.timeInterval
    );
  }

  // private async createRow<T extends Slot | Ballot>(
  //   interval: number,
  //   data: T[],
  //   dataGetter: (date: Date, data: T[], timeSlot: string) => Promise<string>,
  //   dateOffset: number
  // ): Promise<{ [key: string]: string }> {
  //   const timeSlot = this.getTimeSlot(interval);
  //   const row: { [key: string]: string } = { "TIME SLOT": timeSlot };

  //   for (let day = 0; day < config.daysToPrint; day++) {
  //     const date = addDays(weekStart(), dateOffset + day);
  //     const formattedDate = this.formatDate(date);
  //     row[formattedDate] = await dataGetter.call(this, date, data, timeSlot);
  //   }

  //   return row;
  // }
  private async createRow<T extends Slot | Ballot>(
    interval: number,
    data: T[],
    dataGetter: (date: Date, data: T[], timeSlot: string) => Promise<string>,
    dateOffset: number
  ): Promise<{ [key: string]: string }> {
    const timeSlot = this.getTimeSlot(interval);
    console.log("Creating row for timeslot", timeSlot); // Added log

    const row: { [key: string]: string } = { "TIME SLOT": timeSlot };

    for (let day = 0; day < config.daysToPrint; day++) {
      const date = addDays(weekStart(), dateOffset + day);
      console.log("Creating row for date", date); // Added log

      const formattedDate = this.formatDate(date);
      const rowData = await dataGetter.call(this, date, data, timeSlot);
      console.log("Row data retrieved", rowData); // Added log

      row[formattedDate] = rowData;
    }

    console.log("Finished creating row", row); // Added log
    return row;
  }

  private async getBookedSlotData(
    date: Date,
    timeSlots: Slot[],
    timeSlot: string
  ): Promise<string> {
    console.log("Finding booked slot for date", date, "and timeslot", timeSlot); // Added log

    const bookedSlot = timeSlots.find((slot) =>
      this.isTimeOverlap(slot, date, timeSlot)
    );

    console.log("Found booked slot", bookedSlot); // Added log

    return bookedSlot
      ? `Yes, booked by: ${await this.db.getUserById(bookedSlot.booked_by)}`
      : "No";
  }

  private getTimeSlot(interval: number): string {
    const startMillis = new Date(
      `1970-01-01T${config.startingTime}Z`
    ).getTime();
    const start = new Date(
      startMillis + interval * config.timeInterval * 60000
    );
    const end = new Date(
      startMillis + (interval + 1) * config.timeInterval * 60000
    );
    return `${start.toISOString().substring(11, 16)} - ${end
      .toISOString()
      .substring(11, 16)}`;
  }

  // private async getBookedSlotData(
  //   date: Date,
  //   timeSlots: Slot[],
  //   timeSlot: string
  // ): Promise<string> {
  //   const bookedSlot = timeSlots.find((slot) =>
  //     this.isTimeOverlap(slot, date, timeSlot)
  //   );
  //   return bookedSlot
  //     ? `Yes, booked by: ${await this.db.getUserById(bookedSlot.booked_by)}`
  //     : "No";
  // }

  private getBallotData(
    date: Date,
    ballots: Ballot[],
    timeSlot: string
  ): Promise<string> {
    const slotBallots = ballots.filter((ballot) =>
      this.isTimeOverlap(ballot, date, timeSlot)
    );
    return Promise.resolve(slotBallots.length.toString());
  }

  private isTimeOverlap(
    item: Slot | Ballot,
    date: Date,
    timeSlot: string
  ): boolean {
    const [startTime, endTime] = timeSlot
      .split(" - ")
      .map((time) => this.createDate(date, time));
    const itemStart = new Date(item.time_begin);
    const itemEnd = new Date(item.time_end);
    const overlap =
      (itemStart >= startTime && itemStart < endTime) ||
      (itemEnd > startTime && itemEnd <= endTime) ||
      (itemStart <= startTime && itemEnd >= endTime);

    if (overlap) {
      console.log(`Overlap found for item ${item.id} in time slot ${timeSlot}`);
    }

    return overlap;
  }
  private createDate(date: Date, time: string): Date {
    const dateTime = new Date(`${this.formatDate(date)}T${time}:00Z`);
    dateTime.setHours(dateTime.getHours()); // Convert to UTC
    return dateTime;
  }
}

export default LiveUpdater;
