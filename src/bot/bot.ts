import { Telegraf, Context } from 'telegraf';
import { Result, Ok, Err } from '@sniptt/monads';
import { DDatabase } from '../database/src/d-database';

// Create a class for your Telegram bot
class TelegramBot {
  private readonly bot: Telegraf<Context>;

  constructor(botToken: string) {
    this.bot = new Telegraf<Context>(botToken);
    this.setupCommands().catch((error) => {
      console.error('Error setting up commands:', error);
    });
  }

  private async setupCommands(): Promise<void> {
    // Read Supabase URL and key from process environment variables
    const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

    try {
      // Create an instance of DDatabase
      const database = await DDatabase.build({ supabaseUrl, supabaseKey });

      // Command handler: Check if user exists
      this.bot.command('isUser', async (ctx) => {
        const telegramId = ctx.message.from.id.toString();
        try {
          const isUser = await database.isUser(telegramId);
          ctx.reply(`User exists: ${isUser}`);
        } catch (error) {
          console.error('Error checking user:', error);
          ctx.reply('An error occurred while checking the user.');
        }
      });

      // Command handler: Add a user
      this.bot.command('addUser', async (ctx) => {
        const telegramId = ctx.message.from.id.toString();
        const newUser = {
          name: 'John Doe',
          telegramId: telegramId,
          nusEmail: 'johndoe@example.com',
          room: 'Room 101',
        };

        try {
          const result = await database.addUser(newUser);
          if (result.isOk()) {
            ctx.reply('User added successfully!');
          } else {
            ctx.reply(`Failed to add user: ${result.unwrapErr().message}`);
          }
        } catch (error) {
          console.error('Error adding user:', error);
          ctx.reply('An error occurred while adding the user.');
        }
      });

      // Add more command handlers as needed

      // Start the bot
      this.bot.launch().then(() => {
        console.log('Bot started');
      }).catch((err) => {
        console.error('Error starting bot', err);
      });
    } catch (error) {
      console.error('Error creating DDatabase instance:', error);
    }
  }

  public start(): void {
    this.bot.start((ctx: Context) => {
      ctx.reply('Welcome! This is the start command.');
    });
  }
  
  public help(): void {
    this.bot.help((ctx: Context) => {
      const helpMessage = `
        This is a custom bot that provides various commands.
  
        Available commands:
        /start - Start the bot
        /help - Show the help message
        /custom - Perform a custom action
  
        Feel free to explore and interact with the bot!
      `;
      ctx.reply(helpMessage);
    });
  }
  // Add more methods for other bot functionality
}

// Usage
const botToken = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const bot = new TelegramBot(botToken);
bot.start();
bot.help();