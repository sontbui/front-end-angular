import { Component, OnInit } from '@angular/core';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { TokenService } from '../../services/token.service';
import { environment } from '../../../environments/environment';
import { OrderDTO } from '../../dtos/order/order.dto';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Order } from '../../models/order';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { CouponService } from '../../services/coupon.service';
import { ApiResponse } from '../../responses/api.response';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class OrderComponent implements OnInit {
  private couponService = inject(CouponService);
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private tokenService = inject(TokenService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);

  orderForm: FormGroup;
  cartItems: { product: Product, quantity: number }[] = [];
  totalAmount: number = 0;
  couponDiscount: number = 0;
  couponApplied: boolean = false;
  cart: Map<number, number> = new Map();
  orderData: OrderDTO = {
    user_id: 0,
    fullname: '',
    email: '',
    phone_number: '',
    address: '',
    status: 'pending',
    note: '',
    total_money: 0,
    payment_method: 'cod',
    shipping_method: 'express',
    coupon_code: '',
    cart_items: []
  };

  constructor() {
    this.orderForm = this.formBuilder.group({
      fullname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      phone_number: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(11), Validators.pattern("^[0-9]+$")]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      note: [''],
      couponCode: [''],
      shipping_method: ['express'],
      payment_method: ['cod']
    });
  }

  ngOnInit(): void {
    this.orderData.user_id = this.tokenService.getUserId();
    this.cart = this.cartService.getCart();
    const productIds = Array.from(this.cart.keys());

    if (productIds.length === 0) {
      return;
    }
    this.productService.getProductsByIds(productIds).subscribe({
      next: (apiResponse: ApiResponse) => {
        const products: Product[] = apiResponse.data;
        this.cartItems = productIds.map((productId) => {
          const product = products.find((p) => p.id === productId);
          if (product) {
            product.thumbnail = `${environment.apiBaseUrl}/products/images/${product.thumbnail}`;
          }
          return {
            product: product!,
            quantity: this.cart.get(productId)!
          };
        });
      },
      complete: () => {
        this.calculateTotal();
      },
      error: (error: HttpErrorResponse) => {
        console.error(error?.error?.message ?? '');
      }
    });
  }

  isFormValid(): boolean {
    const fieldsToCheck = ['fullname', 'email', 'phone_number', 'address'];
    return fieldsToCheck.every(fieldName => {
      const field = this.orderForm.get(fieldName);
      return field && field.valid;
    });
  }

  placeOrder() {
    if (this.orderForm.errors == null && this.isFormValid()) {
      this.calculateTotal();
      this.orderData = {
        ...this.orderData,
        ...this.orderForm.value,
        total_money: this.totalAmount,
      };
      this.orderData.cart_items = this.cartItems.map(cartItem => ({
        product_id: cartItem.product.id,
        quantity: cartItem.quantity
      }));

      if (!this.totalAmount || this.totalAmount <= 0) {
        console.error('Invalid total money:', this.totalAmount);
        alert('Invalid total money! Please check your cart.');
        return;
      }

      // Check if VNPay is selected
      if (this.orderForm.get('payment_method')?.value === 'vnpay') {
        // Save order data temporarily and initiate VNPay payment
        this.orderService.placeOrder(this.orderData).subscribe({
          next: (response: ApiResponse) => {
            const pendingOrderId = response.data.pendingOrderId; // Assume backend returns a pending order ID
            this.initiateVNPayPayment(pendingOrderId);
            this.cartService.clearCart();
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error saving pending order:', error?.error?.message ?? '');
            alert('Error initiating VNPay payment. Please try again.');
          }
        });
      } else {
        // Original order creation logic for non-VNPay methods
        this.orderService.placeOrder(this.orderData).subscribe({
          next: (response: ApiResponse) => {
            console.log('Order successfully');
            alert('Order successfully');
            this.cartService.clearCart();
            this.router.navigate(['/']);
          },
          complete: () => {
            this.calculateTotal();
          },
          error: (error: HttpErrorResponse) => {
            console.error(`Error: ${error?.error?.message ?? ''}`);
            alert('Lost information. Please check information again !!!');
          },
        });
      }
    } else {
      console.error('Form is invalid');
      alert('Please fill in all required fields correctly.');
    }
  }

  initiateVNPayPayment(pendingOrderId: number) {
    const amount = this.totalAmount;
    const vnpayApiUrl = `${environment.apiBaseUrl}/payment/createURL/${amount}?pendingOrderId=${pendingOrderId}`;

    this.http.get(vnpayApiUrl).subscribe({
      next: (response: any) => {
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        } else {
          console.error('No payment URL returned');
          alert('Failed to initiate VNPay payment. Please try again.');
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('VNPay API error:', error?.error?.message ?? '');
        alert('Error initiating VNPay payment. Please try again.');
      }
    });
  }

  decreaseQuantity(index: number): void {
    if (this.cartItems[index].quantity > 1) {
      this.cartItems[index].quantity--;
      this.updateCartFromCartItems();
      this.calculateTotal();
    }
  }

  increaseQuantity(index: number): void {
    this.cartItems[index].quantity++;
    this.updateCartFromCartItems();
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.totalAmount = this.cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
    if (!this.totalAmount || this.totalAmount <= 0) {
      this.totalAmount = 0;
      console.error('Invalid total money:', this.totalAmount);
      alert('Invalid total money! Please check your cart.');
      return;
    }
  }

  confirmDelete(index: number): void {
    if (confirm('Do you want to remove this?')) {
      this.cartItems.splice(index, 1);
      this.updateCartFromCartItems();
      this.calculateTotal();
    }
  }

  applyCoupon(): void {
    const couponCode = this.orderForm.get('couponCode')!.value;
    if (!this.couponApplied && couponCode) {
      this.calculateTotal();
      this.couponService.calculateCouponValue(couponCode, this.totalAmount)
        .subscribe({
          next: (apiResponse: ApiResponse) => {
            this.totalAmount = apiResponse.data;
            this.couponApplied = true;
          }
        });
    }
  }

  private updateCartFromCartItems(): void {
    this.cart.clear();
    this.cartItems.forEach((item) => {
      this.cart.set(item.product.id, item.quantity);
    });
    this.cartService.setCart(this.cart);
  }
}