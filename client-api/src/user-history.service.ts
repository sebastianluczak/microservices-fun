import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

type UserHistory = {
  visitCount: number;
  recordedAt: number[];
};

@Injectable()
export class UserHistoryService {
  constructor(@Inject('USER_TRACKER') private userTracker: ClientProxy) {}

  async getUserHistory(
    ephemeralId: string,
    corelationId: string,
  ): Promise<UserHistory> {
    const userId = ephemeralId || 'unknown-user' + crypto.randomUUID();
    const userHistory = await firstValueFrom(
      this.userTracker.send<string>(
        { cmd: 'storeUser' },
        JSON.stringify({ userId, corelationId }),
      ),
    );
    const parsedUserData = JSON.parse(userHistory) as {
      visitCount: number;
      recordedAt: number[];
    };

    return parsedUserData;
  }
}
