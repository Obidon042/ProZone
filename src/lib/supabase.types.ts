export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TimestampColumns = {
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: "seeker" | "owner" | "agent" | "admin";
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: "seeker" | "owner" | "agent" | "admin";
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          role?: "seeker" | "owner" | "agent" | "admin";
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          owner_id: string;
          agent_id: string | null;
          title: string;
          location: string;
          price: number;
          price_period: "month" | "total";
          bedrooms: number;
          bathrooms: number;
          area: number;
          category: "House" | "Apartment" | "Villa";
          description: string;
          cover_image_url: string;
          listing_status: "draft" | "active" | "pending" | "sold";
        } & TimestampColumns;
        Insert: {
          id?: string;
          owner_id: string;
          agent_id?: string | null;
          title: string;
          location: string;
          price: number;
          price_period: "month" | "total";
          bedrooms: number;
          bathrooms: number;
          area: number;
          category: "House" | "Apartment" | "Villa";
          description?: string;
          cover_image_url: string;
          listing_status?: "draft" | "active" | "pending" | "sold";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          agent_id?: string | null;
          title?: string;
          location?: string;
          price?: number;
          price_period?: "month" | "total";
          bedrooms?: number;
          bathrooms?: number;
          area?: number;
          category?: "House" | "Apartment" | "Villa";
          description?: string;
          cover_image_url?: string;
          listing_status?: "draft" | "active" | "pending" | "sold";
          updated_at?: string;
        };
        Relationships: [];
      };
      property_inquiries: {
        Row: {
          id: string;
          property_id: string;
          property_title: string;
          sender_id: string;
          recipient_id: string;
          sender_name: string;
          sender_phone: string;
          message: string;
          status: "new" | "contacted";
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          property_title?: string;
          sender_id: string;
          recipient_id?: string;
          sender_name: string;
          sender_phone: string;
          message: string;
          status?: "new" | "contacted";
          created_at?: string;
        };
        Update: {
          status?: "new" | "contacted";
        };
        Relationships: [];
      };
      inspection_bookings: {
        Row: {
          id: string;
          property_id: string;
          property_title: string;
          property_location: string;
          visitor_id: string;
          recipient_id: string;
          visitor_name: string;
          visitor_phone: string;
          visit_date: string;
          visit_time: string;
          status: "pending" | "confirmed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          property_title?: string;
          property_location?: string;
          visitor_id: string;
          recipient_id?: string;
          visitor_name: string;
          visitor_phone: string;
          visit_date: string;
          visit_time: string;
          status?: "pending" | "confirmed" | "cancelled";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "confirmed" | "cancelled";
        };
        Relationships: [];
      };
      saved_properties: {
        Row: {
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          property_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profile_role_requests: {
        Row: {
          id: string;
          user_id: string;
          requested_role: "owner" | "agent";
          status: "pending" | "approved" | "rejected" | "needs_info";
          created_at: string;
          legal_name: string | null;
          phone_number: string | null;
          agency_name: string | null;
          office_address: string | null;
          property_address: string | null;
          document_files: Json;
          application_submitted: boolean;
          submitted_at: string | null;
          decision_reason: string | null;
          decided_by: string | null;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          requested_role: "owner" | "agent";
          status?: "pending" | "approved" | "rejected" | "needs_info";
          created_at?: string;
          legal_name?: string | null;
          phone_number?: string | null;
          agency_name?: string | null;
          office_address?: string | null;
          property_address?: string | null;
          document_files?: Json;
          application_submitted?: boolean;
          submitted_at?: string | null;
          decision_reason?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          requested_role?: "owner" | "agent";
          status?: "pending" | "approved" | "rejected" | "needs_info";
          created_at?: string;
          legal_name?: string | null;
          phone_number?: string | null;
          agency_name?: string | null;
          office_address?: string | null;
          property_address?: string | null;
          document_files?: Json;
          application_submitted?: boolean;
          submitted_at?: string | null;
          decision_reason?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
        };
        Relationships: [];
      };
      profile_role_request_decisions: {
        Row: {
          id: string;
          request_id: string;
          applicant_id: string;
          admin_id: string | null;
          action: "approved" | "rejected" | "needs_info";
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          applicant_id: string;
          admin_id?: string | null;
          action: "approved" | "rejected" | "needs_info";
          reason?: string | null;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_dashboard_stats: {
        Args: Record<PropertyKey, never>;
        Returns: {
          total_users: number;
          seekers: number;
          agents: number;
          owners: number;
          pending_agents: number;
          pending_owners: number;
          approved_requests: number;
          rejected_requests: number;
          approved_agents: number;
          approved_owners: number;
          needs_info_agents: number;
          needs_info_owners: number;
        }[];
      };
      admin_list_role_requests: {
        Args: { p_status?: string | null };
        Returns: {
          id: string;
          user_id: string;
          requested_role: string;
          status: string;
          created_at: string;
          display_name: string;
          profile_role: string;
          is_verified: boolean;
          email: string;
          submitted_at: string | null;
          legal_name: string | null;
          phone_number: string | null;
          agency_name: string | null;
          office_address: string | null;
          property_address: string | null;
          document_files: Json;
          decision_reason: string | null;
          decided_at: string | null;
          decision_history: Json;
        }[];
      };
      admin_decide_role_request: {
        Args: {
          p_request_id: string;
          p_action: string;
          p_reason?: string | null;
        };
        Returns: string;
      };
      submit_role_verification: {
        Args: {
          p_requested_role: string;
          p_legal_name: string;
          p_phone_number: string;
          p_agency_name: string | null;
          p_office_address: string | null;
          p_property_address: string | null;
          p_document_files: Json;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
