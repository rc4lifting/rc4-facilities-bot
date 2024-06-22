import * as fs from "fs";
import * as yaml from "js-yaml";
import { zonedTimeToUtc } from "date-fns-tz";

interface Config {
  botToken: string;
  resendAPIKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKey: string;
  googleSpreadsheetId: string;
  bookingDays: number;
  timeInterval: number;
  startingTime: string;
  endingTime: string;
  maxLength: number;
  n: number;
  rows: number;
  columns: number;
  daysToPrint: number;
  weekendsDisallowed: boolean;
  startDateTimeUTC: Date;
  endDateTimeUTC: Date;
}

const configPath = "./config.yaml";
const configData = fs.readFileSync(configPath, "utf8");
const config: Config = yaml.load(configData) as Config;

console.log("botToken: ", config.botToken);
console.log("resendAPIKey: ", config.resendAPIKey);
console.log("supabaseUrl: ", config.supabaseUrl);
console.log("supabaseKey: ", config.supabaseKey);
console.log("googleServiceAccountEmail: ", config.googleServiceAccountEmail);
console.log(
  "googleServiceAccountPrivateKey: ",
  config.googleServiceAccountPrivateKey
);
console.log("bookingDays: ", config.bookingDays);
console.log("timeInterval: ", config.timeInterval);
console.log("startingTime: ", config.startingTime);
console.log("endingTime: ", config.endingTime);
console.log("maxLength: ", config.maxLength);
console.log("rows: ", config.rows);
console.log("columns: ", config.columns);

// Correctly format the private key
config.googleServiceAccountPrivateKey =
  config.googleServiceAccountPrivateKey.replace(/\\n/g, "\n");

const startingDateTimeLocal = new Date(`1970-01-01T${config.startingTime}:00`);
const endingDateTimeLocal = new Date(`1970-01-01T${config.endingTime}:00`);

config.startDateTimeUTC = zonedTimeToUtc(
  startingDateTimeLocal,
  "Asia/Singapore"
);
config.endDateTimeUTC = zonedTimeToUtc(endingDateTimeLocal, "Asia/Singapore");

export default config;
