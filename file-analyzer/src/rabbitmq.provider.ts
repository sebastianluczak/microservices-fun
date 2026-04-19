import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AppGateway } from './app.gateway.js';

@Controller()
export class RabbitMqProvider {
  constructor(private readonly appGateway: AppGateway) {}

  @MessagePattern('validation_notifications_queue')
  getCats(@Payload() data: string, @Ctx() context: RmqContext) {
    console.log(`Received message with routing key: ${context.getPattern()}`);
    console.log(data);

    let payload: unknown = data;
    if (typeof data === 'string') {
      try {
        payload = JSON.parse(data);
      } catch {
        payload = data;
      }
    }

    this.appGateway.broadcastValidation(payload);

    return {
      message: 'Hello from the cats service!',
    };
  }
}
