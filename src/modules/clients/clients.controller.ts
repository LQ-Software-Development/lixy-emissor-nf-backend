import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ViaCepAddress, ViaCepService } from '../../common/services/viacep.service';
import { isValidCep } from '../../common/validators/is-cep.validator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { ListClientsQueryDto } from './dto/list-clients-query.dto';
import { PaginatedClientsDto } from './dto/paginated-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientEntity } from './entities/client.entity';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly viaCepService: ViaCepService,
  ) {}

  @Post()
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiCreatedResponse({ type: ClientEntity })
  create(
    @Headers('x-company-id') organizationId: string,
    @Body() dto: CreateClientDto,
  ): Promise<ClientEntity> {
    return this.clientsService.create(organizationId, dto);
  }

  @Get()
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiOkResponse({ type: PaginatedClientsDto })
  findAll(
    @Headers('x-company-id') organizationId: string,
    @Query() query: ListClientsQueryDto,
  ): Promise<PaginatedClientsDto> {
    return this.clientsService.findAll(organizationId, query);
  }

  @Get('address/lookup/:cep')
  @ApiOkResponse({ description: 'Endereço obtido via ViaCEP' })
  async lookupAddress(@Param('cep') cep: string): Promise<ViaCepAddress> {
    if (!isValidCep(cep)) {
      throw new BadRequestException('CEP inválido');
    }
    return this.viaCepService.lookup(cep);
  }

  @Get(':id')
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiOkResponse({ type: ClientEntity })
  findOne(
    @Headers('x-company-id') organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ClientEntity> {
    return this.clientsService.findOne(organizationId, id);
  }

  @Patch(':id')
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiOkResponse({ type: ClientEntity })
  update(
    @Headers('x-company-id') organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ): Promise<ClientEntity> {
    return this.clientsService.update(organizationId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiNoContentResponse({ description: 'Cliente removido' })
  async remove(
    @Headers('x-company-id') organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.clientsService.remove(organizationId, id);
  }
}
