import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Counter, Histogram } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';

type HistogramAttributes = {
  type: string;
};

@Controller()
export class AppController {
  private customMetricCounter: Counter;
  private performanceGauge: Histogram<HistogramAttributes>;
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly metricService: MetricService) {
    this.customMetricCounter = this.metricService.getCounter('custom_counter', {
      description: 'Description for counter',
    });
    this.performanceGauge = this.metricService.getHistogram(
      'app_process_time',
      {
        description: 'Process time',
        unit: 'ms',
        advice: {
          explicitBucketBoundaries: [500, 750, 1000, 1500],
        },
      },
    );
  }

  @GrpcMethod('StatisticsService', 'SaveNew')
  saveNewStatistic(data: {
    name: string;
    milliseconds: number;
    type: string;
    dateAt: string;
    corelationId: string;
    userId: string;
  }): { collectedAt: string } {
    this.logger.log(
      `[${data.corelationId}] (@${data.userId}) Received statistics for name: ${data.name} with ${data.milliseconds}ms timer.`,
    );

    this.customMetricCounter.add(1, {
      type: data.type,
    });

    this.performanceGauge.record(data.milliseconds, {
      type: data.type,
    });
    return { collectedAt: new Date().toISOString() };
  }
}
