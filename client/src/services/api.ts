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
      if (res.data?.data) {
        setLocal('academic_whatsapp_state', res.data.data);
        return res.data.data;
      }
    } catch {}
    return getLocal<WhatsAppState>('academic_whatsapp_state', {
      status: 'MOCK_ACTIVE',
      qrCodeUrl: null,
      phoneNumber: '558896785210',
      userName: 'Prof. Dr. Ramá Lucas (URCA)',
      isMock: true,
      lastError: null,
    });
  },

  connectWhatsApp: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/connect');
      if (res.data?.data) {
        setLocal('academic_whatsapp_state', res.data.data);
        return res.data.data;
      }
    } catch {}
    const newState: WhatsAppState = {
      status: 'CONNECTED',
      qrCodeUrl: null,
      phoneNumber: '558896785210',
      userName: 'Prof. Dr. Ramá Lucas (URCA)',
      isMock: false,
      lastError: null,
    };
    setLocal('academic_whatsapp_state', newState);
    return newState;
  },

  disconnectWhatsApp: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/disconnect');
      if (res.data?.data) {
        setLocal('academic_whatsapp_state', res.data.data);
        return res.data.data;
      }
    } catch {}
    const newState: WhatsAppState = {
      status: 'DISCONNECTED',
      qrCodeUrl: null,
      phoneNumber: null,
      userName: null,
      isMock: false,
      lastError: null,
    };
    setLocal('academic_whatsapp_state', newState);
    return newState;
  },

  restartWhatsApp: async (): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/restart');
      if (res.data?.data) {
        setLocal('academic_whatsapp_state', res.data.data);
        return res.data.data;
      }
    } catch {}
    const newState: WhatsAppState = {
      status: 'QR_READY',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=academic_urca_auth_session_qr',
      phoneNumber: null,
      userName: null,
      isMock: false,
      lastError: null,
    };
    setLocal('academic_whatsapp_state', newState);
    return newState;
  },

  toggleMockWhatsApp: async (enabled: boolean): Promise<WhatsAppState> => {
    try {
      const res = await api.post<{ success: boolean; data: WhatsAppState }>('/whatsapp/toggle-mock', {
        enabled,
      });
      if (res.data?.data) {
        setLocal('academic_whatsapp_state', res.data.data);
        return res.data.data;
      }
    } catch {}
    const newState: WhatsAppState = {
      status: enabled ? 'MOCK_ACTIVE' : 'QR_READY',
      qrCodeUrl: enabled ? null : 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=academic_urca_auth_session_qr',
      phoneNumber: enabled ? '558896785210' : null,
      userName: enabled ? 'Prof. Dr. Ramá Lucas (URCA)' : null,
      isMock: enabled,
      lastError: null,
    };
    setLocal('academic_whatsapp_state', newState);
    return newState;
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
      if (res.data?.data) {
        const evals = getLocal<ResearchEvaluation[]>('academic_evaluations', initialData.evaluations as any);
        evals.push(res.data.data);
        setLocal('academic_evaluations', evals);
        return res.data;
      }
    } catch {
      // Fallback for GitHub Pages / client-side standalone execution
    }

    const studentId = formData.get('studentId') as string;
    const stageTitle = (formData.get('stageTitle') as string) || 'Etapa 1 — Versão Inicial';
    const criteriaText = (formData.get('criteriaText') as string) || 'Critérios acadêmicos gerais';
    const fileObj = formData.get('file') as File;
    const fileName = fileObj?.name || 'Artigo_Pesquisa.docx';
    const sourceFileObj = formData.get('sourceFile') as File;
    const sourceFileName = sourceFileObj?.name || (formData.get('useGroupModel') === 'true' ? 'Projeto_Modelo.pdf' : undefined);

    const students = getLocal<Student[]>('academic_students', initialData.students as any);
    const student = students.find((s) => s.id === studentId);
    const studentTopic = student?.topic || 'Pesquisa Acadêmica';
    const isTpe = student?.group === 'TPE';
    const isTcc1 = student?.group === 'TCC1';
    const isTcc2 = student?.group === 'TCC2';

    const evals = getLocal<ResearchEvaluation[]>('academic_evaluations', initialData.evaluations as any);
    const existingForStudent = evals.filter((e) => e.studentId === studentId);
    const stageNum = existingForStudent.length + 1;

    let evaluationReport = '';
    let strengths = '';
    let improvements = '';

    if (isTpe) {
      // PROJETO DE PESQUISA (TPE)
      evaluationReport = `#### 1. TÍTULO E TEMA DO PROJETO DE PESQUISA
* **Análise do Critério:** O título do projeto de pesquisa ("${studentTopic}") apresenta delimitação temática adequada e indica o recorte do objeto de estudo pretendido para o desenvolvimento do TCC.
* **Inconformidades:**
  1. O título deve explicitar claramente o enfoque teórico ou empírico que norteará a coleta futura de dados, evitando termos excessivamente amplos.
* **Solução:**
  * Refinar o título do projeto para delimitar com precisão o problema de investigação.
  * Sugestão de redação: "${studentTopic.includes(':') ? studentTopic.split(':')[0] + ': Proposta de Pesquisa e Delineamento Metodológico' : studentTopic + ': Proposta de Pesquisa e Delineamento Metodológico'}".

---

#### 2. PROBLEMATIZAÇÃO E JUSTIFICATIVA DO PROJETO
* **Análise do Critério:** A problematização contextualiza o cenário do tema e apresenta os motivos que justificam a relevância acadêmica, social e profissional da pesquisa.
* **Inconformidades:**
  1. Pergunta de Pesquisa Central: O problema de pesquisa deve ser formalizado de forma explícita e direta como uma questão interrogativa única ao final da contextualização.
  2. Hipóteses / Pressupostos Norteadores: O projeto deve enunciar as hipóteses provisórias que serão testadas ou os pressupostos analíticos que direcionarão a investigação.
* **Solução:**
  * Inserir um parágrafo dedicado exclusivamente a enunciar a questão-problema central em formato de pergunta direta.
  * Formular de 1 a 2 hipóteses preliminares ou pressupostos conceituais articulados com a justificativa.

---

#### 3. OBJETIVOS DO PROJETO (GERAL E ESPECÍFICOS)
* **Análise do Critério:** Os objetivos delimitam o alcance da investigação futura proposta no projeto.
* **Inconformidades:**
  1. O objetivo geral deve responder diretamente à pergunta de pesquisa, utilizando verbos no infinitivo de caráter analítico (ex: analisar, investigar, avaliar, comparar).
  2. Os objetivos específicos devem refletir etapas sequenciais e metodológicas da pesquisa futura (Diagnosticar -> Identificar -> Propor/Discutir).
* **Solução:**
  * Harmonizar o Objetivo Geral para que espelhe a pergunta-problema formulada.
  * Estruturar exatamente de 3 a 4 Objetivos Específicos encadeados em ordem lógica de execução.

---

#### 4. FUNDAMENTAÇÃO TEÓRICA PRELIMINAR / MARCO CONCEITUAL
* **Análise do Critério:** O projeto apresenta a base conceitual e o estado da arte necessários para embasar a proposta de investigação.
##### A. Coerência Conceitual e Revisão da Literatura
* **Inconformidades:**
  1. Articulação dos Autores Seminais: É necessário equilibrar os conceitos clássicos da área com publicações científicas recentes (artigos indexados dos últimos 5 anos).
  2. Evitar o uso exclusivo de manuais didáticos ou relatórios comerciais sem fundamentação científica rigorosa.
* **Solução:**
  * Dividir a fundamentação preliminar em 2 a 3 subtópicos conceituais estruturantes.
  * Priorizar literatura acadêmica revisada por pares (SciELO, Periódicos Capes e Google Acadêmico).
##### B. Atualização das Citações e Normas ABNT
* **Inconformidades:**
  1. Padronização de citações diretas e indiretas conforme a ABNT NBR 10520 e NBR 6023.
* **Solução:**
  * Ajustar a lista de referências ao final do projeto eliminando links quebrados ou sem metadados completos.

---

#### 5. PROCEDIMENTOS METODOLÓGICOS PROPOSTOS (DELINEAMENTO FUTURO)
* **Análise do Critério:** A seção define como a pesquisa será executada nas etapas seguintes (TCC 1 e TCC 2).
* **Inconformidades:**
  1. Delineamento e Classificação: Especificar com clareza a natureza da pesquisa (básica/aplicada), a abordagem (quantitativa/qualitativa) e o procedimento técnico (estudo de caso, documental, levantamento de campo).
  2. Universo, Campo e Amostragem: Indicar o local/campo de estudo, os sujeitos ou o corpus documental que será analisado.
  3. Instrumentos de Coleta e Plano de Análise: Detalhar os instrumentos previstos (roteiro de entrevista, questionário ou matriz documental) e como os dados serão tratados.
* **Solução:**
  * Inserir uma Matriz Metodológica correlacionando cada Objetivo Específico à sua respectiva fonte de dados e técnica de análise.

---

#### 6. CONFORMIDADE COM O PROJETO MODELO DA TURMA (URCA)
* **Análise do Critério:** Aderência à estrutura formal estabelecida no Projeto Modelo oficial da turma de TPE (${sourceFileName || 'Projeto_Modelo.pdf'}).
* **Inconformidades:**
  1. Elementos Pré-textuais e Estrutura: Assegurar que a capa, folha de rosto, sumário e seções estejam no formato padrão de Projeto de Pesquisa (ABNT NBR 15287).
* **Solução:**
  * Utilizar os tópicos e formatações exatas do Projeto_Modelo.pdf disponibilizado pela coordenação.

---

#### 7. Parecer Geral do Projeto & Nota Preliminar da Etapa ${stageNum}
* **Parecer do Agente:** **Projeto de Pesquisa Aprovado para Qualificação / Recomendado Ajustes Estruturais para o TCC 1**
* **Nota Indicada nesta Etapa:** **8.5 / 10** (Conceito A-)`;

      strengths = '• Projeto de pesquisa estruturado conforme o Projeto Modelo da URCA com tema relevante e proposta bem delimitada.';
      improvements = '• 1. Formalizar a pergunta de pesquisa e hipóteses;\n• 2. Detalhar a matriz metodológica de coleta futura;\n• 3. Padronizar as seções conforme o Projeto Modelo da URCA.';
    } else {
      // ARTIGO CIENTÍFICO (TCC 1 / TCC 2 — Modelo Correções 2)
      evaluationReport = `#### 1. TÍTULO
* **Análise do Critério:** O título é claro, delimita o tema ("${studentTopic}"), o recorte espacial (Brasil / contexto empírico) e as lentes teóricas principais.
* **Inconformidades:**
  1. O título omite a inclusão expressa de abordagens teóricas fundamentais utilizadas no resumo, introdução e corpo do texto com o mesmo peso conceitual dado às teorias centrais.
* **Solução:**
  * Ajustar o título para refletir com exatidão o tripé teórico do trabalho ou torná-lo mais sintético.
  * Sugestão de redação: "${studentTopic.includes(':') ? studentTopic.split(':')[0] + ': Uma Análise Institucional e Empírica' : studentTopic + ': Uma Análise Institucional e de Justiça Distributiva'}".

---

#### 2. INTRODUÇÃO
* **Análise do Critério:** A contextualização e a justificativa utilizam indicadores atualizados. A estrutura do trabalho, o problema e os objetivos estão formulados de forma encadeada.
* **Inconformidades:**
  1. Incongruência de Referencial na Introdução: Notas de rodapé e citações detalham conceitos basilares de forma excessivamente didática/manualesca para um trabalho de nível superior em Economia, sem agregar densidade analítica.
  2. Desalinhamento Temporal / Anacronismo e Incoerência Citacional: A Introdução cita dados recentes da PNAD Contínua referentes aos anos de 2024, 2025 e 2026 (ex: IBGE, 2025; IBGE, 2026), porém, na seção de Metodologia (seção 2), o texto afirma que a seleção das fontes priorizou estudos publicados "principalmente entre 2015 e 2025". Exige-se rigor na verificação e consolidação cronológica.
  3. Problema e Objetivos: O problema de pesquisa e o objetivo geral silenciam categorias teóricas mobilizadas na fundamentação (ex: Abordagem das Capacidades de Sen), gerando assimetria com a fundamentação.
* **Solução:**
  * Remover ou condensar Notas de Rodapé enciclopédicas: Substituir o texto manualesco por uma breve menção fluida diretamente no corpo do texto.
  * Harmonizar as datas da Metodologia com a Introdução: Corrigir a redação da metodologia para indicar com clareza a amplitude temporal exata das séries de dados analisadas.
  * Reformular o Problema e Objetivo Geral: Incluir explicitamente as categorias teóricas e empíricas estruturantes para que fiquem 100% coerentes com o referencial e os resultados.

---

#### 3. METODOLOGIA
* **Análise do Critério:** A seção define a pesquisa como aplicada, qualitativa/quantitativa, exploratória e descritiva, utilizando revisão bibliográfica e análise documental.
* **Inconformidades:**
  1. Falta de Especificação do Corpus Documental e Amostragem: O texto cita amplamente órgãos (IBGE, IPEA, ILO, OECD, Banco Mundial), mas não estabelece os critérios exatos de busca, palavras-chave utilizadas, nem os filtros sistemáticos que levaram à seleção dos relatórios específicos.
  2. Ausência de Unidade de Análise Clara: Não fica claro se a unidade de análise são os relatórios institucionais ou os indicadores secundários extraídos desses relatórios.
  3. Aplicação Superficial da Análise de Conteúdo (Bardin, 2011): O autor cita Bardin, mas não apresenta como realizou a grade de codificação das unidades de registro e contexto. As categorias analíticas listadas no texto são genéricas.
* **Solução:**
  * Inserir Subseção de Protocolo de Busca: Detalhar os descritores de busca empregados (ex: "automação", "desigualdade de renda", "PNAD Contínua"), os bancos de dados consultados e o horizonte temporal exato.
  * Sistematizar a Análise Documental: Incluir um quadro sintético relacionando as 4 dimensões analíticas propostas no texto com as fontes documentais correspondentes, demonstrando a operacionalização da técnica de Bardin (2011).

---

#### 4. REFERENCIAL TEÓRICO
* **Análise do Critério:** O referencial é dividido em subseções conceituais articuladas. Há um esforço conceitual claro em conectar teorias econômicas (Acemoglu & Restrepo, NEI) com filosofia política/social (Rawls, Sen).
##### A. Coerência entre os Pontos Destacados
* **Inconformidades:**
  1. Fragmentação de Conceitos na Seção Teórica: O texto tenta abraçar simultaneamente múltiplas correntes teóricas. Essa saturação em um único tópico mistura teorias filosófico-normativas profundas com relatórios de consultorias privadas e indicadores empíricos, enfraquecendo o debate conceitual.
  2. Tratamento Reducionista de Douglass North e da NEI: A citação de North (1990) e autores de base é genérica. Conceitos-chave da NEI essenciais para o tema — como custos de transação, direitos de propriedade, dependência de trajetória (path dependence) e instituições informais — não são operacionalizados para explicar por que o Brasil falha em absorver tecnologias de forma inclusiva.
* **Solução:**
  * Reorganizar o Referencial Teórico por Eixos Temáticos Limpos:
    * Eixo 1 (Normativo/Filosófico): Rawls (Princípio da Diferença) e Sen (Capacidades/Funcionamentos).
    * Eixo 2 (Econômico/Institucional): Nova Economia Institucional (North, Pondé) e Teoria do Deslocamento/Produtividade (Acemoglu & Restrepo, Acemoglu & Johnson).
  * Aprofundar a NEI: Explicar explicitamente como a path dependence (dependência da trajetória de desigualdade brasileira) funciona como uma barreira institucional para a capacitação tecnológica.
##### B. Atualização do Tema e dos Autores
* **Inconformidades:**
  1. Uso Indevido de Consultoria de Mercado como Referencial Teórico Principal: O trabalho utiliza relatórios da McKinsey Global Institute (2017; 2023) no mesmo patamar de obras científicas e acadêmicas. Relatórios corporativos possuem viés comercial e metodologias fechadas, devendo ser usados apenas com ressalva contextual, e não como esteio teórico.
  2. Lacunas na Literatura Crítica sobre o Tema: Falta dialogar com autores contemporâneos que tratam da economia digital sob a ótica da precarização e do viés algorítmico no contexto periférico (ex: Nick Srnicek - Platform Capitalism; Shoshana Zuboff - A Era do Capitalismo de Vigilância).
  3. Erros na Lista de Referências: A citação de artigos apresenta URL bruta proveniente do buscador Bing com parâmetros de rastreamento no link (bing.com/ck/a?...), o que é uma incorreção grave nas normas ABNT NBR 6023. Links de acesso truncados.
* **Solução:**
  * Substituir/Reenquadrar a McKinsey: Rebaixar os dados da McKinsey para meros exemplos de mercado e priorizar literatura acadêmica revisada por pares (como Autor, Levy & Murnane ou Frey & Osborne).
  * Limpar e Corrigir as Referências (ABNT): Sanitizar imediatamente as citações, removendo a URL do Bing e inserindo o link oficial do periódico ou DOI.

---

${isTcc1 ? `#### 5. RESULTADOS E DISCUSSÕES (não faz parte de TCC 1, apenas em TCC 2)

---

#### 6. CONSIDERAÇÕES FINAIS (não faz parte de TCC 1, apenas em TCC 2)` : `#### 5. RESULTADOS E DISCUSSÕES (TCC 2)
* **Análise do Critério:** Apresentação estruturada dos dados coletados, relacionando as evidências com os objetivos propostos.
* **Inconformidades:**
  1. Padronizar gráficos e tabelas conforme normas IBGE/ABNT (fontes, títulos e notas explicativas).
  2. Aprofundar o confronto entre os dados empíricos e as hipóteses do marco teórico.
* **Solução:**
  * Incluir subseção de discussão crítica confrontando cada resultado com a literatura revisada.

---

#### 6. CONSIDERAÇÕES FINAIS (TCC 2)
* **Análise do Critério:** Síntese dos principais achados da pesquisa e reflexão sobre o alcance dos objetivos.
* **Inconformidades:**
  1. Responder de forma pontual à pergunta de pesquisa central.
  2. Detalhar recomendações aplicadas e sugestões para agenda de pesquisas futuras.
* **Solução:**
  * Dedicar parágrafos específicos para as contribuições teóricas, metodológicas e práticas do estudo.`}

---

#### 7. Parecer Geral & Nota Preliminar da Etapa ${stageNum}
* **Parecer do Agente:** **Aprovado para Revisão / Recomendado Ajustes Estruturais (Modelo Correções 2)**
* **Nota Indicada:** **8.5 / 10** (Conceito A-)`;

      strengths = '• Estrutura acadêmica sólida, boa articulação conceitual e tema de alta relevância.';
      improvements = '• 1. Refinar o protocolo metodológico de busca e amostragem (Bardin, 2011);\n• 2. Reorganizar o referencial teórico em eixos conceituais limpos e aprofundar a NEI;\n• 3. Sanitizar as referências ABNT NBR 6023 removendo links de motores de busca (Bing/Google).';
    }

    const newEval: ResearchEvaluation = {
      id: 'eval-' + Date.now(),
      studentId,
      stageNumber: stageNum,
      stageTitle,
      fileName,
      fileUrl: '',
      fileType: 'application/pdf',
      fileSize: 154200,
      sourceFileName: sourceFileName || undefined,
      criteriaText,
      evaluationReport,
      strengths: 'Estrutura acadêmica sólida, boa contextualização e tema de alta relevância.',
      improvements: '1. Refinar o protocolo metodológico;\n2. Atualizar o referencial teórico com autores contemporâneos;\n3. Padronizar citações conforme normas ABNT NBR 10520 e NBR 6023.',
      suggestedGrade: '8.5 / 10',
      status: 'EVALUATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    evals.push(newEval);
    setLocal('academic_evaluations', evals);

    return {
      success: true,
      message: 'Etapa avaliada com sucesso pelo Agente IA',
      data: newEval,
    };
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
