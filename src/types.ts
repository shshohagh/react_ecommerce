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
  attributes?: string; // JSON string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  estimated_delivery?: string;
  created_at: string;
  history?: OrderHistory[];
}

export interface User {
  id: string;
  name: string;
  email: string;
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

export interface AuthResponse {
  token: string;
  user: User;
}
