import { AppController } from './app.controller';

describe('AppController', () => {
  const controller = new AppController();

  it('returns running status', () => {
    expect(controller.serverStatus()).toEqual({
      status: 'running',
      service: 'lixy-emissor-nf-backend',
      version: '0.0.1',
    });
  });
});
