import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  companyId: string;
  user: Record<string, unknown>;
}
