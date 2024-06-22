import { Context } from "telegraf";

export default function helpCommand(ctx: Context): void {
  const helpMessage = `
    This is a custom bot that provides various commands.

    Available commands:
    /start - Start the bot
    /help - Show the help message
    /register - Register for the bot
    /verify - Verify your email address
    /unregister - Unregister and delete your data
    /book - Book a slot for the current Monday - Sunday cycle
    /ballot - Ballot for a slot in the coming Monday - Sunday cycle
    /view_sheets - View the spreadsheet for live updates on booking

    To begin registration, use the /register command.
    Follow the instructions provided by the bot to complete the registration process.
    Once registered, use the /verify command to verify your email address.
    You can also use the /unregister command to unregister from the bot and delete your data.
  `;
  ctx.reply(helpMessage);
}
