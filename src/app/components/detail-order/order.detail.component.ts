import { Component, OnInit, Inject } from '@angular/core';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { OrderDTO } from '../../dtos/order/order.dto';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderResponse } from '../../responses/order/order.response';
import { environment } from '../../../environments/environment';
import { OrderDetail } from '../../models/order.detail';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ApiResponse } from '../../responses/api.response';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { OrderResponse1 } from '../../responses/order/order_response';


@Component({
  selector: 'app-order-detail',
  templateUrl: './order.detail.component.html',
  styleUrls: ['./order.detail.component.scss'],
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule
  ]
})
export class OrderDetailComponent implements OnInit {
  orders: OrderResponse1[] = [];
  selectedOrder: OrderResponse1 | null = null;
  userId: number; 
  localStorage?: Storage;
  urlImg: string;
  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: Document,
    private router: Router,
  ) {
    this.localStorage = document.defaultView?.localStorage;

  }

  ngOnInit(): void {
    this.urlImg = environment.apiBaseUrl + '/products/images/';
    const userJson = this.localStorage?.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      this.userId = user.id;
      console.log('User ID:', this.userId);
  
    } else {
      this.router.navigate(['/login']);

    }
    this.loadOrdersByUserId(this.userId);
  }

  loadOrdersByUserId(userId: number): void {
    this.http.get<OrderResponse1[]>(`${environment.apiBaseUrl}/payment/orders/${userId}`).subscribe({
      next: (orders: OrderResponse1[]) => {
        this.orders = orders.map(order => ({
          ...order,
          orderDate: order.orderDate ? [order.orderDate[0], order.orderDate[1], order.orderDate[2]] : [],
          shippingDate: order.shippingDate ? [order.shippingDate[0], order.shippingDate[1], order.shippingDate[2]] : [],
          orderDetails: order.orderDetails.map(detail => ({
            ...detail,
            thumbnail: detail.thumbnail // giữ nguyên để HTML dùng đúng
          }))
        }));
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching orders:', error?.error?.message ?? error.message);
      }
    });
  }
  trackByOrder(index: number, order: OrderResponse): number {
    return order.id;
  }
  trackByFn(index: number, item: OrderDetail): number {
    return item.product.id;
  }
  showOrderDetails(orderId: number): void {
    const foundOrder = this.orders.find((order: OrderResponse1) => order.id === orderId);
    this.selectedOrder = foundOrder || null;
    console.log(this.selectedOrder);
  }
  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'processing':
        return 'Đang xử lý';
      case 'shipped':
        return 'Đã gửi hàng';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã huỷ';
      default:
        return 'Không xác định';
    }
  }
  
}