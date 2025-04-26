import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewChecked, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../../services/user.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../../../services/token.service';
import { environment } from '../../../../environments/environment';

interface ChatMessage {
    id: number;
    content: string;
    timestamp: Date;
    isSent: boolean;
}

interface Chat {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    time: string;
}

interface UserChatSummary {
    userId: number;
    fullName: string;
    phoneNumber: string;
    lastMessage: string;
    lastMessageTime: string;
}

@Component({
    selector: 'app-chat-admin',
    templateUrl: './chat.admin.component.html',
    styleUrls: ['./chat.admin.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ]
})
export class ChatAdminComponent implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('chatMessages') chatMessages!: ElementRef;

    userService = inject(UserService);
    router = inject(Router);
    route = inject(ActivatedRoute);
    http = inject(HttpClient);
    tokenService = inject(TokenService);

    userSummaries: UserChatSummary[] = [];
    selectedUserId: number | null = null;
    messages: ChatMessage[] = [];
    newMessage: string = '';
    private socket!: WebSocket;
    private messageId = 0;
    apiBaseUrl = environment.apiBaseUrl;
    localStorage?: Storage;
    adminId: number = 19; 

    constructor(
        @Inject(DOCUMENT) private document: Document
    ) {
        this.localStorage = document.defaultView?.localStorage;
    }

    ngOnInit(): void {
        this.loadUsersChattedWithAdminSummary();

        this.socket = new WebSocket('ws://localhost:8088/ws-chat');

        this.socket.onopen = () => {
            console.log('Connected to WebSocket');
        };

        this.socket.onmessage = (event) => {
            const receivedMessage = event.data;
            const chatMessage: Chat = JSON.parse(receivedMessage);
            if (
                (chatMessage.senderId === this.selectedUserId && chatMessage.receiverId === this.adminId) ||
                (chatMessage.senderId === this.adminId && chatMessage.receiverId === this.selectedUserId)
            ) {
                this.messages.push({
                    id: this.messageId++,
                    content: chatMessage.content,
                    timestamp: new Date(chatMessage.time),
                    isSent: chatMessage.senderId === this.adminId
                });
                this.sortMessagesByTime();
            }
            this.loadUsersChattedWithAdminSummary();
        };

        this.socket.onclose = () => {
            console.log('Disconnected from WebSocket');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    loadUsersChattedWithAdminSummary(): void {
        const url = `${this.apiBaseUrl}/chat/users-chatted-summary?adminId=${this.adminId}`;
        this.http.get<UserChatSummary[]>(url).subscribe({
            next: (summaries) => {
                this.userSummaries = summaries;
            },
            error: (error) => {
                console.error('Error loading user summaries:', error);
            }
        });
    }

    selectUser(userId: number): void {
        this.selectedUserId = userId;
        this.messages = [];
        this.loadChatHistory();
    }

    loadChatHistory(): void {
        if (this.selectedUserId === null) return;
        const url = `${this.apiBaseUrl}/chat/history?senderId=${this.adminId}&receiverId=${this.selectedUserId}`;
        this.http.get<Chat[]>(url).subscribe({
            next: (chatHistory) => {
                this.messages = chatHistory.map(chat => ({
                    id: this.messageId++,
                    content: chat.content,
                    timestamp: new Date(chat.time),
                    isSent: chat.senderId === this.adminId
                }));
                this.sortMessagesByTime();
            },
            error: (error) => {
                console.error('Error loading chat history:', error);
            }
        });
    }

    sendMessage(): void {
        if (this.newMessage.trim() && this.socket.readyState === WebSocket.OPEN && this.selectedUserId !== null) {
            const chatMessage = {
                senderId: this.adminId,
                receiverId: this.selectedUserId,
                content: this.newMessage.trim(),
                time: new Date().toISOString()
            };

            this.socket.send(JSON.stringify(chatMessage));

            this.messages.push({
                id: this.messageId++,
                content: this.newMessage,
                timestamp: new Date(),
                isSent: true
            });

            this.sortMessagesByTime();
            this.loadUsersChattedWithAdminSummary();
            this.newMessage = '';
        }
    }

    private sortMessagesByTime(): void {
        this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        if (this.chatMessages) {
            const element = this.chatMessages.nativeElement;
            element.scrollTop = element.scrollHeight;
        }
    }

    ngOnDestroy(): void {
        if (this.socket) {
            this.socket.close();
        }
    }
}