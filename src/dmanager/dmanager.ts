import { DDatabase } from "../database";

export class DManager {
  private database: DDatabase;
  public constructor(database: DDatabase) {
    this.database = database;
  }

  public resolve() {}

  public update() {}

  public ballot() {}

  public book() {}
}

