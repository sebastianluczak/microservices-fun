import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppGateway } from './app.gateway.js';

@Controller()
export class RabbitMqProvider {
  constructor(private readonly appGateway: AppGateway) {}

  @MessagePattern('validation_notifications_queue')
  broadcastValidation(@Payload() data: string) {
    let payload: unknown = data;
    if (typeof data === 'string') {
      try {
        payload = JSON.parse(data);
      } catch {
        payload = data;
      }
    }

    this.appGateway.broadcastValidation(payload);

    return { status: 'ok', code: 420 };
  }
}
