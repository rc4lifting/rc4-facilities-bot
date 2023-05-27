import { Telegraf, Context } from "telegraf";
import { EmailVerifier } from "../email/email";
import { DDatabase } from "../database/src/d-database";
class TelegramBot {
  private bot: Telegraf<Context>;
  private verifier: EmailVerifier;
  private database: DDatabase;

  constructor(
    botToken: string,
    apiKey: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.bot = new Telegraf<Context>(botToken);
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
    // Command handler: Check if user is authorized
    this.bot.command("*", async (ctx) => {
      const telegramId = ctx.message.from.id.toString();
      try {
        const isAuthorized = await this.checkAuthorization(telegramId);
        if (!isAuthorized) {
          await this.registerUser(ctx, telegramId);
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        ctx.reply("An error occurred while checking authorization.");
      }
    });

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
  }

  private async checkAuthorization(telegramId: string): Promise<boolean> {
    // Perform authorization check based on your logic (e.g., database lookup)
    // Return true if authorized, false otherwise
    return this.database.isUser(telegramId);
  }

  private async registerUser(ctx: Context, telegramId: string): Promise<void> {
    ctx.reply("You are not authorized. Please register to use this bot.");

    // Prompt the user for registration information
    ctx.reply("Please enter your name:");
    const nameResponse = await this.waitForUserResponse(ctx);
    const name = nameResponse.text;

    ctx.reply("Please enter your NUS email (e.g., yourname@u.nus.edu):");
    const emailResponse = await this.waitForUserResponse(ctx);
    const email = emailResponse.text;

    // Validate the NUS email
    const emailRegex = /^[A-Za-z0-9._%+-]+@u\.nus\.edu$/;
    if (!emailRegex.test(email)) {
      ctx.reply("Invalid NUS email. Please provide a valid NUS email address.");
      return;
    }

    ctx.reply("Please enter your room number:");
    const roomResponse = await this.waitForUserResponse(ctx);
    const room = roomResponse.text;

    // Save user information to the database
    const newUser = {
      name,
      telegramId,
      nusEmail: email,
      room,
    };
    try {
      await this.database.addUser(newUser);
      ctx.reply(
        "User added successfully! Please run /verify to complete the registration."
      );
    } catch (error) {
      console.error("Error adding user:", error);
      ctx.reply("An error occurred while adding the user.");
    }
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

  private async waitForUserResponse(ctx: Context): Promise<{ text: string }> {
    return new Promise((resolve) => {
      this.bot.on("text", (message) => {
        resolve({ text: "hehe" });
      });
    });
  }
}

// Usage
const botToken = process.env.BOT_TOKEN || "YOUR_BOT_TOKEN";
const apiKey = process.env.ELASTICEMAIL_KEY || "YOUR_API_KEY";
const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_KEY || "YOUR_SUPABASE_KEY";

const bot = new TelegramBot(botToken, apiKey, supabaseUrl, supabaseKey);
