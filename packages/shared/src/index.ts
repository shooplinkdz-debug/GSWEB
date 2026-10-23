/**
 * Shared domain models, types, and constants for Web Manager Monorepo
 */

declare const process: any;

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  DEVELOPER = 'DEVELOPER',
  CONFIRMATEUR = 'CONFIRMATEUR',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PREPARATION = 'IN_PREPARATION',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  UNCONFIRMED = 'UNCONFIRMED',
  RETURNED = 'RETURNED',
}

export interface User {
  id: string | number;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export type VendorProfile = Vendor;

export interface Vendor {
  id: string | number;
  user_id: string | number;
  company_name: string;
  store_name?: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  phone?: string;
  wilaya?: string;
  rating?: number;
  commission_rate?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'SUSPENDED';
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Product {
  id: string | number;
  vendor_id?: string | number;
  category_id?: number;
  sku?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  image_url?: string;
  is_published?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface OrderItem {
  id: string | number;
  order_id: string | number;
  product_id: string | number;
  vendor_id?: string | number;
  product_name: string;
  quantity: number;
  unit_price: number;
  commission_rate?: number;
  commission_amount?: number;
  vendor_payout?: number;
}

export interface Order {
  id: string | number;
  order_number: string;
  user_id?: string | number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  total_amount: number;
  shipping_fee?: number;
  status: OrderStatus;
  payment_method?: string;
  is_confirmed?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
  items?: OrderItem[];
}

export interface Page {
  id: string | number;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface AuditLog {
  id: string | number;
  user_id?: string | number;
  action: string;
  ip_address?: string;
  details?: Record<string, unknown> | string;
  created_at?: string | Date;
}

export interface DeliveryRate {
  id: string | number;
  wilaya_code: number;
  wilaya_name: string;
  wilaya_name_ar?: string;
  home_fee: number;
  desk_fee: number;
  is_active: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_system?: boolean;
  created_at?: string | Date;
}

export interface Permission {
  id: number;
  code: string;
  module: string;
  action: string;
  name: string;
  description?: string;
}

export interface Subscription {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  plan_name: string;
  start_date: string | Date;
  end_date: string | Date;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED';
  notes?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface FinancialMovement {
  id: number;
  vendor_id: number;
  type: 'BENEFIT' | 'EXPENSE';
  amount: number;
  description: string;
  category: string;
  status: 'PENDING' | 'VALIDATED' | 'CANCELLED';
  receipt_url?: string;
  created_by?: number;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface ProductReview {
  id: number;
  product_id: number;
  product_name?: string;
  user_id: number;
  user_name?: string;
  rating: number;
  comment?: string;
  photos?: string[];
  is_verified_purchase?: boolean;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN';
  created_at?: string | Date;
}

export interface AdBanner {
  id: number;
  title: string;
  image_url: string;
  video_url?: string;
  target_url?: string;
  position: string;
  priority: number;
  is_active: boolean;
  start_date?: string | Date;
  end_date?: string | Date;
  created_at?: string | Date;
}

export interface DeliveryCompany {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  api_key?: string;
  config?: string;
  created_at?: string | Date;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  old_status?: string;
  new_status: string;
  changed_by?: number;
  notes?: string;
  created_at?: string | Date;
}

export interface Notification {
  id: number;
  user_id?: number;
  target_role?: string;
  type: string;
  summary: string;
  link?: string;
  is_read: boolean;
  created_at?: string | Date;
}

export interface PlatformSettings {
  support_email?: string;
  support_phone?: string;
  support_hours?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  twitter_url?: string;
  meta_pixel_id?: string;
  google_analytics_id?: string;
  tiktok_pixel_id?: string;
  [key: string]: string | undefined;
}

export * from './i18n.js';

const getEnvVar = (key: string, fallback: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const PLATFORM_URLS = {
  marketplace: getEnvVar('MARKETPLACE_URL', 'http://localhost:3000'),
  admin: getEnvVar('ADMIN_URL', 'http://localhost:3001'),
  vendor: getEnvVar('VENDOR_URL', 'http://localhost:3002'),
  api: getEnvVar('API_URL', 'http://localhost:4000'),
};

export const MONOREPO_INFO = {
  name: 'web-manager-monorepo',
  apps: ['apps/api', 'apps/web-astro', 'apps/admin-nuxt', 'apps/web-multivendor'],
  packages: ['packages/shared'],
};
