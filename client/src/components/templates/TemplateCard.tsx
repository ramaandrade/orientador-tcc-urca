import React from 'react';
import { Template } from '../../types';
import { FileText, Image, Edit2, Trash2, Send, Tag } from 'lucide-react';

interface TemplateCardProps {
  template: Template;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onUseInCampaign: (template: Template) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onUseInCampaign,
}) => {
  const getGroupBadge = (group: string) => {
    switch (group) {
      case 'TPE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">TPE</span>;
      case 'TCC1':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">TCC 1</span>;
      case 'TCC2':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">TCC 2</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">Geral (Todos)</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group">
      <div>
        {/* Top bar with title and badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-100 group-hover:text-emerald-300 transition-colors">
                {template.title}
              </h3>
            </div>
          </div>
          {getGroupBadge(template.group)}
        </div>

        {/* Snippet */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-3 text-xs text-slate-300 font-sans line-clamp-4 whitespace-pre-wrap">
          {template.content}
        </div>

        {/* Attachment Pill if any */}
        {template.attachmentName && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800 mb-3">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate max-w-[200px]">{template.attachmentName}</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Editar Modelo"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            title="Excluir Modelo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={() => onUseInCampaign(template)}
          className="flex items-center space-x-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 px-3 py-1.5 rounded-xl font-semibold transition-colors"
        >
          <Send className="w-3 h-3" />
          <span>Usar no Disparo</span>
        </button>
      </div>
    </div>
  );
};
