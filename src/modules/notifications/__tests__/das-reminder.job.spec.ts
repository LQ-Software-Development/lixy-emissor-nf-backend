import { Test, TestingModule } from '@nestjs/testing';
import { DasReminderJob } from '../jobs/das-reminder.job';
import { DasReminderService } from '../services/das-reminder.service';

describe('DasReminderJob', () => {
  let job: DasReminderJob;
  let dasReminderService: DasReminderService;

  const mockDasReminderService = {
    processReminders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DasReminderJob,
        {
          provide: DasReminderService,
          useValue: mockDasReminderService,
        },
      ],
    }).compile();

    job = module.get<DasReminderJob>(DasReminderJob);
    dasReminderService = module.get<DasReminderService>(DasReminderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleDasReminderCron', () => {
    it('should call processReminders', async () => {
      mockDasReminderService.processReminders.mockResolvedValue(undefined);

      await job.handleDasReminderCron();

      expect(mockDasReminderService.processReminders).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Test error');
      mockDasReminderService.processReminders.mockRejectedValue(error);

      // Spy on logger
      const loggerSpy = jest.spyOn(job['logger'], 'error');

      await job.handleDasReminderCron();

      expect(loggerSpy).toHaveBeenCalledWith('DAS reminder cron job failed', error);
    });
  });
});
