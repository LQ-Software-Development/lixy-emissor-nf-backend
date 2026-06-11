import { AppController } from './app.controller';

describe('AppController', () => {
  it('returns service metadata', () => {
    const controller = new AppController();
    expect(controller.getRoot()).toEqual({
      status: 'ok',
      service: 'lixy-emissor-nf-backend',
      version: '0.1.0',
    });
  });
});
