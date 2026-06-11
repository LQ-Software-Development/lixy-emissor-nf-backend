import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EmailService } from '../services/email.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let send: jest.Mock;

  const createService = async (config: Record<string, string | undefined>) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(
              (key: string, defaultValue?: string) =>
                config[key] ?? defaultValue,
            ),
          },
        },
      ],
    }).compile();

    return module.get(EmailService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    send = jest
      .fn()
      .mockResolvedValue({ data: { id: 'email-id' }, error: null });
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: { send },
    }));
  });

  it('reports not configured without RESEND_API_KEY', async () => {
    service = await createService({});
    expect(service.isConfigured()).toBe(false);
  });

  it('initializes Resend client when API key is present', async () => {
    service = await createService({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM: 'noreply@test.com',
    });

    expect(Resend).toHaveBeenCalledWith('re_test_key');
    expect(service.isConfigured()).toBe(true);
  });

  it('sends email when configured', async () => {
    service = await createService({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM: 'noreply@test.com',
    });

    await expect(
      service.send({
        to: 'recipient@test.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(true);

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@test.com',
        to: 'recipient@test.com',
        subject: 'Subject',
      }),
    );
  });

  it('returns false when Resend is not configured', async () => {
    service = await createService({});

    await expect(
      service.send({
        to: 'recipient@test.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(false);
  });

  it('returns false when Resend reports an error', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'failed' } });

    service = await createService({
      RESEND_API_KEY: 're_test_key',
    });

    await expect(
      service.send({
        to: 'recipient@test.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(false);
  });
});
