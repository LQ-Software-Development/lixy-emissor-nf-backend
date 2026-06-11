import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { normalizeCep } from '../validators/is-cep.validator';

export type ViaCepAddress = {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type ViaCepApiResponse = {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

@Injectable()
export class ViaCepService {
  async lookup(cep: string): Promise<ViaCepAddress> {
    const normalized = normalizeCep(cep);

    let response: Response;
    try {
      response = await fetch(
        `https://viacep.com.br/ws/${normalized}/json/`,
      );
    } catch {
      throw new BadGatewayException('Falha ao consultar ViaCEP');
    }

    if (!response.ok) {
      throw new BadGatewayException('Falha ao consultar ViaCEP');
    }

    const data = (await response.json()) as ViaCepApiResponse;

    if (data.erro || !data.cep) {
      throw new NotFoundException('CEP não encontrado');
    }

    return {
      cep: normalizeCep(data.cep),
      street: data.logradouro ?? '',
      complement: data.complemento ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      state: data.uf ?? '',
    };
  }
}
