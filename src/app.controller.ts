import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Service metadata' })
  getRoot(): { status: string; service: string; version: string } {
    return {
      status: 'ok',
      service: 'lixy-emissor-nf-backend',
      version: '0.1.0',
    };
  }
}
