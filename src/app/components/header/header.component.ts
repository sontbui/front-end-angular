import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { UserResponse } from '../../responses/user/user.response';

import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';  

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [    
    CommonModule,
    NgbModule,
    RouterModule
  ]
})
export class HeaderComponent implements OnInit{
  userResponse?:UserResponse | null;
  isPopoverOpen = false;
  activeNavItem: number = 0;
  // cartItemCount: number = 0;
  

  constructor(
    private userService: UserService,       
    private tokenService: TokenService,    
    private router: Router,
  ) {
    
   }
  ngOnInit() {
    this.userResponse = this.userService.getUserResponseFromLocalStorage();  
    
  }
  // const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  // // Đếm số lượng sản phẩm trong giỏ hàng
  // this.cartItemCount = cartItems.length;   

  togglePopover(event: Event): void {
    event.preventDefault();
    this.isPopoverOpen = !this.isPopoverOpen;
  }

  handleItemClick(index: number): void {
    //console.error(`Clicked on "${index}"`);
    if(index === 0) {
      debugger
      this.router.navigate(['/user-profile']);                      
    } else if(index === 1){
      debugger
      this.router.navigate(['/orders/user'], { queryParams: { id: this.userResponse?.id } });
    }
    else if (index === 2) {
      this.userService.removeUserFromLocalStorage();
      this.tokenService.removeToken();
      this.userResponse = this.userService.getUserResponseFromLocalStorage();    
    }
    this.isPopoverOpen = false; // Close the popover after clicking an item    
  }

  
  setActiveNavItem(index: number) {   
    this.activeNavItem = index;      
    //console.error(this.activeNavItem);
  }  
}
