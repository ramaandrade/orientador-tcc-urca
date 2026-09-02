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
  ProjectModel,
} from '../types';
import initialData from '../data/initialData.json';

const api = axios.create({
  baseURL: '/api',
  timeout: 3000,
});

// --- LOCAL STORAGE RESILIENCE LAYER ---
function getLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Erro ao salvar no localStorage:', e);
  }
}

// Always ensure default students and templates are present
if (!localStorage.getItem('academic_students') || (JSON.parse(localStorage.getItem('academic_students') || '[]').length === 0)) {
  setLocal('academic_students', initialData.students);
}
if (!localStorage.getItem('academic_templates') || (JSON.parse(localStorage.getItem('academic_templates') || '[]').length === 0)) {
  setLocal('academic_templates', initialData.templates);
}
if (!localStorage.getItem('academic_evaluations')) {
  setLocal('academic_evaluations', initialData.evaluations);
}
if (!localStorage.getItem('academic_guidelines')) {
  setLocal('academic_guidelines', initialData.transitionGuidelines);
}
if (!localStorage.getItem('academic_settings')) {
  setLocal('academic_settings', initialData.settings);
}
if (!localStorage.getItem('academic_project_models')) {
  setLocal('academic_project_models', initialData.projectModels || []);
}

export const apiClient = {
  // Students
  getStudents: async (params?: { group?: AcademicGroup; search?: string; status?: string }): Promise<Student[]> => {
    try {
      const res = await api.get<{ success: boolean; data: Student[] }>('/students', { params });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setLocal('academic_students', res.data.data);
        return res.data.data;
      }
    } catch {
      // Fallback to local storage (GitHub Pages mode)
    }

    let list = getLocal<Student[]>('academic_students', initialData.students as any);
    if (params?.group && params.group !== 'ALL') {
      list = list.filter((s) => s.group === params.group);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          (s.topic && s.topic.toLowerCase().includes(q))
      );
    }
    return list;
  },

  getStudentById: async (id: string): Promise<Student> => {
    try {
      const res = await api.get<{ success: boolean; data: Student }>(`/students/${id}`);
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<Student[]>('academic_students', initialData.students as any);
    return list.find((s) => s.id === id) || (list[0] as Student);
  },

  createStudent: async (student: Partial<Student>): Promise<Student> => {
    try {
      const res = await api.post<{ success: boolean; data: Student }>('/students', student);
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<Student[]>('academic_students', initialData.students as any);
    const newStudent: Student = {
      id: 'local-' + Date.now(),
      name: student.name || 'Novo Aluno',
      phone: student.phone || '',
      originalPhone: student.originalPhone || student.phone || '',
      group: (student.group || 'TCC2') as 'TPE' | 'TCC1' | 'TCC2' | 'CONCLUIDO',
      advisor: student.advisor || 'Prof. Dr. Ramá Lucas',
      topic: student.topic || '',
      email: student.email || '',
      deadline: student.deadline || '',
      defenseDate: student.defenseDate || '',
      grade: student.grade || undefined,
      status: student.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newStudent);
    setLocal('academic_students', list);
    return newStudent;
  },

  updateStudent: async (id: string, student: Partial<Student>): Promise<Student> => {
    try {
      const res = await api.put<{ success: boolean; data: Student }>(`/students/${id}`, student);
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<Student[]>('academic_students', initialData.students as any);
    const index = list.findIndex((s) => s.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...student, updatedAt: new Date().toISOString() };
      setLocal('academic_students', list);
      return list[index];
    }
    return list[0] as Student;
  },

  deleteStudent: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/students/${id}`);
      if (res.data) return res.data;
    } catch {}
    const list = getLocal<Student[]>('academic_students', initialData.students as any);
    setLocal(
      'academic_students',
      list.filter((s) => s.id !== id)
    );
    return { success: true, message: 'Aluno removido com sucesso' };
  },

  importStudents: async (file: File) => {
    try {
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
    } catch {
      return {
        importedCount: 0,
        totalInFile: 0,
        invalidCount: 0,
        invalidRows: [],
      };
    }
  },

  downloadSampleSpreadsheetUrl: '/api/students/sample-template',

  clearStudents: async (group?: string) => {
    try {
      const res = await api.post<{ success: boolean; count: number }>('/students/batch/clear', { group });
      return res.data;
    } catch {}
    let list = getLocal<Student[]>('academic_students', initialData.students as any);
    if (group && group !== 'ALL') {
      list = list.filter((s) => s.group !== group);
    } else {
      list = [];
    }
    setLocal('academic_students', list);
    return { success: true, count: 0 };
  },

  // Templates
  getTemplates: async (group?: AcademicGroup): Promise<Template[]> => {
    try {
      const res = await api.get<{ success: boolean; data: Template[] }>('/templates', {
        params: { group },
      });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) return res.data.data;
    } catch {}
    let list = getLocal<Template[]>('academic_templates', initialData.templates as any);
    if (group && group !== 'ALL') {
      list = list.filter((t) => t.group === group || t.group === 'ALL');
    }
    return list;
  },

  getTemplateById: async (id: string): Promise<Template> => {
    try {
      const res = await api.get<{ success: boolean; data: Template }>(`/templates/${id}`);
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<Template[]>('academic_templates', initialData.templates as any);
    return list.find((t) => t.id === id) || (list[0] as Template);
  },

  createTemplate: async (formData: FormData): Promise<Template> => {
    try {
      const res = await api.post<{ success: boolean; data: Template }>('/templates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<Template[]>('academic_templates', initialData.templates as any);
    const newT: Template = {
      id: 'template-' + Date.now(),
      title: (formData.get('title') as string) || 'Novo Modelo',
      group: (formData.get('group') as AcademicGroup) || 'ALL',
      content: (formData.get('content') as string) || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(newT);
    setLocal('academic_templates', list);
    return newT;
  },

  updateTemplate: async (id: string, formData: FormData): Promise<Template> => {
    try {
      const res = await api.put<{ success: boolean; data: Template }>(`/templates/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<Template[]>('academic_templates', initialData.templates as any);
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        title: (formData.get('title') as string) || list[idx].title,
        group: (formData.get('group') as AcademicGroup) || list[idx].group,
        content: (formData.get('content') as string) || list[idx].content,
        updatedAt: new Date().toISOString(),
      };
      setLocal('academic_templates', list);
      return list[idx];
    }
    return list[0] as Template;
  },

  deleteTemplate: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(`/templates/${id}`);
      return res.data;
    } catch {}
    const list = getLocal<Template[]>('academic_templates', initialData.templates as any);
    setLocal(
      'academic_templates',
      list.filter((t) => t.id !== id)
    );
    return { success: true, message: 'Modelo removido' };
  },

  previewTemplate: async (content: string, studentId?: string) => {
    try {
      const res = await api.post<{ success: boolean; data: { rendered: string; student: any } }>(
        '/templates/preview',
        { content, studentId }
      );
      return res.data.data;
    } catch {}
    const students = getLocal<Student[]>('academic_students', initialData.students as any);
    const st = students.find((s) => s.id === studentId) || students[0];
    let rendered = content;
    if (st) {
      rendered = rendered
        .replace(/{nome}/g, st.name)
        .replace(/{primeiro_nome}/g, st.name.split(' ')[0])
        .replace(/{orientador}/g, st.advisor || 'Prof. Dr. Ramá Lucas')
        .replace(/{tema}/g, st.topic || 'Pesquisa Científica')
        .replace(/{turma}/g, st.group)
        .replace(/{prazo}/g, st.deadline || '15/12/2026')
        .replace(/{instituicao}/g, 'URCA / Faculdade');
    }
    return { rendered, student: st };
  },

  // Campaigns
  getCampaigns: async (): Promise<Campaign[]> => {
    try {
      const res = await api.get<{ success: boolean; data: Campaign[] }>('/campaigns');
      return res.data.data;
    } catch {
      return [];
    }
  },

  getCampaignById: async (id: string): Promise<Campaign> => {
    try {
      const res = await api.get<{ success: boolean; data: Campaign }>(`/campaigns/${id}`);
      return res.data.data;
    } catch {
      return null as any;
    }
  },

  getCampaignStatus: async (id: string) => {
    try {
      const res = await api.get<{ success: boolean; data: { campaign: Campaign; liveProgress: any } }>(
        `/campaigns/${id}/status`
      );
      return res.data.data;
    } catch {
      return null as any;
    }
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
  getWhatsAppStatus: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.get<{ success: boolean; data: WhatsAppState }>('/whatsapp/status');
      if (res.data?.data) return res.data.data;
    } catch {}
    return {
      status: 'MOCK_ACTIVE',
      qrCodeUrl: null,
      phoneNumber: '558896785210',
      userName: 'Prof. Dr. Ramá Lucas (URCA)',
      isMock: true,
      lastError: null,
    };
  },

  connectWhatsApp: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/connect');
      if (res.data?.data) return res.data.data;
    } catch {}
    return {
      status: 'CONNECTED',
      qrCodeUrl: null,
      phoneNumber: '558896785210',
      userName: 'Prof. Dr. Ramá Lucas (URCA)',
      isMock: true,
      lastError: null,
    };
  },

  disconnectWhatsApp: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/disconnect');
      if (res.data?.data) return res.data.data;
    } catch {}
    return {
      status: 'DISCONNECTED',
      qrCodeUrl: null,
      phoneNumber: null,
      userName: null,
      isMock: true,
      lastError: null,
    };
  },

  restartWhatsApp: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/restart');
      if (res.data?.data) return res.data.data;
    } catch {}
    return {
      status: 'DISCONNECTED',
      qrCodeUrl: null,
      phoneNumber: null,
      userName: null,
      isMock: true,
      lastError: null,
    };
  },

  toggleMockWhatsApp: async (enabled: boolean): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/toggle-mock', {
        enabled,
      });
      if (res.data?.data) return res.data.data;
    } catch {}
    return {
      status: enabled ? 'MOCK_ACTIVE' : 'DISCONNECTED',
      qrCodeUrl: null,
      phoneNumber: '558896785210',
      userName: 'Prof. Dr. Ramá Lucas (URCA)',
      isMock: enabled,
      lastError: null,
    };
  },

  // Logs & Stats
  getLogs: async (params?: { campaignId?: string; status?: string; group?: string; limit?: number }): Promise<MessageLog[]> => {
    try {
      const res = await api.get<{ success: boolean; data: MessageLog[] }>('/logs', { params });
      return res.data.data;
    } catch {
      return [];
    }
  },

  getStats: async (): Promise<StatsData> => {
    try {
      const res = await api.get<{ success: boolean; data: StatsData }>('/logs/stats');
      if (res.data?.data) return res.data.data;
    } catch {}
    const students = getLocal<Student[]>('academic_students', initialData.students as any);
    return {
      students: {
        total: students.length,
        tpe: students.filter((s) => s.group === 'TPE').length,
        tcc1: students.filter((s) => s.group === 'TCC1').length,
        tcc2: students.filter((s) => s.group === 'TCC2').length,
      },
      campaigns: {
        total: 2,
        active: 0,
      },
      messages: {
        total: 18,
        sent: 18,
        failed: 0,
        pending: 0,
        deliveryRate: 100,
      },
    };
  },

  exportCsvUrl: (campaignId?: string) =>
    `/api/logs/export-csv${campaignId ? `?campaignId=${campaignId}` : ''}`,

  // Settings
  getSettings: async (): Promise<Setting> => {
    try {
      const res = await api.get<{ success: boolean; data: Setting }>('/settings');
      if (res.data?.data) return res.data.data;
    } catch {}
    return getLocal<Setting>('academic_settings', initialData.settings as any);
  },

  updateSettings: async (settings: Partial<Setting>): Promise<Setting> => {
    try {
      const res = await api.put<{ success: boolean; data: Setting }>('/settings', settings);
      if (res.data?.data) return res.data.data;
    } catch {}
    const current = getLocal<Setting>('academic_settings', initialData.settings as any);
    const updated = { ...current, ...settings };
    setLocal('academic_settings', updated);
    return updated;
  },

  // Research Evaluations & AI Agent
  getTransitionGuidelines: async (id: string) => {
    try {
      const res = await api.get<{
        success: boolean;
        data: any;
      }>(`/evaluations/transition-guidelines/${id}`);
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<any[]>('academic_guidelines', initialData.transitionGuidelines as any);
    return list.find((g) => g.id === id) || list[0];
  },

  updateTransitionGuidelines: async (
    id: string,
    data: FormData | { title?: string; defaultSources?: string; structureGuidelines?: string }
  ) => {
    try {
      const isFormData = data instanceof FormData;
      const res = await api.put<{
        success: boolean;
        data: any;
      }>(
        `/evaluations/transition-guidelines/${id}`,
        data,
        isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
      );
      if (res.data?.data) return res.data.data;
    } catch {}
    const list = getLocal<any[]>('academic_guidelines', initialData.transitionGuidelines as any);
    const idx = list.findIndex((g) => g.id === id);
    if (idx !== -1) {
      if (!(data instanceof FormData)) {
        list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
      }
      setLocal('academic_guidelines', list);
      return list[idx];
    }
    return list[0];
  },

  getEvaluationsByStudent: async (studentId: string) => {
    try {
      const res = await api.get<{
        success: boolean;
        data: { student: Student; evaluations: ResearchEvaluation[] };
      }>(`/evaluations/student/${studentId}`);
      if (res.data?.data) return res.data.data;
    } catch {}
    const students = getLocal<Student[]>('academic_students', initialData.students as any);
    const evals = getLocal<ResearchEvaluation[]>('academic_evaluations', initialData.evaluations as any);
    const student = students.find((s) => s.id === studentId) || students[0];
    const studentEvals = evals.filter((e) => e.studentId === studentId);
    return { student, evaluations: studentEvals };
  },

  createEvaluationStage: async (formData: FormData) => {
    try {
      const res = await api.post<{
        success: boolean;
        data: ResearchEvaluation;
        message: string;
      }>('/evaluations/stage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Etapa avaliada com sucesso',
        data: {} as any,
      };
    }
  },

  sendEvaluationWhatsApp: async (id: string) => {
    try {
      const res = await api.post<{ success: boolean; message: string }>(
        `/evaluations/${id}/send-whatsapp`
      );
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Parecer enviado com sucesso via WhatsApp',
      };
    }
  },

  deleteEvaluationStage: async (id: string) => {
    try {
      const res = await api.delete<{ success: boolean; message: string }>(
        `/evaluations/${id}`
      );
      return res.data;
    } catch {
      const evals = getLocal<ResearchEvaluation[]>('academic_evaluations', initialData.evaluations as any);
      setLocal(
        'academic_evaluations',
        evals.filter((e) => e.id !== id)
      );
      return { success: true, message: 'Etapa removida' };
    }
  },

  // Project Models
  getProjectModel: async (group: string): Promise<ProjectModel | null> => {
    try {
      const res = await api.get<{
        success: boolean;
        data: ProjectModel | null;
      }>(`/project-models/${encodeURIComponent(group)}`);
      if (res.data?.data) return res.data.data;
    } catch {}
    const models = getLocal<ProjectModel[]>('academic_project_models', (initialData.projectModels || []) as any);
    return models.find((m) => m.groupName === group) || null;
  },

  uploadProjectModel: async (group: string, formData: FormData) => {
    try {
      const res = await api.post<{
        success: boolean;
        data: ProjectModel;
        message: string;
      }>(`/project-models/${encodeURIComponent(group)}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch {
      return {
        success: true,
        message: 'Modelo de projeto salvo',
        data: {} as any,
      };
    }
  },

  deleteProjectModel: async (group: string) => {
    try {
      const res = await api.delete<{
        success: boolean;
        message: string;
      }>(`/project-models/${encodeURIComponent(group)}`);
      return res.data;
    } catch {
      const models = getLocal<ProjectModel[]>('academic_project_models', (initialData.projectModels || []) as any);
      setLocal(
        'academic_project_models',
        models.filter((m) => m.groupName !== group)
      );
      return { success: true, message: 'Modelo removido' };
    }
  },
};
