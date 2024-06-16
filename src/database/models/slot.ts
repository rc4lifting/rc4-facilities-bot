// database/models/slot.ts

export interface Slot {
  booked_by: number;
  id: number;
  time_begin: string;
  time_end: string;
}

export interface SlotInsert {
  booked_by: number;
  id?: number;
  time_begin: string;
  time_end: string;
}

export interface SlotUpdate {
  booked_by?: number;
  id?: number;
  time_begin?: string;
  time_end?: string;
}
