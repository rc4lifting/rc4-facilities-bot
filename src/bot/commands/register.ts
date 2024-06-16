import { MyContext } from "../context";

export default function registerCommand(ctx: MyContext): void {
  ctx.scene.enter("registration");
}
