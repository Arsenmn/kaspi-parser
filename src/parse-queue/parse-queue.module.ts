import { Module } from '@nestjs/common';
import { ParseQueueService } from './parse-queue.service';
import { ParseQueueController } from './parse-queue.controller';
import { BullModule } from '@nestjs/bullmq';
import { PARSE_QUEUE } from './parse-queue.constants';
import { ParseProcessor } from './parse.processor';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    ProductsModule,
    BullModule.registerQueue({
      name: PARSE_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2_000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 1_000 },
      },
    }),
  ],
  controllers: [ParseQueueController],
  providers: [ParseQueueService, ParseProcessor],
})
export class ParseQueueModule {}
