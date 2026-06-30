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
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
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
          email: string | null;
          employee_number: string | null;
          address: string | null;
          language: string | null;
          status: string;
          invite_token: string;
          profile_image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name: string;
          phone: string;
          email?: string | null;
          employee_number?: string | null;
          address?: string | null;
          language?: string | null;
          status?: string;
          invite_token: string;
          profile_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          employee_number?: string | null;
          address?: string | null;
          language?: string | null;
          status?: string;
          invite_token?: string;
          profile_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      worker_company_memberships: {
        Row: {
          id: string;
          worker_id: string;
          company_id: string;
          invite_token: string;
          status: string;
          relationship_type: string;
          display_name: string | null;
          display_phone: string | null;
          private_note: string | null;
          created_by_manager_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          company_id: string;
          invite_token: string;
          status?: string;
          relationship_type?: string;
          display_name?: string | null;
          display_phone?: string | null;
          private_note?: string | null;
          created_by_manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          worker_id?: string;
          company_id?: string;
          invite_token?: string;
          status?: string;
          relationship_type?: string;
          display_name?: string | null;
          display_phone?: string | null;
          private_note?: string | null;
          created_by_manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_aliases: {
        Row: {
          id: string;
          company_id: string;
          owner_role: string;
          owner_id: string;
          contact_role: string;
          contact_id: string;
          display_name: string | null;
          display_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          owner_role: string;
          owner_id: string;
          contact_role: string;
          contact_id: string;
          display_name?: string | null;
          display_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          owner_role?: string;
          owner_id?: string;
          contact_role?: string;
          contact_id?: string;
          display_name?: string | null;
          display_phone?: string | null;
          created_at?: string;
          updated_at?: string;
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
          location_lat: number | null;
          location_lng: number | null;
          location_label: string | null;
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
          location_lat?: number | null;
          location_lng?: number | null;
          location_label?: string | null;
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
          location_lat?: number | null;
          location_lng?: number | null;
          location_label?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_role: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_role: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_role?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
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
