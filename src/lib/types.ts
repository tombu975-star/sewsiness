export type Role =
  | "super_admin"
  | "system_admin"
  | "owner"
  | "manager"
  | "staff"
  | "apprentice"
  | "freelancer"
  | "trainer";

export interface Profile {
  id: string;
  organization_id: string | null;
  branch_id: string | null;
  full_name: string;
  role: Role;
  avatar_url: string | null;
}

export interface Organization {
  id: string;
  name: string;
  region: string | null;
  plan: string;
  status: "Active" | "Paused";
  logo_url: string | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  ghana_card_number: string | null;
  ghana_card_front_path: string | null;
  ghana_card_back_path: string | null;
  selfie_path: string | null;
  verification_submitted_at: string | null;
  verification_reviewed_at: string | null;
  verification_reviewed_by: string | null;
  verification_rejection_reason: string | null;
  created_at: string;
}

export interface AdvisoryNote {
  id: string;
  organization_id: string;
  author_id: string;
  message: string;
  created_at: string;
  seen_at: string | null;
}

// Shape returned by the get_business_directory() RPC — operational
// signals only, deliberately no revenue/invoice/customer fields.
export interface BusinessDirectoryRow {
  organization_id: string;
  organization_name: string;
  region: string | null;
  plan: string;
  status: "Active" | "Paused";
  enrolled_at: string;
  owner_name: string | null;
  total_users: number;
  orders_total: number;
  orders_in_progress: number;
  orders_overdue: number;
  qc_checks_run: number;
  qc_pass_rate: number | null;
  health_score: number;
}

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  city: string | null;
}

export type CustomerStatus = "Active" | "New" | "Overdue" | "Inactive";

export interface Customer {
  id: string;
  organization_id: string;
  branch_id: string | null;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  gender: string | null;
  notes: string | null;
  status: CustomerStatus;
  created_at: string;
}

export type OrderStatus =
  | "Pending"
  | "In Progress"
  | "Review"
  | "Completed"
  | "Overdue"
  | "Cancelled";

export interface CustomOrder {
  id: string;
  order_number: string;
  organization_id: string;
  branch_id: string | null;
  customer_id: string;
  garment: string;
  due_date: string | null;
  total_amount: number;
  amount_paid: number;
  status: OrderStatus;
  priority: "Low" | "Normal" | "High";
  created_at: string;
}

export type ProductStatus = "Active" | "Low Stock" | "Out of Stock" | "Draft";

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  category: string | null;
  sku: string | null;
  selling_price: number;
  cost_price: number | null;
  stock_qty: number;
  status: ProductStatus;
  created_at: string;
}

export type PaymentMethod = "Cash" | "Mobile Money" | "Bank Transfer" | "Card";
export type PaymentType = "Deposit" | "Balance" | "Full" | "Refund" | "Sale";

export interface Payment {
  id: string;
  organization_id: string;
  branch_id: string | null;
  customer_id: string | null;
  order_id: string | null;
  pos_sale_id: string | null;
  amount: number;
  method: PaymentMethod;
  type: PaymentType;
  notes: string | null;
  created_at: string;
}

export interface PosSale {
  id: string;
  sale_number: string;
  organization_id: string;
  branch_id: string | null;
  customer_id: string | null;
  cashier_id: string;
  subtotal: number;
  total: number;
  status: "Completed" | "Refunded" | "Void";
  created_at: string;
}

export interface PosSaleItem {
  id: string;
  pos_sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}
