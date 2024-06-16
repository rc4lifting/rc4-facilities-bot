import { Telegraf, Scenes, session, Middleware } from "telegraf";
import {
  startCommand,
  helpCommand,
  registerCommand,
  verifyCommand,
  unregisterCommand,
  ballotCommand,
  bookCommand,
} from "./commands";
import AuthMiddleware from "./middleware/auth";
import ErrorHandlerMiddleware from "./middleware/error-handler";
import RegistrationScene from "./scenes/registration";
import { Database } from "../database";
import { EmailVerifier } from "../email";
import { LiveUpdater } from "../live_updater";
import { Manager } from "../manager";
import { BotContext } from "./context"; // Import the BotContext

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

    this.setupCommands(database, emailService, liveUpdater, manager);
    this.setupMiddleware();
    this.setupScenes();
  }

  private setupCommands(
    database: Database,
    emailVerifier: EmailVerifier,
    liveUpdater: LiveUpdater,
    manager: Manager
  ): void {
    this.bot.command("start", startCommand as Middleware<BotContext>);
    this.bot.command("help", helpCommand as Middleware<BotContext>);
    this.bot.command("register", registerCommand as Middleware<BotContext>);
    this.bot.command(
      "verify",
      verifyCommand(database) as Middleware<BotContext>
    );
    this.bot.command(
      "unregister",
      unregisterCommand(database) as Middleware<BotContext>
    );
    this.bot.command(
      "ballot",
      ballotCommand(manager) as Middleware<BotContext>
    );
    this.bot.command("book", bookCommand(manager) as Middleware<BotContext>);
  }

  private setupMiddleware(): void {
    this.bot.use(session());
    this.bot.use(this.authMiddleware.handle as Middleware<BotContext>);
    this.bot.use(this.errorHandlerMiddleware.handle as Middleware<BotContext>);
  }

  private setupScenes(): void {
    const stage = new Scenes.Stage<BotContext>([
      this.registrationScene.middleware(),
    ]);
    this.bot.use(stage.middleware());
  }

  public async start(): Promise<void> {
    await this.bot.launch();
    console.log("Bot started");
  }
}

export default TelegramBot;
