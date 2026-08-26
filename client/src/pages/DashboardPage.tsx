import React from 'react';
import { StatsData, Campaign, WhatsAppState, Student } from '../types';
import {
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';

interface DashboardPageProps {
  stats: StatsData | null;
  students?: Student[];
  recentCampaigns: Campaign[];
  whatsAppState: WhatsAppState | null;
  onNavigateToCampaigns: () => void;
  onNavigateToStudents: () => void;
  onNavigateToWhatsApp: () => void;
  onOpenMonitor: (campaignId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  students = [],
  recentCampaigns,
  whatsAppState,
  onNavigateToCampaigns,
  onNavigateToStudents,
  onNavigateToWhatsApp,
  onOpenMonitor,
}) => {
  const isMock = whatsAppState?.isMock || whatsAppState?.status === 'MOCK_ACTIVE';
  const isConnected = whatsAppState?.status === 'CONNECTED';

  // Robust student metric computation with instant fallback
  const totalStudents = stats?.students?.total && stats.students.total > 0 ? stats.students.total : students.length;
  const tpeCount = stats?.students?.tpe !== undefined && stats.students.tpe > 0 
    ? stats.students.tpe 
    : students.filter(s => s.group.toUpperCase().includes('TPE')).length;
  const tcc1Count = stats?.students?.tcc1 !== undefined && stats.students.tcc1 > 0 
    ? stats.students.tcc1 
    : students.filter(s => s.group.toUpperCase().replace(/\s+/g, '') === 'TCC1').length;
  const tcc2Count = stats?.students?.tcc2 !== undefined && stats.students.tcc2 > 0 
    ? stats.students.tcc2 
    : students.filter(s => s.group.toUpperCase().replace(/\s+/g, '') === 'TCC2').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner if WhatsApp is disconnected */}
      {!isConnected && !isMock && (
        <div className="bg-amber-950/70 border border-amber-600/60 rounded-2xl p-4 flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center space-x-3 text-amber-200 text-xs">
            <QrCode className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-100">WhatsApp não conectado:</span>
              <p className="text-amber-300/90 text-[11px]">
                Escaneie o QR Code para habilitar o envio de mensagens reais para seus alunos.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToWhatsApp}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-colors"
          >
            Conectar Agora
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Alunos</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{totalStudents}</span>
            <p className="text-[11px] text-slate-400 mt-1">
              {tpeCount} TPE • {tcc1Count} TCC1 • {tcc2Count} TCC2
            </p>
          </div>
        </div>

        {/* Delivery Rate % */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Entrega</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400">
              {stats?.messages.deliveryRate || 100}%
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Meta acadêmica &gt; 98% de abertura</p>
          </div>
        </div>

        {/* Messages Sent */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mensagens Enviadas</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{stats?.messages.sent || 0}</span>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.messages.failed || 0} falhas • {stats?.messages.pending || 0} pendentes
            </p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Campanhas Totais</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-100">{stats?.campaigns.total || 0}</span>
            <p className="text-[11px] text-emerald-400 mt-1">
              {stats?.campaigns.active || 0} em andamento / fila
            </p>
          </div>
        </div>
      </div>

      {/* Student Segments Row: TPE, TCC1, TCC2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TPE */}
        <div className="bg-slate-900/80 border border-amber-900/40 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                TPE
              </span>
              <span className="text-sm font-bold text-amber-400">{tpeCount} alunos</span>
            </div>
            <h4 className="font-bold text-xs text-slate-200 mt-2">Pesquisa / Estágio</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Avisos de cronograma, escolha de orientador e modelo de anteprojeto.
            </p>
          </div>
          <button
            onClick={onNavigateToCampaigns}
            className="mt-4 text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center space-x-1"
          >
            <span>Disparar para TPE</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* TCC 1 */}
        <div className="bg-slate-900/80 border border-blue-900/40 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                TCC 1
              </span>
              <span className="text-sm font-bold text-blue-400">{tcc1Count} alunos</span>
            </div>
            <h4 className="font-bold text-xs text-slate-200 mt-2">Desenvolvimento & Qualificação</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Prazos de qualificação, envio do capítulo inicial e comitê de ética.
            </p>
          </div>
          <button
            onClick={onNavigateToCampaigns}
            className="mt-4 text-[11px] font-semibold text-blue-300 hover:text-blue-200 flex items-center space-x-1"
          >
            <span>Disparar para TCC 1</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* TCC 2 */}
        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                TCC 2
              </span>
              <span className="text-sm font-bold text-emerald-400">{tcc2Count} alunos</span>
            </div>
            <h4 className="font-bold text-xs text-slate-200 mt-2">Defesa Final & Conclusão</h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Agendamento de bancas, envio de versão final, entrega de ata e termo.
            </p>
          </div>
          <button
            onClick={onNavigateToCampaigns}
            className="mt-4 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 flex items-center space-x-1"
          >
            <span>Disparar para TCC 2</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Actions & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Campaigns (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">Disparos Recentes</h3>
            <button
              onClick={onNavigateToCampaigns}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhuma campanha criada ainda. Clique no botão ao lado para criar o primeiro disparo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentCampaigns.slice(0, 4).map((c) => {
                const total = c.totalRecipients || 1;
                const processed = c.sentCount + c.failedCount;
                const pct = Math.min(100, Math.round((processed / total) * 100));

                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenMonitor(c.id)}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-200">{c.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                          {c.targetGroup}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{c.messageContent}</p>
                    </div>

                    <div className="text-right pl-4">
                      <span className="text-xs font-bold text-emerald-400">{pct}%</span>
                      <span className="block text-[10px] text-slate-500">
                        {processed}/{c.totalRecipients}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Launch Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-100 mb-1">Ações Rápidas</h3>
            <p className="text-xs text-slate-400 mb-4">Atalhos para fluxos mais comuns</p>

            <div className="space-y-2.5">
              <button
                onClick={onNavigateToCampaigns}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950 transition-all text-left"
              >
                <Send className="w-4 h-4 shrink-0" />
                <div>
                  <span>Criar Nova Campanha</span>
                  <span className="block text-[10px] text-emerald-100 font-normal">
                    Disparo em lote com anti-bloqueio
                  </span>
                </div>
              </button>

              <button
                onClick={onNavigateToStudents}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span>Importar Planilha XLSX</span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    Atualizar turmas de alunos
                  </span>
                </div>
              </button>

              <button
                onClick={onNavigateToWhatsApp}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors text-left"
              >
                <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span>Status do WhatsApp</span>
                  <span className="block text-[10px] text-slate-400 font-normal">
                    {isConnected ? 'Sessão ativa e sincronizada' : 'Conectar ou simular'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-[11px] text-slate-400">
            🔒 <strong>Conformidade LGPD:</strong> Os contatos telefônicos permanecem restritos na base
            local para fins exclusivamente acadêmicos.
          </div>
        </div>
      </div>
    </div>
  );
};
