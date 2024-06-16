import {
  format,
  addMinutes,
  parseISO,
  addDays,
  subDays,
  getDay,
} from "date-fns";

/**
 * Formats a Date object to an ISO string.
 * @param date - The Date object to format.
 * @returns The ISO string representation of the date.
 */
export function formatISODate(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Adds minutes to a Date object.
 * @param date - The Date object to add minutes to.
 * @param minutes - The number of minutes to add.
 * @returns The new Date object with the added minutes.
 */
export function addMinutesToDate(date: Date, minutes: number): Date {
  return addMinutes(date, minutes);
}

/**
 * Parses an ISO date string into a Date object.
 * @param dateString - The ISO date string to parse.
 * @returns The parsed Date object.
 */
export function parseISODate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Get the date of the previous Sunday from the given date.
 * @param date - The date from which to calculate the previous Sunday.
 * @returns The Date object representing the previous Sunday.
 */
function previousSunday(date: Date): Date {
  const dayOfWeek = getDay(date);
  return subDays(date, dayOfWeek);
}

/**
 * Using the current time, get the start of what we define
 * as the "previous week" - Monday to Sunday.
 * @returns The start of the current week, Monday.
 */
export function weekStart(): Date {
  const start = previousSunday(new Date());
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  start.setMilliseconds(0);
  return addDays(start, 1);
}

export { addDays };
