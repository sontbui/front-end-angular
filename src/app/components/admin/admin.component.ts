import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { UserResponse } from '../../responses/user/user.response';
import { TokenService } from '../../services/token.service';
import {RouterModule} from "@angular/router";
import { adminRoutes } from './admin-routes';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: [
    './admin.component.scss',        
  ],  
  standalone: true,
  imports: [       
    CommonModule,    
    RouterModule,
    //FormsModule
  ],
  
  
})
export class AdminComponent implements OnInit {
  //adminComponent: string = 'orders';
  userResponse?:UserResponse | null;
  lastName: string = '';
  firstName: string = '';
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
    
  ngOnInit() {
    this.userResponse = this.userService.getUserResponseFromLocalStorage();    
    // Default router
    if (this.userResponse?.fullname) {
      const names = this.userResponse.fullname.split(' ');
      this.lastName = names[names.length - 1];  // Họ
      this.firstName = names.slice(0, names.length - 1).join(' ');  // Tên
    }

    if (this.router.url === '/admin') {
      this.router.navigate(['/admin/orders']);
    }
   }  
  logout() {
    this.userService.removeUserFromLocalStorage();
    this.tokenService.removeToken();
    this.userResponse = this.userService.getUserResponseFromLocalStorage();    
    alert("Đăng xuất thành công");
    this.router.navigate(['/']);
  }
  showAdminComponent(componentName: string): void {
    debugger
    if (componentName === 'orders') {
      this.router.navigate(['/admin/orders']);
    } else if (componentName === 'categories') {
      this.router.navigate(['/admin/categories']);
    } else if (componentName === 'products') {
      this.router.navigate(['/admin/products']);
    } else if (componentName === 'users') {
      this.router.navigate(['/admin/users']);
    } else if (componentName === 'chat-admin') {
      this.router.navigate(['/admin/chat-admin']);
    }
  }
}


/**
 npm install --save font-awesome
 angular.json:
 "styles": [   
    "node_modules/font-awesome/css/font-awesome.min.css"
],
 */