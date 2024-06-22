import { Context } from "telegraf";

export default function startCommand(ctx: Context): void {
  const startMessage = `
    Welcome to the Telegram Bot!

    Available commands:
    /start - Start the bot
    /help - Show the help message
    /register - Register for the bot
    /verify - Verify your email address
    /unregister - Unregister and delete your data

    To begin registration, use the /register command.
    Follow the instructions provided by the bot to complete the registration process.
    Once registered, use the /verify command to verify your email address.
    You can also use the /unregister command to unregister from the bot and delete your data.
  `;
  ctx.reply(startMessage);
}
