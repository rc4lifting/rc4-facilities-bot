// src/bot/context.ts
import { Context, Scenes } from "telegraf";

export interface RegistrationSessionData extends Scenes.WizardSessionData {
  name: string;
  email: string;
  room_no: string;
}

export interface MyContext
  extends Context,
    Scenes.WizardContext<RegistrationSessionData> {
  scene: Scenes.SceneContextScene<MyContext, RegistrationSessionData>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}

export type BotContext = MyContext;
