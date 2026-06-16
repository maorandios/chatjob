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
      companies: {
        Row: {
          id: string;
          name: string;
          company_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          company_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          company_number?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      managers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          phone: string;
          email: string | null;
          invite_token: string;
          is_admin: boolean;
          onboarding_complete: boolean;
          profile_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          phone: string;
          email?: string | null;
          invite_token: string;
          is_admin?: boolean;
          onboarding_complete?: boolean;
          profile_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          invite_token?: string;
          is_admin?: boolean;
          onboarding_complete?: boolean;
          profile_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      workers: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          phone: string;
          employee_number: string | null;
          address: string | null;
          language: string | null;
          status: string;
          invite_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          phone: string;
          employee_number?: string | null;
          address?: string | null;
          language?: string | null;
          status?: string;
          invite_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          phone?: string;
          employee_number?: string | null;
          address?: string | null;
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
          company_id: string;
          manager_id: string;
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
          company_id: string;
          manager_id: string;
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
          company_id?: string;
          manager_id?: string;
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
    Functions: {
      slang_bootstrap_admin: {
        Args: {
          p_company_name: string;
          p_admin_name: string;
          p_admin_phone: string;
          p_invite_token: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
