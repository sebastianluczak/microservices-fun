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
    this.logger.debug(`[WS] Client disconnected: ${client.id}`);
  }
  handleConnection(client: { id: string }) {
    this.logger.debug(`[WS] Client connected: ${client.id}`);
  }

  broadcastValidation(validation: unknown) {
    if (!this.server) {
      this.logger.warn(
        'WebSocket server not ready yet - skipping validation broadcast',
      );
      return;
    }

    this.server.emit('validation', validation);
  }

  @SubscribeMessage('hello')
  handleHello(
    @MessageBody() data: { message: string; userId: string; knownAs: string },
  ) {
    this.server.emit('events', {
      message: `Hello, ${data.knownAs}!`,
      userId: data.userId,
    });
  }
}
