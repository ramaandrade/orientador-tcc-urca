import axios from 'axios';
import {
  Student,
  Template,
  Campaign,
  MessageLog,
  Setting,
  WhatsAppState,
  StatsData,
  AcademicGroup,
  ResearchEvaluation,
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const apiClient = {
  // Students
  getStudents: async (params?: { group?: AcademicGroup; search?: string; status?: string }) => {
    const res = await api.get<{ success: boolean; data: Student[] }>('/students', { params });
    return res.data.data;
  },
  getStudentById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Student }>(`/students/${id}`);
    return res.data.data;
  },
  createStudent: async (student: Partial<Student>) => {
    const res = await api.post<{ success: boolean; data: Student }>('/students', student);
    return res.data.data;
  },
  updateStudent: async (id: string, student: Partial<Student>) => {
    const res = await api.put<{ success: boolean; data: Student }>(`/students/${id}`, student);
    return res.data.data;
  },
  deleteStudent: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/students/${id}`);
    return res.data;
  },
  importStudents: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<{
      success: boolean;
      data: {
        importedCount: number;
        totalInFile: number;
        invalidCount: number;
        invalidRows: any[];
      };
    }>('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  downloadSampleSpreadsheetUrl: '/api/students/sample-template',
  clearStudents: async (group?: string) => {
    const res = await api.post<{ success: boolean; count: number }>('/students/batch/clear', { group });
    return res.data;
  },

  // Templates
  getTemplates: async (group?: AcademicGroup) => {
    const res = await api.get<{ success: boolean; data: Template[] }>('/templates', {
      params: { group },
    });
    return res.data.data;
  },
  getTemplateById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Template }>(`/templates/${id}`);
    return res.data.data;
  },
  createTemplate: async (formData: FormData) => {
    const res = await api.post<{ success: boolean; data: Template }>('/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  updateTemplate: async (id: string, formData: FormData) => {
    const res = await api.put<{ success: boolean; data: Template }>(`/templates/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  deleteTemplate: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/templates/${id}`);
    return res.data;
  },
  previewTemplate: async (content: string, studentId?: string) => {
    const res = await api.post<{ success: boolean; data: { rendered: string; student: any } }>(
      '/templates/preview',
      { content, studentId }
    );
    return res.data.data;
  },

  // Campaigns
  getCampaigns: async () => {
    const res = await api.get<{ success: boolean; data: Campaign[] }>('/campaigns');
    return res.data.data;
  },
  getCampaignById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Campaign }>(`/campaigns/${id}`);
    return res.data.data;
  },
  getCampaignStatus: async (id: string) => {
    const res = await api.get<{ success: boolean; data: { campaign: Campaign; liveProgress: any } }>(
      `/campaigns/${id}/status`
    );
    return res.data.data;
  },
  createCampaign: async (formData: FormData) => {
    const res = await api.post<{ success: boolean; data: Campaign; recipientsCount: number }>(
      '/campaigns',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
  startCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/campaigns/${id}/start`);
    return res.data;
  },
  pauseCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/campaigns/${id}/pause`);
    return res.data;
  },
  resumeCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/campaigns/${id}/resume`);
    return res.data;
  },
  cancelCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/campaigns/${id}/cancel`);
    return res.data;
  },
  retryFailedCampaign: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(`/campaigns/${id}/retry-failed`);
    return res.data;
  },
  deleteCampaign: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(`/campaigns/${id}`);
    return res.data;
  },

  // WhatsApp
  getWhatsAppStatus: async () => {
    const res = await api.get<{ success: boolean; data: WhatsAppState }>('/whatsapp/status');
    return res.data.data;
  },
  connectWhatsApp: async () => {
    const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/connect');
    return res.data.data;
  },
  disconnectWhatsApp: async () => {
    const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/disconnect');
    return res.data.data;
  },
  restartWhatsApp: async () => {
    const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/restart');
    return res.data.data;
  },
  toggleMockWhatsApp: async (enabled: boolean) => {
    const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/toggle-mock', {
      enabled,
    });
    return res.data.data;
  },

  // Logs & Stats
  getLogs: async (params?: { campaignId?: string; status?: string; group?: string; limit?: number }) => {
    const res = await api.get<{ success: boolean; data: MessageLog[] }>('/logs', { params });
    return res.data.data;
  },
  getStats: async () => {
    const res = await api.get<{ success: boolean; data: StatsData }>('/logs/stats');
    return res.data.data;
  },
  exportCsvUrl: (campaignId?: string) =>
    `/api/logs/export-csv${campaignId ? `?campaignId=${campaignId}` : ''}`,

  // Settings
  getSettings: async () => {
    const res = await api.get<{ success: boolean; data: Setting }>('/settings');
    return res.data.data;
  },
  updateSettings: async (settings: Partial<Setting>) => {
    const res = await api.put<{ success: boolean; data: Setting }>('/settings', settings);
    return res.data.data;
  },

  // Research Evaluations & AI Agent
  getTransitionGuidelines: async (id: string) => {
    const res = await api.get<{
      success: boolean;
      data: {
        id: string;
        stageOrigin: string;
        stageTarget: string;
        title: string;
        defaultSources: string;
        structureGuidelines: string;
        sourceFileName?: string;
        sourceFileUrl?: string;
        sourceFilePath?: string;
        updatedAt: string;
      };
    }>(`/evaluations/transition-guidelines/${id}`);
    return res.data.data;
  },
  updateTransitionGuidelines: async (id: string, data: FormData | { title?: string; defaultSources?: string; structureGuidelines?: string }) => {
    const isFormData = data instanceof FormData;
    const res = await api.put<{
      success: boolean;
      data: any;
    }>(`/evaluations/transition-guidelines/${id}`, data, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : undefined);
    return res.data.data;
  },
  getEvaluationsByStudent: async (studentId: string) => {
    const res = await api.get<{
      success: boolean;
      data: { student: Student; evaluations: ResearchEvaluation[] };
    }>(`/evaluations/student/${studentId}`);
    return res.data.data;
  },
  createEvaluationStage: async (formData: FormData) => {
    const res = await api.post<{
      success: boolean;
      data: ResearchEvaluation;
      message: string;
    }>('/evaluations/stage', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  sendEvaluationWhatsApp: async (id: string) => {
    const res = await api.post<{ success: boolean; message: string }>(
      `/evaluations/${id}/send-whatsapp`
    );
    return res.data;
  },
  deleteEvaluationStage: async (id: string) => {
    const res = await api.delete<{ success: boolean; message: string }>(
      `/evaluations/${id}`
    );
    return res.data;
  },

  // Project Models (CRUD Projeto Modelo Padrão: TPE, TCC 1, TCC 2)
  getProjectModel: async (group: string) => {
    const res = await api.get<{
      success: boolean;
      data: import('../types').ProjectModel | null;
    }>(`/project-models/${encodeURIComponent(group)}`);
    return res.data.data;
  },
  uploadProjectModel: async (group: string, formData: FormData) => {
    const res = await api.post<{
      success: boolean;
      data: import('../types').ProjectModel;
      message: string;
    }>(`/project-models/${encodeURIComponent(group)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  deleteProjectModel: async (group: string) => {
    const res = await api.delete<{
      success: boolean;
      message: string;
    }>(`/project-models/${encodeURIComponent(group)}`);
    return res.data;
  },
};
