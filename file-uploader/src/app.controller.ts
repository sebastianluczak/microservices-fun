import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';

type DownloadFileDto = {
  filenameInTemporaryDirectory: string;
  fileInStorage: string;
  publicDownloadUrl: string;
  eTag: string;
};

@Controller()
export class AppController {
  private logger = new Logger(AppController.name);
  private minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  });

  @MessagePattern({ cmd: 'upload' })
  async upload(jsonString: string): Promise<string> {
    const json = JSON.parse(jsonString) as {
      filename: string;
      size: number;
      buffer: string;
    };

    const data = Buffer.from(json.buffer, 'utf-8');
    this.logger.log('Received file upload request');
    this.logger.log(`File size: ${data.length} bytes`);
    // Store this in `uploads` directory with a unique name
    const uploadsDir = path.join(os.tmpdir(), 'uploads');
    this.logger.log(`Ensuring uploads directory exists at ${uploadsDir}`);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const filename = `${randomUUID()}-${json.filename}`;
    const filePath = path.join(uploadsDir, filename);
    this.logger.log(`Saving file to ${filePath}`);
    fs.writeFileSync(filePath, data);
    // now upload to MinIO
    this.logger.log(
      `Uploading file to MinIO bucket 'uploads' with name ${filename}`,
    );
    const uploadPromise = this.minioClient
      .putObject('uploads', filename, fs.createReadStream(filePath))
      .then((response) => {
        this.logger.log(`File uploaded to MinIO as ${response.etag}`);
        // Optionally, delete the local file after upload
        fs.unlinkSync(filePath);

        return response;
      })
      .catch((err) => {
        this.logger.error('Error uploading file to MinIO', err);
        throw err;
      });

    const result = await uploadPromise;
    const publicDownloadUrl = this.minioClient.presignedGetObject(
      'uploads',
      filename,
      24 * 60 * 60,
    ); // URL valid for 24 hours
    this.logger.log(`File uploaded and saved as ${filePath}`);
    return JSON.stringify({
      filenameInTemporaryDirectory: filePath,
      fileInStorage: filename,
      publicDownloadUrl: await publicDownloadUrl,
      eTag: result.etag,
    } as DownloadFileDto); // Return a success code or any relevant information
  }
}
