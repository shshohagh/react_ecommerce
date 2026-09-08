export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  brand: string;
  attributes?: string; // JSON string
  is_featured: boolean;
  stock?: number;
  stock_status?: 'in_stock' | 'out_of_stock' | 'on_backorder';
  in_stock?: boolean;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  attributes: string; // JSON string
  quantity: number;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Attribute {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  created_at: string;
}

export interface OrderHistory {
  id: string;
  order_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  description?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  email?: string;
  phone: string;
  address: string;
  product_id: string;
  product_name?: string;
  product_price?: number;
  quantity?: number;
  shipping_area?: string;
  total?: number;
  items?: any[];
  attributes?: string; // JSON string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  estimated_delivery?: string;
  created_at: string;
  history?: OrderHistory[];
  device_id?: string;
}

export interface BlockedCustomer {
  id: string;
  phone_number: string;
  reason: string;
  blocked_at: string;
}

export interface BlockedDevice {
  id: string;
  device_id: string;
  reason: string;
  blocked_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface ShippingArea {
  id: string;
  name: string;
  cost: number;
  created_at: string;
}

export interface PriceAlert {
  id?: string;
  email: string;
  product_id: string;
  product_name: string;
  target_price?: number;
  created_at: string;
}

export interface StockNotification {
  id?: string;
  email: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  product_price?: number;
  product_category?: string;
  user_id?: string | null;
  user_name?: string | null;
  selected_attributes?: Record<string, string>;
  status: 'pending' | 'notified' | 'cancelled';
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserAddress {
  id?: string;
  user_id: string;
  full_name: string;
  phone: string;
  street_address: string;
  apartment?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default?: boolean;
  label?: 'Home' | 'Work' | 'Other';
  created_at?: string;
}

export interface UserPreferences {
  user_id: string;
  email_order_updates: boolean;
  email_promotions: boolean;
  email_price_alerts: boolean;
  email_stock_alerts: boolean;
  sms_notifications: boolean;
  updated_at?: string;
}

export interface LiveProductActivity {
  product_id: string;
  in_carts_count: number;
  active_viewers: number;
  last_purchased_minutes_ago?: number;
  remaining_inventory: number;
  updated_at?: string;
}

