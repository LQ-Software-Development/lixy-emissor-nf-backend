import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../services/email.service';

const sendMock = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

describe('EmailService', () => {
  let service: EmailService;

  const createService = (config: Record<string, string | undefined>) => {
    return Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => config[key],
          },
        },
      ],
    }).compile();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sendMock.mockResolvedValue({ data: { id: 'email-id' }, error: null });
  });

  it('reports not configured when RESEND_API_KEY is missing', async () => {
    const module = await createService({});
    service = module.get(EmailService);

    expect(service.isConfigured()).toBe(false);
    await expect(
      service.send({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(false);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends email via Resend when configured', async () => {
    const module = await createService({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM: 'noreply@test.com',
    });
    service = module.get(EmailService);

    expect(service.isConfigured()).toBe(true);

    const sent = await service.send({
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Hello</p>',
    });

    expect(sent).toBe(true);
    expect(sendMock).toHaveBeenCalledWith({
      from: 'noreply@test.com',
      to: 'user@test.com',
      subject: 'Test',
      html: '<p>Hello</p>',
      text: 'Hello',
    });
  });

  it('returns false when Resend reports an error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'delivery failed' },
    });

    const module = await createService({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM: 'noreply@test.com',
    });
    service = module.get(EmailService);

    await expect(
      service.send({
        to: 'user@test.com',
        subject: 'Test',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(false);
  });
});
