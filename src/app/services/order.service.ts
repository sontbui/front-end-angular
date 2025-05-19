import { ProductService } from './product.service';
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderDTO } from '../dtos/order/order.dto';
import { OrderResponse } from '../responses/order/order.response';
import { ApiResponse } from '../responses/api.response';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private apiUrl = `${environment.apiBaseUrl}/orders`;
  private apiGetAllOrders = `${environment.apiBaseUrl}/orders/get-orders-by-keyword?`;
  private apiGetAllOrdersDashBoard = `${environment.apiBaseUrl}/orders/all`;

  constructor(private http: HttpClient) { }

  placeOrder(orderData: OrderDTO): Observable<ApiResponse> {
    // Gửi yêu cầu đặt hàng
    return this.http.post<ApiResponse>(this.apiUrl, orderData);
  }
  getOrderById(orderId: number): Observable<ApiResponse> {
    debugger
    const url = `${environment.apiBaseUrl}/orders/${orderId}`;
    return this.http.get<ApiResponse>(url);
  }
  // getAllOrders(keyword:string,
  //   page: number, limit: number
  // ): Observable<ApiResponse> {
  //     let params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('limit', limit.toString())
  //     ;  
  //     if (keyword !== null && keyword !== undefined && keyword !== '') {
  //       params = params.set('keyword', keyword);
  //     }
  //     console.error("Order service URL:", this.apiGetAllOrders, params.toString());
  //     return this.http.get<ApiResponse>(this.apiGetAllOrders, { params });

  // }
  getAllOrders(keyword: string, page: number, limit: number) {
    let params = new HttpParams()
      .set('page', page.toString())  // Không có khoảng trắng trước 'page'
      .set('limit', limit.toString());

    // Chỉ thiết lập tham số 'keyword' nếu có giá trị được truyền vào
    if (keyword !== null && keyword !== undefined && keyword.trim() !== '') {
      params = params.set('keyword', keyword.trim()); // Cắt bỏ khoảng trắng ở đầu và cuối chuỗi
    }

    return this.http.get<ApiResponse>(this.apiGetAllOrders, { params });
  }

  getAllOrdersDashBoard() {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJwaG9uZU51bWJlciI6IjEyMzQiLCJ1c2VySWQiOjE5LCJzdWIiOiIxMjM0IiwiZXhwIjoxNzUwMDg2ODA1fQ.DtVILFTo2tkQSq8fEq4OGqSn3kJdZuzMqax9bspXDVs';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    // Gọi API để lấy danh sách đơn hàng
    return this.http.get<ApiResponse>('http://localhost:8088/api/v1/orders/all', { headers });
  }



  updateOrder(orderId: number, orderData: OrderDTO): Observable<ApiResponse> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`;
    return this.http.put<ApiResponse>(url, orderData);
  }
  deleteOrder(orderId: number): Observable<ApiResponse> {
    const url = `${environment.apiBaseUrl}/orders/${orderId}`;
    return this.http.delete<ApiResponse>(url);
  }
}
