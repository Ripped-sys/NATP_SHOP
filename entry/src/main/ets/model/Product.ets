export interface Product {
  id: string;
  name: string;
  englishName: string;
  price: number;
  originalPrice: number;
  image: ResourceStr;
  category: string;
  description: string;
  englishDescription?: string;
  sizes: string[];
  stock: number;
  isLimited: boolean;
  isNew: boolean;
}
export interface CartItem {
  productId: string;
  size: string;
  quantity: number;
}
export interface MockOrder {
  id: string;
  total: number;
  count: number;
  status: string;
}
