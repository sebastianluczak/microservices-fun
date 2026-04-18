import {
  Controller,
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

  constructor(@Inject('FILE_UPLOADER') private client: ClientProxy) {
    this.client.status.subscribe((status: TcpStatus) => {
      this.logger.log(`File Uploader microservice status: ${status}`);
    });
  }

  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: { buffer: Buffer; originalname: string },
  ): Promise<string> {
    this.logger.log('Received file upload request');
    this.logger.log(`File size: ${file.buffer.length} bytes`);
    const jsonPayload = JSON.stringify({
      filename: file.originalname,
      size: file.buffer.length,
      buffer: file.buffer.toString('utf-8'),
    });
    const response = this.client.send<string>({ cmd: 'upload' }, jsonPayload);
    const trueResponse = await firstValueFrom(response);

    return trueResponse;
  }
}
