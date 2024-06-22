import { Telegraf, Scenes, session, Middleware } from "telegraf";
import {
  startCommand,
  helpCommand,
  registerCommand,
  verifyCommand,
  unregisterCommand,
  ballotCommand,
  bookCommand,
  getCodeCommand,
} from "./commands";
import AuthMiddleware from "./middleware/auth";
import ErrorHandlerMiddleware from "./middleware/error-handler";
import RegistrationScene from "./scenes/registration";
import { Database } from "../database";
import { EmailVerifier } from "../email";
import { LiveUpdater } from "../live_updater";
import { Manager } from "../manager";
import { BotContext } from "./context";

class TelegramBot {
  private bot: Telegraf<BotContext>;
  private authMiddleware: AuthMiddleware;
  private errorHandlerMiddleware: ErrorHandlerMiddleware;
  private registrationScene: RegistrationScene;

  constructor(
    botToken: string,
    database: Database,
    emailService: EmailVerifier,
    liveUpdater: LiveUpdater,
    manager: Manager
  ) {
    this.bot = new Telegraf<BotContext>(botToken);
    this.authMiddleware = new AuthMiddleware(database);
    this.errorHandlerMiddleware = new ErrorHandlerMiddleware();
    this.registrationScene = new RegistrationScene(database);

    this.setupMiddleware();
    this.setupCommands(database, emailService, liveUpdater, manager);
  }

  private setupCommands(
    database: Database,
    emailVerifier: EmailVerifier,
    liveUpdater: LiveUpdater,
    manager: Manager
  ): void {
    this.bot.command("start", startCommand);
    this.bot.command("help", helpCommand);
    this.bot.command("register", registerCommand);
    this.bot.command(
      "verify",
      this.authMiddleware.handle,
      verifyCommand(database)
    );
    this.bot.command(
      "unregister",
      this.authMiddleware.handle,
      unregisterCommand(database)
    );
    this.bot.command(
      "ballot",
      this.authMiddleware.handle,
      ballotCommand(manager)
    );
    this.bot.command("book", this.authMiddleware.handle, bookCommand(manager));
    this.bot.command("get_code", getCodeCommand(database, emailVerifier));
  }

  private setupMiddleware(): void {
    this.bot.use(session());
    const stage = new Scenes.Stage<BotContext>([
      this.registrationScene.middleware(),
    ]);
    this.bot.use(stage.middleware());
    this.bot.use(this.errorHandlerMiddleware.handle as Middleware<BotContext>);
  }

  private setupScenes(): void {
    console.log("Setting up scenes...");
    const stage = new Scenes.Stage<BotContext>([
      this.registrationScene.middleware(),
    ]);
    this.bot.use(stage.middleware());
    console.log("Scenes setup complete");
  }

  public async start(): Promise<void> {
    await this.bot.launch();
    console.log("Bot started");
  }
}

export default TelegramBot;
