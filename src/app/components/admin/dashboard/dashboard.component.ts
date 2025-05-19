import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../services/order.service';
import { ApiResponse } from '../../../responses/api.response';
import { OrderResponse } from '../../../responses/order/order.response';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class DashboardComponent implements AfterViewInit, OnInit {
  selectedChartType: 'line' | 'bar' = 'line';
  private orderService = inject(OrderService);
  orders: OrderResponse[] = [];
  filteredOrders: OrderResponse[] = [];

  showFilterSidebar = false;

  summary = [
    { label: 'Tổng đơn hàng', value: 0, bgClass: 'bg-primary' },
    { label: 'Đã giao', value: 0, bgClass: 'bg-success' },
    { label: 'Đang xử lý', value: 0, bgClass: 'bg-info' },
    { label: 'Đã huỷ', value: 0, bgClass: 'bg-danger' }
  ];

  statusData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    counts: [0, 0, 0, 0, 0],
  };

  selectedStatus: string = '';
  filterMonth: string = ''; // '1' đến '12'
  filterYear: string = ''; // '2023', '2024', ...

  months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);
  years: number[] = [];

  private chartInstance: Chart | null = null;

  ngOnInit(): void {
    this.initYears();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  initYears() {
    const currentYear = new Date().getFullYear();
    for(let y = currentYear; y >= currentYear - 5; y--) {
      this.years.push(y);
    }
  }



  loadDashboardData(): void {
    this.orderService.getAllOrdersDashBoard().subscribe({
      next: (res: ApiResponse) => {
        this.orders = res.data as OrderResponse[];
        this.applyFilters();
      },
      error: (err) => {
        console.error('Lỗi khi load dữ liệu dashboard:', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      // Kiểm tra trạng thái
      const statusMatch = this.selectedStatus ? order.status.toLowerCase() === this.selectedStatus.toLowerCase() : true;

      // Lấy ngày đặt đơn hàng
      let orderDate: Date;
      if (typeof order.order_date === 'string' || order.order_date instanceof String) {
        orderDate = new Date(order.order_date);
      } else if (Array.isArray(order.order_date)) {
        orderDate = new Date(order.order_date[0], order.order_date[1] - 1, order.order_date[2]);
      } else {
        orderDate = new Date(); // fallback
      }

      // Kiểm tra tháng
      const monthMatch = this.filterMonth ? (orderDate.getMonth() + 1) === +this.filterMonth : true;
      // Kiểm tra năm
      const yearMatch = this.filterYear ? orderDate.getFullYear() === +this.filterYear : true;

      return statusMatch && monthMatch && yearMatch;
    });

    this.updateSummary();
    this.updateChart();
  }

  updateSummary() {
    const statusLabels = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const counts = Array(statusLabels.length).fill(0);

    for (const order of this.filteredOrders) {
      const idx = statusLabels.indexOf(order.status.toLowerCase());
      if (idx !== -1) {
        counts[idx]++;
      }
    }

    this.summary = [
      { label: 'Tổng đơn hàng', value: this.filteredOrders.length, bgClass: 'bg-primary' },
      { label: 'Đã giao', value: counts[statusLabels.indexOf('delivered')], bgClass: 'bg-success' },
      { label: 'Đang xử lý', value: counts[statusLabels.indexOf('processing')], bgClass: 'bg-info' },
      { label: 'Đã huỷ', value: counts[statusLabels.indexOf('cancelled')], bgClass: 'bg-danger' }
    ];

    this.statusData.counts = counts;
  }

  createLineChart() {
    const ctx = document.getElementById('orderStatusChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.statusData.labels,
        datasets: [
          {
            label: 'Số lượng đơn hàng',
            data: this.statusData.counts,
            borderColor: 'blue',
            backgroundColor: 'rgba(0, 0, 255, 0.2)',
            fill: false,
            tension: 0.3,
            yAxisID: 'y',
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Số lượng đơn'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Thống kê đơn hàng theo trạng thái'
          }
        }
      }
    });
  }

  updateChart(): void {
    if (this.chartInstance) {
      this.chartInstance.data.datasets[0].data = this.statusData.counts;
      this.chartInstance.update();
    }
  }
  createChart(): void {
  const ctx = document.getElementById('orderStatusChart') as HTMLCanvasElement;
  if (!ctx) return;

  // Huỷ chart cũ nếu đã tồn tại
  if (this.chartInstance) {
    this.chartInstance.destroy();
  }

  this.chartInstance = new Chart(ctx, {
    type: this.selectedChartType,
    data: {
      labels: this.statusData.labels,
      datasets: [
        {
          label: 'Số lượng đơn hàng',
          data: this.statusData.counts,
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.4)',
          fill: this.selectedChartType === 'line' ? false : true,
          tension: 0.3,
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Số lượng đơn'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Thống kê đơn hàng theo trạng thái'
        }
      }
    }
  });
}
updateChartType(): void {
  this.createChart();
}

}
