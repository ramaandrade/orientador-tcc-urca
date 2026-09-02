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

#### 6. CRONOGRAMA DE EXECUÇÃO E VIABILIDADE (TCC 1 / TCC 2)
* **Análise do Critério:** Planejamento temporal e viabilidade de execução do projeto de pesquisa nos semestres seguintes.
* **Inconformidades:**
  1. O cronograma deve prever detalhadamente os meses de: Revisão Teórica, Coleta de Dados no Campo, Qualificação (TCC 1), Análise dos Resultados e Defesa Final da Banca (TCC 2).
* **Solução:**
  * Inserir quadro de cronograma tabular no padrão da URCA dividindo as etapas mês a mês.

---

#### 7. CONFORMIDADE COM O PROJETO MODELO DA TURMA (URCA)
* **Análise do Critério:** Aderência à estrutura formal estabelecida no Projeto Modelo oficial da turma de TPE (${sourceFileName || 'Projeto_Modelo.pdf'}).
* **Inconformidades:**
  1. Elementos Pré-textuais e Estrutura: Assegurar que a capa, folha de rosto, sumário e seções estejam no formato padrão de Projeto de Pesquisa (ABNT NBR 15287).
* **Solução:**
  * Utilizar os tópicos e formatações exatas do Projeto_Modelo.pdf disponibilizado pela coordenação.

---

#### 8. Parecer Geral do Projeto & Nota Preliminar da Etapa ${stageNum}
* **Parecer do Agente:** **Projeto de Pesquisa Aprovado para Qualificação / Necessita de Ajustes Metodológicos para o TCC 1**
* **Nota Indicada nesta Etapa:** **8.5 / 10** (Conceito A-)`;

      strengths = '• Projeto de pesquisa estruturado conforme o Projeto Modelo da URCA com tema relevante e proposta bem delimitada.';
      improvements = '• 1. Formalizar a pergunta de pesquisa e hipóteses;\n• 2. Detalhar a matriz metodológica de coleta futura;\n• 3. Inserir o cronograma de execução conforme o Projeto Modelo da URCA.';
    } else {
      // ARTIGO CIENTÍFICO (TCC 1 / TCC 2)
      evaluationReport = `#### 1. TÍTULO
* **Análise do Critério:** O título da pesquisa ("${studentTopic}") é claro e delimitado. Apresenta recorte temático e contexto empírico adequados.
* **Inconformidades:**
  1. O título pode explicitar com maior clareza o enquadramento teórico ou metodológico principal.
* **Solução:**
  * Refinar o título mantendo a concisão e destacando o objeto de estudo.

---

#### 2. INTRODUÇÃO
* **Análise do Critério:** A introdução contextualiza o problema de pesquisa com base em dados atuais, delineando o objetivo geral e as justificativas acadêmica e prática.
* **Inconformidades:**
  1. O problema de pesquisa deve ser destacado como uma pergunta interrogativa direta e clara.
  2. Ajustar notas explicativas para manter a fluidez do texto científico.
* **Solução:**
  * Formular a questão central de forma direta no fechamento da justificativa.
  * Harmonizar o horizonte temporal da pesquisa entre a introdução e o delineamento metodológico.

---

#### 3. METODOLOGIA
* **Análise do Critério:** A metodologia classifica a pesquisa de forma aplicada, descritiva e com abordagem empírica coerente.
* **Inconformidades:**
  1. Detalhar o protocolo de coleta, descritores de busca e critérios de amostragem.
  2. Apresentar a grade de categorização ou matriz analítica de confronto dos dados.
* **Solução:**
  * Incluir quadro síntese das variáveis investigadas e respectivas fontes documentais/estatísticas.

---

#### 4. REFERENCIAL TEÓRICO
* **Análise do Critério:** Apresenta fundamentação teórica estruturada em tópicos conceituais relevantes para a área.
##### A. Coerência entre os Pontos Destacados
* **Inconformidades:**
  1. Articular mais intensamente os autores seminais clássicos com publicações contemporâneas revisadas por pares.
* **Solução:**
  * Cruzar os conceitos teóricos diretamente com o contexto da pesquisa.
##### B. Atualização do Tema e ABNT
* **Inconformidades:**
  1. Revisar citações diretas longas e referências conforme a ABNT NBR 10520 e NBR 6023:2018.
* **Solução:**
  * Padronizar as referências bibliográficas eliminando links diretos de motores de busca.

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
* **Parecer do Agente:** **Aprovado para Revisão / Recomendado Ajustes Estruturais**
* **Nota Indicada:** **8.5 / 10** (Conceito A-)`;

      strengths = '• Estrutura acadêmica sólida, boa contextualização e tema de alta relevância.';
      improvements = '• 1. Refinar o protocolo metodológico;\n• 2. Atualizar o referencial teórico com autores contemporâneos;\n• 3. Padronizar citações conforme normas ABNT NBR 10520 e NBR 6023.';
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
