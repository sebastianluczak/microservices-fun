import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'FILE_UPLOADER',
        transport: Transport.TCP,
        options: {
          port: 7001,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
