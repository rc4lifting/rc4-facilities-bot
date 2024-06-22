// database/models/user.ts

export interface User {
  id: number;
  is_auth: boolean;
  name: string | null;
  nus_email: string;
  room: string;
  telegram_id: string;
  verification_code: string | null;
}

export interface UserInsert {
  id?: number;
  is_auth?: boolean;
  name?: string | null;
  nus_email: string;
  room: string;
  telegram_id: string;
  verification_code?: string | null;
}

export interface UserUpdate {
  id?: number;
  is_auth?: boolean;
  name?: string | null;
  nus_email?: string;
  room?: string;
  telegram_id?: string;
  verification_code?: string | null;
}
