import { Repository } from 'typeorm';
import { UpdateObligationStatusJob } from './update-obligation-status.job';
import { FiscalObligation } from './entities/fiscal-obligation.entity';

describe('UpdateObligationStatusJob', () => {
  let job: UpdateObligationStatusJob;
  let obligationRepository: jest.Mocked<Repository<FiscalObligation>>;

  beforeEach(() => {
    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 3 }),
    };

    obligationRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<FiscalObligation>>;

    job = new UpdateObligationStatusJob(obligationRepository);
  });

  it('updates pending obligations past due date to overdue', async () => {
    const affected = await job.execute();

    expect(affected).toBe(3);
    expect(obligationRepository.createQueryBuilder).toHaveBeenCalled();
  });

  it('runs cron handler', async () => {
    await expect(job.handleCron()).resolves.toBeUndefined();
  });

  it('returns zero when no rows are affected', async () => {
    const queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: undefined }),
    };

    obligationRepository.createQueryBuilder = jest
      .fn()
      .mockReturnValue(queryBuilder);

    await expect(job.execute()).resolves.toBe(0);
  });
});
