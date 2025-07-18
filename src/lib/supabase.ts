import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export type Database = {
  public: {
    Tables: {
      competitions: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          description: string | null;
          status: string;
          current_round: number;
          total_rounds: number;
          voting_enabled: boolean;
          display_mode: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en?: string | null;
          description?: string | null;
          status?: string;
          current_round?: number;
          total_rounds?: number;
          voting_enabled?: boolean;
          display_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string | null;
          description?: string | null;
          status?: string;
          current_round?: number;
          total_rounds?: number;
          voting_enabled?: boolean;
          display_mode?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rounds: {
        Row: {
          id: string;
          competition_id: string;
          round_number: number;
          name: string;
          name_en: string | null;
          description: string | null;
          elimination_count: number | null;
          is_public_voting: boolean;
          public_votes_per_user: number;
          status: string;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          round_number: number;
          name: string;
          name_en?: string | null;
          description?: string | null;
          elimination_count?: number | null;
          is_public_voting?: boolean;
          public_votes_per_user?: number;
          status?: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          round_number?: number;
          name?: string;
          name_en?: string | null;
          description?: string | null;
          elimination_count?: number | null;
          is_public_voting?: boolean;
          public_votes_per_user?: number;
          status?: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          competition_id: string;
          name: string;
          photo_url: string | null;
          leader_id: string | null;
          is_eliminated: boolean;
          elimination_round: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          name: string;
          photo_url?: string | null;
          leader_id?: string | null;
          is_eliminated?: boolean;
          elimination_round?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          name?: string;
          photo_url?: string | null;
          leader_id?: string | null;
          is_eliminated?: boolean;
          elimination_round?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          name: string;
          photo_url: string | null;
          group_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          photo_url?: string | null;
          group_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          photo_url?: string | null;
          group_id?: string | null;
          created_at?: string;
        };
      };
      judges: {
        Row: {
          id: string;
          competition_id: string;
          name: string;
          clerk_user_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          name: string;
          clerk_user_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          name?: string;
          clerk_user_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
      };
      scoring_factors: {
        Row: {
          id: string;
          competition_id: string;
          name: string;
          name_en: string | null;
          description: string | null;
          max_score: number;
          weight: number;
          order_index: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id: string;
          name: string;
          name_en?: string | null;
          description?: string | null;
          max_score?: number;
          weight?: number;
          order_index?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string;
          name?: string;
          name_en?: string | null;
          description?: string | null;
          max_score?: number;
          weight?: number;
          order_index?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
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
  };
};
