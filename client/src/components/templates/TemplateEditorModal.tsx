import React, { useState, useEffect, useRef } from 'react';
import { Template, Student, AcademicGroup } from '../../types';
import { WhatsAppBubblePreview } from '../whatsapp/WhatsAppBubblePreview';
import { X, Save, FileText, Upload, Sparkles, User, Tag } from 'lucide-react';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
  initialData?: Template | null;
  students?: Student[];
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  students = [],
}) => {
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<AcademicGroup>('ALL');
  const [content, setContent] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(undefined);
  const [selectedPreviewStudent, setSelectedPreviewStudent] = useState<Student | undefined>(
    students[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setGroup(initialData.group);
      setContent(initialData.content);
      setAttachmentName(initialData.attachmentName);
      setAttachmentFile(null);
    } else {
      setTitle('');
      setGroup('ALL');
      setContent(
        'Olá, *{nome}*!\n\nAqui é da coordenação acadêmica sobre o seu *{turma}*.\n\nLembramos que seu prazo é *{prazo}* com o orientador(a) *{orientador}*.'
      );
      setAttachmentName(undefined);
      setAttachmentFile(null);
    }
    if (students.length > 0) {
      setSelectedPreviewStudent(students[0]);
    }
    setError(null);
  }, [initialData, isOpen, students]);

  if (!isOpen) return null;

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setAttachmentFile(f);
      setAttachmentName(f.name);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    setAttachmentName(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Título e conteúdo são obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('group', group);
      formData.append('content', content);

      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      } else if (!attachmentName && initialData?.attachmentName) {
        formData.append('removeAttachment', 'true');
      }

      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao salvar modelo');
    } finally {
      setLoading(false);
    }
  };

  const dynamicTags = [
    { label: 'Nome Completo', tag: '{nome}' },
    { label: '1º Nome', tag: '{primeiro_nome}' },
    { label: 'Turma', tag: '{turma}' },
    { label: 'Título da Pesquisa', tag: '{titulo_pesquisa}' },
    { label: 'Data da Defesa', tag: '{data_defesa}' },
    { label: 'Nota', tag: '{nota}' },
    { label: 'Instituição', tag: '{instituicao}' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {initialData ? 'Editar Modelo de Mensagem' : 'Novo Modelo de Mensagem'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Layout Grid: Form (Left) & WhatsApp Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left: Editor form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl">
                {error}
              </div>
            )}

            {/* Title & Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">
                  Título do Modelo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TCC 1 - Lembrete de Qualificação"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Segmento</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Geral (Todas)</option>
                  <option value="TPE">TPE</option>
                  <option value="TCC1">TCC 1</option>
                  <option value="TCC2">TCC 2</option>
                </select>
              </div>
            </div>

            {/* Tags Bar */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Inserir Variáveis Personalizadas (clique para inserir)</span>
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

            {/* Message Body */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Texto da Mensagem (com formatação WhatsApp: *negrito*, _itálico_)
              </label>
              <textarea
                ref={textareaRef}
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva sua mensagem aqui..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
              />
            </div>

            {/* Attachment */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Anexo Padrão (Opcional - PDF ou Imagem)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf, .png, .jpg, .jpeg, .docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {attachmentName ? (
                <div className="flex items-center justify-between bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2">
                  <div className="flex items-center space-x-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-200 truncate">{attachmentName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="text-rose-400 hover:text-rose-300 text-xs font-semibold ml-2"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-950/60 hover:bg-slate-950 border border-dashed border-slate-700 rounded-xl py-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Anexar Manual / Modelo de Ata / PDF</span>
                </button>
              )}
            </div>

            {/* Submit buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Salvando...' : 'Salvar Modelo'}</span>
              </button>
            </div>
          </form>

          {/* Right: Live WhatsApp Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
            <div className="w-full flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pré-visualização</span>
              </span>

              {students.length > 0 && (
                <select
                  value={selectedPreviewStudent?.id || ''}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === e.target.value);
                    setSelectedPreviewStudent(st);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      Aluno: {s.name.split(' ')[0]} ({s.group})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <WhatsAppBubblePreview
              content={content}
              student={selectedPreviewStudent}
              attachmentName={attachmentName}
              attachmentType={attachmentFile?.type || (attachmentName ? 'application/pdf' : undefined)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
