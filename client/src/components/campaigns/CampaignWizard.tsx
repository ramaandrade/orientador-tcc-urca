import React, { useState } from 'react';
import { Student, Template, AcademicGroup } from '../../types';
import { apiClient } from '../../services/api';
import { WhatsAppBubblePreview } from '../whatsapp/WhatsAppBubblePreview';
import {
  Users,
  FileText,
  ShieldAlert,
  Eye,
  Send,
  Calendar,
  Clock,
  Upload,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface CampaignWizardProps {
  students: Student[];
  templates: Template[];
  onCampaignCreated: (campaignId: string) => void;
  onCancel: () => void;
}

export const CampaignWizard: React.FC<CampaignWizardProps> = ({
  students,
  templates,
  onCampaignCreated,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [targetGroup, setTargetGroup] = useState<AcademicGroup>('TCC2');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);

  // Anti-Ban & Scheduling
  const [minDelay, setMinDelay] = useState<number>(5);
  const [maxDelay, setMaxDelay] = useState<number>(12);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM'>('NONE');
  const [recurrenceDays, setRecurrenceDays] = useState<number>(15);

  // Preview state
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtered target students (ALL explicitly excludes CONCLUIDO)
  const targetStudents = students.filter((s) => {
    if (targetGroup === 'ALL') return s.status === 'ACTIVE' && s.group !== 'CONCLUIDO';
    if (targetGroup === 'CONCLUIDO') return s.group === 'CONCLUIDO';
    return s.group === targetGroup && s.status === 'ACTIVE';
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      if (!title) setTitle(`Disparo: ${tpl.title}`);
      setMessageContent(tpl.content);
      if (tpl.attachmentName) {
        setAttachmentName(tpl.attachmentName);
        setAttachmentFile(null);
      }
    }
  };

  const insertTag = (tag: string) => {
    setMessageContent((prev) => prev + tag);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setAttachmentFile(f);
      setAttachmentName(f.name);
    }
  };

  const handleLaunch = async () => {
    if (!title.trim()) {
      setError('Por favor defina o título da campanha');
      return;
    }
    if (!messageContent.trim()) {
      setError('Por favor preencha a mensagem a ser disparada');
      return;
    }
    if (targetStudents.length === 0) {
      setError('Nenhum aluno ativo encontrado no público selecionado');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('targetGroup', targetGroup);
      formData.append('messageContent', messageContent);
      formData.append('minDelay', String(minDelay));
      formData.append('maxDelay', String(maxDelay));
      formData.append('startImmediately', (!isScheduled).toString());
      formData.append('recurrence', recurrence);

      if (recurrence === 'CUSTOM') {
        formData.append('recurrenceDays', String(recurrenceDays));
      } else if (recurrence === 'BIWEEKLY') {
        formData.append('recurrenceDays', '15');
      } else if (recurrence === 'WEEKLY') {
        formData.append('recurrenceDays', '7');
      } else if (recurrence === 'MONTHLY') {
        formData.append('recurrenceDays', '30');
      } else if (recurrence === 'DAILY') {
        formData.append('recurrenceDays', '1');
      }

      if (selectedTemplateId) {
        formData.append('templateId', selectedTemplateId);
      }
      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }
      if (isScheduled && scheduledDate) {
        formData.append('scheduledAt', new Date(scheduledDate).toISOString());
      }

      const res = await apiClient.createCampaign(formData);
      onCampaignCreated(res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao criar campanha');
    } finally {
      setLoading(false);
    }
  };

  const dynamicTags = [
    { label: 'Nome', tag: '{nome}' },
    { label: '1º Nome', tag: '{primeiro_nome}' },
    { label: 'Turma', tag: '{turma}' },
    { label: 'Título da Pesquisa', tag: '{titulo_pesquisa}' },
    { label: 'Data da Defesa', tag: '{data_defesa}' },
    { label: 'Nota', tag: '{nota}' },
    { label: 'Instituição', tag: '{instituicao}' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Wizard Step Progress Bar */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Assistente de Criação de Campanha</h3>
          <p className="text-xs text-slate-400">Configure o público, conteúdo e proteção anti-bloqueio</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          {[
            { num: 1, label: 'Público' },
            { num: 2, label: 'Mensagem' },
            { num: 3, label: 'Anti-Ban' },
            { num: 4, label: 'Revisão' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-semibold ${
                step === s.num
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : step > s.num
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-950 text-slate-500'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="m-6 p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="p-6">
        {/* STEP 1: PÚBLICO-ALVO */}
        {step === 1 && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome de Identificação da Campanha <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="Ex: Convocação de Bancas TCC 2 - Novembro"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-3">
                Selecione o Segmento de Alunos Destinatários <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  {
                    id: 'TCC2' as AcademicGroup,
                    title: 'TCC 2 (Defesa Final)',
                    desc: 'Alunos em fase de bancas examinadoras e entrega final',
                    count: students.filter((s) => s.group === 'TCC2' && s.status === 'ACTIVE').length,
                    color: 'border-emerald-700/60 hover:border-emerald-500',
                  },
                  {
                    id: 'TCC1' as AcademicGroup,
                    title: 'TCC 1 (Qualificação)',
                    desc: 'Alunos em desenvolvimento de projeto e qualificação preliminar',
                    count: students.filter((s) => s.group === 'TCC1' && s.status === 'ACTIVE').length,
                    color: 'border-blue-700/60 hover:border-blue-500',
                  },
                  {
                    id: 'TPE' as AcademicGroup,
                    title: 'TPE (Pesquisa / Estágio)',
                    desc: 'Alunos em fase de anteprojeto e escolha de orientador',
                    count: students.filter((s) => s.group === 'TPE' && s.status === 'ACTIVE').length,
                    color: 'border-amber-700/60 hover:border-amber-500',
                  },
                  {
                    id: 'CONCLUIDO' as AcademicGroup,
                    title: 'Concluídos / Egressos',
                    desc: 'Alunos com TCC já defendido e concluído',
                    count: students.filter((s) => s.group === 'CONCLUIDO').length,
                    color: 'border-purple-700/60 hover:border-purple-500',
                  },
                  {
                    id: 'ALL' as AcademicGroup,
                    title: 'Todos os Alunos Ativos',
                    desc: 'Disparo unificado para TPE, TCC 1 e TCC 2 (exclui alunos Concluídos)',
                    count: students.filter((s) => s.status === 'ACTIVE' && s.group !== 'CONCLUIDO').length,
                    color: 'border-teal-700/60 hover:border-teal-500',
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setTargetGroup(item.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      targetGroup === item.id
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-950'
                        : `bg-slate-950/60 ${item.color}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-xs text-slate-100">{item.title}</h4>
                      <span className="text-xs font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded-full">
                        {item.count} alunos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audience Summary Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-slate-200 font-semibold">Total de Destinatários Selecionados:</span>
                  <p className="text-[11px] text-slate-400">
                    Apenas alunos ativos com números de WhatsApp sanitizados receberão.
                  </p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-400">{targetStudents.length}</span>
            </div>
          </div>
        )}

        {/* STEP 2: MENSAGEM & MODELO */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4 text-xs">
              {/* Template selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Carregar a partir de um Modelo Salvo (Opcional)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Escrever mensagem do zero --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      [{tpl.group}] {tpl.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic tag chips */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inserir Variáveis Personalizadas</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dynamicTags.map((t) => (
                    <button
                      key={t.tag}
                      type="button"
                      onClick={() => insertTag(t.tag)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950 hover:border-emerald-700 border border-slate-700 text-slate-300 hover:text-emerald-300 font-mono text-[11px] transition-colors"
                    >
                      + {t.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message text */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Corpo da Mensagem (*negrito*, _itálico_) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={8}
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Escreva a mensagem personalizada aqui..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>

              {/* Attachment upload */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Anexo da Campanha (PDF / Imagem)
                </label>
                <input
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg, .docx"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1"
                />
                {attachmentName && (
                  <p className="text-[11px] text-emerald-400 mt-1">Anexo selecionado: {attachmentName}</p>
                )}
              </div>
            </div>

            {/* Right preview */}
            <div className="lg:col-span-5 bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-start space-y-2">
              <span className="font-bold text-xs text-slate-300 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulação do WhatsApp</span>
              </span>
              <WhatsAppBubblePreview
                content={messageContent}
                student={targetStudents[0]}
                attachmentName={attachmentName}
              />
            </div>
          </div>
        )}

        {/* STEP 3: ANTI-BAN & AGENDAMENTO */}
        {step === 3 && (
          <div className="space-y-6 max-w-2xl mx-auto text-xs">
            {/* Anti-ban explanation */}
            <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-start space-x-3 text-emerald-200">
              <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-300">Algoritmo Anti-Bloqueio WhatsApp</h4>
                <p className="text-[11px] text-emerald-300/90 mt-1 leading-relaxed">
                  Para proteger o número da instituição contra detecção de spam pelo WhatsApp, o sistema
                  aguarda um intervalo randômico configurável entre cada envio e insere pausas automáticas a
                  cada 20 mensagens.
                </p>
              </div>
            </div>

            {/* Delay sliders */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="font-bold text-xs text-slate-200">Intervalo Randômico entre Mensagens:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">
                    Delay Mínimo: <strong className="text-emerald-400">{minDelay} segundos</strong>
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={20}
                    value={minDelay}
                    onChange={(e) => setMinDelay(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">
                    Delay Máximo: <strong className="text-emerald-400">{maxDelay} segundos</strong>
                  </label>
                  <input
                    type="range"
                    min={minDelay}
                    max={30}
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Tempo estimado para {targetStudents.length} alunos: ~
                {Math.ceil((targetStudents.length * ((minDelay + maxDelay) / 2)) / 60)} minutos.
              </p>
            </div>

            {/* Scheduling & Recurrence option */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-200">Programar Agendamento / Recorrência Automática</h4>
                  <p className="text-[11px] text-slate-400">
                    Agende para data futura ou configure disparos recorrentes (ex: a cada 15 dias)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => {
                    setIsScheduled(e.target.checked);
                    if (!e.target.checked) setRecurrence('NONE');
                  }}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>

              {isScheduled && (
                <div className="pt-3 border-t border-slate-800 space-y-4">
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Data e Horário de Início:</label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Frequência de Repetição Automática:</label>
                    <select
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="NONE">Disparo Único (Sem repetição periódica)</option>
                      <option value="BIWEEKLY">A cada 15 dias (Quinzenal - Lembrete periódico)</option>
                      <option value="WEEKLY">Semanal (A cada 7 dias)</option>
                      <option value="MONTHLY">Mensal (A cada 30 dias)</option>
                      <option value="DAILY">Diário (A cada 24 horas)</option>
                      <option value="CUSTOM">Personalizado (Definir intervalo de dias)</option>
                    </select>
                  </div>

                  {recurrence === 'CUSTOM' && (
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">Intervalo entre disparos (em dias):</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={recurrenceDays}
                          onChange={(e) => setRecurrenceDays(Number(e.target.value))}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 w-28"
                        />
                        <span className="text-slate-400">dias</span>
                      </div>
                    </div>
                  )}

                  {recurrence !== 'NONE' && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-[11px] flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        O sistema reiniciará automaticamente o envio para os alunos deste grupo a cada{' '}
                        <strong>
                          {recurrence === 'BIWEEKLY'
                            ? '15 dias'
                            : recurrence === 'WEEKLY'
                            ? '7 dias'
                            : recurrence === 'MONTHLY'
                            ? '30 dias'
                            : recurrence === 'DAILY'
                            ? '1 dia'
                            : `${recurrenceDays} dias`}
                        </strong>.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: REVISÃO ALUNO POR ALUNO */}
        {step === 4 && (
          <div className="space-y-6 max-w-4xl mx-auto text-xs">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <div>
                <h4 className="font-bold text-xs text-slate-200">Revisão Personalizada Aluno por Aluno</h4>
                <p className="text-[11px] text-slate-400">
                  Navegue entre os alunos para ver exatamente como a mensagem será renderizada para cada um.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  disabled={previewIndex === 0}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono font-bold text-slate-200 px-2">
                  {previewIndex + 1} / {targetStudents.length || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewIndex((i) => Math.min(targetStudents.length - 1, i + 1))}
                  disabled={previewIndex >= targetStudents.length - 1}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student info sheet */}
              {targetStudents[previewIndex] ? (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h5 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">
                    Dados do Destinatário #{previewIndex + 1}
                  </h5>
                  <div className="space-y-2 text-slate-300">
                    <p>
                      <strong>Nome:</strong> {targetStudents[previewIndex].name}
                    </p>
                    <p>
                      <strong>WhatsApp:</strong> +{targetStudents[previewIndex].phone}
                    </p>
                    <p>
                      <strong>Turma:</strong> {targetStudents[previewIndex].group}
                    </p>
                    <p>
                      <strong>Título da Pesquisa:</strong> {targetStudents[previewIndex].topic || 'Não informado'}
                    </p>
                    <p>
                      <strong>Data da Defesa:</strong> {targetStudents[previewIndex].defenseDate || targetStudents[previewIndex].deadline || 'A definir'}
                    </p>
                    <p>
                      <strong>Nota:</strong> {targetStudents[previewIndex].grade || 'Pendente'}
                    </p>
                    {targetStudents[previewIndex].email && (
                      <p>
                        <strong>Email:</strong> {targetStudents[previewIndex].email}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 text-center text-slate-500">Nenhum aluno no grupo selecionado</div>
              )}

              {/* WhatsApp Bubble */}
              <div>
                <WhatsAppBubblePreview
                  content={messageContent}
                  student={targetStudents[previewIndex]}
                  attachmentName={attachmentName}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard Footer Navigation */}
      <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={step === 1 ? onCancel : () => setStep((s) => (s - 1) as any)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          {step === 1 ? 'Cancelar' : 'Voltar'}
        </button>

        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && !title.trim()) {
                setError('Defina o título da campanha');
                return;
              }
              if (step === 2 && !messageContent.trim()) {
                setError('Preencha a mensagem');
                return;
              }
              setError(null);
              setStep((s) => (s + 1) as any);
            }}
            className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <span>Próximo Passo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleLaunch}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-xl shadow-emerald-950 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>
              {loading
                ? 'Criando Campanha...'
                : isScheduled
                ? 'Agendar Campanha'
                : 'Iniciar Disparo Agora'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
