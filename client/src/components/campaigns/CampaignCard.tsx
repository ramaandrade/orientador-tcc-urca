import React from 'react';
import { Campaign } from '../../types';
import {
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Pause,
  Trash2,
  Eye,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface CampaignCardProps {
  campaign: Campaign;
  onOpenMonitor: (id: string) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onRetryFailed?: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onOpenMonitor,
  onDelete,
  onStart,
  onRetryFailed,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800 animate-pulse">
            Disparando...
          </span>
        );
      case 'PAUSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
            Pausado
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
            Concluído
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
            Agendado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
            Rascunho
          </span>
        );
    }
  };

  const processed = campaign.sentCount + campaign.failedCount;
  const total = campaign.totalRecipients || 1;
  const pct = Math.min(100, Math.round((processed / total) * 100));

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-bold text-xs text-slate-100">{campaign.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Público: <strong className="text-emerald-400">{campaign.targetGroup}</strong> ({campaign.totalRecipients} alunos)
            </p>
          </div>
          <div className="flex items-center space-x-1.5 flex-col items-end gap-y-1">
            {getStatusBadge(campaign.status)}
            {campaign.recurrence && campaign.recurrence !== 'NONE' && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-purple-950 text-purple-300 border border-purple-800 flex items-center space-x-1">
                <RotateCcw className="w-2.5 h-2.5" />
                <span>
                  {campaign.recurrence === 'BIWEEKLY'
                    ? 'A cada 15 dias'
                    : campaign.recurrence === 'WEEKLY'
                    ? 'Semanal'
                    : campaign.recurrence === 'MONTHLY'
                    ? 'Mensal'
                    : campaign.recurrence === 'DAILY'
                    ? 'Diário'
                    : `${campaign.recurrenceDays}d`}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>
              {processed} de {campaign.totalRecipients} processados
            </span>
            <span className="text-emerald-400 font-bold">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {campaign.failedCount > 0 && (
            <div className="flex items-center justify-between text-[10px] pt-0.5">
              <span className="text-emerald-400">{campaign.sentCount} entregues</span>
              <span className="text-rose-400 font-semibold">{campaign.failedCount} com erro</span>
            </div>
          )}
        </div>

        {/* Snippet */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 text-[11px] text-slate-300 line-clamp-2">
          {campaign.messageContent}
        </div>

        {/* Attachment info if any */}
        {campaign.attachmentName && (
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
            <FileText className="w-3.5 h-3.5 text-rose-400" />
            <span className="truncate max-w-[200px]">{campaign.attachmentName}</span>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
        <div className="text-[10px] text-slate-500">
          {new Date(campaign.createdAt).toLocaleDateString('pt-BR')} às{' '}
          {new Date(campaign.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          {campaign.failedCount > 0 && campaign.status !== 'RUNNING' && onRetryFailed && (
            <button
              onClick={() => onRetryFailed(campaign.id)}
              className="px-2.5 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-semibold flex items-center space-x-1 text-[11px] transition-colors shadow-sm"
              title="Reenviar apenas para os alunos que deram erro"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reenviar ({campaign.failedCount})</span>
            </button>
          )}

          {campaign.status === 'DRAFT' && (
            <button
              onClick={() => onStart(campaign.id)}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1"
            >
              <Play className="w-3 h-3" />
              <span>Iniciar</span>
            </button>
          )}

          <button
            onClick={() => onOpenMonitor(campaign.id)}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center space-x-1"
          >
            <Eye className="w-3 h-3" />
            <span>Monitorar</span>
          </button>

          <button
            onClick={() => onDelete(campaign.id)}
            className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/50"
            title="Excluir Campanha"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
