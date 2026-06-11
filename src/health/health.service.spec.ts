import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok when database responds', async () => {
    const dataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as DataSource;

    const service = new HealthService(dataSource);
    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('returns degraded when database fails', async () => {
    const dataSource = {
      query: jest.fn().mockRejectedValue(new Error('connection refused')),
    } as unknown as DataSource;

    const service = new HealthService(dataSource);
    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      database: 'down',
    });
  });
});
