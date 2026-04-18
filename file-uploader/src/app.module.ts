import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INTERNAL_STATISTICS',
        transport: Transport.GRPC,
        options: {
          package: 'statistics',
          protoPath: 'src/statistics.proto',
        },
      },
      {
        name: 'FILE_ANALYZER',
        transport: Transport.GRPC,
        options: {
          url: 'localhost:5051',
          package: 'file_analyzer',
          protoPath: 'src/file_analyzer.proto',
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
