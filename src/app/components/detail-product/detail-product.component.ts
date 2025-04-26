import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';
import { ProductImage } from '../../models/product.image';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiResponse } from '../../responses/api.response';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-detail-product',
  templateUrl: './detail-product.component.html',
  styleUrls: ['./detail-product.component.scss'],
  standalone: true,
  imports: [
    FooterComponent,
    HeaderComponent,
    CommonModule,
    NgbModule
  ]
})

export class DetailProductComponent implements OnInit {
  product?: Product;
  discount: number = 10;
  productId: number = 0;
  currentImageIndex: number = 0;
  quantity: number = 1;
  isPressedAddToCart: boolean = false;
  showAlert: boolean = false;
  hiddenButton: boolean = false;
  productAfter: number = 0;
  showCompareDialog: boolean = false;
  productsToCompare: Product[] = [];
  selectedCompareProduct?: Product;
  urlImg: string;
  constructor(
    private productService: ProductService,
    private cartService: CartService,
    // private categoryService: CategoryService,
    // private router: Router,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {

  }
  ngOnInit() {
    this.urlImg = environment.apiBaseUrl + '/products/images/';

    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam !== null) {
      this.productId = +idParam;
    }
    if (!isNaN(this.productId)) {
      this.loadProductDetails();
      this.loadProductsToCompare();
    } else {
      console.error('Invalid productId:', idParam);
    }
  }

  loadProductDetails() {
    this.productService.getDetailProduct(this.productId).subscribe({
      next: (apiResponse: ApiResponse) => {
        const response = apiResponse.data;
        if (response.product_images && response.product_images.length > 0) {
          response.product_images.forEach((product_image: ProductImage) => {
            if (!product_image.isImageUrlUpdated) {
              product_image.image_url = `${environment.apiBaseUrl}/products/images/${product_image.image_url}`;
              product_image.isImageUrlUpdated = true;
            }
          });
        }
        this.product = response;
        this.productAfter = response.price * 0.95;
        this.showImage(0);
      },
      error: (error: HttpErrorResponse) => {
        console.error(error?.error?.message ?? '');
      }
    });
  }

  loadProductsToCompare() {
    this.productService.getProducts('', 0, 0, 100).subscribe({
      next: (apiResponse: ApiResponse) => {
        this.productsToCompare = apiResponse.data.products.filter(
          (p: Product) => p.id !== this.productId
        );
      },
      error: (error: HttpErrorResponse) => {
        console.error(error?.error?.message ?? '');
      }
    });
  }

  openCompareDialog() {
    if (!this.product) return;

    // Lọc sản phẩm cùng loại (cùng category_id)
    this.productsToCompare = this.productsToCompare.filter(p => p.category_id === this.product?.category_id);
    if (this.productsToCompare.length === 0) {
      alert('Không có sản phẩm nào cùng loại để so sánh.');
      return;
    }
    this.selectedCompareProduct = undefined;
    this.showCompareDialog = true;
  }


  closeCompareDialog() {
    this.showCompareDialog = false;
    this.selectedCompareProduct = undefined;
  }

  selectProductToCompare(product: Product) {
    this.selectedCompareProduct = product;
    if (this.selectedCompareProduct.product_images) {
      this.selectedCompareProduct.product_images.forEach((image: ProductImage) => {
        if (!image.isImageUrlUpdated) {
          image.image_url = `${environment.apiBaseUrl}/products/images/${image.image_url}`;
          image.isImageUrlUpdated = true;
        }
      });
    }
  }
  showImage(index: number): void {
    debugger
    if (this.product && this.product.product_images &&
      this.product.product_images.length > 0) {
      if (index < 0) {
        index = 0;
      } else if (index >= this.product.product_images.length) {
        index = this.product.product_images.length - 1;
      }
      this.currentImageIndex = index;
    }
  }
  thumbnailClick(index: number) {
    debugger

    this.currentImageIndex = index;
  }
  nextImage(): void {
    debugger
    this.showImage(this.currentImageIndex + 1);
  }

  previousImage(): void {
    debugger
    this.showImage(this.currentImageIndex - 1);
  }
  addToCart(): void {
    debugger
    this.isPressedAddToCart = true;
    if (this.product) {
      this.cartService.addToCart(this.product.id, this.quantity);
    } else {
      console.error('Can not add prdc to cart. Cause prdc is null.');
    }
  }

  increaseQuantity(): void {
    debugger
    this.quantity++;
    this.showAlert = false;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.showAlert = false;
    }
  }
  updateQuantity(event: any) {

    const inputValue = parseInt(event.target.value);
    if (!isNaN(inputValue) && inputValue != 0) {
      this.quantity = inputValue;
      this.showAlert = false;
    }
    if (inputValue === 0) {
      this.showAlert = true;
      this.quantity = 0;
      this.hiddenButton = false;
    }
  }
  getTotalPrice(): number {
    if (this.product) {
      return (this.product.price * 0.95) * this.quantity;
    }
    return 0;
  }
  buyNow(): void {
    if (this.isPressedAddToCart == false) {
      this.addToCart();
    }
    this.router.navigate(['/orders']);
  }
  onProductClick(productId: number) {

    window.location.href = '/products/' + productId
  }
}