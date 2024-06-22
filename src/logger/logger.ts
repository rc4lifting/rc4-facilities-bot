// logger/logger.ts

import * as fs from "fs";
import * as path from "path";

enum LogLevel {
  INFO = "INFO",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

class Logger {
  private static logFilePath: string = path.join(__dirname, "logs.txt");

  public static info(message: string): void {
    this.log(LogLevel.INFO, message);
  }

  public static error(message: string): void {
    this.log(LogLevel.ERROR, message);
  }

  public static debug(message: string): void {
    this.log(LogLevel.DEBUG, message);
  }

  private static log(level: LogLevel, message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    console.log(logMessage);

    fs.appendFile(this.logFilePath, logMessage, (err) => {
      if (err) {
        console.error("Failed to write to log file:", err);
      }
    });
  }
}

export default Logger;
