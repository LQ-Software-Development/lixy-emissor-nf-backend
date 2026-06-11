import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns health status', () => {
    const controller = new HealthController();
    expect(controller.check()).toEqual({
      status: 'ok',
      service: 'lixy-emissor-nf-backend',
    });
  });
});
