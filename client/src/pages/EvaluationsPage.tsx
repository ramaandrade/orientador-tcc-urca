import React, { useState, useEffect } from 'react';
import { Student, ResearchEvaluation, AcademicGroup } from '../types';
import {
  Sparkles,
  BookOpen,
  Search,
  Layers,
  GraduationCap,
  Award,
  Phone,
  Calendar,
  AlertCircle,
  FileCheck2
} from 'lucide-react';
import { apiClient } from '../services/api';
import { EvaluationStageModal } from '../components/evaluations/EvaluationStageModal';
import { EvaluationTimeline } from '../components/evaluations/EvaluationTimeline';

interface EvaluationsPageProps {
  students: Student[];
}

export const EvaluationsPage: React.FC<EvaluationsPageProps> = ({ students }) => {
  // Only target active students from TPE, TCC1, TCC2 (exclude CONCLUIDO)
  const activeStudents = students.filter(
    (s) => (s.group === 'TPE' || s.group === 'TCC1' || s.group === 'TCC2') && s.status === 'ACTIVE'
  );

  const [selectedGroup, setSelectedGroup] = useState<AcademicGroup>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    activeStudents.length > 0 ? activeStudents[0].id : ''
  );
  const [evaluations, setEvaluations] = useState<ResearchEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter students by selected tab and search term
  const filteredStudents = activeStudents.filter((s) => {
    const matchesGroup = selectedGroup === 'ALL' || s.group === selectedGroup;
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.topic && s.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.phone.includes(searchTerm);
    return matchesGroup && matchesSearch;
  });

  // Selected student object
  const currentStudent = activeStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0];

  // Fetch evaluations when selected student changes
  const fetchEvaluations = async (studentId: string) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const data = await apiClient.getEvaluationsByStudent(studentId);
      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error('Erro ao carregar avaliações do aluno:', err);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentStudent) {
      fetchEvaluations(currentStudent.id);
    }
  }, [currentStudent?.id]);

  const groupTabs: { id: AcademicGroup; label: string; count: number }[] = [
    {
      id: 'ALL',
      label: 'Todos Ativos',
      count: activeStudents.length,
    },
    {
      id: 'TPE',
      label: 'TPE',
      count: activeStudents.filter((s) => s.group === 'TPE').length,
    },
    {
      id: 'TCC1',
      label: 'TCC 1',
      count: activeStudents.filter((s) => s.group === 'TCC1').length,
    },
    {
      id: 'TCC2',
      label: 'TCC 2',
      count: activeStudents.filter((s) => s.group === 'TCC2').length,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Agente Avaliador de Pesquisas & Histórico de Etapas
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                IA Acadêmica
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submeta versões de pesquisa, defina parâmetros de orientação e acompanhe o histórico evolutivo (Etapa 1, 2, 3...)
            </p>
          </div>
        </div>

        {currentStudent && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-all cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Avaliar Nova Etapa da Pesquisa</span>
          </button>
        )}
      </div>

      {/* Main Grid: Left sidebar (students list) & Right panel (timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Student Selection (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Group Filter Tabs */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-2xl gap-1">
            {groupTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedGroup(tab.id)}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedGroup === tab.id
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar aluno ou tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Student Cards List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                Nenhum aluno encontrado para este filtro.
              </div>
            ) : (
              filteredStudents.map((s) => {
                const isSelected = currentStudent?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 shadow-md shadow-emerald-950'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-100">{s.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                              s.group === 'TPE'
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : s.group === 'TCC1'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {s.group}
                          </span>
                          <span className="text-[10px] text-slate-400">+{s.phone}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
                      )}
                    </div>

                    {s.topic && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        "{s.topic}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Research Evolution Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {currentStudent ? (
            <>
              {/* Selected Student Profile Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-base text-slate-100">{currentStudent.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                        {currentStudent.group}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      WhatsApp: +{currentStudent.phone}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setModalOpen(true)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+ Nova Etapa</span>
                    </button>
                  </div>
                </div>

                {currentStudent.topic && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-xs text-slate-200">Tema da Pesquisa Cadastrado:</span>
                      <p className="text-xs text-slate-300 mt-0.5 italic leading-relaxed">
                        "{currentStudent.topic}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Stage Timeline */}
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Carregando histórico de etapas e avaliações...</p>
                </div>
              ) : (
                <EvaluationTimeline
                  student={currentStudent}
                  evaluations={evaluations}
                  onRefresh={() => fetchEvaluations(currentStudent.id)}
                  onNewStageClick={() => setModalOpen(true)}
                />
              )}
            </>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
              Selecione um aluno na coluna à esquerda para visualizar seu histórico de etapas e avaliações.
            </div>
          )}
        </div>
      </div>

      {/* Modal for Creating Stage */}
      {currentStudent && (
        <EvaluationStageModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          student={currentStudent}
          currentStageCount={evaluations.length}
          onEvaluationCreated={() => fetchEvaluations(currentStudent.id)}
        />
      )}
    </div>
  );
};
