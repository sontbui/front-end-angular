export interface OrderResponse1 {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    address: string;
    note: string;
    orderDate: number[]; // [year, month, day]
    status: string;
    totalMoney: number;
    shippingMethod: string;
    shippingAddress: string | null;
    shippingDate: number[]; // [year, month, day]
    trackingNumber: string | null;
    paymentMethod: string;
    active: boolean;
    orderDetails: OrderDetail1[];
  }
  
  export interface OrderDetail1 {
    id: number;
    productId: number;
    productName: string;
    thumbnail: string;
    price: number;
    numberOfProducts: number;
    totalMoney: number | null;
    color: string | null;
  }