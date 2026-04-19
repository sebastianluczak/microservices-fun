import { Module } from '@nestjs/common';
import { RabbitMqProvider } from './rabbitmq.provider.js';

@Module({
  imports: [],
  controllers: [RabbitMqProvider],
  providers: [],
})
export class AppModule {}
