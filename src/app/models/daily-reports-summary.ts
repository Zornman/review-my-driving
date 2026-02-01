export type DailyReportStatus = 'submitted' | 'waived' | 'pending' | 'missing';

export type DailyReportPhoto = {
  slot: string;
  url?: string | null;
  mongoFileId?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  size?: number | null;
};

export type DailyReportsSummaryRow = {
  reportDateLocal: string;
  truckId: string | null;
  truckObjectId: any;
  driverObjectId: any;
  driverName: string | null;
  driverEmail: string | null;
  truckLabel: string | null;

  status: DailyReportStatus;

  token?: {
    kind: string;
    sentAt: any;
    expiresAt: any;
    usedAt: any;
  } | null;

  report?: {
    submittedAt: any;
    odometer: number | null;
    issues: string | null;
    issuesSummary: string | null;
    photos: DailyReportPhoto[];
    missingPhotoSlots?: string[];
  } | null;
};

export type DailyReportsSummaryDay = {
  reportDateLocal: string;
  totals: {
    expected: number;
    submitted: number;
    waived: number;
    pending: number;
    missing: number;
  };
  rows: DailyReportsSummaryRow[];
};

export type DailyReportsSummaryResult = {
  businessId: any;
  startDateLocal: string;
  endDateLocal: string;
  days: DailyReportsSummaryDay[];
};

export type DailyReportsSummaryResponse = {
  message: string;
  result: DailyReportsSummaryResult;
};
