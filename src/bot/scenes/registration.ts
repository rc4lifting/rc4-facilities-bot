import { Scenes } from "telegraf";
import { Database } from "../../database";
import { Message } from "telegraf/typings/core/types/typegram";
import { MyContext } from "../context";

export default class RegistrationScene {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public middleware(): Scenes.WizardScene<MyContext> {
    const registrationScene = new Scenes.WizardScene<MyContext>(
      "registration",
      async (ctx: MyContext) => {
        await ctx.reply("Please enter your name:");
        return ctx.wizard.next();
      },
      async (ctx: MyContext) => {
        const message = ctx.message as Message.TextMessage;
        if (message && message.text && message.text.length < 3) {
          await ctx.reply("Please enter a valid name.");
          return;
        }
        ctx.scene.session.name = message?.text ?? "";
        await ctx.reply("Please enter your NUS email:");
        return ctx.wizard.next();
      },
      async (ctx: MyContext) => {
        const message = ctx.message as Message.TextMessage;
        const email = message?.text ?? "";
        const emailRegex = /^[A-Za-z0-9._%+-]+@u\.nus\.edu$/;
        if (!emailRegex.test(email)) {
          await ctx.reply(
            "Please enter a valid NUS email address (e.g., XXX@u.nus.edu)."
          );
          return;
        }
        ctx.scene.session.email = email;
        await ctx.reply("Please enter your room number:");
        return ctx.wizard.next();
      },
      async (ctx: MyContext) => {
        const message = ctx.message as Message.TextMessage;
        const room = message?.text ?? "";
        if (room.length < 3) {
          await ctx.reply("Please enter a valid room.");
          return;
        }
        ctx.scene.session.room_no = room;
        const confirmString = `Your name is ${ctx.scene.session.name}, your email is ${ctx.scene.session.email}, and your room is ${ctx.scene.session.room_no}.`;
        const telegramId = message?.from?.id.toString() ?? "";
        const user = {
          name: ctx.scene.session.name,
          telegramId: telegramId,
          nusEmail: ctx.scene.session.email,
          room: ctx.scene.session.room_no,
        };
        await this.database.addUser(user);
        await ctx.reply(confirmString);
        await ctx.reply(
          "Please run /get_code to get a verification code sent to your email address and finish your registration."
        );
        return ctx.scene.leave();
      }
    );
    return registrationScene;
  }
}
