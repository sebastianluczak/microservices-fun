import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module.js';
import otelSDK from './tracing.js';

async function bootstrap() {
  otelSDK.start();
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'statistics',
        protoPath: 'src/statistics.proto',
      },
    },
  );
  await app.listen();
}
bootstrap().catch((err) => {
  console.error('Error starting the microservice:', err);
  process.exit(1);
});
