export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  is_featured: boolean;
}

export interface Order {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  product_id: number;
  product_name?: string;
  product_price?: number;
  status: 'pending' | 'confirmed' | 'delivered';
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
