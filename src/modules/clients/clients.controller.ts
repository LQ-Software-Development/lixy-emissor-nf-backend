import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ClientEntity } from './entities/client.entity';
import { ClientsService } from './clients.service';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiOkResponse({ description: 'Lista clientes da organização' })
  listClients(
    @Headers('x-company-id') organizationId: string,
  ): Promise<ClientEntity[]> {
    return this.clientsService.findAll(organizationId);
  }
}
