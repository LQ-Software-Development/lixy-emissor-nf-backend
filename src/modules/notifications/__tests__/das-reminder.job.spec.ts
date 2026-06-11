import { Test, TestingModule } from '@nestjs/testing';
import { DasReminderJob } from '../jobs/das-reminder.job';
import { DasReminderService } from '../services/das-reminder.service';

describe('DasReminderJob', () => {
  let job: DasReminderJob;
  let dasReminderService: jest.Mocked<DasReminderService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DasReminderJob,
        {
          provide: DasReminderService,
          useValue: {
            processReminders: jest.fn(),
          },
        },
      ],
    }).compile();

    job = module.get(DasReminderJob);
    dasReminderService = module.get(DasReminderService);
  });

  it('executes DAS reminder processing', async () => {
    dasReminderService.processReminders.mockResolvedValue({
      processed: 2,
      notificationsCreated: 2,
      emailsSent: 1,
    });

    await job.execute();

    expect(dasReminderService.processReminders).toHaveBeenCalled();
  });
});
