import { Test, TestingModule } from '@nestjs/testing';
import { FiscalCronService } from '../fiscal-cron.service';
import { FiscalService } from '../fiscal.service';

describe('FiscalCronService', () => {
  let cronService: FiscalCronService;
  let fiscalService: jest.Mocked<FiscalService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalCronService,
        {
          provide: FiscalService,
          useValue: {
            updateOverdueObligations: jest.fn(),
          },
        },
      ],
    }).compile();

    cronService = module.get(FiscalCronService);
    fiscalService = module.get(FiscalService);
  });

  it('runs daily overdue status update', async () => {
    fiscalService.updateOverdueObligations.mockResolvedValue(2);

    await cronService.handleDailyObligationStatusUpdate();

    expect(fiscalService.updateOverdueObligations).toHaveBeenCalled();
  });
});
