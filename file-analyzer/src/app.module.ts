import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitMqProvider } from './rabbitmq.provider.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'VALIDATION_NOTIFICATIONS',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'validation_notifications_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [RabbitMqProvider],
  providers: [AppGateway],
})
export class AppModule {}
