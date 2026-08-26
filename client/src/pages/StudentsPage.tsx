import React, { useState } from 'react';
import { Student, AcademicGroup } from '../types';
import { apiClient } from '../services/api';
import { StudentTable } from '../components/students/StudentTable';
import { StudentFormModal } from '../components/students/StudentFormModal';
import { ImportModal } from '../components/students/ImportModal';

interface StudentsPageProps {
  students: Student[];
  onRefresh: () => void;
}

export const StudentsPage: React.FC<StudentsPageProps> = ({ students, onRefresh }) => {
  const [currentGroup, setCurrentGroup] = useState<AcademicGroup>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormModalOpen(true);
  };

  const handleSaveStudent = async (studentData: Partial<Student>) => {
    if (editingStudent) {
      await apiClient.updateStudent(editingStudent.id, studentData);
    } else {
      await apiClient.createStudent(studentData);
    }
    onRefresh();
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Deseja realmente remover este aluno?')) return;
    await apiClient.deleteStudent(id);
    onRefresh();
  };

  const handleClearGroup = async () => {
    const groupLabel = currentGroup === 'ALL' ? 'todos os alunos' : `os alunos da turma ${currentGroup}`;
    if (!confirm(`Tem certeza que deseja apagar ${groupLabel}? Esta ação não pode ser desfeita.`)) return;
    await apiClient.clearStudents(currentGroup);
    onRefresh();
  };

  // Filter students by group & search
  const filteredStudents = students.filter((s) => {
    if (currentGroup !== 'ALL' && s.group !== currentGroup) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchPhone = s.phone.includes(q);
      const matchAdvisor = (s.advisor || '').toLowerCase().includes(q);
      const matchTopic = (s.topic || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchAdvisor && !matchTopic) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Gestão de Contatos e Turmas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastre, edite e segmente alunos orientandos por TPE, TCC 1 e TCC 2
          </p>
        </div>
      </div>

      <StudentTable
        students={filteredStudents}
        currentGroup={currentGroup}
        onSelectGroup={setCurrentGroup}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddStudent={handleOpenAdd}
        onImportStudents={() => setIsImportModalOpen(true)}
        onEditStudent={handleOpenEdit}
        onDeleteStudent={handleDeleteStudent}
        onClearGroup={handleClearGroup}
        downloadSampleUrl={apiClient.downloadSampleSpreadsheetUrl}
      />

      {/* Form Modal */}
      <StudentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveStudent}
        initialData={editingStudent}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
};
