import fs from "fs";
import yaml from "js-yaml";

interface Config {
  botToken: string;
  elasticEmailKey: string;
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
}

const configPath = "./config.yaml";
const configData = fs.readFileSync(configPath, "utf8");
const config: Config = yaml.load(configData) as Config;

console.log("botToken: ", config.botToken);
console.log("elasticEmailKey: ", config.elasticEmailKey);
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

export default config;
