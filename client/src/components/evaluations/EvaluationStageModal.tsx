import React, { useState, useEffect } from 'react';
import { Student, ProjectModel } from '../../types';
import {
  X,
  Upload,
  Sparkles,
  BookOpen,
  FileText,
  FileCode,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Globe,
  Compass,
  ArrowRight,
  Save,
  Bookmark,
  Library,
  Paperclip,
  Trash2,
  Download,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface EvaluationStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentStageCount: number;
  onEvaluationCreated: () => void;
}

export const EvaluationStageModal: React.FC<EvaluationStageModalProps> = ({
  isOpen,
  onClose,
  student,
  currentStageCount,
  onEvaluationCreated,
}) => {
  const nextStageNumber = currentStageCount + 1;
  const isTpe = student.group.toUpperCase().includes('TPE');
  const isTcc1 = student.group.toUpperCase().includes('TCC 1') || student.group.toUpperCase().includes('TCC1');
  const targetStage = isTpe ? 'TCC 1' : isTcc1 ? 'TCC 2' : 'Banca de Defesa Final';
  const transitionId = isTpe ? 'TPE_TO_TCC1' : 'TCC1_TO_TCC2';

  const [mode, setMode] = useState<'STANDARD' | 'PLAGIARISM' | 'ROADMAP'>('STANDARD');
  const [stageTitle, setStageTitle] = useState(`Etapa ${nextStageNumber} — ${nextStageNumber === 1 ? 'Versão Inicial' : `Revisão ${nextStageNumber - 1}`}`);
  const [file, setFile] = useState<File | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [criteriaText, setCriteriaText] = useState(
    `1. Adequação da estrutura acadêmica (Introdução, Objetivos, Metodologia e Fundamentação).\n2. Coerência entre o título da pesquisa ("${student.topic || 'Tema do Aluno'}") e o conteúdo redigido.\n3. Aplicação correta das normas da ABNT nas citações e referências.\n4. Clareza e rigor metodológico na proposta.`
  );
  const [sourceRefText, setSourceRefText] = useState('');
  
  // CRUD Projeto Modelo da Turma (TPE, TCC 1, TCC 2)
  const [groupModel, setGroupModel] = useState<ProjectModel | null>(null);
  const [useGroupModel, setUseGroupModel] = useState<boolean>(true);
  const [isUploadingGroupModel, setIsUploadingGroupModel] = useState<boolean>(false);
  const [isDeletingGroupModel, setIsDeletingGroupModel] = useState<boolean>(false);
  const [modelActionSuccess, setModelActionSuccess] = useState<string | null>(null);

  // Transition persistent sources & attached manual
  const [transitionSources, setTransitionSources] = useState('');
  const [transitionSourceFile, setTransitionSourceFile] = useState<File | null>(null);
  const [persistedFileName, setPersistedFileName] = useState<string | null>(null);
  const [isSavingDefaultSources, setIsSavingDefaultSources] = useState(false);
  const [savedSourceSuccess, setSavedSourceSuccess] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-configured official source libraries
  const librarySourcesTCC1 = [
    { 
      title: 'Correções 2 (Diretrizes Deep Model URCA)', 
      isHighlighted: true,
      fileUrl: '/docs/Modelo_Correcoes_2_URCA.txt',
      fileName: 'Modelo_Correcoes_2_URCA.txt',
      text: 'Modelo de Correções 2 (Diretrizes e Diagnóstico Aprofundado URCA):\n• 1. Título: Delimitação temática e alinhamento com lentes teóricas centrais (evitar omitir teorias seminais).\n• 2. Introdução: Eliminação de notas de rodapé manualescas/enciclopédicas, harmonização temporal das datas com a metodologia e inclusão explícita das teorias no problema/objetivos.\n• 3. Metodologia: Protocolo exato de busca e descritores, definição da unidade de análise e operacionalização rigorosa da Análise de Conteúdo (Bardin, 2011) com quadro de dimensões.\n• 4. Referencial Teórico:\n  A. Coerência: Reorganização por eixos temáticos limpos (Normativo/Filosófico vs Econômico/Institucional) e aprofundamento de conceitos-chave (path dependence, custos de transação).\n  B. Atualização & ABNT: Reenquadrar relatórios de mercado (McKinsey) como exemplos e priorizar literatura revisada por pares; incluir literatura crítica contemporânea; sanitizar referências removendo links de buscadores (Bing/Google) conforme ABNT NBR 6023.\n• 5/6. Regra Estrutural: Resultados e Considerações Finais apenas em TCC 2.' 
    },
    { 
      title: 'Roteiro de Desenvolvimento do TCC 1', 
      isHighlighted: true,
      fileUrl: '/docs/Roteiro_Desenvolvimento_TCC1.txt',
      fileName: 'Roteiro_Desenvolvimento_TCC1.txt',
      text: 'Roteiro de Desenvolvimento do TCC 1: 5 Passos Estruturantes (Passo 1: Elementos Pré-Textuais; Passo 2: Introdução em texto corrido com Contextualização, Justificativa acadêmica/prática, Problema em pergunta direta, Hipótese, Objetivos fluidos e Estrutura do Artigo; Passo 3: Metodologia com Classificação/Delineamento, Unidade de Análise, Amostragem, Instrumentos e Análise de Dados; Passo 4: Referencial Teórico de 5 a 6 páginas com autores clássicos/contemporâneos, debate e Estado da Arte; Passo 5: Referências ABNT NBR 6023:2018. Avisos: expansão sem reescrita, eliminação do cronograma e resumo somente em TCC 2).' 
    },
    { 
      title: 'Critérios de Pesquisa TCC 1 (URCA)', 
      isHighlighted: true,
      fileUrl: '/docs/Criterios_Pesquisa_TCC1_URCA.txt',
      fileName: 'Criterios_Pesquisa_TCC1_URCA.txt',
      text: 'Critérios Verificados na Pesquisa TCC 1 da URCA: 1. Título claro e delimitado; 2. Introdução (Contextualização com dados, Justificativa teórica/prática, Objetivos geral e específicos, Problema de pesquisa, Relevância/Contribuição e Estrutura); 3. Metodologia (Natureza/Abordagem, Delineamento da pesquisa, Campo/Unidade de análise, Amostragem e Coleta/Análise); 4. Referencial Teórico (Conceitos-chave, Estado da Arte e Diálogo/confronto entre autores); 5. Diretrizes Estruturais: Resultados, Discussões e Considerações Finais NÃO fazem parte do TCC 1 (exclusivos do TCC 2).' 
    },
    { title: 'Manual de Artigo TCC 1', text: 'Manual de Estrutura de Artigo Científico e Qualificação de TCC 1 (Colegiado de Curso).' },
    { title: 'Normas ABNT (NBR 14724/10520)', text: 'Normas ABNT NBR 14724 (Trabalhos Acadêmicos), NBR 10520 (Citações) e NBR 6023 (Referências).' },
    { title: 'Metodologia & Amostragem (Gil)', text: 'Delineamento Metodológico, Classificação de Pesquisa e Matriz de Coleta (Gil / Marconi & Lakatos).' },
    { title: 'Bases Qualis/Capes & SciELO', text: 'Periódicos indexados Qualis/Capes, SciELO, Google Acadêmico e Repositórios Universitários.' },
    { title: 'Microdados do TCE-CE / IEGM', text: 'Base oficial de microdados do IEGM (TCE-CE) nas dimensões de Governança, Tecnologia e Gestão.' },
    { title: 'IBGE Cidades & Dados MUNIC', text: 'Perfil dos Municípios Brasileiros (MUNIC/IBGE) e dados censitários socioeconômicos.' },
  ];

  const librarySourcesTCC2 = [
    { 
      title: 'Correções 2 (Diretrizes Deep Model URCA)', 
      isHighlighted: true,
      fileUrl: '/docs/Modelo_Correcoes_2_URCA.txt',
      fileName: 'Modelo_Correcoes_2_URCA.txt',
      text: 'Modelo de Correções 2 (Diretrizes e Diagnóstico Aprofundado URCA):\n• 1. Título: Delimitação temática e alinhamento com lentes teóricas centrais (evitar omitir teorias seminais).\n• 2. Introdução: Eliminação de notas de rodapé manualescas/enciclopédicas, harmonização temporal das datas com a metodologia e inclusão explícita das teorias no problema/objetivos.\n• 3. Metodologia: Protocolo exato de busca e descritores, definição da unidade de análise e operacionalização rigorosa da Análise de Conteúdo (Bardin, 2011) com quadro de dimensões.\n• 4. Referencial Teórico:\n  A. Coerência: Reorganização por eixos temáticos limpos (Normativo/Filosófico vs Econômico/Institucional) e aprofundamento de conceitos-chave (path dependence, custos de transação).\n  B. Atualização & ABNT: Reenquadrar relatórios de mercado (McKinsey) como exemplos e priorizar literatura revisada por pares; incluir literatura crítica contemporânea; sanitizar referências removendo links de buscadores (Bing/Google) conforme ABNT NBR 6023.\n• 5. Resultados e Discussões: Apresentação tabular/gráfica IBGE/ABNT e confrontação teórica.\n• 6. Considerações Finais: Resposta ao problema, contribuições e recomendações práticas.' 
    },
    { 
      title: 'Critérios TCC 2 (URCA)', 
      isHighlighted: true,
      fileUrl: '/docs/Criterios_Pesquisa_TCC2_URCA.txt',
      fileName: 'Criterios_Pesquisa_TCC2_URCA.txt',
      text: 'Critérios Verificados na Pesquisa TCC 2 da URCA: 1. Título definitivo delimitado; 2. Introdução consolidada articulando problema e objetivos; 3. Metodologia executada (Delineamento, Unidade de análise, Amostragem, Coleta e Análise de dados); 4. Referencial Teórico com conceitos e Estado da Arte; 5. Resultados e Discussões (TCC 2: Apresentação tabular/gráfica IBGE/ABNT, Análise crítica, Confrontação teórica e Validação expressa das hipóteses); 6. Considerações Finais (TCC 2: Resposta ao problema, Contribuições, Recomendações práticas e Novas investigações).' 
    },
    { title: 'Manual de Defesa TCC 2', text: 'Manual de Apresentação, Redação Final e Defesa de TCC 2 em Banca Examinadora.' },
    { title: 'Guia de Tabulação de Dados', text: 'Diretrizes de Coleta, Tabulação de Microdados e Construção de Variáveis Empíricas.' },
    { title: 'Análise de Conteúdo & Triangulação', text: 'Técnicas de Análise de Conteúdo (Bardin) e Triangulação de Dados Quantitativos e Qualitativos.' },
    { title: 'Normas de Tabelas IBGE', text: 'Normas de Apresentação Tabular da Fundação IBGE e ABNT para Quadros e Gráficos.' },
    { title: 'Critérios da Banca Examinadora', text: 'Critérios de Avaliação da Banca: Rigor analítico, originalidade, discussão teórica e recomendações práticas.' },
  ];

  // Load persistent transition sources and group model on mount or when opening
  useEffect(() => {
    if (isOpen) {
      // Clean and initialize research file and parameters for this student
      setFile(null);
      setSourceFile(null);
      setTransitionSourceFile(null);
      setError(null);
      setMode('STANDARD');
      setStageTitle(
        isTpe
          ? `Projeto de Pesquisa — ${nextStageNumber === 1 ? 'Versão Inicial' : `Revisão ${nextStageNumber - 1}`}`
          : `Etapa ${nextStageNumber} — ${nextStageNumber === 1 ? 'Versão Inicial' : `Revisão ${nextStageNumber - 1}`}`
      );
      if (isTpe) {
        setCriteriaText(
          `1. Adequação à estrutura formal do Projeto de Pesquisa (conforme Projeto Modelo da URCA: Problematização, Objetivos, Metodologia Proposta e Fundamentação).\n2. Coerência temática do Título e aderência da proposta ao tema ("${student.topic || 'Tema do Projeto'}").\n3. Clareza da Pergunta de Pesquisa e Definição de Hipóteses/Pressupostos.\n4. Procedimentos Metodológicos Propostos (Classificação, Unidade de Análise e Coleta de Dados).\n5. Cronograma de Execução e Viabilidade para TCC 1/TCC 2.\n6. Aplicação correta das normas da ABNT para Projetos (NBR 15287 e NBR 6023).`
        );
      } else if (isTcc1) {
        setCriteriaText(
          `1. Adequação da estrutura do Artigo de Qualificação de TCC 1 (Introdução, Metodologia e Referencial Teórico).\n2. Coerência entre o título da pesquisa ("${student.topic || 'Tema do Aluno'}") e o conteúdo redigido.\n3. Aplicação correta das normas da ABNT nas citações e referências.\n4. Clareza e rigor metodológico na proposta.`
        );
      } else {
        setCriteriaText(
          `1. Adequação da estrutura do Artigo Completo de TCC 2 (Introdução, Metodologia, Referencial Teórico, Resultados/Discussões e Considerações Finais).\n2. Coerência e consistência dos Resultados com os Objetivos propostos.\n3. Apresentação gráfica e tabular conforme normas IBGE/ABNT.\n4. Confrontação crítica com o referencial teórico e normas ABNT NBR 6023.`
        );
      }
      setSourceRefText('');

      // 1. Fetch Group Project Model ONLY for TPE
      if (isTpe) {
        apiClient.getProjectModel('TPE')
          .then((model) => setGroupModel(model))
          .catch((err) => console.warn('Nenhum projeto modelo encontrado para TPE', err));
      } else {
        setGroupModel(null);
      }

      // 2. Fetch Transition Guidelines
      apiClient.getTransitionGuidelines(transitionId)
        .then((data) => {
          if (data?.defaultSources) {
            setTransitionSources(data.defaultSources);
          }
          if (data?.sourceFileName) {
            setPersistedFileName(data.sourceFileName);
          }
        })
        .catch(() => {
          // Fallback defaults
          if (isTpe) {
            setTransitionSources(
              `1. Manual de Estrutura de Artigo Científico e Qualificação de TCC 1 (Colegiado).\n2. Normas ABNT NBR 14724 (Trabalhos Acadêmicos), NBR 10520 (Citações) e NBR 6023 (Referências).\n3. Bases de Dados Acadêmicas Qualis/Capes, SciELO, Google Acadêmico e Repositórios Institucionais.\n4. Fontes Primárias e Secundárias: Portais de Transparência, TCE-CE, IBGE e IPEA.`
            );
          } else {
            setTransitionSources(
              `1. Manual de Apresentação, Redação Final e Defesa de TCC 2.\n2. Diretrizes de Coleta, Tabulação e Tratamento de Dados (Microdados, Questionários, Entrevistas).\n3. Critérios de Avaliação da Banca Examinadora: Rigor analítico, originalidade e consistência dos resultados.\n4. Normas ABNT para Apresentação Tabular (IBGE), Gráficos e Ilustrações.`
            );
          }
        });
    }
  }, [isOpen, student.id, student.topic, student.group, transitionId, nextStageNumber, isTpe]);

  if (!isOpen) return null;

  const handleSetStandardMode = () => {
    setMode('STANDARD');
    setStageTitle(`Etapa ${nextStageNumber} — ${nextStageNumber === 1 ? 'Versão Inicial' : `Revisão ${nextStageNumber - 1}`}`);
  };

  const handleSetPlagiarismMode = () => {
    if (mode === 'PLAGIARISM') {
      handleSetStandardMode();
    } else {
      setMode('PLAGIARISM');
      setStageTitle(`Auditoria de Plágio & IA — Etapa ${nextStageNumber}`);
    }
  };

  const handleSetRoadmapMode = () => {
    if (mode === 'ROADMAP') {
      handleSetStandardMode();
    } else {
      setMode('ROADMAP');
      setStageTitle(`Passos para o ${targetStage} — Roteiro Didático`);
    }
  };

  const addLibrarySourceToText = (sourceText: string) => {
    setTransitionSources((prev) => {
      if (!prev.trim()) return `• ${sourceText}`;
      if (prev.includes(sourceText)) return prev;
      return `${prev}\n• ${sourceText}`;
    });
  };

  // CRUD Handler: Upload / Replace Project Model for the Student's Group (TPE, TCC 1, TCC 2)
  const handleUploadGroupModel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const fileToUpload = e.target.files[0];
    setIsUploadingGroupModel(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('title', `Projeto Modelo Padrão — ${student.group}`);
      formData.append('groupName', student.group);
      const res = await apiClient.uploadProjectModel(student.group, formData);
      setGroupModel(res.data);
      setModelActionSuccess(`Projeto Modelo (${fileToUpload.name}) salvo como padrão para todos em ${student.group}!`);
      setTimeout(() => setModelActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Erro ao fazer upload do Projeto Modelo: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsUploadingGroupModel(false);
    }
  };

  // CRUD Handler: Delete Project Model
  const handleDeleteGroupModel = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o Projeto Modelo padrão de ${student.group}?`)) return;
    setIsDeletingGroupModel(true);
    try {
      await apiClient.deleteProjectModel(student.group);
      setGroupModel(null);
      setModelActionSuccess(`Projeto Modelo de ${student.group} removido.`);
      setTimeout(() => setModelActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Erro ao excluir Projeto Modelo: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsDeletingGroupModel(false);
    }
  };

  const handleSaveDefaultSources = async () => {
    setIsSavingDefaultSources(true);
    try {
      const formData = new FormData();
      formData.append('title', `Diretrizes & Fontes Estruturantes: Transição ${student.group} ➔ ${targetStage}`);
      formData.append('defaultSources', transitionSources);
      if (transitionSourceFile) {
        formData.append('file', transitionSourceFile);
      }

      await apiClient.updateTransitionGuidelines(transitionId, formData as any);
      setSavedSourceSuccess(true);
      if (transitionSourceFile) {
        setPersistedFileName(transitionSourceFile.name);
      }
      setTimeout(() => setSavedSourceSuccess(false), 3500);
    } catch (err: any) {
      alert('Erro ao salvar fontes padrão: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsSavingDefaultSources(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSourceFile(e.target.files[0]);
    }
  };

  const handleTransitionSourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTransitionSourceFile(e.target.files[0]);
    }
  };

  const addCriteriaSnippet = (snippet: string) => {
    setCriteriaText((prev) => prev ? `${prev}\n• ${snippet}` : `• ${snippet}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'STANDARD' && !criteriaText.trim()) {
      setError('Por favor, defina os parâmetros e critérios que o Agente IA deve considerar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('stageTitle', stageTitle.trim());
      formData.append('isPlagiarismCheck', mode === 'PLAGIARISM' ? 'true' : 'false');
      formData.append('isNextStageRoadmap', mode === 'ROADMAP' ? 'true' : 'false');
      formData.append('targetStage', targetStage);
      formData.append('useGroupModel', useGroupModel ? 'true' : 'false');

      if (mode === 'PLAGIARISM') {
        formData.append('criteriaText', 'Auditoria de Similaridade Web e Detecção de Texto Sintético (IA)');
      } else if (mode === 'ROADMAP') {
        formData.append('criteriaText', transitionSources.trim() || 'Diretrizes curriculares e normas estruturantes do colegiado.');
        if (transitionSourceFile) {
          formData.append('sourceFile', transitionSourceFile);
        } else if (sourceFile) {
          formData.append('sourceFile', sourceFile);
        }
      } else {
        formData.append('criteriaText', criteriaText.trim());
        if (sourceRefText.trim()) {
          formData.append('sourceRefText', sourceRefText.trim());
        }
        if (sourceFile) {
          formData.append('sourceFile', sourceFile);
        }
      }

      if (file) {
        formData.append('file', file);
      } else {
        const defaultDocName = `Artigo_${student.name.replace(/\s+/g, '_')}_Versao_Inicial.docx`;
        const virtualFile = new File(['Pesquisa Acadêmica do Discente ' + student.name], defaultDocName, {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
        formData.append('file', virtualFile);
      }

      await apiClient.createEvaluationStage(formData);
      onEvaluationCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao processar avaliação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mode === 'ROADMAP' 
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                : mode === 'PLAGIARISM'
                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            }`}>
              {mode === 'ROADMAP' ? <Compass className="w-4 h-4" /> : mode === 'PLAGIARISM' ? <ShieldCheck className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                {mode === 'ROADMAP' 
                  ? `Passos para o ${targetStage}`
                  : mode === 'PLAGIARISM'
                  ? 'Verificação de Plágio & IA na Web'
                  : 'Nova Etapa de Avaliação com Agente IA'}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  mode === 'ROADMAP'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : mode === 'PLAGIARISM'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {mode === 'ROADMAP' ? `Transição: ${student.group} ➔ ${targetStage}` : `Etapa ${nextStageNumber}`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Discente: <strong className="text-slate-200">{student.name}</strong> (Turma Atual: {student.group})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Topic Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Tema da Pesquisa Cadastrado:</span>
              <p className="text-slate-200 mt-0.5 italic">
                "{student.topic || 'Não especificado — o agente considerará o título contido no arquivo'}"
              </p>
            </div>
          </div>

          {/* Top Dedicated Action Buttons (Plagiarism vs Next Stage Roadmap) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Button 1: Plagiarism & AI Check */}
            <button
              type="button"
              onClick={handleSetPlagiarismMode}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                mode === 'PLAGIARISM'
                  ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                mode === 'PLAGIARISM' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Verificação de Plágio e uso de IA</span>
                  {mode === 'PLAGIARISM' && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-900 text-purple-200 border border-purple-700">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                  Varredura de originalidade na Web e detecção de texto por IA (&lt; 20%, meta ~10%).
                </p>
              </div>
            </button>

            {/* Button 2: Next Stage Roadmap */}
            <button
              type="button"
              onClick={handleSetRoadmapMode}
              className={`p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                mode === 'ROADMAP'
                  ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${
                mode === 'ROADMAP' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                <Compass className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Passos para Próxima Etapa</span>
                  {mode === 'ROADMAP' && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-900 text-cyan-200 border border-cyan-700">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                  De <strong>{student.group}</strong> para <strong>{targetStage}</strong> com autores e fontes estruturantes.
                </p>
              </div>
            </button>
          </div>

          {/* Stage Title */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Título / Identificação do Documento
            </label>
            <input
              type="text"
              required
              value={stageTitle}
              onChange={(e) => setStageTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* File Upload (Student's research project) */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Arquivo da Pesquisa do Aluno (.PDF, .DOCX, .DOC ou .TXT) <span className="text-rose-400">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 bg-slate-950/60 text-center transition-colors">
              <input
                type="file"
                id="researchFile"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="researchFile" className="cursor-pointer flex flex-col items-center justify-center">
                {file ? (
                  <div className="flex items-center justify-between w-full px-3 py-2 bg-emerald-950/40 border border-emerald-800 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs truncate">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10.5px]">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-slate-400 hover:text-slate-200 text-[11px] underline">Trocar</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setFile(null);
                        }}
                        className="px-2 py-0.5 text-[10.5px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-md transition-colors"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-slate-500 mb-1.5" />
                    <span className="font-semibold text-slate-200">Clique para selecionar o trabalho do aluno</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Suporta PDF, Microsoft Word (.docx) ou Texto (.txt)</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* MODE 1: ROADMAP TO NEXT STAGE (TPE ➔ TCC 1 ou TCC 1 ➔ TCC 2) */}
          {mode === 'ROADMAP' && (
            <div className="bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/40 border border-cyan-800/60 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs">
                  <Bookmark className="w-4 h-4 text-cyan-400" />
                  <span>Fontes & Diretrizes Estruturantes para {targetStage}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Transição {student.group} ➔ {targetStage}
                </span>
              </div>

              {/* 1. Quick Selectable Library of Official Sources */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Library className="w-3.5 h-3.5 text-cyan-400" />
                  Biblioteca de Fontes Oficiais Relacionadas ao {targetStage} (Clique para Inserir):
                </label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(isTpe ? librarySourcesTCC1 : librarySourcesTCC2).map((item) => (
                    <div
                      key={item.title}
                      className={`inline-flex items-center rounded-lg border transition-all shadow-sm overflow-hidden ${
                        (item as any).isHighlighted
                          ? 'bg-emerald-950/90 border-emerald-700/90 font-bold ring-1 ring-emerald-500/30'
                          : 'bg-cyan-950/80 border-cyan-800/80 font-medium'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => addLibrarySourceToText(item.text)}
                        className={`px-2.5 py-1 text-[10.5px] transition-colors flex items-center gap-1 cursor-pointer ${
                          (item as any).isHighlighted
                            ? 'text-emerald-200 hover:text-white hover:bg-emerald-900'
                            : 'text-cyan-200 hover:text-white hover:bg-cyan-900'
                        }`}
                      >
                        <span>+ {item.title}</span>
                      </button>
                      {(item as any).fileUrl && (
                        <a
                          href={(item as any).fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={(item as any).fileName || 'documento.txt'}
                          className={`px-2 py-1 border-l transition-colors flex items-center ${
                            (item as any).isHighlighted
                              ? 'text-emerald-400 hover:text-white hover:bg-emerald-800 border-emerald-700/60'
                              : 'text-cyan-400 hover:text-white hover:bg-cyan-800 border-cyan-800/60'
                          }`}
                          title={`Baixar / Visualizar ${item.title}`}
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Source Text / Parameters Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Diretrizes e Fontes Institucionais Configuradas:
                  </label>
                  {savedSourceSuccess && (
                    <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="w-3 h-3" /> Salvo como padrão para todos!
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={transitionSources}
                  onChange={(e) => setTransitionSources(e.target.value)}
                  placeholder="Liste os manuais, normas, autores e diretrizes do colegiado..."
                  className="w-full bg-slate-950 border border-cyan-900/60 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed font-mono text-[11px]"
                />
              </div>

              {/* 3. Upload of Official Source / Manual File */}
              <div className="border border-dashed border-cyan-900/80 hover:border-cyan-500 rounded-xl p-3 bg-slate-950/60 text-center transition-colors">
                <input
                  type="file"
                  id="transitionSourceFile"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleTransitionSourceFileChange}
                  className="hidden"
                />
                <label htmlFor="transitionSourceFile" className="cursor-pointer flex items-center justify-center space-x-2 text-xs">
                  {transitionSourceFile ? (
                    <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>Manual anexado: <strong>{transitionSourceFile.name}</strong> ({(transitionSourceFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setTransitionSourceFile(null);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-[10px] underline ml-2"
                      >
                        Remover
                      </button>
                    </div>
                  ) : persistedFileName ? (
                    <div className="flex items-center space-x-2 text-cyan-300 font-medium">
                      <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Manual padrão salvo: <strong>{persistedFileName}</strong></span>
                      <span className="text-slate-400 text-[10.5px] underline ml-2">Clique para substituir</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-cyan-400" />
                      <span className="text-slate-200 font-medium">Fazer upload do arquivo de Manual / Diretrizes do {targetStage} (.pdf, .docx, .txt)</span>
                    </>
                  )}
                </label>
              </div>

              {/* 4. Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleSaveDefaultSources}
                  disabled={isSavingDefaultSources}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDefaultSources ? 'Salvando...' : `💾 Salvar fontes e manual como padrão institucional para ${targetStage}`}</span>
                </button>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Outros parâmetros manuais inativados</span>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: PLAGIARISM & AI DETECTION */}
          {mode === 'PLAGIARISM' && (
            <div className="bg-gradient-to-br from-purple-950/40 via-slate-950 to-indigo-950/40 border border-purple-800/60 rounded-2xl p-5 space-y-3.5 shadow-xl animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Diretrizes da Auditoria de Integridade Acadêmica (Agente IA na Web)</span>
              </div>
              <div className="text-[11px] text-slate-300 space-y-2 leading-relaxed">
                <p>
                  🛡️ <strong>Varredura de Similaridade na Web:</strong> O Agente IA extrairá o texto integral do arquivo e verificará a correspondência com bases acadêmicas, artigos e fontes abertas na Internet (teto &lt; 20%, ideal ~10%).
                </p>
                <p>
                  🤖 <strong>Detecção de Padrões Sintéticos (IA):</strong> Análise de perplexidade, uniformidade sintática e densidade de conectores padronizados para estimar a probabilidade de geração por IA.
                </p>
                <p>
                  💡 <strong>Diagnóstico Didático com Trechos Reais:</strong> O parecer apontará com precisão quais parágrafos necessitam de paráfrase e como citar corretamente.
                </p>
              </div>
              <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-800/40 flex items-center gap-2 text-[11px] text-purple-200">
                <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Os parâmetros de orientação metodológica e fontes manuais foram inativados neste modo.</span>
              </div>
            </div>
          )}

          {/* MODE 3: STANDARD PROFESSOR EVALUATION */}
          {mode === 'STANDARD' && (
            <>
              {/* Professor Evaluation Criteria */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    Parâmetros e Instruções do Professor (Critérios do Agente) <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">O Agente IA usará estas diretrizes</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={criteriaText}
                  onChange={(e) => setCriteriaText(e.target.value)}
                  placeholder="Descreva o que o agente deve cobrar (ex: fundamentação teórica, normas ABNT, clareza metodológica, consistência)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed font-mono text-[11px]"
                />
                {/* Quick Chips & Official URCA Criteria Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {/* + Critérios TCC 1 Button & Link */}
                  <div className="inline-flex items-center rounded-lg bg-emerald-950/90 border border-emerald-700 shadow-sm overflow-hidden ring-1 ring-emerald-500/20">
                    <button
                      type="button"
                      onClick={() => addCriteriaSnippet(
                        `Critérios Verificados na Pesquisa TCC 1 (URCA):\n• Título delimitado com teoria explícita e tempo.\n• Introdução em texto corrido (Contextualização, Justificativa, Problema em pergunta direta, Hipótese, Objetivos fluidos e Estrutura).\n• Metodologia replicável (Natureza/Abordagem, Delineamento, Unidade de análise, Amostragem e Coleta/Processamento de dados).\n• Referencial Teórico com confronto de autores e Parágrafo de Estado da Arte.\n• Regra Estrutural: Resultados, Discussões e Considerações Finais NÃO entram em TCC 1 (exclusivos de TCC 2). Referências ABNT NBR 6023.`
                      )}
                      className="px-2.5 py-1 text-emerald-200 hover:text-white hover:bg-emerald-800 text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Acrescentar os Critérios Oficiais de TCC 1 aos parâmetros do agente"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Critérios TCC 1</span>
                    </button>
                    <a
                      href="/docs/Criterios_Pesquisa_TCC1_URCA.txt"
                      target="_blank"
                      rel="noreferrer"
                      download="Criterios_Pesquisa_TCC1_URCA.txt"
                      className="px-2 py-1 text-emerald-400 hover:text-white hover:bg-emerald-800 border-l border-emerald-700/80 transition-colors flex items-center"
                      title="Baixar / Visualizar Arquivo de Critérios TCC 1"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>

                  {/* + Critérios TCC 2 Button & Link */}
                  <div className="inline-flex items-center rounded-lg bg-indigo-950/90 border border-indigo-700 shadow-sm overflow-hidden ring-1 ring-indigo-500/20">
                    <button
                      type="button"
                      onClick={() => addCriteriaSnippet(
                        `Critérios Verificados na Pesquisa TCC 2 (URCA):\n• Título definitivo delimitado.\n• Introdução consolidada articulando problema e objetivos.\n• Metodologia executada (Delineamento, Unidade de análise, Amostragem, Coleta e Análise).\n• Referencial Teórico com conceitos e Estado da Arte.\n• Resultados e Discussões (TCC 2): Apresentação clara de tabelas/gráficos IBGE/ABNT, análise crítica, confrontação teórica e validação expressa das hipóteses.\n• Considerações Finais (TCC 2): Resposta ao problema, contribuições, recomendações práticas a gestores e novas investigações.`
                      )}
                      className="px-2.5 py-1 text-indigo-200 hover:text-white hover:bg-indigo-800 text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Acrescentar os Critérios Oficiais de TCC 2 aos parâmetros do agente"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      <span>+ Critérios TCC 2</span>
                    </button>
                    <a
                      href="/docs/Criterios_Pesquisa_TCC2_URCA.txt"
                      target="_blank"
                      rel="noreferrer"
                      download="Criterios_Pesquisa_TCC2_URCA.txt"
                      className="px-2 py-1 text-indigo-400 hover:text-white hover:bg-indigo-800 border-l border-indigo-700/80 transition-colors flex items-center"
                      title="Baixar / Visualizar Arquivo de Critérios TCC 2"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>

                  {/* + Correções 2 Button & Link */}
                  <div className="inline-flex items-center rounded-lg bg-purple-950/90 border border-purple-600 shadow-sm overflow-hidden ring-1 ring-purple-500/30">
                    <button
                      type="button"
                      onClick={() => addCriteriaSnippet(
                        `Modelo de Correções 2 (Diretrizes e Diagnóstico Aprofundado URCA):\n• 1. TÍTULO: Delimitação temática e alinhamento com lentes teóricas centrais (evitar omitir teorias seminais).\n• 2. INTRODUÇÃO: Eliminação de notas de rodapé manualescas/enciclopédicas, harmonização temporal das datas com a metodologia e alinhamento do problema/objetivos com o referencial.\n• 3. METODOLOGIA: Protocolo exato de busca e descritores, definição da unidade de análise e operacionalização rigorosa da Análise de Conteúdo (Bardin, 2011) com quadro de dimensões.\n• 4. REFERENCIAL TEÓRICO:\n  A. Coerência: Reorganização por eixos temáticos limpos (Normativo/Filosófico vs Econômico/Institucional) e aprofundamento de conceitos-chave (path dependence, custos de transação).\n  B. Atualização & ABNT: Reenquadrar relatórios de mercado (McKinsey) como exemplos e priorizar literatura revisada por pares; incluir literatura crítica contemporânea; sanitizar referências removendo links de buscadores (Bing/Google) conforme ABNT NBR 6023.\n• 5/6. Regra Estrutural: Resultados e Considerações Finais apenas em TCC 2.`
                      )}
                      className="px-2.5 py-1 text-purple-200 hover:text-white hover:bg-purple-800 text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Acrescentar o Modelo de Correções 2 aos parâmetros do agente"
                    >
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>+ Correções 2</span>
                    </button>
                    <a
                      href="/docs/Modelo_Correcoes_2_URCA.txt"
                      target="_blank"
                      rel="noreferrer"
                      download="Modelo_Correcoes_2_URCA.txt"
                      className="px-2 py-1 text-purple-400 hover:text-white hover:bg-purple-800 border-l border-purple-700/80 transition-colors flex items-center"
                      title="Baixar / Visualizar Arquivo Modelo de Correções 2"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Standard Quick Chips */}
                  {[
                    'Normas ABNT e Citações',
                    'Consistência Metodológica',
                    'Fundamentação Teórica Sólida',
                    'Clareza na Hipótese/Problema',
                    'Coleta & Tratamento de Dados',
                    'Revisão da Etapa Anterior',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => addCriteriaSnippet(chip)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* CRUD DO PROJETO MODELO PADRÃO (TPE / TCC 1 / TCC 2) & Fonte de Confronto */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    Fonte ou Referencial Teórico de Confronto (Upload & Texto)
                  </label>
                  <span className="text-[10px] text-slate-400">Opcional</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isTpe 
                    ? 'Faça upload do Projeto Modelo oficial da turma de TPE, do artigo-base ou ementa (.PDF, .DOCX, .TXT) para o Agente IA confrontar.' 
                    : 'Faça upload opcional de um artigo-base, ementa ou fonte bibliográfica de referência (.PDF, .DOCX, .TXT) para o Agente IA analisar.'}
                </p>

                {/* CRUD Card: Projeto Modelo Padrão da Turma - EXCLUSIVO PARA TPE */}
                {isTpe && (
                  <div className="bg-slate-900/90 border border-slate-700/70 rounded-xl p-3.5 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-slate-200 text-xs">
                          Projeto Modelo Padrão da Turma (TPE)
                        </span>
                      </div>
                      {groupModel ? (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Modelo Ativo para TPE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Nenhum modelo cadastrado
                        </span>
                      )}
                    </div>

                    {modelActionSuccess && (
                      <div className="p-2 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] rounded-lg flex items-center gap-1.5 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{modelActionSuccess}</span>
                      </div>
                    )}

                    {groupModel ? (
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 text-xs truncate" title={groupModel.fileName}>
                              {groupModel.fileName}
                            </p>
                            <p className="text-[10.5px] text-slate-400">
                              {(groupModel.fileSize / 1024).toFixed(1)} KB • Salvo no CRUD da Turma
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <a
                            href={groupModel.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={groupModel.fileName}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Baixar Projeto Modelo"
                          >
                            <Download className="w-3 h-3" />
                            <span>Baixar</span>
                          </a>

                          {/* Replace Button (CRUD Update) */}
                          <label className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer">
                            <RefreshCw className={`w-3 h-3 ${isUploadingGroupModel ? 'animate-spin' : ''}`} />
                            <span>{isUploadingGroupModel ? 'Substituindo...' : 'Alterar'}</span>
                            <input
                              type="file"
                              accept=".pdf,.docx,.doc,.txt,.md"
                              onChange={handleUploadGroupModel}
                              disabled={isUploadingGroupModel}
                              className="hidden"
                            />
                          </label>

                          {/* Delete Button (CRUD Delete) */}
                          <button
                            type="button"
                            onClick={handleDeleteGroupModel}
                            disabled={isDeletingGroupModel}
                            className="p-1 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            title="Excluir Projeto Modelo do Sistema"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Deletar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-3 bg-slate-950/60 text-center transition-colors">
                        <input
                          type="file"
                          id="uploadGroupModelInput"
                          accept=".pdf,.docx,.doc,.txt,.md"
                          onChange={handleUploadGroupModel}
                          disabled={isUploadingGroupModel}
                          className="hidden"
                        />
                        <label htmlFor="uploadGroupModelInput" className="cursor-pointer flex items-center justify-center space-x-2 text-xs">
                          <Upload className="w-4 h-4 text-emerald-400" />
                          <span className="text-slate-200 font-medium">
                            {isUploadingGroupModel ? 'Salvando Projeto Modelo...' : 'Fazer upload do Projeto_Modelo padrão para TPE (.pdf, .docx, .txt)'}
                          </span>
                        </label>
                      </div>
                    )}

                    {groupModel && (
                      <label className="flex items-center space-x-2 text-[11px] text-slate-300 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={useGroupModel}
                          onChange={(e) => setUseGroupModel(e.target.checked)}
                          className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-950 cursor-pointer"
                        />
                        <span>Confrontar automaticamente a pesquisa do aluno com este Projeto Modelo</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Additional Specific Source File Upload (Optional override) */}
                <div className="border border-dashed border-indigo-900/60 hover:border-indigo-500 rounded-xl p-3 bg-slate-900/60 text-center transition-colors">
                  <input
                    type="file"
                    id="sourceFile"
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={handleSourceFileChange}
                    className="hidden"
                  />
                  <label htmlFor="sourceFile" className="cursor-pointer flex items-center justify-center space-x-2 text-xs">
                    {sourceFile ? (
                      <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        <span>Fonte avulsa anexada: <strong>{sourceFile.name}</strong> ({(sourceFile.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setSourceFile(null);
                          }}
                          className="text-rose-400 hover:text-rose-300 text-[10px] underline ml-2"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-indigo-400" />
                        <span className="text-slate-200 font-medium">Anexar outro arquivo de referência específico (.pdf, .docx, .txt)</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Optional Additional Source Notes */}
                <textarea
                  rows={2}
                  value={sourceRefText}
                  onChange={(e) => setSourceRefText(e.target.value)}
                  placeholder="Observações complementares sobre a fonte ou trechos de destaque para o agente focar..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-[11px]"
                />
              </div>
            </>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer ${
                mode === 'ROADMAP'
                  ? 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-950'
                  : mode === 'PLAGIARISM'
                  ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
              }`}
            >
              {mode === 'ROADMAP' ? (
                <Compass className="w-4 h-4" />
              ) : mode === 'PLAGIARISM' ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              )}
              <span>
                {loading
                  ? (mode === 'ROADMAP'
                      ? `Gerando Roteiro para ${targetStage}...`
                      : mode === 'PLAGIARISM'
                      ? 'Auditando Plágio & IA na Web...'
                      : 'Agente Avaliando Pesquisa...')
                  : (mode === 'ROADMAP'
                      ? `🚀 Gerar Passos para o ${targetStage}`
                      : mode === 'PLAGIARISM'
                      ? '🛡️ Iniciar Auditoria de Plágio & IA na Web'
                      : '🤖 Iniciar Avaliação com IA')}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
