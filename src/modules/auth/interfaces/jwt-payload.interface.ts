export interface JwtAccessPayload {
  sub: string;
  cnpj: string;
  type: 'access' | 'refresh';
}
