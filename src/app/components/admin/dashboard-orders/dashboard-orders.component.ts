import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import Chart from 'chart.js/auto';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { ApiResponse } from '../../../responses/api.response';
import { OrderResponse } from '../../../responses/order/order.response';
import { PLATFORM_ID } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { TokenService } from '../../../services/token.service';

@Component({
  selector: 'app-dashboard-orders',
  templateUrl: './dashboard-orders.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DashboardOrdersComponent implements OnInit, AfterViewInit {
  private orderService = inject(OrderService);
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);

  userOrderCount = 0;
  userTotalIncome = 0;

  loading = false;
  selectedChartType: 'line' | 'bar' = 'line';
  showFilterSidebar = false;
  userMap: { [id: number]: string } = {};

  orders: OrderResponse[] = [];
  filterUser: string = '';
  years: number[] = [];
  users: { id: number, fullname: string }[] = [];
  highestIncomeUser: { id: number, fullname: string, income: number } | null = null;
  top3Users: { id: number, fullname: string, income: number }[] = [];

  filterYear: number | '' = '';


  chart: Chart | null = null;

  ngOnInit() {
    this.loadOrders();
    this.loadUsers();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.createChart([], [], 'Biểu đồ đang tải...');
      });
    }
  }
  loadUsers() {
    this.userService.getUsersWithToken({ page: 0, limit: 1000, keyword: '' }).subscribe({
      next: (apiResponse: ApiResponse) => {
        const users = apiResponse.data.users;
        this.userMap = users.reduce((map: any, user: any) => {
          map[user.id] = user.fullname;
          return map;
        }, {});
        this.extractFilterOptions(); 
      },
      error: (error) => {
        console.error('Lỗi khi tải user:', error);
      }
    });
  }


  loadOrders() {
    this.loading = true;
    this.orderService.getAllOrdersDashBoard().subscribe({
      next: (res: ApiResponse) => {
        this.orders = res.data as OrderResponse[];
        this.extractFilterOptions();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Lỗi khi load dữ liệu:', err);
        this.loading = false;
      }
    });
  }
  extractFilterOptions() {
    const yearSet = new Set<number>();
    const userIdSet = new Set<number>();

    this.orders.forEach(order => {
      const date = this.getOrderDate(order);
      if (date) {
        yearSet.add(date.getFullYear());
      }
      if (order.user_id) {
        userIdSet.add(order.user_id);
      }
    });

    this.years = Array.from(yearSet).sort((a, b) => b - a);

    this.users = Array.from(userIdSet).sort((a, b) => a - b).map(id => ({
      id,
      fullname: this.userMap[id] || `User ${id}`
    }));
  }



  getOrderDate(order: OrderResponse): Date | null {
    if (typeof order.order_date === 'string') {
      return new Date(order.order_date);
    }
    if (Array.isArray(order.order_date)) {
      return new Date(order.order_date[0], order.order_date[1] - 1, order.order_date[2]);
    }
    return null;
  }

  applyFilters() {
  const filterYearNum = this.filterYear !== '' ? Number(this.filterYear) : null;

  // Lọc order theo năm và user
  const filtered = this.orders.filter(order => {
    const date = this.getOrderDate(order);
    if (!date) return false;

    if (filterYearNum && date.getFullYear() !== filterYearNum) return false;
    if (this.filterUser && order.user_id?.toString() !== this.filterUser) return false;

    return true;
  });

  // Tính tổng thu nhập theo user_id
  const incomeByUser: { [id: number]: number } = {};
  filtered.forEach(order => {
    if (order.user_id) {
      incomeByUser[order.user_id] = (incomeByUser[order.user_id] || 0) + (Number(order.total_money) || 0);
    }
  });

  // Nếu lọc user thì tính số đơn và tổng thu nhập riêng
  if (this.filterUser) {
    const userIdNum = Number(this.filterUser);
    this.userOrderCount = filtered.length;
    this.userTotalIncome = incomeByUser[userIdNum] || 0;
    this.top3Users = []; // ẩn bảng xếp hạng
  } else {
    this.userOrderCount = 0;
    this.userTotalIncome = 0;

    // Tính top 3 user nếu không lọc user
    const userIncomeArray = Object.entries(incomeByUser).map(([idStr, income]) => ({
      id: Number(idStr),
      fullname: this.userMap[Number(idStr)] || `Không xác định`,
      income
    }));

    this.top3Users = userIncomeArray.sort((a, b) => b.income - a.income).slice(0, 3);
  }

  // Cập nhật biểu đồ
  if (filterYearNum) {
    const totalByMonth = Array(12).fill(0);
    filtered.forEach(order => {
      const date = this.getOrderDate(order);
      if (!date) return;
      const month = date.getMonth();
      totalByMonth[month] += Number(order.total_money) || 0;
    });

    this.updateChart(
      ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
      totalByMonth,
      `Tổng thu nhập theo tháng - năm ${filterYearNum}`
    );
  } else {
    const incomeByYear: { [year: number]: number } = {};
    filtered.forEach(order => {
      const date = this.getOrderDate(order);
      if (!date) return;
      const year = date.getFullYear();
      incomeByYear[year] = (incomeByYear[year] || 0) + (Number(order.total_money) || 0);
    });

    const sortedYears = Object.keys(incomeByYear).map(Number).sort((a, b) => a - b);
    const data = sortedYears.map(y => incomeByYear[y]);

    this.updateChart(
      sortedYears.map(y => y.toString()),
      data,
      'Tổng thu nhập theo từng năm'
    );
  }
}


  createChart(labels: string[], data: number[], title = '', type: 'line' | 'bar' = 'bar') {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = document.getElementById('incomeMonthChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: type,
      data: {
        labels,
        datasets: [{
          label: 'Tổng thu nhập',
          data,
          backgroundColor: type === 'bar' ? 'rgba(54, 162, 235, 0.7)' : 'transparent',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: false,
          tension: type === 'line' ? 0.4 : 0,
          pointRadius: type === 'line' ? 3 : 0,
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Tổng thu nhập (VNĐ)'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: title
          },
          tooltip: {
            callbacks: {
              label: ctx => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ctx.parsed.y)
            }
          }
        }
      }
    });
  }

  updateChart(labels: string[], data: number[], title: string) {
    if (!this.chart) {
      setTimeout(() => {
        this.createChart(labels, data, title, this.selectedChartType);
      });
      return;
    }

    const currentType = (this.chart.config as any).type;
    if (currentType !== this.selectedChartType) {
      this.chart.destroy();
      setTimeout(() => {
        this.createChart(labels, data, title, this.selectedChartType);
      });
      return;
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.options.plugins!.title!.text = title;
    this.chart.update();
  }
  updateChartType() {
    this.applyFilters();
  }
}
