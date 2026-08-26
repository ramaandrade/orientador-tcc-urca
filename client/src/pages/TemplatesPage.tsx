import React, { useState } from 'react';
import { Template, Student, AcademicGroup } from '../types';
import { apiClient } from '../services/api';
import { TemplateCard } from '../components/templates/TemplateCard';
import { TemplateEditorModal } from '../components/templates/TemplateEditorModal';
import { Plus, FileText, Sparkles } from 'lucide-react';

interface TemplatesPageProps {
  templates: Template[];
  students: Student[];
  onRefresh: () => void;
  onUseInCampaign: (template: Template) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templates,
  students,
  onRefresh,
  onUseInCampaign,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<AcademicGroup>('ALL');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (tpl: Template) => {
    setEditingTemplate(tpl);
    setIsEditorOpen(true);
  };

  const handleSave = async (formData: FormData) => {
    if (editingTemplate) {
      await apiClient.updateTemplate(editingTemplate.id, formData);
    } else {
      await apiClient.createTemplate(formData);
    }
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este modelo de mensagem?')) return;
    await apiClient.deleteTemplate(id);
    onRefresh();
  };

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedGroup === 'ALL') return true;
    return tpl.group === selectedGroup || tpl.group === 'ALL';
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Biblioteca de Modelos de Mensagem</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Modelos dinâmicos com tags automáticas ({'{nome}'}, {'{turma}'}, {'{prazo}'}, etc.) e suporte a anexos em PDF
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Modelo</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {(['ALL', 'TPE', 'TCC1', 'TCC2'] as AcademicGroup[]).map((grp) => (
          <button
            key={grp}
            onClick={() => setSelectedGroup(grp)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedGroup === grp
                ? 'bg-slate-800 text-slate-100 border border-slate-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {grp === 'ALL' ? 'Todos os Modelos' : grp}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUseInCampaign={onUseInCampaign}
          />
        ))}
      </div>

      {/* Modal */}
      <TemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        initialData={editingTemplate}
        students={students}
      />
    </div>
  );
};
