import { Context } from "telegraf";
import { Manager } from "../../manager";

export default function bookCommand(manager: Manager) {
  return async function (ctx: Context): Promise<void> {
    // Implement the book command logic here
    // Use the `dmanager` to handle balloting
  };
}
