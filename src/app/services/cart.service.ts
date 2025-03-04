import { Injectable, Inject } from '@angular/core';
import { Product } from '../models/product';
import { CommonModule, DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class CartService {
  private cart: Map<number, number> = new Map<number, number>();
  localStorage?:Storage;

  private cartItemCount = new BehaviorSubject<number>(0);
  cartItemCount$ = this.cartItemCount.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.localStorage = document.defaultView?.localStorage;          
    this.refreshCart()
  }

  private updateCartCount(): void {
    const totalCount = Array.from(this.cart.values()).reduce((acc, value) => acc + value, 0);
    this.cartItemCount.next(totalCount);
  }
  getCartItemCount(): number{
    return Array.from(this.cart.values()).reduce((acc, value) => acc + value, 0);
  }
  public  refreshCart(){
    const storedCart = this.localStorage?.getItem(this.getCartKey());
    if (storedCart) {
      this.cart = new Map(JSON.parse(storedCart));      
    } else {
      this.cart = new Map<number, number>();
    }
    this.updateCartCount();
  }
  private getCartKey():string {    
    const userResponseJSON = this.localStorage?.getItem('user'); 
    const userResponse = JSON.parse(userResponseJSON!);  
    debugger
    return `cart:${userResponse?.id ?? ''}`;

  }

  addToCart(productId: number, quantity: number = 1): void {
    debugger
    if (this.cart.has(productId)) {
      this.cart.set(productId, this.cart.get(productId)! + quantity);
    } else {
      this.cart.set(productId, quantity);
    }
    this.saveCartToLocalStorage();
    this.updateCartCount();
  }
  
  getCart(): Map<number, number> {
    return this.cart;
  }
  private saveCartToLocalStorage(): void {
    debugger
    this.localStorage?.setItem(this.getCartKey(), JSON.stringify(Array.from(this.cart.entries())));
  }  
  setCart(cart : Map<number, number>) {
    this.cart = cart ?? new Map<number, number>();
    this.saveCartToLocalStorage();
  }
  clearCart(): void {
    this.cart.clear(); 
    this.saveCartToLocalStorage(); 
    this.updateCartCount();
  }
}
