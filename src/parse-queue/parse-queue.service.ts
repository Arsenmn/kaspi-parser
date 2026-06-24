import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  PARSE_JOB,
  PARSE_QUEUE,
  ParseProductJob,
} from './parse-queue.constants';
import { Job, Queue } from 'bullmq';
import cron, { ScheduledTask } from 'node-cron';

@Injectable()
export class ParseQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ParseQueueService.name);
  private task?: ScheduledTask;

  constructor(
    @InjectQueue(PARSE_QUEUE)
    private readonly queue: Queue<ParseProductJob>,
  ) {}

  onModuleInit(): void {
    const pattern = process.env.PARSE_CRON ?? '*/5 * * * * *';
    const slotMs = Number(process.env.PARSE_SLOT_MS ?? 5_000);

    if (!cron.validate(pattern)) {
      throw new Error(`Invalid PARSE_CRON expression: ${pattern}`);
    }

    this.task = cron.schedule(pattern, () => {
      this.logger.log(`Cron tick fired for expression "${pattern}"`);
      void this.scheduleParse().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Could not schedule parsing: ${message}`);
      });
    });
    this.logger.log(
      `Cron started with expression "${pattern}" and slot size ${slotMs}ms`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.task?.destroy();
  }

  async scheduleParse(): Promise<void> {
    const query = process.env.PARSE_QUERY ?? 'iphone';
    const slotMs = Number(process.env.PARSE_SLOT_MS ?? 5_000);
    const slot = Math.floor(Date.now() / slotMs);
    this.logger.log(`Queueing automatic parse for "${query}" in slot ${slot}`);
    const job = await this.addParse(query, `scheduled-${slot}`);
    this.logger.log(
      `Scheduled job ${job.id} for "${query}" from automatic cron tick`,
    );
  }

  async addParse(
    query = 'iphone',
    jobId?: string,
  ): Promise<Job<ParseProductJob>> {
    const job = await this.queue.add(PARSE_JOB, { query }, { jobId });
    this.logger.log(`Added job ${job.id} to Redis queue for query "${query}"`);
    return job;
  }
}
