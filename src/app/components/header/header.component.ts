import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { UserResponse } from '../../responses/user/user.response';
import { CartService } from '../../services/cart.service';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

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
export class HeaderComponent implements OnInit, OnDestroy {
  userResponse?: UserResponse | null;
  isPopoverOpen = false;
  activeNavItem: number = 0;
  cartItemCount: number = 0;
  hasUnreadMessages: boolean = false;
  private unreadMessagesSubscription?: Subscription;

  constructor(
    private userService: UserService,
    private tokenService: TokenService,
    private cartService: CartService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load user data
    this.userResponse = this.userService.getUserResponseFromLocalStorage();

    // Subscribe to cart item count
    this.cartService.cartItemCount$.subscribe((count) => {
      this.cartItemCount = count;
    });

    // Subscribe to unread messages
    if (this.userResponse?.id) {
      this.chatService.initializeWebSocket(this.userResponse.id);
      this.unreadMessagesSubscription = this.chatService.unreadMessages$.subscribe((hasUnread) => {
        this.hasUnreadMessages = hasUnread;
      });
    }
  }

  togglePopover(event: Event): void {
    event.preventDefault();
    this.isPopoverOpen = !this.isPopoverOpen;
  }

  handleItemClick(index: number): void {
    if (index === 0) {
      this.router.navigate(['/user-profile']);
    } else if (index === 1) {
      this.router.navigate(['/orders/user'], { queryParams: { id: this.userResponse?.id } });
    } else if (index === 2) {
      this.cartService.clearCart();
      this.userService.removeUserFromLocalStorage();
      this.tokenService.removeToken();
      this.userResponse = this.userService.getUserResponseFromLocalStorage();
    }
    this.isPopoverOpen = false;
  }

  setActiveNavItem(index: number): void {
    this.activeNavItem = index;
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.unreadMessagesSubscription) {
      this.unreadMessagesSubscription.unsubscribe();
    }
  }
}