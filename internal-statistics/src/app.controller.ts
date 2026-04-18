import * as grpcJs from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Counter, Histogram } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';

type StatsObject = {
  id: number;
  name: string;
  milliseconds: number;
};

type HistogramAttributes = {
  type: string;
};

@Controller()
export class AppController {
  private customMetricCounter: Counter;
  private performanceGauge: Histogram<HistogramAttributes>;

  constructor(private readonly metricService: MetricService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.customMetricCounter = this.metricService.getCounter('custom_counter', {
      description: 'Description for counter',
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  @GrpcMethod('StatisticsService', 'FindAll')
  findAllStatistics(
    metadata: grpcJs.Metadata,
    call: grpcJs.ServerUnaryCall<any, any>,
  ): StatsObject {
    const items = [
      { id: 1, name: 'Task A', milliseconds: 150 },
      { id: 2, name: 'Task B', milliseconds: 300 },
      { id: 3, name: 'Task C', milliseconds: 450 },
    ];
    return items[Math.floor(Math.random() * items.length)]; // Return a random item for demonstration
  }

  @GrpcMethod('StatisticsService', 'SaveNew')
  saveNewStatistic(
    data: { name: string; milliseconds: number; type: string; dateAt: string },
    metadata: grpcJs.Metadata,
    call: grpcJs.ServerUnaryCall<any, any>,
  ): { collectedAt: string } {
    console.log('Received new statistic:', data);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.customMetricCounter.add(1, {
      type: data.type,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.performanceGauge.record(data.milliseconds, {
      type: data.type,
    });
    return { collectedAt: new Date().toISOString() };
  }
}
