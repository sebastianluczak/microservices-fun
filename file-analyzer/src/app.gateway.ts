import { Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server: Server;

  handleDisconnect(client: { id: string }) {
    console.log('Client disconnected:', client.id);
  }
  handleConnection(client: { id: string }) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('hello')
  handleHello(
    @MessageBody() data: { message: string; userId: string; knownAs: string },
  ) {
    this.logger.log('Received hello:', data);

    this.server.emit('events', {
      message: `Hello, ${data.knownAs}!`,
      userId: data.userId,
    });
  }
}
