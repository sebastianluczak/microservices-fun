import { Controller, Inject, Logger, OnModuleInit } from '@nestjs/common';
import * as microservices from '@nestjs/microservices';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import * as Minio from 'minio';
import { Observable } from 'rxjs';

type DownloadFileDto = {
  filenameInTemporaryDirectory: string;
  fileInStorage: string;
  publicDownloadUrl: string;
  eTag: string;
};

type StatsResponse = {
  id: number;
  name: string;
  milliseconds: number;
};

type StatsService = {
  FindAll: () => Observable<StatsResponse>;
  SaveNew: (data: {
    name: string;
    milliseconds: number;
    type: string;
    dateAt: string;
  }) => Observable<{ collectedAt: string }>;
};

type FileAnalyzerService = {
  CheckForErrors: (data: {
    pathToGcs: string;
    corelationId: string;
    userId: string;
  }) => Observable<void>;
};

@Controller()
export class AppController implements OnModuleInit {
  private logger = new Logger(AppController.name);
  private minioClient = new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: 'minioadmin',
    secretKey: 'minioadmin',
  });
  private statsService: StatsService;
  private fileAnalyzerService: FileAnalyzerService;

  constructor(
    @Inject('INTERNAL_STATISTICS')
    private statisticsClient: microservices.ClientGrpc,
    @Inject('FILE_ANALYZER')
    private fileAnalyzerClient: microservices.ClientGrpc,
  ) {}

  onModuleInit() {
    this.statsService =
      this.statisticsClient.getService<StatsService>('StatisticsService');
    this.fileAnalyzerService =
      this.fileAnalyzerClient.getService<FileAnalyzerService>('FileAnalyzer');
  }

  @microservices.MessagePattern({ cmd: 'upload' })
  async upload(jsonString: string): Promise<string> {
    const dataForStats: {
      name: string;
      milliseconds: number;
      type: string;
      dateAt: string;
    } = {
      name: 'file-upload',
      milliseconds: 0,
      type: 'upload',
      dateAt: new Date().toISOString(),
    };
    const startTime = Date.now();

    const json = JSON.parse(jsonString) as {
      filename: string;
      size: number;
      buffer: string;
      corelationId: string;
      ephemeralId: string;
    };
    this.logger.log(
      `[${json.corelationId}] (@${json.ephemeralId}) Upload request started`,
    );

    const data = Buffer.from(json.buffer, 'utf-8');
    this.logger.log(
      `[${json.corelationId}] (@${json.ephemeralId}) File size: ${data.length} bytes`,
    );
    // Store this in `uploads` directory with a unique name
    const uploadsDir = path.join(os.tmpdir(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const filename = `${randomUUID()}-${json.filename}`;
    const filePath = path.join(uploadsDir, filename);
    this.logger.log(
      `[${json.corelationId}] (@${json.ephemeralId}) Saving file to ${filePath}`,
    );
    fs.writeFileSync(filePath, data);
    // now upload to MinIO
    this.logger.log(
      `[${json.corelationId}] (@${json.ephemeralId}) Uploading file to MinIO bucket 'uploads' with name ${filename}`,
    );
    const uploadPromise = this.minioClient
      .putObject('uploads', filename, fs.createReadStream(filePath))
      .then((response) => {
        this.logger.log(
          `[${json.corelationId}] (@${json.ephemeralId}) File uploaded to MinIO as ${response.etag}`,
        );
        // Optionally, delete the local file after upload
        fs.unlinkSync(filePath);

        return response;
      })
      .catch((err) => {
        this.logger.error(
          `[${json.corelationId}] (@${json.ephemeralId}) Error uploading file to MinIO`,
          err,
        );
        throw err;
      });

    const result = await uploadPromise;
    const publicDownloadUrl = await this.minioClient.presignedUrl(
      'GET',
      'uploads',
      filename,
      12 * 60 * 60,
    ); // URL valid for 12 hours
    this.logger.log(
      `[${json.corelationId}] (@${json.ephemeralId}) File uploaded and saved as ${filePath}`,
    );

    // Send file to analyzer microservice
    this.logger.log(
      `[${json.corelationId}] (@${json.ephemeralId}) Sending file to analyzer microservice at ${filePath}`,
    );
    this.fileAnalyzerService
      .CheckForErrors({
        pathToGcs: publicDownloadUrl,
        corelationId: json.corelationId,
        userId: json.ephemeralId,
      })
      .subscribe({
        next: () => {
          this.logger.log(
            `[${json.corelationId}] (@${json.ephemeralId}) File analysis sent. See logs on the other side`,
          );
        },
        error: (err) => {
          this.logger.error(
            `[${json.corelationId}] (@${json.ephemeralId}) Error analyzing file`,
            err,
          );
        },
      });

    const endTime = Date.now();
    dataForStats.milliseconds = endTime - startTime;
    this.statsService.SaveNew(dataForStats).subscribe({
      next: (res) => {
        this.logger.log(
          `[${json.corelationId}] (@${json.ephemeralId}) Stats saved successfully at ${res.collectedAt}`,
        );
      },
      error: (err) => {
        this.logger.error(
          `[${json.corelationId}] (@${json.ephemeralId}) Error saving stats`,
          err,
        );
      },
    });

    return JSON.stringify({
      filenameInTemporaryDirectory: filePath,
      fileInStorage: filename,
      publicDownloadUrl: publicDownloadUrl,
      eTag: result.etag,
    } as DownloadFileDto);
  }
}
