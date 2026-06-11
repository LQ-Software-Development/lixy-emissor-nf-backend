export interface DasReminder {
  userId: string;
  dasCode: string;
  barcode: string;
  dueDate: Date;
  amount: number;
  userEmail?: string;
  userPhone?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  metadata?: Record<string, any>;
}
