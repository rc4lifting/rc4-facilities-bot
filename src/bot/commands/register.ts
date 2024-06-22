// src/bot/commands/register.ts
import { MyContext } from "../context";

export default async function registerCommand(ctx: MyContext) {
  if (!ctx.scene) {
    console.error("Scene is undefined in context");
    await ctx.reply("An error occurred. Please try again later.");
    return;
  }
  await ctx.scene.enter("registration");
}
