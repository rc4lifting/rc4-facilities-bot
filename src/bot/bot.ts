import { Telegraf, Context, Scenes, Composer, session, Markup } from "telegraf";
import { EmailVerifier } from "../email/email";
import { DDatabase } from "../database/src/d-database";
import { WizardContext, WizardScene } from "telegraf/typings/scenes";
import * as fs from "fs";
import * as yaml from "js-yaml";

interface Config {
  botToken: string;
  elasticEmailKey: string;
  supabaseUrl: string;
  supabaseKey: string;
}

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
    this.bot.command("getCode", (ctx) => this.getAndSendVerificationCode(ctx));

    // https://github.com/telegraf/telegraf/issues/705

    const nameStepHandler = new Composer<MyContext>();
    nameStepHandler.on("text", async (ctx) => {
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
      const email = ctx.message.text;
      const emailRegex = /^[A-Za-z0-9._%+-]+@u\.nus\.edu$/;
      if (!emailRegex.test(email)) {
        await ctx.reply(
          "Please enter a valid NUS email address (e.g., XXX@u.nus.edu)."
        );
        return;
      }
      ctx.scene.session.email = email;
      await ctx.reply("Please enter your room number.");
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
      console.log("room is valid");
      const confirm_string = `Your name is ${ctx.scene.session.name}, your email is ${ctx.scene.session.email} and your room is ${ctx.scene.session.room_no}.`;
      //add to database
      const telegramId = ctx.message!.from!.id.toString();
      //create a user as a json object
      const user = {
        name: ctx.scene.session.name,
        telegramId: telegramId,
        nusEmail: ctx.scene.session.email,
        room: ctx.scene.session.room_no,
      };
      await this.database.addUser(user);
      await ctx.reply(confirm_string);
      await ctx.reply(
        "Please run /verify to verify your email address and finish your registration."
      );
      return ctx.scene.leave();
    });

    // Setup the registration wizard
    const registrationWizard = new Scenes.WizardScene(
      "registration",
      async (ctx) => {
        //const name = await ctx.reply(ctx.message.text);
        //check if alreayd registered
        const telegramId = ctx.message!.from!.id.toString();
        const isRegistered = await this.database.isRegistered(telegramId);
        const isVerified = await this.database.isVerified(telegramId);
        //log isRegistered, isVerified
        console.log("isRegistered: ", isRegistered);
        console.log("isVerified: ", isVerified);
        console.log("telegramId: ", telegramId);
        if (isRegistered) {
          await ctx.reply("You have already registered.");
          if (isVerified) {
            await ctx.reply("You have also already verified your email.");
          } else {
            await ctx.reply(
              "However, you have not verified your email. Please run /getCode to get a verification code for your email address."
            );
          }
          return ctx.scene.leave();
        }
        await ctx.reply("Please enter your name:");
        //console log this
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
    // Command handler: Verify email address with code
    this.bot.command("verify", async (ctx) => {
      const telegramId = ctx.from!.id.toString();
      const isRegistered = await this.database.isRegistered(telegramId);
      if (!isRegistered) {
        ctx.reply("You are not registered. Please run /register to register.");
        return;
      }

      const isVerified = await this.database.isVerified(telegramId);
      if (isVerified) {
        ctx.reply("You are already verified.");
        return;
      }

      const verificationCode = ctx.message.text.split(" ")[1];
      if (!verificationCode) {
        ctx.reply("Please provide a verification code. Usage: /verify {CODE}");
        return;
      }

      const storedVerificationCode = await this.database.getVerificationCode(
        telegramId
      );
      if (!storedVerificationCode) {
        ctx.reply(
          "No verification code found. Please generate a new verification code via /getCode."
        );
        return;
      }

      if (verificationCode !== storedVerificationCode) {
        ctx.reply("Invalid verification code. Please try again.");
        return;
      }

      try {
        await this.database.markUserAsVerified(telegramId);
        ctx.reply("Email address verified successfully!");
      } catch (error) {
        console.error("Error marking user as verified:", error);
        ctx.reply("An error occurred while marking the user as verified.");
      }
    });
  }

  private async checkAuthorization(telegramId: string): Promise<boolean> {
    // Perform authorization check based on your logic (e.g., database lookup)
    // Return true if authorized, false otherwise
    return this.database.isUser(telegramId);
  }

  private async getAndSendVerificationCode(ctx: Context): Promise<void> {
    // Check if the user is already verified
    //const isVerified = await this.database.isVerified(telegramId);
    //get telegramId from context
    const telegramId = ctx.from!.id.toString();
    const isRegistered = await this.database.isRegistered(telegramId);
    //if not registered, ask them to register
    if (!isRegistered) {
      ctx.reply("You are not registered. Please run /register to register.");
      return;
    }

    const isVerified = await this.database.isVerified(telegramId);
    if (isVerified) {
      ctx.reply("You are already verified.");
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
        "Verification email sent! Please check your email (and spam) and follow the instructions to complete the verification process."
      );
    } catch (error) {
      console.error("Error sending verification email:", error);
      ctx.reply("An error occurred while sending the verification email.");
    }
    //wait for reply
    //if reply is correct, then save to database
    //if reply is wrong, then ask them to try again
    //if reply is wrong 3 times, then ask them to try again later
    // Wait for the user's reply with the verification code
    ctx.reply(
      "We've sent the verification code to your email address. Please run /verify {CODE} to verify your email address."
    );
    return;
  }

  private generateVerificationCode(): string {
    // Generate a random verification code
    return Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
  }
}

interface Config {
  botToken: string;
  elasticEmailKey: string;
  supabaseUrl: string;
  supabaseKey: string;
}

const configPath = "./config.yaml";
const configData = fs.readFileSync(configPath, "utf8");
const config: Config = yaml.load(configData) as Config;

const { botToken, elasticEmailKey, supabaseUrl, supabaseKey } = config;

const bot = new TelegramBot(
  botToken,
  elasticEmailKey,
  supabaseUrl,
  supabaseKey
);
