import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

type UploaderResponse = {
  fileInStorage: string;
};

@Injectable()
export class FileUploaderService {
  constructor(@Inject('FILE_UPLOADER') private fileUploader: ClientProxy) {}

  async uploadFile(
    buffer: Buffer,
    originalname: string,
    corelationId: string,
    userId: string,
  ) {
    const jsonPayload = JSON.stringify({
      filename: originalname,
      size: buffer.length,
      buffer: buffer.toString('utf-8'),
      corelationId,
      ephemeralId: userId,
    });
    const response = this.fileUploader.send<string>(
      { cmd: 'upload' },
      jsonPayload,
    );
    const trueResponse = await firstValueFrom(response);

    return JSON.parse(trueResponse) as UploaderResponse;
  }
}
