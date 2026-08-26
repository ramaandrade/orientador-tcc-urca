export type AcademicGroup = 'ALL' | 'TPE' | 'TCC1' | 'TCC2' | 'CONCLUIDO';

export interface Student {
  id: string;
  name: string;
  phone: string;
  originalPhone?: string;
  group: 'TPE' | 'TCC1' | 'TCC2' | 'CONCLUIDO';
  advisor?: string;
  topic?: string;        // Título da Pesquisa
  email?: string;
  deadline?: string;
  defenseDate?: string;  // Data da Defesa
  grade?: string;        // Nota
  status: 'ACTIVE' | 'INACTIVE' | 'DEFENDED';
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  title: string;
  group: AcademicGroup;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface Campaign {
  id: string;
  title: string;
  targetGroup: AcademicGroup;
  templateId?: string;
  messageContent: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  status: CampaignStatus;
  minDelay: number;
  maxDelay: number;
  scheduledAt?: string;
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM';
  recurrenceDays?: number;
  nextRunAt?: string;
  startedAt?: string;
  completedAt?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  logs?: MessageLog[];
  liveProgress?: CampaignProgress;
}

export interface CampaignProgress {
  campaignId: string;
  status: CampaignStatus;
  total: number;
  processed: number;
  sent: number;
  failed: number;
  currentRecipient?: string;
  logs: Array<{
    id: string;
    studentName: string;
    phone: string;
    status: string;
    time: string;
    error?: string;
  }>;
}

export type MessageLogStatus = 'PENDING' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export interface MessageLog {
  id: string;
  campaignId?: string;
  studentId?: string;
  recipientName: string;
  recipientPhone: string;
  recipientGroup: string;
  renderedMessage: string;
  hasAttachment: boolean;
  status: MessageLogStatus;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Setting {
  id: string;
  mockMode: boolean;
  defaultMinDelay: number;
  defaultMaxDelay: number;
  batchSize: number;
  batchPauseSeconds: number;
  institutionName: string;
  coordinatorName: string;
  updatedAt: string;
}

export type WhatsAppConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED' | 'MOCK_ACTIVE';

export interface WhatsAppState {
  status: WhatsAppConnectionStatus;
  qrCodeUrl: string | null;
  phoneNumber: string | null;
  userName: string | null;
  isMock: boolean;
  lastError: string | null;
}

export interface StatsData {
  students: {
    total: number;
    tpe: number;
    tcc1: number;
    tcc2: number;
  };
  campaigns: {
    total: number;
    active: number;
  };
  messages: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    deliveryRate: number;
  };
}

export interface ResearchEvaluation {
  id: string;
  studentId: string;
  stageNumber: number;
  stageTitle: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  sourceFileName?: string;
  sourceFileUrl?: string;
  criteriaText: string;
  sourceRefText?: string;
  evaluationReport: string;
  strengths?: string;
  improvements?: string;
  suggestedGrade?: string;
  status: 'PENDING' | 'PROCESSING' | 'EVALUATED';
  createdAt: string;
  updatedAt: string;
}

export interface ProjectModel {
  id: string;
  groupName: string;
  title: string;
  fileName: string;
  fileUrl: string;
  filePath?: string;
  fileSize: number;
  fileType?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
