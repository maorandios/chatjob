export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      managers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          company_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          phone?: string;
          company_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          company_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      workers: {
        Row: {
          id: string;
          manager_id: string;
          name: string;
          phone: string;
          language: string | null;
          status: string;
          invite_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          manager_id: string;
          name: string;
          phone: string;
          language?: string | null;
          status?: string;
          invite_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          manager_id?: string;
          name?: string;
          phone?: string;
          language?: string | null;
          status?: string;
          invite_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          worker_id: string;
          sender_role: string;
          original_text: string;
          original_lang: string;
          translated_text: string | null;
          target_lang: string | null;
          input_type: string;
          image_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          sender_role: string;
          original_text?: string;
          original_lang?: string;
          translated_text?: string | null;
          target_lang?: string | null;
          input_type?: string;
          image_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          sender_role?: string;
          original_text?: string;
          original_lang?: string;
          translated_text?: string | null;
          target_lang?: string | null;
          input_type?: string;
          image_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
