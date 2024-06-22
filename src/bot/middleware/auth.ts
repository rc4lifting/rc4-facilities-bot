// middleware/auth.ts
import { Context } from "telegraf";
import { Database } from "../../database";

export default class AuthMiddleware {
  private database: Database;

  constructor(database: Database) {
    //throw if database is undefined
    if (!database) {
      throw new Error("Database is required");
    }
    this.database = database;
    this.handle = this.handle.bind(this);
  }

  public async handle(ctx: Context, next: () => Promise<void>): Promise<void> {
    const telegramId = ctx.from!.id.toString();

    const isRegistered = await this.database.isRegistered(telegramId);
    if (!isRegistered) {
      await ctx.reply(
        "You are not registered. Please run /register to register."
      );
      return;
    }

    const isVerified = await this.database.isVerified(telegramId);
    if (!isVerified) {
      await ctx.reply(
        "You are not verified. Please run /get_code to get a verification code sent to your email address."
      );
      return;
    }

    await next();
  }
}
