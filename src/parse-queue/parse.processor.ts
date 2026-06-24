import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { PARSE_QUEUE, ParseProductJob } from './parse-queue.constants';
import { Logger } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { Job } from 'bullmq';

@Processor(PARSE_QUEUE, { concurrency: 5 })
export class ParseProcessor extends WorkerHost {
  private readonly logger = new Logger(ParseProcessor.name);
  private readonly workerId = process.env.HOSTNAME ?? `local-${process.pid}`;

  constructor(private readonly productService: ProductsService) {
    super();
  }

  async process(job: Job<ParseProductJob>): Promise<{ saved: number }> {
    const startedAt = Date.now();
    await job.log(
      `Picked by worker ${this.workerId} for query "${job.data.query}"`,
    );
    this.logger.log(
      `[worker=${this.workerId}] Processing job ${job.id} for "${job.data.query}"`,
    );
    const products = await this.productService.parse(job.data.query);
    const duration = Date.now() - startedAt;
    await job.log(
      `Saved ${products.length} products to MongoDB in ${duration} ms`,
    );
    this.logger.log(
      `[worker=${this.workerId}] Job ${job.id} stored ${products.length} products in ${duration} ms`,
    );
    return { saved: products.length };
  }

  @OnWorkerEvent('active')
  onActive(job: Job<ParseProductJob>): void {
    this.logger.log(
      `[worker=${this.workerId}] Job ${job.id} started, attempt ${job.attemptsMade + 1}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<ParseProductJob>): void {
    this.logger.log(
      `[worker=${this.workerId}] Job ${job.id} completed (${job.finishedOn! - job.processedOn!} ms)`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<ParseProductJob> | undefined, error: Error): void {
    if (!job) {
      this.logger.error(
        `[worker=${this.workerId}] Unknown job failed: ${error.message}`,
      );
      return;
    }

    this.logger.error(
      `[worker=${this.workerId}] Job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
