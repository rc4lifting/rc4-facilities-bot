// database/models/ballot.ts

export interface Ballot {
  created_at: string;
  id: number;
  telegram_id: string;
  time_begin: string;
  time_end: string;
  user_id: number | null;
}

export interface BallotInsert {
  created_at?: string;
  id?: number;
  telegram_id: string;
  time_begin: string;
  time_end: string;
  user_id?: number | null;
}

export interface BallotUpdate {
  created_at?: string;
  id?: number;
  telegram_id?: string;
  time_begin?: string;
  time_end?: string;
  user_id?: number | null;
}
