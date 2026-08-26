import React, { useState, useEffect } from 'react';
import { Student } from '../../types';
import { X, Save, User, Phone, Mail, BookOpen, Calendar, Award } from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Partial<Student>) => Promise<void>;
  initialData?: Student | null;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [group, setGroup] = useState<'TPE' | 'TCC1' | 'TCC2' | 'CONCLUIDO'>('TCC1');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [defenseDate, setDefenseDate] = useState('');
  const [grade, setGrade] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getNextStage = (currentGroup: 'TPE' | 'TCC1' | 'TCC2' | 'CONCLUIDO') => {
    switch (currentGroup) {
      case 'TPE': return 'TCC1';
      case 'TCC1': return 'TCC2';
      case 'TCC2': return 'CONCLUIDO';
      default: return 'CONCLUIDO';
    }
  };

  const getStageLabel = (g: string) => {
    switch (g) {
      case 'TPE': return 'TPE (Pesquisa / Estágio)';
      case 'TCC1': return 'TCC 1 (Qualificação)';
      case 'TCC2': return 'TCC 2 (Defesa Final)';
      case 'CONCLUIDO': return 'Concluído / Egresso';
      default: return g;
    }
  };

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.originalPhone || initialData.phone || '');
      setGroup(initialData.group || 'TCC1');
      setEmail(initialData.email || '');
      setTopic(initialData.topic || '');
      setDefenseDate(initialData.defenseDate || initialData.deadline || '');
      setGrade(initialData.grade || '');
    } else {
      setName('');
      setPhone('');
      setGroup('TCC1');
      setEmail('');
      setTopic('');
      setDefenseDate('');
      setGrade('');
    }
    setError(null);
  }, [initialData, isOpen]);

  // Handle auto-advancing stage when defenseDate or grade is filled
  const handleGradeOrDefenseChange = (newDefense: string, newGrade: string) => {
    setDefenseDate(newDefense);
    setGrade(newGrade);

    if (autoAdvance && initialData && (newDefense.trim() || newGrade.trim())) {
      const next = getNextStage(initialData.group);
      setGroup(next);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do aluno é obrigatório');
      return;
    }
    if (!phone.trim()) {
      setError('O telefone/WhatsApp é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const finalStatus = group === 'CONCLUIDO' ? 'DEFENDED' : (initialData?.status || 'ACTIVE');
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        group,
        email: email.trim() || undefined,
        topic: topic.trim() || undefined,
        defenseDate: defenseDate.trim() || undefined,
        grade: grade.trim() || undefined,
        status: finalStatus,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao salvar aluno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <User className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {initialData ? 'Editar Aluno' : 'Novo Aluno'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl">
              {error}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">
              Nome Completo do Aluno <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mariana Souza Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Telefone & Turma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                WhatsApp com DDD <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Turma / Segmento <span className="text-rose-400">*</span>
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="TPE">TPE (Pesquisa / Estágio)</option>
                <option value="TCC1">TCC 1 (Qualificação)</option>
                <option value="TCC2">TCC 2 (Defesa Final)</option>
                <option value="CONCLUIDO">Concluído (TCC Defendido / Egresso)</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Email Institucional</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="aluno@universidade.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Título da Pesquisa */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Título da Pesquisa</label>
            <div className="relative">
              <BookOpen className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Ex: Impactos da IA na Educação e Aprendizagem"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Data da Defesa & Nota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Data da Defesa</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: 20/11/2026"
                  value={defenseDate}
                  onChange={(e) => handleGradeOrDefenseChange(e.target.value, grade)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Nota</label>
              <div className="relative">
                <Award className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: 9.5 ou 10.0"
                  value={grade}
                  onChange={(e) => handleGradeOrDefenseChange(defenseDate, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Academic Progression Alert */}
          {initialData && (defenseDate.trim() || grade.trim()) && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/70 rounded-xl text-emerald-300 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  🎓 Progressão Automática de Etapa:
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={(e) => setAutoAdvance(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-emerald-500"
                  />
                  <span>Avançar turma</span>
                </label>
              </div>
              <p className="text-slate-300">
                Ao registrar data de defesa e nota, o aluno é promovido de{' '}
                <strong className="text-amber-300">{getStageLabel(initialData.group)}</strong> para{' '}
                <strong className="text-emerald-400">{getStageLabel(group)}</strong>.
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Salvando...' : 'Salvar Aluno'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
