// app.ts

import { Database } from "./database";
import { Manager } from "./manager";
import { EmailVerifier } from "./email/email_verifier";
import { LiveUpdater } from "./live_updater/live_updater";
import Logger from "./logger/logger";
import config from "./config/default";

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
      config.supabaseUrl,
      config.supabaseKey
    );

    await liveUpdater.init();

    // Example usage of the services
    await manager.resolve();
    await liveUpdater.updateSheets();

    Logger.info("Application started successfully");
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Error starting application: ${error.message}`);
    } else {
      Logger.error("Unknown error occurred during application start");
    }
  }
}

startApp();
