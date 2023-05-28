import { Telegraf, Context, Scenes, Composer, session } from "telegraf";
import { EmailVerifier } from "../email/email";
import { DDatabase } from "../database/src/d-database";
import { WizardContext, WizardScene } from "telegraf/typings/scenes";

interface MyWizardSession extends Scenes.WizardSessionData {
  // will be available under `ctx.scene.session.myWizardSessionProp`
  name: string;
  email: string;
  room_no: string;
}
type MyContext = Scenes.WizardContext<MyWizardSession>;
//https://github.com/feathers-studio/telegraf-docs/blob/master/examples/wizards/wizard-with-custom-scene-session.ts
//const nameStepHandler = new Composer<Scenes.WizardContext>();
class TelegramBot {
  private bot: Telegraf<MyContext>;
  private verifier: EmailVerifier;
  private database: DDatabase;

  constructor(
    botToken: string,
    apiKey: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.bot = new Telegraf<MyContext>(botToken);
    this.verifier = null!;
    this.database = null!;

    this.initializeVerifier(apiKey).catch((error) => {
      console.error("Error initializing verifier:", error);
    });
    this.initializeDatabase(supabaseUrl, supabaseKey).catch((error) => {
      console.error("Error initializing database:", error);
    });
    this.setupCommands().catch((error) => {
      console.error("Error setting up commands:", error);
    });

    // Start the bot
    this.bot
      .launch()
      .then(() => {
        console.log("Bot started");
      })
      .catch((err) => {
        console.error("Error starting bot", err);
      });
  }

  private async initializeDatabase(
    supabaseUrl: string,
    supabaseKey: string
  ): Promise<void> {
    try {
      this.database = await DDatabase.build({ supabaseUrl, supabaseKey });
    } catch (error) {
      console.error("Error creating DDatabase instance:", error);
    }
  }

  private async initializeVerifier(apiKey: string): Promise<void> {
    try {
      this.verifier = await EmailVerifier.build(apiKey);
    } catch (error) {
      console.error("Error creating EmailVerifier instance:", error);
    }
  }

  private async setupCommands(): Promise<void> {
    // Command handler: Start the bot
    this.bot.command("start", (ctx) => {
      ctx.reply("Welcome! This is the start command.");
    });

    // Command handler: Show help message
    this.bot.command("help", (ctx) => {
      const helpMessage = `
        This is a custom bot that provides various commands.
  
        Available commands:
        /start - Start the bot
        /help - Show the help message
        /verify - Verify your email address
  
        Feel free to explore and interact with the bot!
      `;
      ctx.reply(helpMessage);
    });

    // Command handler: Verify email address
    this.bot.command("verify", async (ctx) => {
      const telegramId = ctx.message.from.id.toString();
      try {
        const isAuthorized = await this.checkAuthorization(telegramId);
        if (!isAuthorized) {
          ctx.reply("You are not authorized to use this command.");
          return;
        }
        await this.verifyEmailAddress(ctx, telegramId);
      } catch (error) {
        console.error("Error verifying email address:", error);
        ctx.reply("An error occurred while verifying your email address.");
      }
    });

    // https://github.com/telegraf/telegraf/issues/705

    const nameStepHandler = new Composer<MyContext>();
    nameStepHandler.on("text", async (ctx) => {
      //const name = await ctx.reply(ctx.message.text);
      if (ctx.message!.text.length < 3) {
        console.log("name is invalid");
        await ctx.reply("Please enter a valid name.");
        return;
      }
      console.log("name is valid");
      ctx.scene.session.name = ctx.message.text;
      await ctx.reply("Please enter your NUS email.");
      return ctx.wizard.next();
    });

    const emailStepHandler = new Composer<MyContext>();
    emailStepHandler.on("text", async (ctx) => {
      //const name = await ctx.reply(ctx.message.text);
      const email = ctx.message.text;
      console.log(ctx.message.text);
      if (email.length < 3) {
        console.log("email is invalid");
        await ctx.reply("Please enter a valid email.");
        return;
      }
      ctx.scene.session.email = email;
      await ctx.reply("Please enter your room number.");
      console.log("email is valid");
      return ctx.wizard.next();
    });
    const roomStepHandler = new Composer<MyContext>();
    roomStepHandler.on("text", async (ctx) => {
      const room = ctx.message.text;
      console.log(ctx.message.text);
      if (room.length < 3) {
        console.log("room is invalid");
        await ctx.reply("Please enter a valid room.");
        return;
      }
      ctx.scene.session.room_no = room;
      //reply all ctx scene
      //reply with his data formatted
      await ctx.reply("Name: " + ctx.scene.session.name);
      await ctx.reply("Email: " + ctx.scene.session.email);
      await ctx.reply("Room: " + ctx.scene.session.room_no);

      console.log("room is valid");
      return ctx.scene.leave();
    });

    // Setup the registration wizard
    const registrationWizard = new Scenes.WizardScene(
      "registration",
      async (ctx) => {
        await ctx.reply("Please enter your name:");
        //console log this hsit
        return ctx.wizard.next();
      },
      nameStepHandler,
      emailStepHandler,
      roomStepHandler
    );

    const stage = new Scenes.Stage<MyContext>([registrationWizard], {});
    this.bot.use(session());
    this.bot.use(stage.middleware());
    this.bot.command("register", (ctx) => ctx.scene.enter("registration"));
  }

  private async checkAuthorization(telegramId: string): Promise<boolean> {
    // Perform authorization check based on your logic (e.g., database lookup)
    // Return true if authorized, false otherwise
    return this.database.isUser(telegramId);
  }

  private async verifyEmailAddress(
    ctx: Context,
    telegramId: string
  ): Promise<void> {
    // Check if the user is already verified
    //const isVerified = await this.database.isVerified(telegramId);
    const isVerified = true;
    if (isVerified) {
      ctx.reply("Your email address is already verified.");
      return;
    }

    // Generate a verification code
    const verificationCode = this.generateVerificationCode();

    // Save the verification code to the database
    try {
      await this.database.saveVerificationCode(telegramId, verificationCode);
    } catch (error) {
      console.error("Error saving verification code:", error);
      ctx.reply("An error occurred while generating the verification code.");
      return;
    }

    // Get the user's email address from the database
    const userEmail = await this.database.getUserEmail(telegramId);
    if (!userEmail) {
      ctx.reply("Email address not found for the user.");
      return;
    }

    // Send the verification email
    try {
      await this.verifier.sendVerificationEmail(userEmail, verificationCode);
      ctx.reply(
        "Verification email sent! Please check your email and follow the instructions to complete the verification process."
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      ctx.reply("An error occurred while sending the verification email.");
    }
  }

  private generateVerificationCode(): string {
    // Generate a random verification code
    return Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
  }
}

// Usage
const botToken = process.env.BOT_TOKEN || "YOUR_BOT_TOKEN";
const apiKey = process.env.ELASTICEMAIL_KEY || "YOUR_API_KEY";
const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_KEY || "YOUR_SUPABASE_KEY";

const bot = new TelegramBot(botToken, apiKey, supabaseUrl, supabaseKey);
