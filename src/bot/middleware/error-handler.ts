import { Context } from "telegraf";

type NextFunction = () => Promise<void>;

export default class ErrorHandlerMiddleware {
  public async handle(ctx: Context, next: NextFunction): Promise<void> {
    try {
      await next();
    } catch (error) {
      console.error("Error handling message:", error);
      await ctx.reply("An error occurred while processing your request.");
    }
  }
}
