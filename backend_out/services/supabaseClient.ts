import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (these should match your Supabase schema)
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo: string | null
          interest_rate: number
          created_at: string
          is_active: boolean
          voen: string | null
          charter: string | null
          registration_withdrawal: string | null
          easy_signature_number: string | null
          director: string | null
        }
        Insert: {
          id?: string
          name: string
          logo?: string | null
          interest_rate?: number
          created_at?: string
          is_active?: boolean
          voen?: string | null
          charter?: string | null
          registration_withdrawal?: string | null
          easy_signature_number?: string | null
          director?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo?: string | null
          interest_rate?: number
          created_at?: string
          is_active?: boolean
          voen?: string | null
          charter?: string | null
          registration_withdrawal?: string | null
          easy_signature_number?: string | null
          director?: string | null
        }
      }
      profiles: {
        Row: {
          user_id: string
          company_id: string | null
          role: 'superadmin' | 'admin' | 'user'
          username: string
          full_name: string
          email: string
          created_at: string
          last_login_at: string | null
          password_changed_at: string | null
        }
        Insert: {
          user_id: string
          company_id?: string | null
          role?: 'superadmin' | 'admin' | 'user'
          username: string
          full_name: string
          email: string
          created_at?: string
          last_login_at?: string | null
          password_changed_at?: string | null
        }
        Update: {
          user_id?: string
          company_id?: string | null
          role?: 'superadmin' | 'admin' | 'user'
          username?: string
          full_name?: string
          email?: string
          created_at?: string
          last_login_at?: string | null
          password_changed_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          company_id: string
          customer_type: 'individual' | 'company'
          first_name: string | null
          last_name: string | null
          father_name: string | null
          national_id: string | null
          company_name: string | null
          voen: string | null
          phone: string
          address: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          company_id?: string
          customer_type: 'individual' | 'company'
          first_name?: string | null
          last_name?: string | null
          father_name?: string | null
          national_id?: string | null
          company_name?: string | null
          voen?: string | null
          phone: string
          address: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          company_id?: string
          customer_type?: 'individual' | 'company'
          first_name?: string | null
          last_name?: string | null
          father_name?: string | null
          national_id?: string | null
          company_name?: string | null
          voen?: string | null
          phone?: string
          address?: string
          created_at?: string
          is_active?: boolean
        }
      }
      vehicles: {
        Row: {
          id: string
          company_id: string
          license_plate: string
          make: string
          model: string
          year: number
          color: string
          vin: string
          body_number: string
          engine: string
          texpasport_document: string | null
        }
        Insert: {
          id?: string
          company_id?: string
          license_plate: string
          make: string
          model: string
          year: number
          color: string
          vin: string
          body_number: string
          engine: string
          texpasport_document?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          license_plate?: string
          make?: string
          model?: string
          year?: number
          color?: string
          vin?: string
          body_number?: string
          engine?: string
          texpasport_document?: string | null
        }
      }
      contracts: {
        Row: {
          id: string
          customer_id: string
          company_id: string
          vehicle_id: string
          standard_purchase_price: number
          down_payment: number
          yearly_interest_rate: number
          term_months: number
          monthly_payment: number
          total_payable: number
          start_date: string
          payment_start_date: string
          next_due_date: string
          payment_interval: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
          status: 'active' | 'completed' | 'defaulted' | 'open'
          remaining_balance: number
          total_paid: number
          payments_count: number
          last_payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          company_id?: string
          vehicle_id: string
          standard_purchase_price: number
          down_payment: number
          yearly_interest_rate: number
          term_months: number
          monthly_payment: number
          total_payable: number
          start_date: string
          payment_start_date: string
          next_due_date: string
          payment_interval?: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
          status?: 'active' | 'completed' | 'defaulted' | 'open'
          remaining_balance: number
          total_paid?: number
          payments_count?: number
          last_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          company_id?: string
          vehicle_id?: string
          standard_purchase_price?: number
          down_payment?: number
          yearly_interest_rate?: number
          term_months?: number
          monthly_payment?: number
          total_payable?: number
          start_date?: string
          payment_start_date?: string
          next_due_date?: string
          payment_interval?: 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually'
          status?: 'active' | 'completed' | 'defaulted' | 'open'
          remaining_balance?: number
          total_paid?: number
          payments_count?: number
          last_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          contract_id: string
          customer_id: string
          company_id: string
          amount: number
          payment_date: string
          due_date: string
          interest_amount: number
          payment_method: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
          is_late: boolean
          days_late: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          customer_id: string
          company_id?: string
          amount: number
          payment_date: string
          due_date: string
          interest_amount?: number
          payment_method: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
          is_late?: boolean
          days_late?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          customer_id?: string
          company_id?: string
          amount?: number
          payment_date?: string
          due_date?: string
          interest_amount?: number
          payment_method?: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
          is_late?: boolean
          days_late?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          type: 'word' | 'excel'
          context: 'customer' | 'contract' | 'payment' | 'vehicle' | 'company' | 'dyp' | 'general'
          assigned_pages: string[]
          file_name: string
          file_size: number
          file_data: string
          variables: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          type: 'word' | 'excel'
          context: 'customer' | 'contract' | 'payment' | 'vehicle' | 'company' | 'dyp' | 'general'
          assigned_pages?: string[]
          file_name: string
          file_size: number
          file_data: string
          variables?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          type?: 'word' | 'excel'
          context?: 'customer' | 'contract' | 'payment' | 'vehicle' | 'company' | 'dyp' | 'general'
          assigned_pages?: string[]
          file_name?: string
          file_size?: number
          file_data?: string
          variables?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_email_for_username: {
        Args: {
          in_username: string
        }
        Returns: string | null
      }
      current_app_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          company_id: string | null
          role: 'superadmin' | 'admin' | 'user'
        }[]
      }
      generate_payment_schedule: {
        Args: {
          lease_id: string
        }
        Returns: {
          payment_id: string
          contract_id: string
          customer_id: string
          company_id: string
          amount: number
          due_date: string
          payment_method: 'automatic' | 'manual' | 'cash' | 'bank_transfer' | 'card_to_card'
        }[]
      }
      mark_payment_paid: {
        Args: {
          payment_id: string
          paid_at?: string
        }
        Returns: boolean
      }
      search_customers: {
        Args: {
          q?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          company_id: string
          customer_type: 'individual' | 'company'
          first_name: string | null
          last_name: string | null
          company_name: string | null
          phone: string
          address: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Typed Supabase client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
