// app.ts
import { Database } from "./database";
import { Manager } from "./manager";
import { EmailVerifier } from "./email/email_verifier";
import { LiveUpdater } from "./live_updater/live_updater";
import Logger from "./logger/logger";
import config from "./config/default";
import TelegramBot from "./bot/bot";

async function startApp() {
  try {
    Logger.info("Starting application...");

    const database = await Database.build({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
    });

    const emailService = new EmailVerifier(config.elasticEmailKey);
    const manager = new Manager(database);
    const liveUpdater = new LiveUpdater(
      config.googleServiceAccountEmail,
      config.googleServiceAccountPrivateKey,
      config.googleSpreadsheetId,
      database
    );

    await liveUpdater.init();
    await manager.resolve();
    await liveUpdater.updateSheets();

    const bot = new TelegramBot(
      config.botToken,
      database,
      emailService,
      liveUpdater,
      manager
    );

    await bot.start();

    Logger.info("Application started successfully");
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(
        `Error starting application: ${error.message}\n${error.stack}`
      );
    } else {
      Logger.error("Unknown error occurred during application start");
    }
  }
}

startApp();
