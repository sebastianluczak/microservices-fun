import {
  Controller,
  Headers,
  Inject,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, TcpStatus } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @Inject('FILE_UPLOADER') private client: ClientProxy,
    @Inject('USER_TRACKER') private userTracker: ClientProxy,
  ) {
    this.client.status.subscribe((status: TcpStatus) => {
      this.logger.log(`File Uploader microservice status: ${status}`);
    });
    this.userTracker.status.subscribe((status) => {
      this.logger.log(`User Tracker microservice status: ${status}`);
    });
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Headers('X-Ephemeral-Id') ephemeralId: string,
  ): Promise<string> {
    const userId = ephemeralId || 'unknown-user' + crypto.randomUUID();
    const corelationId = this.generateCorelationId();
    // Another microservice, that will store the information about the user and return
    // past information about it...
    const userHistory = await firstValueFrom(
      this.userTracker.send<string>(
        { cmd: 'storeUser' },
        JSON.stringify({ userId }),
      ),
    );
    const parsedUserData = JSON.parse(userHistory) as {
      visitCount: number;
      recordedAt: number[];
    };
    this.logger.log(
      `[${corelationId}] (@${userId}) User uploaded their ${parsedUserData.visitCount} file to us, nice!`,
    );

    this.logger.log('Received file upload request');
    this.logger.log(`File size: ${file.buffer.length} bytes`);
    const jsonPayload = JSON.stringify({
      filename: file.originalname,
      size: file.buffer.length,
      buffer: file.buffer.toString('utf-8'),
      corelationId,
      ephemeralId: userId,
    });
    const response = this.client.send<string>({ cmd: 'upload' }, jsonPayload);
    const trueResponse = await firstValueFrom(response);

    return trueResponse;
  }

  private generateCorelationId(): string {
    return crypto.randomUUID();
  }
}
