import { Context, Scenes } from "telegraf";
import { WizardContext } from "telegraf/typings/scenes";

// Define the RegistrationSessionData interface
export interface RegistrationSessionData extends Scenes.WizardSessionData {
  name: string;
  email: string;
  room_no: string;
}

// Define MyContext which extends Context, SceneContext, and WizardContext
export interface MyContext
  extends Context,
    Scenes.WizardContext<RegistrationSessionData> {}

// Define BotContext to use MyContext
export interface BotContext extends MyContext {}
