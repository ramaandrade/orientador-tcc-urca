import React, { useState } from 'react';
import { Campaign, Student, Template } from '../types';
import { apiClient } from '../services/api';
import { CampaignWizard } from '../components/campaigns/CampaignWizard';
import { LiveDispatchMonitor } from '../components/campaigns/LiveDispatchMonitor';
import { CampaignCard } from '../components/campaigns/CampaignCard';
import { Plus, Send, RefreshCw } from 'lucide-react';

interface CampaignsPageProps {
  campaigns: Campaign[];
  students: Student[];
  templates: Template[];
  activeMonitorCampaignId: string | null;
  onOpenMonitor: (id: string | null) => void;
  onRefresh: () => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({
  campaigns,
  students,
  templates,
  activeMonitorCampaignId,
  onOpenMonitor,
  onRefresh,
}) => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleCampaignCreated = (newCampaignId: string) => {
    setIsWizardOpen(false);
    onOpenMonitor(newCampaignId);
    onRefresh();
  };

  const handleStart = async (id: string) => {
    await apiClient.startCampaign(id);
    onOpenMonitor(id);
    onRefresh();
  };

  const handleRetryFailed = async (id: string) => {
    await apiClient.retryFailedCampaign(id);
    onOpenMonitor(id);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta campanha e seus logs associados?')) return;
    await apiClient.deleteCampaign(id);
    if (activeMonitorCampaignId === id) {
      onOpenMonitor(null);
    }
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">Disparador de Mensagens & Filas</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Crie campanhas segmentadas, monitore a entrega em tempo real e controle o anti-bloqueio
          </p>
        </div>

        {!isWizardOpen && (
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Campanha</span>
          </button>
        )}
      </div>

      {/* Wizard Modal / View */}
      {isWizardOpen ? (
        <CampaignWizard
          students={students}
          templates={templates}
          onCampaignCreated={handleCampaignCreated}
          onCancel={() => setIsWizardOpen(false)}
        />
      ) : (
        <>
          {/* Active Live Monitor if selected */}
          {activeMonitorCampaignId && (
            <LiveDispatchMonitor
              campaignId={activeMonitorCampaignId}
              onFinished={onRefresh}
              onClose={() => onOpenMonitor(null)}
            />
          )}

          {/* Campaigns Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                Histórico de Campanhas ({campaigns.length})
              </h3>
              <button
                onClick={onRefresh}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Atualizar</span>
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                <Send className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-400">Nenhuma campanha criada ainda</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Clique em "Criar Nova Campanha" para disparar avisos e cronogramas para suas turmas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {campaigns.map((camp) => (
                  <CampaignCard
                    key={camp.id}
                    campaign={camp}
                    onOpenMonitor={onOpenMonitor}
                    onDelete={handleDelete}
                    onStart={handleStart}
                    onRetryFailed={handleRetryFailed}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
