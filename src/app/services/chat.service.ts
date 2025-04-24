import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


interface Chat {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    time: string;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService implements OnDestroy {
    private socket: WebSocket | null = null;
    private unreadMessagesSubject = new BehaviorSubject<boolean>(false);
    unreadMessages$ = this.unreadMessagesSubject.asObservable();
    private isChatPageActive = false;
    private senderId?: number;
    private receiverId: number = 12; // Default receiver ID

    constructor(private http: HttpClient) {}

    initializeWebSocket(senderId: number): void {
        this.senderId = senderId;
        if (this.socket) {
            this.socket.close();
        }

        this.socket = new WebSocket('ws://localhost:8088/ws-chat');

        this.socket.onopen = () => {
            console.log('Connected to WebSocket');
        };

        this.socket.onmessage = (event) => {
            const receivedMessage = event.data;
            const chatMessage: Chat = JSON.parse(receivedMessage);

            if (
                (chatMessage.senderId === this.senderId && chatMessage.receiverId === this.receiverId) ||
                (chatMessage.senderId === this.receiverId && chatMessage.receiverId === this.senderId)
            ) {
                // Update unread status if not on chat page
                if (!this.isChatPageActive) {
                    this.unreadMessagesSubject.next(true);
                }
            }
        };

        this.socket.onclose = () => {
            console.log('Disconnected from WebSocket');
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    sendMessage(message: { senderId: number; receiverId: number; content: string; time: string }): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }

    loadChatHistory(senderId: number, receiverId: number): Observable<Chat[]> {
        const url = `${environment.apiBaseUrl}/chat/history?senderId=${senderId}&receiverId=${receiverId}`;
        return this.http.get<Chat[]>(url);
    }

    setChatPageActive(active: boolean): void {
        this.isChatPageActive = active;
        if (active) {
            // Reset unread status when entering chat page
            this.unreadMessagesSubject.next(false);
        }
    }

    ngOnDestroy(): void {
        if (this.socket) {
            this.socket.close();
        }
    }
}