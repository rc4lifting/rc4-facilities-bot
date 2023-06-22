export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      BALLOTS: {
        Row: {
          created_at: string;
          id: number;
          time_begin: string;
          time_end: string;
          user_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          time_begin: string;
          time_end: string;
          user_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          time_begin?: string;
          time_end?: string;
          user_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "BALLOTS_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "USERS";
            referencedColumns: ["id"];
          }
        ];
      };
      SLOTS: {
        Row: {
          booked_by: number;
          id: number;
          time_begin: string;
          time_end: string;
        };
        Insert: {
          booked_by: number;
          id?: number;
          time_begin: string;
          time_end: string;
        };
        Update: {
          booked_by?: number;
          id?: number;
          time_begin?: string;
          time_end?: string;
        };
        Relationships: [
          {
            foreignKeyName: "SLOTS_booked_by_fkey";
            columns: ["booked_by"];
            referencedRelation: "USERS";
            referencedColumns: ["id"];
          }
        ];
      };
      USERS: {
        Row: {
          id: number;
          is_auth: boolean;
          name: string | null;
          nus_email: string;
          room: string;
          telegram_id: string;
          verification_code: string | null;
        };
        Insert: {
          id?: number;
          is_auth?: boolean;
          name?: string | null;
          nus_email: string;
          room: string;
          telegram_id: string;
          verification_code?: string | null;
        };
        Update: {
          id?: number;
          is_auth?: boolean;
          name?: string | null;
          nus_email?: string;
          room?: string;
          telegram_id?: string;
          verification_code?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type User = Database["public"]["Tables"]["USERS"]["Row"];
export type Slot = Database["public"]["Tables"]["SLOTS"]["Row"];
export type Ballot = Database["public"]["Tables"]["BALLOTS"]["Row"];
