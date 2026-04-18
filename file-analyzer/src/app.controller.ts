import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @GrpcMethod('FileAnalyzer', 'CheckForErrors')
  async checkForErrors(data: { pathToGcs: string }): Promise<string> {
    this.logger.log(
      `Received gRPC request to analyze file at path: ${data.pathToGcs}`,
    );

    const fetchedFile = await fetch(data.pathToGcs);
    const fileContent = await fetchedFile.text();

    try {
      JSON.parse(fileContent);
      this.logger.log('File content is valid JSON');
      return 'File is clean';
    } catch (error) {
      this.logger.error('File content is not valid JSON', error);
      return 'File has errors';
    }
  }
}
