import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import { AppModule as MicroserviceAppModule } from './microservice.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MicroserviceAppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: 'localhost:5051',
        package: 'file_analyzer',
        protoPath: 'src/file_analyzer.proto',
      },
    },
  );
  await app.listen();
}

async function bootstrapWebSocketServer() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Allow all origins (you can specify specific origins if needed)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  await app.listen(process.env.PORT ?? 3422);
}

bootstrapWebSocketServer()
  .then(() => {
    console.log('WebSocket server is running...');
  })
  .catch((err) => {
    console.error('Error starting the WebSocket server:', err);
    process.exit(1);
  });
bootstrap()
  .then(() => {
    console.log('File Analyzer microservice is running...');
  })
  .catch((err) => {
    console.error('Error starting the microservice:', err);
    process.exit(1);
  });
