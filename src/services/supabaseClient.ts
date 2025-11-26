import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.log(supabaseUrl, supabaseAnonKey);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type definitions
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          logo: string | null;
          interest_rate: number;
          voen: string | null;
          director: string | null;
          director_passport_number: string | null;
          passport_given_object: string | null;
          address: string | null;
          phone_numbers: string[] | null;
          email: string | null;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          logo?: string | null;
          interest_rate: number;
          voen?: string | null;
          director?: string | null;
          director_passport_number?: string | null;
          passport_given_object?: string | null;
          address?: string | null;
          phone_numbers?: string[] | null;
          email?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          logo?: string | null;
          interest_rate?: number;
          voen?: string | null;
          director?: string | null;
          director_passport_number?: string | null;
          passport_given_object?: string | null;
          address?: string | null;
          phone_numbers?: string[] | null;
          email?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          company_id: string | null;
          role: "superadmin" | "admin" | "user";
          username: string;
          full_name: string | null;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          company_id?: string | null;
          role?: "superadmin" | "admin" | "user";
          username: string;
          full_name?: string | null;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          company_id?: string | null;
          role?: "superadmin" | "admin" | "user";
          username?: string;
          full_name?: string | null;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          company_id: string;
          customer_type: "individual" | "company";
          first_name: string | null;
          last_name: string | null;
          father_name: string | null;
          national_id: string | null;
          company_name: string | null;
          voen: string | null;
          license_number: string | null;
          license_category: string | null;
          license_given_date: string | null;
          phone: string;
          address: string;
          contacts: any;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          company_id: string;
          customer_type: "individual" | "company";
          first_name?: string | null;
          last_name?: string | null;
          father_name?: string | null;
          national_id?: string | null;
          company_name?: string | null;
          voen?: string | null;
          license_number?: string | null;
          license_category?: string | null;
          license_given_date?: string | null;
          phone: string;
          address: string;
          contacts?: any;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          company_id?: string;
          customer_type?: "individual" | "company";
          first_name?: string | null;
          last_name?: string | null;
          father_name?: string | null;
          national_id?: string | null;
          company_name?: string | null;
          voen?: string | null;
          license_number?: string | null;
          license_category?: string | null;
          license_given_date?: string | null;
          phone?: string;
          address?: string;
          contacts?: any;
          created_at?: string;
          is_active?: boolean;
        };
      };
      vehicles: {
        Row: {
          id: string;
          company_id: string;
          license_plate: string;
          make: string;
          model: string;
          year: number;
          color: string;
          body_number: string;
          registration_certificate_number: string;
          engine: string;
          texpasport_document: string | null;
        };
        Insert: {
          id?: string;
          company_id?: string;
          license_plate?: string;
          make?: string;
          model?: string;
          year?: number;
          color?: string;
          body_number?: string;
          registration_certificate_number?: string;
          engine?: string;
          texpasport_document?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          license_plate?: string;
          make?: string;
          model?: string;
          year?: number;
          color?: string;
          body_number?: string;
          registration_certificate_number?: string;
          engine?: string;
          texpasport_document?: string | null;
        };
      };
      contracts: {
        Row: {
          id: string;
          customer_id: string;
          vehicle_id: string;
          company_id: string;
          standard_purchase_price: number;
          down_payment: number;
          yearly_interest_rate: number;
          term_months: number;
          monthly_payment: number;
          total_payable: number;
          start_date: string;
          payment_start_date: string;
          next_due_date: string;
          payment_interval: "monthly" | "quarterly" | "yearly";
          status: "active" | "completed" | "defaulted" | "cancelled";
          remaining_balance: number;
          total_paid: number;
          payments_count: number;
          last_payment_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vehicle_id: string;
          company_id: string;
          standard_purchase_price: number;
          down_payment: number;
          yearly_interest_rate: number;
          term_months: number;
          monthly_payment: number;
          total_payable: number;
          start_date: string;
          payment_start_date: string;
          next_due_date: string;
          payment_interval?: "monthly" | "quarterly" | "yearly";
          status?: "active" | "completed" | "defaulted" | "cancelled";
          remaining_balance: number;
          total_paid?: number;
          payments_count?: number;
          last_payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vehicle_id?: string;
          company_id?: string;
          standard_purchase_price?: number;
          down_payment?: number;
          yearly_interest_rate?: number;
          term_months?: number;
          monthly_payment?: number;
          total_payable?: number;
          start_date?: string;
          payment_start_date?: string;
          next_due_date?: string;
          payment_interval?: "monthly" | "quarterly" | "yearly";
          status?: "active" | "completed" | "defaulted" | "cancelled";
          remaining_balance?: number;
          total_paid?: number;
          payments_count?: number;
          last_payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          contract_id: string;
          customer_id: string;
          company_id: string;
          amount: number;
          payment_date: string;
          due_date: string;
          interest_amount: number;
          payment_method: "cash" | "card" | "bank_transfer" | "automatic";
          is_late: boolean;
          days_late: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          contract_id: string;
          customer_id: string;
          company_id: string;
          amount: number;
          payment_date: string;
          due_date: string;
          interest_amount?: number;
          payment_method?: "cash" | "card" | "bank_transfer" | "automatic";
          is_late?: boolean;
          days_late?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          contract_id?: string;
          customer_id?: string;
          company_id?: string;
          amount?: number;
          payment_date?: string;
          due_date?: string;
          interest_amount?: number;
          payment_method?: "cash" | "card" | "bank_transfer" | "automatic";
          is_late?: boolean;
          days_late?: number;
          notes?: string | null;
        };
      };
    };
    Functions: {
      auth_email_for_username: {
        Args: {
          in_username: string;
        };
        Returns: string | null;
      };
      generate_payment_schedule: {
        Args: {
          lease_id: string;
        };
        Returns: {
          payment_date: string;
          amount: number;
          payment_number: number;
        }[];
      };
      mark_payment_paid: {
        Args: {
          payment_id: string;
          paid_at?: string;
        };
        Returns: boolean;
      };
      search_customers: {
        Args: {
          q: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: {
          id: string;
          customer_type: string;
          first_name: string | null;
          last_name: string | null;
          company_name: string | null;
          phone: string;
          email: string | null;
        }[];
      };
    };
  };
}

// Create typed Supabase client
export const typedSupabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);
