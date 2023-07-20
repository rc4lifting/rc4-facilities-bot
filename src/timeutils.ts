import { previousSunday, addDays } from "date-fns";
export { addDays };

/**
   * Using the current time, get the start of what we define
   * as the "previous week" - Monday to Sunday.
   *
   * @returns The start of the current week, Monday.
   */
export function weekStart(): Date {
  const start = previousSunday(Date.now());
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  start.setMilliseconds(0);
  return addDays(start, 1);
};