import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { Redis } from 'ioredis';

type RedisUserEntry = {
  visitCount: number;
  recordedAt: number[];
};

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private readonly redis = new Redis();

  @MessagePattern({ cmd: 'storeUser' })
  async storeUser(jsonString: string) {
    const receivedPayload = JSON.parse(jsonString) as {
      userId: string;
      corelationId: string;
    };
    this.logger.log(
      `[${receivedPayload.corelationId}] (@${receivedPayload.userId}) Received payload: ${JSON.stringify(receivedPayload, null, 2)}`,
    );

    // Check if user is in redis already.
    let possibleUserData = await this.redis.get(receivedPayload.userId);
    if (possibleUserData === null) {
      const userData: RedisUserEntry = {
        visitCount: 1,
        recordedAt: [Math.floor(Date.now() / 1000)],
      };
      possibleUserData = JSON.stringify(userData);
      await this.redis.set(receivedPayload.userId, possibleUserData);
    } else {
      // Increment the number of visits and add one more entry to recorded
      const asRealJson = JSON.parse(possibleUserData) as RedisUserEntry;
      const newData: RedisUserEntry = {
        visitCount: asRealJson.visitCount + 1,
        recordedAt: [...asRealJson.recordedAt, Math.floor(Date.now() / 1000)],
      };
      possibleUserData = JSON.stringify(newData);
      await this.redis.set(receivedPayload.userId, possibleUserData);
    }
    this.logger.log(
      `[${receivedPayload.corelationId}] (@${receivedPayload.userId}) Found ${possibleUserData} for ${receivedPayload.userId}`,
    );

    return possibleUserData;
  }
}
