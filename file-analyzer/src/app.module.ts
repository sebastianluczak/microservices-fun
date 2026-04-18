import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway.js';

@Module({
  imports: [],
  controllers: [],
  providers: [AppGateway],
})
export class AppModule {}
