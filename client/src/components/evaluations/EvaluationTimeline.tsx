import React, { useState } from 'react';
import { ResearchEvaluation, Student } from '../../types';
import {
  FileText,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  FileDown,
  Printer,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/api';

interface EvaluationTimelineProps {
  student: Student;
  evaluations: ResearchEvaluation[];
  onRefresh: () => void;
  onNewStageClick: () => void;
}

export const EvaluationTimeline: React.FC<EvaluationTimelineProps> = ({
  student,
  evaluations,
  onRefresh,
  onNewStageClick,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    evaluations.length > 0 ? evaluations[evaluations.length - 1].id : null
  );
  const [sendingWhatsappId, setSendingWhatsappId] = useState<string | null>(null);
  const [whatsappSuccessId, setWhatsappSuccessId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reevaluatingId, setReevaluatingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleReevaluateStage = async (evalItem: ResearchEvaluation) => {
    if (!window.confirm(`Deseja reavaliar a "${evalItem.stageTitle}" com a nova matriz acadêmica atualizada?`)) return;
    setReevaluatingId(evalItem.id);
    try {
      await apiClient.deleteEvaluationStage(evalItem.id);
      const isTpe = student.group.toUpperCase().includes('TPE');
      const isTcc1 = student.group.toUpperCase().includes('TCC 1') || student.group.toUpperCase().includes('TCC1');

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('stageTitle', evalItem.stageTitle);
      formData.append(
        'criteriaText',
        isTpe
          ? `1. Adequação à estrutura formal do Projeto de Pesquisa (conforme Projeto Modelo da URCA: Problematização, Objetivos, Metodologia Proposta e Fundamentação).\n2. Coerência temática do Título e aderência da proposta ao tema ("${student.topic || 'Tema do Projeto'}").\n3. Clareza da Pergunta de Pesquisa e Definição de Hipóteses/Pressupostos.\n4. Procedimentos Metodológicos Propostos (Classificação, Unidade de Análise e Coleta de Dados).\n5. Cronograma de Execução e Viabilidade para TCC 1/TCC 2.\n6. Aplicação correta das normas da ABNT para Projetos (NBR 15287 e NBR 6023).`
          : isTcc1
          ? `1. Adequação da estrutura do Artigo de Qualificação de TCC 1 (Introdução, Metodologia e Referencial Teórico).\n2. Coerência entre o título da pesquisa ("${student.topic || 'Tema do Aluno'}") e o conteúdo redigido.\n3. Aplicação correta das normas da ABNT nas citações e referências.\n4. Clareza e rigor metodológico na proposta.`
          : `1. Adequação da estrutura do Artigo Completo de TCC 2 (Introdução, Metodologia, Referencial Teórico, Resultados/Discussões e Considerações Finais).\n2. Coerência e consistência dos Resultados com os Objetivos propostos.\n3. Apresentação gráfica e tabular conforme normas IBGE/ABNT.\n4. Confrontação crítica com o referencial teórico e normas ABNT NBR 6023.`
      );
      formData.append('useGroupModel', 'true');
      const virtualFile = new File(['Pesquisa Acadêmica'], evalItem.fileName || 'Projeto_de_Pesquisa.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('file', virtualFile);

      await apiClient.createEvaluationStage(formData);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Erro ao reavaliar etapa');
    } finally {
      setReevaluatingId(null);
    }
  };

  const handleSendWhatsApp = async (evalItem: ResearchEvaluation) => {
    setSendingWhatsappId(evalItem.id);
    try {
      // 1. Try local server dispatch if running on localhost backend
      try {
        await apiClient.sendEvaluationWhatsApp(evalItem.id);
      } catch {}

      // 2. Direct WhatsApp Web / Mobile Dispatcher (Opens chat with prefilled message)
      const firstName = student.name.split(' ')[0];
      const rawPhone = student.phone ? student.phone.replace(/\D/g, '') : '';
      const cleanPhone = rawPhone.startsWith('55') ? rawPhone : (rawPhone ? `55${rawPhone}` : '');

      const isTpe = student.group.toUpperCase().includes('TPE');
      const docType = isTpe ? 'Projeto de Pesquisa' : 'Artigo Científico';

      const messageText = `Olá, *${firstName}*! 🎓

Aqui é o seu Orientador de *${student.group}*.
Acabo de concluir a avaliação da sua pesquisa:

📌 *${evalItem.stageTitle}*
📄 *Tipo:* ${docType} (${evalItem.fileName || 'Trabalho Acadêmico'})
⭐ *Nota/Conceito Indicado:* *${evalItem.suggestedGrade || '8.5 / 10'}*

🔍 *Principais Recomendações e Soluções Didáticas:*
${evalItem.improvements || 'Consulte o parecer completo em anexo.'}

Envio em anexo o Parecer Acadêmico Oficial em PDF. Estou à disposição para orientações!`;

      if (cleanPhone) {
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;
        window.open(waUrl, '_blank');
      } else {
        alert(`O aluno ${student.name} não possui um número de WhatsApp cadastrado.`);
      }

      setWhatsappSuccessId(evalItem.id);
      setTimeout(() => setWhatsappSuccessId(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Erro ao enviar WhatsApp');
    } finally {
      setSendingWhatsappId(null);
    }
  };

  const handleDeleteStage = async (evalItem: ResearchEvaluation) => {
    if (!window.confirm(`Deseja realmente excluir a "${evalItem.stageTitle}"?`)) return;
    setDeletingId(evalItem.id);
    try {
      await apiClient.deleteEvaluationStage(evalItem.id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Erro ao excluir etapa');
    } finally {
      setDeletingId(null);
    }
  };

  const downloadEvaluationPdf = (evalItem: ResearchEvaluation) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, autorize pop-ups no seu navegador para baixar o PDF do Parecer.');
      return;
    }

    const cleanReportHtml = (() => {
      let content = evalItem.evaluationReport;
      
      // Unconditionally remove any Parâmetros or Pontos Fortes section or raw criteria quote blocks
      content = content
        .replace(/####\s*(?:1|2)\.\s*🎯\s*Parâmetros[\s\S]*?(?=####\s*(?:1|2|3)\.\s*(?:⭐|🔍|🚀|🌟|🎯|Diagnóstico|Pontos))/i, '')
        .replace(/####\s*(?:1|2)\.\s*⭐\s*Pontos\s*Fortes[\s\S]*?(?=####\s*(?:1|2|3)\.\s*(?:🔍|🚀|🌟|🎯|Diagnóstico))/i, '')
        .replace(/####\s*2\.\s*📚\s*Fontes[\s\S]*?(?=####\s*(?:2|3)\.\s*🧭)/i, '')
        .replace(/###\s*📋[\s\S]*?---\s*/i, '')
        .replace(/###\s*🚀\s*Roteiro[\s\S]*?---\s*/i, '')
        .replace(/###\s*🛡️[\s\S]*?---\s*/i, '');

      return content
        .replace(/```([\s\S]*?)```/g, '<div style="background:#f8fafc; border-left:3.5px solid #0f766e; padding:8px 12px; margin:8px 0; color:#0f172a; font-size:11px; white-space:normal; word-wrap:break-word; line-height:1.5;">$1</div>')
        .replace(/^>\s*(.*)/gm, '<blockquote style="background:#f8fafc; border-left:3.5px solid #0f766e; border-top:1px solid #e2e8f0; border-right:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:8px 12px; margin:8px 0; color:#1e293b; border-radius:6px; font-size:11px; line-height:1.5; white-space:normal; word-wrap:break-word;">$1</blockquote>')
        .replace(/#{5}\s*(.*)/g, '<h4 style="color:#0f766e; margin:14px 0 6px 0; font-size:12.5px; border-bottom:1px solid #e2e8f0; padding-bottom:3px;">$1</h4>')
        .replace(/#{4}\s*(.*)/g, '<h3 style="color:#0f172a; margin:16px 0 8px 0; font-size:13.5px; font-weight:bold;">$1</h3>')
        .replace(/#{3}\s*(.*)/g, '<h2 style="color:#0f172a; margin:18px 0 10px 0; font-size:14.5px; font-weight:800;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background:#f1f5f9; color:#0f766e; padding:2px 6px; border-radius:4px; font-size:11px;">$1</code>')
        .replace(/^\s*[\*•]\s*(.*)/gm, '<li style="margin-bottom:4px; margin-left: 18px;">$1</li>')
        .replace(/^\s*\d+\.\s*(.*)/gm, '<li style="margin-bottom:4px; margin-left: 18px;">$1</li>')
        .replace(/---\s*/g, '<hr style="border:0; border-top:1px dashed #cbd5e1; margin:14px 0;">')
        .replace(/\n\n/g, '<br><br>');
    })();

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Parecer Didático - ${student.name} - ${evalItem.stageTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 15mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      font-size: 11.5px;
      margin: 0;
      padding: 10px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0f766e;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .inst-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f766e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inst-sub {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 600;
    }
    .badge {
      background-color: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: bold;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px 16px;
      font-size: 11px;
    }
    .info-card strong {
      color: #334155;
    }
    .info-full {
      grid-column: 1 / -1;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      border-left: 4px solid #0f766e;
      padding-left: 8px;
      margin: 14px 0 8px 0;
      text-transform: uppercase;
    }
    .report-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
      font-size: 11.5px;
      line-height: 1.55;
    }
    .footer {
      margin-top: 25px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #64748b;
    }
    .signature-line {
      width: 220px;
      border-top: 1px solid #0f172a;
      text-align: center;
      padding-top: 4px;
      font-weight: bold;
      color: #0f172a;
      font-size: 10.5px;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="inst-title">Parecer Didático de Avaliação Acadêmica</div>
      <div class="inst-sub">Coordenação Acadêmica de TPE & TCC | Sistema Orientador IA</div>
    </div>
    <div class="badge">${evalItem.stageTitle}</div>
  </div>

  <div class="info-card">
    <div><strong>Discente:</strong> ${student.name}</div>
    <div><strong>Turma / Nível:</strong> ${student.group}</div>
    <div><strong>WhatsApp:</strong> +${student.phone}</div>
    <div><strong>Data da Avaliação:</strong> ${new Date(evalItem.createdAt).toLocaleDateString('pt-BR')} às ${new Date(evalItem.createdAt).toLocaleTimeString('pt-BR')}</div>
    <div><strong>Arquivo Avaliado:</strong> ${evalItem.fileName}</div>
    <div><strong>Nota / Conceito Preliminar:</strong> ${evalItem.suggestedGrade || 'Aprovado com Ressalvas'}</div>
    <div class="info-full"><strong>Título da Pesquisa:</strong> ${student.topic || 'Não informado'}</div>
    ${evalItem.sourceFileName ? `<div class="info-full"><strong>Fonte de Confronto Utilizada:</strong> ${evalItem.sourceFileName}</div>` : ''}
  </div>

  <div class="section-title">Diagnóstico Didático (Inconformidades & O Que Fazer Passo a Passo)</div>
  <div class="report-box">${cleanReportHtml}</div>

  <div class="footer">
    <div>Documento oficial de parecer didático gerado em ${new Date().toLocaleDateString('pt-BR')}.</div>
    <div class="signature-line">
      Professor Orientador / Coordenação
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (evaluations.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h4 className="font-bold text-base text-slate-100">Nenhuma etapa de avaliação cadastrada</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Faça o upload da versão inicial da pesquisa do aluno para que o Agente IA avalie conforme os seus critérios.
          </p>
        </div>
        <button
          onClick={onNewStageClick}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Iniciar Etapa 1 — Versão Inicial</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 font-bold text-sm">
            {evaluations.length}
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-200">
              Histórico Evolutivo de Etapas ({evaluations.length} {evaluations.length === 1 ? 'Versão' : 'Versões'})
            </h4>
            <p className="text-[11px] text-slate-400">
              Acompanhe a evolução sequencial das correções e pareceres gerados pela IA
            </p>
          </div>
        </div>

        <button
          onClick={onNewStageClick}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Nova Etapa (Etapa {evaluations.length + 1})</span>
        </button>
      </div>

      {/* Timeline Steps */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
        {evaluations.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const isLast = idx === evaluations.length - 1;

          return (
            <div key={item.id} className="relative">
              {/* Timeline marker */}
              <div
                className={`absolute -left-6 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                  isLast
                    ? 'bg-emerald-500 border-emerald-300 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {item.stageNumber}
              </div>

              {/* Card Container */}
              <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl transition-all">
                {/* Stage Header Summary */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex items-center justify-between cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                      <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-xs text-slate-100">{item.stageTitle}</h4>
                        {isLast && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Versão Mais Recente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {item.fileName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {item.suggestedGrade && (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        Nota: {item.suggestedGrade}
                      </span>
                    )}
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 space-y-5 text-xs">
                    {/* Top action row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="flex items-center space-x-2">
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download={item.fileName}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Baixar Trabalho ({item.fileName})</span>
                        </a>

                        {item.sourceFileUrl && (
                          <a
                            href={item.sourceFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={item.sourceFileName || 'fonte_referencia.pdf'}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-200 text-[11px] font-medium border border-indigo-800 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Baixar Fonte ({item.sourceFileName || 'Fonte Anexa'})</span>
                          </a>
                        )}

                        <button
                          onClick={() => downloadEvaluationPdf(item)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-[11px] font-bold border border-rose-800 transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5 text-rose-400" />
                          <span>Baixar Parecer (PDF)</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReevaluateStage(item)}
                          disabled={Boolean(reevaluatingId)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 text-[11px] font-bold border border-indigo-700 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                          title="Reavalia esta etapa aplicando a matriz acadêmica mais recente"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${reevaluatingId === item.id ? 'animate-spin' : ''}`} />
                          <span>
                            {reevaluatingId === item.id ? 'Reavaliando...' : 'Reavaliar com IA'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleSendWhatsApp(item)}
                          disabled={Boolean(sendingWhatsappId)}
                          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-md shadow-emerald-950 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>
                            {sendingWhatsappId === item.id
                              ? 'Enviando...'
                              : whatsappSuccessId === item.id
                              ? '✓ Enviado no WhatsApp!'
                              : 'Enviar Parecer no WhatsApp'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeleteStage(item)}
                          disabled={Boolean(deletingId)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition-colors"
                          title="Excluir esta etapa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Criteria & Source Reference Used */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                        <span className="font-bold text-[11px] text-slate-300">
                          🎯 Parâmetros Definidos pelo Professor:
                        </span>
                        <p className="text-slate-400 font-mono text-[11px] whitespace-pre-wrap">
                          {item.criteriaText}
                        </p>
                      </div>

                      {item.sourceRefText && (
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                          <span className="font-bold text-[11px] text-indigo-300">
                            📚 Fonte / Referencial de Confronto:
                          </span>
                          <p className="text-slate-400 text-[11px] whitespace-pre-wrap">
                            {item.sourceRefText}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Strengths & Improvements Boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pontos Fortes Identificados</span>
                        </div>
                        <p className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                          {item.strengths || 'Estruturação adequada aos critérios propostos.'}
                        </p>
                      </div>

                      {/* Improvements / Inconformidades vs Soluções */}
                      <div className="bg-amber-950/20 border border-amber-800/50 rounded-xl p-4 space-y-2.5">
                        <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4" />
                          <span>⚠️ Inconformidades & 💡 Solução Didática (O que Fazer)</span>
                        </div>
                        <p className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                          {item.improvements || 'Seguir para a próxima etapa mantendo a qualidade da redação.'}
                        </p>
                      </div>
                    </div>

                    {/* Full Academic Report */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          Parecer Completo e Didático do Agente Avaliador:
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Passo a Passo de Correção
                        </span>
                      </div>
                      <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap break-words font-sans bg-slate-900/80 p-5 rounded-xl border border-slate-800 space-y-2">
                        {item.evaluationReport.replace(/```/g, '')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
