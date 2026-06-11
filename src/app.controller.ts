import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Service status' })
  serverStatus(): { status: string; service: string; version: string } {
    return {
      status: 'running',
      service: 'lixy-emissor-nf-backend',
      version: '0.0.1',
    };
  }
}
