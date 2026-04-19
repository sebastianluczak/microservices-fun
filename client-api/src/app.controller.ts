import {
  Controller,
  Headers,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserHistoryService } from './user-history.service.js';
import { FileUploaderService } from './file-uploader.service.js';

// Acts as API Gateway for our microservice mesh.
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly userHistoryService: UserHistoryService,
    private readonly fileUploaderService: FileUploaderService,
  ) {}

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
    @Headers('X-Ephemeral-Id') ephemeralId: string,
  ) {
    const userId = ephemeralId || 'unknown-user' + crypto.randomUUID();
    const corelationId = this.generateCorelationId();
    const userHistory = await this.userHistoryService.getUserHistory(
      ephemeralId,
      corelationId,
    );
    this.logger.log(
      `[${corelationId}] (@${userId}) User uploaded their ${userHistory.visitCount} file to us, nice!`,
    );
    this.logger.log(
      `[${corelationId}] (@${userId}) File size: ${file.buffer.length} bytes`,
    );
    const result = await this.fileUploaderService.uploadFile(
      file.buffer,
      file.originalname,
      corelationId,
      userId,
    );

    this.logger.log(
      `[${corelationId}] (@${userId}) Received ${result.fileInStorage} from FileUploaderMicroService.`,
    );

    return result;
  }

  private generateCorelationId(): string {
    return crypto.randomUUID();
  }
}
