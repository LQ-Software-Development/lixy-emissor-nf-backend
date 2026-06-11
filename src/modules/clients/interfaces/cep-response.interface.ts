export interface CepResponse {
  zipCode: string;
  street: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
}

export interface ViaCepApiResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}
