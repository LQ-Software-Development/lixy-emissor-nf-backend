import { BadGatewayException, Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import {
  CepResponse,
  ViaCepApiResponse,
} from '../interfaces/cep-response.interface';

@Injectable()
export class CepService {
  async lookup(cep: string): Promise<CepResponse | null> {
    const cleanedCep = cep.replace(/\D/g, '');

    if (cleanedCep.length !== 8) {
      return null;
    }

    try {
      const { data } = await axios.get<ViaCepApiResponse>(
        `https://viacep.com.br/ws/${cleanedCep}/json/`,
        { timeout: 5000 },
      );

      if (data.erro) {
        return null;
      }

      return {
        zipCode: cleanedCep,
        street: data.logradouro,
        complement: data.complemento || null,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new BadGatewayException('Failed to fetch address from ViaCEP');
      }

      throw error;
    }
  }
}
