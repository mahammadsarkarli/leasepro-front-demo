export interface Company {
  id: string;
  name: string;
  logo?: string;
  interest_rate: number; // Daily interest rate as percentage
  created_at: Date;
  is_active: boolean;
  // Company details fields
  voen?: string; // VÖEN (VAT number)
  director?: string; // Direktor
  director_passport_number?: string; // Director's passport number
  passport_given_object?: string; // Who/what entity issued the passport
  // Contact information
  address?: string;
  phone_numbers?: string[]; // Array of contact phone numbers
  email?: string;
}

export interface ContactInfo {
  id: string;
  customer_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone: string;
}



export interface CustomerPhoto {
  fileName: string;
  fileType: string;
  fileSize: number;
  data: string; // base64
}

export enum CustomerType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company'
}

export interface Customer {
  id: string;
  company_id: string;
  customer_type: CustomerType;
  // Individual customer fields
  first_name?: string;
  last_name?: string;
  father_name?: string;
  national_id?: string;
  driver_license_front?: string; // Google Drive file ID for driver license front photo
  driver_license_back?: string; // Google Drive file ID for driver license back photo
  passport_front?: string; // Google Drive file ID for passport front photo
  passport_back?: string; // Google Drive file ID for passport back photo
  // Driver license information
  license_number?: string; // Sürücülük vəsiqəsi nömrəsi
  license_category?: string; // Sürücülük vəsiqəsi kateqoriyası
  license_given_date?: Date; // Sürücülük vəsiqəsi verilmə tarixi
  // Company customer fields
  company_name?: string;
  voen?: string; // VÖEN (VAT number)
  // Common fields
  phone: string;
  address: string;
  contacts: ContactInfo[];
  leasing_company_name?: string; // TSB LİZİNQ, LİSDAS LİZİNQ, etc.
  created_at: Date;
  is_active: boolean;
}

export interface Vehicle {
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
  vin?: string; // Vehicle Identification Number
  type?: string;
  texpasport_document?: string; // URL or base64 string for the uploaded document
}

export enum ContractStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  COMPLETED_EARLY = 'completed_early',
  DEFAULTED = 'defaulted',
  DEFAULTED_CLOSED = 'defaulted_closed',
  OPEN = 'open',
  IMTINA_EDILMIS = 'imtina_edilmis', // Customer cannot pay, contract closed
  ALQI_SATQI = 'alqi_satqi', // Contract ownership transferred, contract closed
  TAMAMLANMIS = 'tamamlanmis' // Fully paid or contract ended
}

export enum PaymentMethod {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD_TO_CARD = 'card_to_card'
}

export enum PaymentInterval {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUALLY = 'semi_annually',
  ANNUALLY = 'annually'
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  license_category?: string; // Sürücülük vəsiqəsi kateqoriyası
  license_given_date?: Date; // Sürücülük vəsiqəsi verilmə tarixi
  phone?: string;
  address?: string;
}

export interface PermissionDocument {
  id: string;
  contractId: string;
  beginDate: Date;
  endDate: Date;
  drivers: Driver[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  customer_id: string;
  company_id: string;
  vehicle: Vehicle;
  standard_purchase_price: number;
  down_payment: number;
  yearly_interest_rate: number;
  term_months: number;
  monthly_payment: number;
  original_monthly_payment: number;
  adjusted_monthly_payment?: number;
  total_payable: number;
  start_date: Date;
  payment_start_date: Date;
  next_due_date: Date;
  payment_interval: PaymentInterval;
  status: ContractStatus;
  remaining_balance: number;
  total_paid: number;
  total_principal_paid: number;
  total_extra_payments: number;
  last_extra_payment_date?: Date;
  payments_count: number;
  last_payment_date?: Date;
  permission_document?: PermissionDocument;
  closeDate?: Date;
  closeNotes?: string;
  whoCreated?: string;
}

export interface Payment {
  id: string;
  contract_id: string;
  customer_id: string;
  company_id: string;
  amount: number;
  payment_date: Date;
  due_date: Date;
  interest_amount: number;
  payment_method: PaymentMethod;
  is_late: boolean;
  days_late: number;
  notes?: string;
  receipt_url?: string; // Google Drive file ID for receipt file
  is_partial?: boolean; // Indicates if this is a partial payment
  expected_amount?: number; // Expected payment amount for partial payments
  remaining_balance?: number; // Remaining balance after partial payment
  payment_period?: number; // Payment period this payment applies to
  is_extra?: boolean; // Indicates if this is an extra payment
  partial_month?: string; // YYYY-MM-01 format for partial month tracking
  
  // Enriched fields from get_payments_enriched_public RPC
  expected_amount_calc?: number; // Expected amount calculated by server
  paid_regular_upto_row?: number; // Paid regular amount up to this row
  remaining_for_month_calc?: number; // Remaining amount for the month calculated by server
  whoCreated?: string;
}

// Contract month progress response from get_contract_month_progress_public RPC
export interface ContractMonthProgress {
  partial_month: string; // YYYY-MM-01 format
  expected: number; // Expected amount for the month
  paid_regular: number; // Regular payments made for the month
  remaining: number; // Remaining amount for the month
  is_complete: boolean; // Whether the month is complete
}

export interface User {
  id: string;
  username?: string;
  full_name: string;
  password: string; // Store the user's password
  role: 'superadmin' | 'admin' | 'user';
  permissions: UserPermission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
}

export interface UserPermission {
  page: string;
  actions: ('read' | 'create' | 'edit' | 'delete')[];
}

export interface RolePermission {
  role: 'superadmin' | 'admin' | 'user';
  defaultPermissions: UserPermission[];
  description: string;
}

export interface NotificationItem {
  id: string;
  customerId: string;
  customerName: string;
  contractId: string;
  vehicleInfo: string;
  dueDate: Date;
  amount: number;
  type: 'due_today' | 'overdue' | 'upcoming';
  daysOverdue?: number;
}


