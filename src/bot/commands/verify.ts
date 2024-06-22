import { Context } from "telegraf";
import { Database } from "../../database";

export default function verifyCommand(database: Database) {
  return async function (ctx: Context): Promise<void> {
    const telegramId = ctx.from!.id.toString();
    const isRegistered = await database.isRegistered(telegramId);
    if (!isRegistered) {
      ctx.reply("You are not registered. Please run /register to register.");
      return;
    }

    const isVerified = await database.isVerified(telegramId);
    if (isVerified) {
      ctx.reply("You are already verified.");
      return;
    }

    if (!ctx.message || !("text" in ctx.message)) {
      ctx.reply("Please provide a verification code. Usage: /verify {CODE}");
      return;
    }

    const verificationCode = ctx.message.text.split(" ")[1];
    if (!verificationCode) {
      ctx.reply("Please provide a verification code. Usage: /verify {CODE}");
      return;
    }

    const storedVerificationCode = await database.getVerificationCode(
      telegramId
    );
    if (!storedVerificationCode) {
      ctx.reply(
        "No verification code found. Please generate a new verification code via /get_code."
      );
      return;
    }

    if (verificationCode !== storedVerificationCode) {
      ctx.reply("Invalid verification code. Please try again.");
      return;
    }

    try {
      await database.markUserAsVerified(telegramId);
      ctx.reply("Email address verified successfully!");
    } catch (error) {
      console.error("Error marking user as verified:", error);
      ctx.reply("An error occurred while marking the user as verified.");
    }
  };
}
