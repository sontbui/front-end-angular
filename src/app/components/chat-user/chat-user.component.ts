import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TokenService } from '../../services/token.service';
import { ChatService } from '../../services/chat.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ChatMessage {
    id: number;
    content: string;
    timestamp: Date;
    isSent: boolean;
}

@Component({
    selector: 'app-chat-user',
    templateUrl: './chat-user.component.html',
    styleUrls: ['./chat-user.component.scss'],
    standalone: true,
    imports: [
        FooterComponent,
        HeaderComponent,
        CommonModule,
        FormsModule
    ]
})
export class ChatUserComponent implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('chatMessages') chatMessages!: ElementRef;

    messages: ChatMessage[] = [];
    newMessage: string = '';
    private messageId = 0;
    apiBaseUrl = environment.apiBaseUrl;
    localStorage?: Storage;
    senderId?: number;
    receiverId: number = 12;

    constructor(
        private router: Router,
        private tokenService: TokenService,
        private chatService: ChatService,
        @Inject(DOCUMENT) private document: Document
    ) {
        this.localStorage = document.defaultView?.localStorage;
    }

    ngOnInit(): void {
        const userJson = this.localStorage?.getItem('user');
        if (userJson) {
            const user = JSON.parse(userJson);
            this.senderId = user.id;
            console.log('User ID:', this.senderId);
            // alert('User ID: ' + this.senderId);
            // Initialize WebSocket
            if (this.senderId !== undefined) {
                this.chatService.initializeWebSocket(this.senderId);
            }
            // Mark chat page as active (resets unread status)
            this.chatService.setChatPageActive(true);
            // Load chat history
            this.loadChatHistory();
        } else {
            this.router.navigate(['/login']);
        }
    }

    loadChatHistory(): void {
        if (this.senderId) {
            this.chatService.loadChatHistory(this.senderId, this.receiverId).subscribe({
                next: (chatHistory) => {
                    this.messages = chatHistory.map(chat => ({
                        id: this.messageId++,
                        content: chat.content,
                        timestamp: new Date(chat.time),
                        isSent: chat.senderId === this.senderId
                    }));
                    this.sortMessagesByTime();
                },
                error: (error) => {
                    console.error('Error loading chat history:', error);
                }
            });
        }
    }

    private sortMessagesByTime(): void {
        this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    sendMessage(): void {
        if (this.newMessage.trim() && this.senderId) {
            const chatMessage = {
                senderId: this.senderId,
                receiverId: this.receiverId,
                content: this.newMessage.trim(),
                time: new Date().toISOString()
            };
            alert('Sending message: ' + JSON.stringify(chatMessage)); // Debugging alert
            this.chatService.sendMessage(chatMessage);
            
            this.messages.push({
                id: this.messageId++,
                content: this.newMessage,
                timestamp: new Date(),
                isSent: true
            });

            this.sortMessagesByTime();
            this.newMessage = '';
        }
    }

    private scrollToBottom(): void {
        const element = this.chatMessages.nativeElement;
        element.scrollTop = element.scrollHeight;
    }

    ngOnDestroy(): void {
        // Mark chat page as inactive
        this.chatService.setChatPageActive(false);
    }
}