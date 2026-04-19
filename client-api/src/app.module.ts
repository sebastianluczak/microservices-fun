import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UserHistoryService } from './user-history.service.js';
import { FileUploaderService } from './file-uploader.service.js';

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
      {
        name: 'USER_TRACKER',
        transport: Transport.TCP,
        options: {
          port: 7071,
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [UserHistoryService, FileUploaderService],
})
export class AppModule {}
