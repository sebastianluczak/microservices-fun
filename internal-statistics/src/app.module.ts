import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { OpenTelemetryModule } from 'nestjs-otel';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true, // Includes Host Metrics
      },
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
