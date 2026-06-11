import { ApiProperty } from '@nestjs/swagger';
import { ClientEntity } from '../entities/client.entity';

export class PaginatedClientsDto {
  @ApiProperty({ type: [ClientEntity] })
  data!: ClientEntity[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
