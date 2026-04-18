/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  SubscribeMessage,
  MessageBody,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleDisconnect(client: { id: string }) {
    console.log('Client disconnected:', client.id);
  }
  handleConnection(client: { id: string }) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('events')
  handleEvent(@MessageBody() data: string) {
    console.log('Received event:', data);
    // Emit back to all connected clients
    this.server.emit('events', `Server received: ${data}`);
  }
}
