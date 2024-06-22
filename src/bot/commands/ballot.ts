import { Context } from "telegraf";
import { Manager } from "../../manager";

export default function ballotCommand(manager: Manager) {
  return async function (ctx: Context): Promise<void> {
    // Implement the ballot command logic here
    // Use the `dmanager` to handle balloting
  };
}
