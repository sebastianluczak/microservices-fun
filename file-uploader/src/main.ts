import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        port: 7001,
      },
    },
  );
  await app.listen();
}
bootstrap().catch((err) => {
  console.error('Error starting the microservice:', err);
  process.exit(1);
});
