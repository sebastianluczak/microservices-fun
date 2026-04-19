import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, GrpcMethod } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @Inject('VALIDATION_NOTIFICATIONS')
    private readonly rabbitNotificationsClient: ClientProxy,
  ) {}

  @GrpcMethod('FileAnalyzer', 'CheckForErrors')
  async checkForErrors(data: {
    pathToGcs: string;
    corelationId: string;
    userId: string;
  }): Promise<string> {
    this.logger.log(
      `[${data.corelationId} (@${data.userId}) Received gRPC request to analyze file at path: ${data.pathToGcs}`,
    );

    const fetchedFile = await fetch(data.pathToGcs);
    const fileContent = await fetchedFile.text();

    try {
      JSON.parse(fileContent);
      this.logger.log(
        `[${data.corelationId} (@${data.userId}) File content is valid JSON`,
      );
      const validation = {
        message: `Validation result`,
        userId: data.userId,
        corelationId: data.corelationId,
        result: 'Your file is VALID! Good job!',
        boolResult: true,
      };
      const result = this.rabbitNotificationsClient.send(
        'validation_notifications_queue',
        JSON.stringify(validation),
      );
      firstValueFrom(result)
        .then(() => {
          this.logger.log(
            `[${data.corelationId} (@${data.userId}) Checked and is valid`,
          );
        })
        .catch(() => {
          this.logger.error(
            `[${data.corelationId} (@${data.userId}) Failed to inform users via WS`,
          );
        });
      return 'File is clean';
    } catch (error) {
      this.logger.error(
        `[${data.corelationId} (@${data.userId}) File content is not valid JSON. ${error}`,
      );
      const validation = {
        message: `Hello, anonymous!`,
        userId: data.userId,
        corelationId: data.corelationId,
        result: 'Your file is NOT VALID, you messed up as hell!',
        boolResult: false,
      };
      const result = this.rabbitNotificationsClient.send(
        'validation_notifications_queue',
        JSON.stringify(validation),
      );

      firstValueFrom(result)
        .then(() => {
          this.logger.log(
            `[${data.corelationId} (@${data.userId}) Resolved result from rabbitmq successfuly.`,
          );
        })
        .catch(() => {
          this.logger.error(
            `[${data.corelationId} (@${data.userId}) Error from rabbitMq.`,
          );
        });

      return 'File has errors';
    }
  }
}
