import { Scenes } from "telegraf";
import { Database, User } from "../../database";
import { Message } from "telegraf/typings/core/types/typegram";
import { MyContext } from "../context";

export default class RegistrationScene {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public middleware(): Scenes.WizardScene<MyContext> {
    return new Scenes.WizardScene<MyContext>(
      "registration",
      async (ctx: MyContext) => {
        await ctx.reply("Please enter your name:");
        return ctx.wizard.next();
      },
      async (ctx: MyContext) => {
        const message = ctx.message as Message.TextMessage;
        if (!message || !message.text || message.text.length < 3) {
          await ctx.reply("Please enter a valid name (at least 3 characters).");
          return;
        }
        ctx.scene.session.name = message.text;
        await ctx.reply("Please enter your NUS email:");
        return ctx.wizard.next();
      },
      async (ctx: MyContext) => {
        const message = ctx.message as Message.TextMessage;
        const email = message?.text ?? "";
        const emailRegex = /^[A-Za-z0-9._%+-]+@u\.nus\.edu$/;
        if (!emailRegex.test(email)) {
          await ctx.reply(
            "Please enter a valid NUS email address (e.g., e0123456@u.nus.edu)."
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
          await ctx.reply("Please enter a valid room number.");
          return;
        }
        ctx.scene.session.room_no = room;
        const telegramId = ctx.from?.id.toString() ?? "";

        try {
          const userExists = await this.database.userExists(telegramId);
          if (userExists) {
            await ctx.reply(
              "You are already registered. If you need to update your information, please contact an administrator."
            );
          } else {
            const user: User = {
              id: 0, // This will be set by the database
              is_auth: false,
              name: ctx.scene.session.name,
              nus_email: ctx.scene.session.email,
              room: ctx.scene.session.room_no,
              telegram_id: telegramId,
              verification_code: null,
            };
            await this.database.addUser(user);
            const confirmString = `Registration successful!\n\nName: ${user.name}\nEmail: ${user.nus_email}\nRoom: ${user.room}`;
            await ctx.reply(confirmString);
            await ctx.reply(
              "Please run /get_code to get a verification code sent to your email address and finish your registration."
            );
          }
        } catch (error) {
          console.error("Error during registration:", error);
          await ctx.reply(
            "An error occurred during registration. Please try again later or contact an administrator."
          );
        }
        return ctx.scene.leave();
      }
    );
  }
}
