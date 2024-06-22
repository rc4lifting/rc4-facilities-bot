import { Context } from "telegraf";
import { Database } from "../../database";
import { EmailVerifier } from "../../email";

export default function getCodeCommand(
  database: Database,
  emailVerifier: EmailVerifier
) {
  return async function (ctx: Context): Promise<void> {
    const telegramId = ctx.from!.id.toString();

    try {
      const isRegistered = await database.isRegistered(telegramId);
      if (!isRegistered) {
        await ctx.reply(
          "You are not registered. Please run /register to register."
        );
        return;
      }

      const isVerified = await database.isVerified(telegramId);
      if (isVerified) {
        await ctx.reply("You are already verified.");
        return;
      }

      const verificationCode = generateVerificationCode();
      await database.saveVerificationCode(telegramId, verificationCode);

      const userEmail = await database.getUserEmail(telegramId);
      if (!userEmail) {
        await ctx.reply("Email address not found for the user.");
        return;
      }

      await emailVerifier.sendVerificationEmail(userEmail, verificationCode);
      await ctx.reply(
        "Verification email sent! Please check your email (and spam) and follow the instructions to complete the verification process."
      );
      await ctx.reply(
        "We've sent the verification code to your email address. Please run /verify {CODE} to verify your email address."
      );
    } catch (error) {
      console.error("Error getting verification code:", error);
      await ctx.reply("An error occurred while getting the verification code.");
    }
  };
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
