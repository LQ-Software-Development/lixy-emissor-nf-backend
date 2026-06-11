import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOkResponse({ description: 'API status' })
  serverStatus(): object {
    const port = Number(process.env.API_PORT) || 3009;

    return {
      status: 'running',
      service: 'lixy-emissor-nf-backend',
      version: '0.0.1',
      documentation: `http://localhost:${port}/docs`,
      health: `http://localhost:${port}/health`,
    };
  }
}
