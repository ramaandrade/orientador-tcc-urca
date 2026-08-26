import React, { useEffect, useState } from 'react';
import { Campaign, CampaignProgress } from '../../types';
import { apiClient } from '../../services/api';
import {
  Play,
  Pause,
  XCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  User,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface LiveDispatchMonitorProps {
  campaignId: string;
  onFinished?: () => void;
  onClose?: () => void;
}

export const LiveDispatchMonitor: React.FC<LiveDispatchMonitorProps> = ({
  campaignId,
  onFinished,
  onClose,
}) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await apiClient.getCampaignStatus(campaignId);
      setCampaign(data.campaign);
      setProgress(data.liveProgress);

      if (data.campaign?.status === 'COMPLETED' || data.campaign?.status === 'CANCELLED') {
        if (onFinished) onFinished();
      }
    } catch (err) {
      console.error('Erro ao buscar status da campanha:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [campaignId]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await apiClient.pauseCampaign(campaignId);
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await apiClient.resumeCampaign(campaignId);
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Deseja realmente cancelar o disparo desta campanha?')) return;
    setActionLoading(true);
    try {
      await apiClient.cancelCampaign(campaignId);
      await fetchStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading(true);
    try {
      await apiClient.retryFailedCampaign(campaignId);
      await fetchStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Erro ao iniciar reenvio');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !campaign) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-center space-x-3 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
        <span>Carregando monitor de disparo...</span>
      </div>
    );
  }

  const status = progress?.status || campaign?.status || 'DRAFT';
  const total = progress?.total || campaign?.totalRecipients || 1;
  const processed = progress?.processed || (campaign?.sentCount || 0) + (campaign?.failedCount || 0);
  const sent = progress?.sent || campaign?.sentCount || 0;
  const failed = progress?.failed || campaign?.failedCount || 0;

  const percentage = Math.min(100, Math.round((processed / (total || 1)) * 100));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">{campaign?.title}</h3>
            <p className="text-xs text-slate-400">
              Público: <strong className="text-emerald-400">{campaign?.targetGroup}</strong> • Delay Anti-Ban:{' '}
              {campaign?.minDelay}s a {campaign?.maxDelay}s
            </p>
          </div>
        </div>

        {/* State Badge and Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {status === 'RUNNING' && (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Disparando</span>
            </span>
          )}
          {status === 'PAUSED' && (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
              <Pause className="w-3.5 h-3.5" />
              <span>Pausado</span>
            </span>
          )}
          {status === 'COMPLETED' && (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluído</span>
            </span>
          )}
          {status === 'CANCELLED' && (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800">
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelado</span>
            </span>
          )}

          {/* Retry Failed Button */}
          {failed > 0 && status !== 'RUNNING' && (
            <button
              onClick={handleRetryFailed}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-rose-950 transition-all"
              title="Reenviar mensagem exclusivamente para os alunos que falharam"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reenviar Falhas ({failed})</span>
            </button>
          )}

          {/* Action Buttons */}
          {status === 'RUNNING' && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pausar</span>
            </button>
          )}

          {status === 'PAUSED' && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Retomar</span>
            </button>
          )}

          {(status === 'RUNNING' || status === 'PAUSED') && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & KPI counters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">
            Progresso do Envio: <strong>{processed}</strong> de <strong>{total}</strong> alunos
          </span>
          <span className="font-bold text-emerald-400">{percentage}%</span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Sub-counters */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[11px] text-slate-400">Enviados com Sucesso</span>
            <span className="text-lg font-bold text-emerald-400">{sent}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[11px] text-slate-400">Falhas / Erros</span>
            <span className="text-lg font-bold text-rose-400">{failed}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="block text-[11px] text-slate-400">Pendentes</span>
            <span className="text-lg font-bold text-slate-300">{Math.max(0, total - processed)}</span>
          </div>
        </div>
      </div>

      {/* Current processing recipient if running */}
      {status === 'RUNNING' && progress?.currentRecipient && (
        <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-xl flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
            <span>
              Processando agora:{' '}
              <strong className="text-white font-bold">{progress.currentRecipient}</strong>
            </span>
          </div>
          <span className="text-[11px] text-blue-300 font-mono">Anti-Ban Ativo</span>
        </div>
      )}

      {/* Live Stream Logs */}
      <div>
        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Histórico de Entregas em Tempo Real</span>
        </h4>

        <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
          {progress?.logs && progress.logs.length > 0 ? (
            progress.logs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  log.status === 'SENT'
                    ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {log.status === 'SENT' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-100 font-sans">{log.studentName}</span>
                    <span className="text-[11px] text-slate-400 ml-2">+{log.phone}</span>
                    {log.error && (
                      <span className="block text-[10px] text-rose-400 font-sans mt-0.5">
                        Motivo: {log.error}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">{log.time}</span>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-slate-500 font-sans text-xs">
              Aguardando início dos registros de envio...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
