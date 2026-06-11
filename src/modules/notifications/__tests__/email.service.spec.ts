import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from '../services/email.service';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('EmailService', () => {
  let service: EmailService;
  const sendMail = jest.fn();

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
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  it('reports not configured without SMTP credentials', async () => {
    service = await createService({});
    expect(service.isConfigured()).toBe(false);
  });

  it('initializes transporter with SMTP credentials', async () => {
    service = await createService({
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user@test.com',
      SMTP_PASS: 'secret',
      SMTP_FROM: 'noreply@test.com',
    });

    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(service.isConfigured()).toBe(true);
  });

  it('sends email when configured', async () => {
    sendMail.mockResolvedValue({ messageId: '1' });

    service = await createService({
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user@test.com',
      SMTP_PASS: 'secret',
      SMTP_FROM: 'noreply@test.com',
    });

    await expect(
      service.send({
        to: 'recipient@test.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(true);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@test.com',
        subject: 'Subject',
      }),
    );
  });

  it('returns false when SMTP is not configured', async () => {
    service = await createService({});

    await expect(
      service.send({
        to: 'recipient@test.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).resolves.toBe(false);
  });
});
