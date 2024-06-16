import { Context } from "telegraf";
import { Database } from "../../database";

export default function unregisterCommand(database: Database) {
  return async function (ctx: Context): Promise<void> {
    const telegramId = ctx.from!.id.toString();

    try {
      await database.delUser(telegramId);
      ctx.reply("You have been unregistered and your data has been deleted.");
    } catch (error) {
      console.error("Error unregistering user:", error);
      ctx.reply("An error occurred while unregistering.");
    }
  };
}
