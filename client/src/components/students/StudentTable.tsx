import React, { useState } from 'react';
import { Student, AcademicGroup } from '../../types';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  GraduationCap,
  Award,
  Calendar,
  BookOpen,
} from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  currentGroup: AcademicGroup;
  onSelectGroup: (group: AcademicGroup) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  onAddStudent: () => void;
  onImportStudents: () => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onClearGroup: () => void;
  downloadSampleUrl: string;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  currentGroup,
  onSelectGroup,
  searchTerm,
  onSearchChange,
  onAddStudent,
  onImportStudents,
  onEditStudent,
  onDeleteStudent,
  onClearGroup,
  downloadSampleUrl,
}) => {
  const groups: { id: AcademicGroup; label: string; count: number }[] = [
    {
      id: 'ALL',
      label: 'Todos os Alunos',
      count: students.length,
    },
    {
      id: 'TPE',
      label: 'TPE (Estágio/Pesquisa)',
      count: students.filter((s) => s.group === 'TPE').length,
    },
    {
      id: 'TCC1',
      label: 'TCC 1 (Qualificação)',
      count: students.filter((s) => s.group === 'TCC1').length,
    },
    {
      id: 'TCC2',
      label: 'TCC 2 (Defesa Final)',
      count: students.filter((s) => s.group === 'TCC2').length,
    },
    {
      id: 'CONCLUIDO',
      label: 'Concluídos / Egressos',
      count: students.filter((s) => s.group === 'CONCLUIDO').length,
    },
  ];

  const getGroupBadge = (group: string) => {
    switch (group) {
      case 'TPE':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/60">TPE</span>;
      case 'TCC1':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/70 text-blue-300 border border-blue-800/60">TCC 1</span>;
      case 'TCC2':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">TCC 2</span>;
      case 'CONCLUIDO':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-950/70 text-purple-300 border border-purple-800/60">Concluído</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">{group}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, título da pesquisa ou nota..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center space-x-2.5 flex-wrap">
          <a
            href={downloadSampleUrl}
            download
            className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors"
            title="Baixar modelo XLSX com colunas esperadas"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Modelo Excel</span>
          </a>

          <button
            onClick={onImportStudents}
            className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importar Planilha</span>
          </button>

          <button
            onClick={onAddStudent}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Aluno</span>
          </button>
        </div>
      </div>

      {/* Tabs for Academic Groups: ALL, TPE, TCC1, TCC2 */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 border-b border-slate-800">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelectGroup(g.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shrink-0 ${
              currentGroup === g.id
                ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>{g.label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-900 font-bold ${
                currentGroup === g.id ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {g.count}
            </span>
          </button>
        ))}
      </div>

      {/* Student List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Aluno</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Turma</th>
                <th className="py-3.5 px-4">Título da Pesquisa</th>
                <th className="py-3.5 px-4">Data da Defesa</th>
                <th className="py-3.5 px-4">Nota</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <GraduationCap className="w-8 h-8 text-slate-600" />
                      <p className="font-medium text-slate-400">Nenhum aluno encontrado neste filtro.</p>
                      <p className="text-[11px] text-slate-500">
                        Importe uma planilha (.xlsx / .csv) ou adicione alunos manualmente.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      <div>
                        <span className="font-semibold text-slate-100">{student.name}</span>
                        {student.email && (
                          <span className="block text-[10px] text-slate-400">{student.email}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-900/50 text-[11px]">
                        +{student.phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getGroupBadge(student.group)}</td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs">
                      {student.topic ? (
                        <span className="truncate block" title={student.topic}>
                          {student.topic}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Não informado</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                      {student.defenseDate || student.deadline ? (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{student.defenseDate || student.deadline}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {student.grade ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <Award className="w-3 h-3 text-emerald-400" />
                          <span>{student.grade}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Pendente</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditStudent(student)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Editar Aluno"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteStudent(student.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                          title="Remover Aluno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with bulk count */}
        {students.length > 0 && (
          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Exibindo <strong>{students.length}</strong> alunos cadastrados
            </span>
            <button
              onClick={onClearGroup}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium hover:underline"
            >
              Limpar alunos desta turma
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
