import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../services/email.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('sendEmail', () => {
    it('should return false when transporter is not configured', async () => {
      // SMTP config incomplete
      mockConfigService.get.mockReturnValue(undefined);

      // Re-initialize service
      const newService = new EmailService(configService);

      const result = await newService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test</p>',
      );

      expect(result).toBe(false);
    });
  });

  describe('sendDasReminderEmail', () => {
    it('should return false when transporter is not configured', async () => {
      // SMTP config incomplete
      mockConfigService.get.mockReturnValue(undefined);

      // Re-initialize service
      const newService = new EmailService(configService);

      const result = await newService.sendDasReminderEmail(
        'test@example.com',
        {
          userId: 'user-123',
          dasCode: 'DAS-001',
          barcode: '123456789',
          dueDate: new Date(),
          amount: 150.0,
        },
      );

      expect(result).toBe(false);
    });
  });
});
