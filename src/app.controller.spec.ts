import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('serverStatus', () => {
    it('returns running status payload', () => {
      const result = appController.serverStatus();

      expect(result).toMatchObject({
        status: 'running',
        service: 'lixy-emissor-nf-backend',
        version: '0.0.1',
      });
      expect(result).toHaveProperty('documentation');
      expect(result).toHaveProperty('health');
    });
  });
});
