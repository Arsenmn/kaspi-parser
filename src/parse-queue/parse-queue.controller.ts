import { Controller, Post, Query } from '@nestjs/common';
import { ParseQueueService } from './parse-queue.service';

@Controller('parse-queue')
export class ParseQueueController {
  constructor(private readonly parseQueueService: ParseQueueService) {}

  @Post()
  async add(@Query('query') query = 'iphone') {
    const job = await this.parseQueueService.addParse(query);
    return { jobId: job.id, status: 'queued' };
  }
}
