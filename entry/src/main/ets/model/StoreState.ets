import { Product, CartItem, MockOrder } from './Product';
import { MOCK_PRODUCTS } from '../data/MockProducts';

@Observed
export class StoreState {
  products: Product[] = MOCK_PRODUCTS;
  cart: CartItem[] = [];
  favorites: string[] = [];
  orders: MockOrder[] = [];
  username: string = '';
  loggedIn: boolean = false;
  receiver: string = '';
  phone: string = '';
  address: string = '';
  directBuy: CartItem | undefined = undefined;

  login(name: string): void {
    this.username = name;
    this.loggedIn = true;
  }

  logout(): void {
    this.username = '';
    this.loggedIn = false;
    this.cart = [];
    this.favorites = [];
    this.orders = [];
    this.receiver = '';
    this.phone = '';
    this.address = '';
    this.directBuy = undefined;
  }

  findProduct(id: string): Product | undefined {
    return this.products.find((item: Product) => item.id === id);
  }

  toggleFavorite(id: string): void {
    if (!this.findProduct(id)) { return; }
    this.favorites = this.favorites.includes(id)
      ? this.favorites.filter((item: string) => item !== id)
      : this.favorites.concat(id);
  }

  cartCount(): number {
    return this.cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  }

  total(): number {
    return this.cart.reduce((sum: number, item: CartItem) => {
      const product: Product | undefined = this.findProduct(item.productId);
      return sum + (product ? Math.round(product.price * 100) * item.quantity : 0);
    }, 0) / 100;
  }

  addCart(id: string, size: string, quantity: number): boolean {
    const product: Product | undefined = this.findProduct(id);
    if (!product || quantity < 1 || !Number.isInteger(quantity) || !this.loggedIn) { return false; }
    if (product.sizes.length > 0 && !product.sizes.includes(size)) { return false; }
    const existing: number = this.cart.filter((item: CartItem) => item.productId === id)
      .reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
    if (existing + quantity > product.stock) { return false; }
    const found: boolean = this.cart.some((item: CartItem) => item.productId === id && item.size === size);
    if (found) {
      this.cart = this.cart.map((item: CartItem): CartItem => {
        return { productId: item.productId, size: item.size,
          quantity: item.quantity + (item.productId === id && item.size === size ? quantity : 0) };
      });
    } else {
      this.cart = this.cart.concat({ productId: id, size: size, quantity: quantity });
    }
    return true;
  }

  changeQuantity(id: string, size: string, delta: number): void {
    const item: CartItem | undefined = this.cart.find((line: CartItem) => line.productId === id && line.size === size);
    if (!item) { return; }
    if (delta > 0) { this.addCart(id, size, delta); return; }
    if (item.quantity + delta < 1) { return; }
    this.cart = this.cart.map((line: CartItem): CartItem => {
      return { productId: line.productId, size: line.size,
        quantity: line.quantity + (line.productId === id && line.size === size ? delta : 0) };
    });
  }

  removeCart(id: string, size: string): void {
    this.cart = this.cart.filter((item: CartItem) => item.productId !== id || item.size !== size);
  }

  prepareBuy(id: string, size: string, quantity: number): boolean {
    const product: Product | undefined = this.findProduct(id);
    if (!this.loggedIn || !product || quantity < 1 || !Number.isInteger(quantity) || quantity > product.stock) { return false; }
    if (product.sizes.length > 0 && !product.sizes.includes(size)) { return false; }
    this.directBuy = { productId: id, size: size, quantity: quantity };
    return true;
  }

  checkoutItems(): CartItem[] {
    return this.directBuy ? [this.directBuy] : this.cart;
  }

  checkoutCount(): number {
    return this.checkoutItems().reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  }

  checkoutTotal(): number {
    return this.checkoutItems().reduce((sum: number, item: CartItem) => {
      const product: Product | undefined = this.findProduct(item.productId);
      return sum + (product ? Math.round(product.price * 100) * item.quantity : 0);
    }, 0) / 100;
  }

  checkout(): boolean {
    const lines: CartItem[] = this.checkoutItems();
    if (!this.loggedIn || lines.length === 0 || this.address.length === 0) { return false; }
    for (const item of lines) {
      const product: Product | undefined = this.findProduct(item.productId);
      const required: number = lines.filter((line: CartItem) => line.productId === item.productId)
        .reduce((sum: number, line: CartItem) => sum + line.quantity, 0);
      if (!product || product.stock < required || item.quantity < 1 || !Number.isInteger(item.quantity)) { return false; }
    }
    const order: MockOrder = {
      id: Date.now().toString() + '-' + (this.orders.length + 1), total: this.checkoutTotal(), count: this.checkoutCount(), status: '待收货'
    };
    this.orders = [order].concat(this.orders);
    if (this.directBuy) { this.directBuy = undefined; } else { this.cart = []; }
    return true;
  }
}
