export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  brand: string;
  is_featured: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface OrderHistory {
  id: number;
  order_id: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  description?: string;
  created_at: string;
}

export interface Order {
  id: number;
  customer_name: string;
  email?: string;
  phone: string;
  address: string;
  product_id: number;
  product_name?: string;
  product_price?: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  estimated_delivery?: string;
  created_at: string;
  history?: OrderHistory[];
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Review {
  id: number;
  product_id: number;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
