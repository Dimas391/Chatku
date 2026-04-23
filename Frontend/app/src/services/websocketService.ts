import storageService from './storageService';

const WS_URL = 'ws://192.168.1.23:8000';

type Callback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000;
  private eventCallbacks: Map<string, Callback[]> = new Map();
  private messageCallbacks: Map<string, Callback[]> = new Map();
  private isConnecting = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

  async connect(): Promise<boolean> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return this.ws?.readyState === WebSocket.OPEN;
    }

    const token = await storageService.getAccessToken();
    if (!token) {
      return false;
    }

    this.isConnecting = true;
    this.reconnectAttempts = 0;

    try {
      const wsUrl = `${WS_URL}/ws?token=${token}`;
      
      this.ws = new WebSocket(wsUrl);

      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          this.ws?.close();
          this.isConnecting = false;
        }
      }, 5000);

      this.ws.onopen = () => {
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.trigger('connected', { status: 'connected' });
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {}
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.trigger('error', error);
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
        this.stopPing();
        this.trigger('disconnected', event);
        
        if (event.code !== 1000) {
          this.reconnect();
        }
      };

      return new Promise((resolve) => {
        setTimeout(() => resolve(this.isConnected()), 3000);
      });
    } catch (error) {
      this.isConnecting = false;
      this.reconnect();
      return false;
    }
  }

  private handleMessage(data: any) {
    const event = data.event;
    if (!event) return;

    // Trigger event callbacks
    this.trigger(event, data.data || data);

    // Handle new_message khusus
    if (event === 'new_message') {
      this.triggerMessage('new_message', data.data);
    }

    if (event === 'message_sent') {
      this.triggerMessage('message_sent', data.data);
    }
  }

  // ───── Event Callbacks (untuk event umum) ─────
  on(event: string, callback: Callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Callback) {
    const list = this.eventCallbacks.get(event);
    if (!list) return;
    const filtered = list.filter((cb) => cb !== callback);
    if (filtered.length === 0) {
      this.eventCallbacks.delete(event);
    } else {
      this.eventCallbacks.set(event, filtered);
    }
  }

  private trigger(event: string, data: any) {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  // ───── Message Callbacks (untuk pesan chat) ─────
  onNewMessage(callback: Callback) {
    this.addMessageCallback('new_message', callback);
  }

  onMessageSent(callback: Callback) {
    this.addMessageCallback('message_sent', callback);
  }

  private addMessageCallback(type: string, callback: Callback) {
    if (!this.messageCallbacks.has(type)) {
      this.messageCallbacks.set(type, []);
    }
    this.messageCallbacks.get(type)!.push(callback);
  }

  private triggerMessage(type: string, data: any) {
    const callbacks = this.messageCallbacks.get(type);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  // ───── Typing & Chat ─────
  onTyping(callback: Callback) {
    this.on('typing', callback);
  }

  onMessagesRead(callback: Callback) {
    this.on('messages_read', callback);
  }

  onConnected(callback: Callback) {
    this.on('connected', callback);
  }

  onDisconnected(callback: Callback) {
    this.on('disconnected', callback);
  }

  // ───── Send data ─────
  send(data: any) {
    if (this.isConnected()) {
      this.ws?.send(JSON.stringify(data));
    }
  }

  sendTyping(chatId: string, isTyping: boolean) {
    this.send({
      event: 'typing',
      data: { chat_id: chatId, is_typing: isTyping }
    });
  }

  joinChat(chatId: string) {
    this.send({ event: 'join_chat', data: { chat_id: chatId } });
  }

  leaveChat(chatId: string) {
    this.send({ event: 'leave_chat', data: { chat_id: chatId } });
  }

  markAsRead(chatId: string) {
    this.send({ event: 'read', data: { chat_id: chatId } });
  }

  // ───── Ping & reconnect ─────
  private startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ event: 'ping' });
      }
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private reconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  disconnect() {
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventCallbacks.clear();
    this.messageCallbacks.clear();
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketService();