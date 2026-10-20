/**
 * Shared domain models, types, and constants for Web Manager Monorepo
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  SHIPPED = 'SHIPPED',
  CANCELLED = 'CANCELLED',
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Vendor {
  id: string | number;
  user_id: string | number;
  company_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface Product {
  id: string;
  vendor_id?: string | number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  stock: number;
  low_stock_threshold: number;
  image_url?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: OrderStatus;
  customer_email?: string;
  shipping_address?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  items?: OrderItem[];
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  ip_address?: string;
  details?: Record<string, unknown> | string;
  created_at?: string | Date;
}

export const MONOREPO_INFO = {
  name: 'web-manager-monorepo',
  apps: ['apps/api', 'apps/web-astro', 'apps/admin-nuxt', 'apps/web-multivendor'],
  packages: ['packages/shared'],
};
