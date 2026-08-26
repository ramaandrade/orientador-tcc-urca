import React, { useState, useEffect } from 'react';
import {
  Student,
  Template,
  Campaign,
  MessageLog,
  Setting,
  WhatsAppState,
  StatsData,
} from './types';
import { apiClient } from './services/api';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { EvaluationsPage } from './pages/EvaluationsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { ReportsPage } from './pages/ReportsPage';
import { WhatsAppPage } from './pages/WhatsAppPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Application Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [whatsAppState, setWhatsAppState] = useState<WhatsAppState | null>(null);

  // Monitor Campaign Selection
  const [activeMonitorCampaignId, setActiveMonitorCampaignId] = useState<string | null>(null);

  // Data Fetching with individual state resilience
  const fetchAllData = async () => {
    try {
      const results = await Promise.allSettled([
        apiClient.getStudents(),
        apiClient.getTemplates(),
        apiClient.getCampaigns(),
        apiClient.getLogs({ limit: 200 }),
        apiClient.getStats(),
        apiClient.getSettings(),
        apiClient.getWhatsAppStatus(),
      ]);

      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
        setStudents(results[0].value);
      }
      if (results[1].status === 'fulfilled') {
        setTemplates(results[1].value);
      }
      if (results[2].status === 'fulfilled') {
        setCampaigns(results[2].value);
      }
      if (results[3].status === 'fulfilled') {
        setLogs(results[3].value);
      }
      if (results[4].status === 'fulfilled' && results[4].value) {
        setStats(results[4].value);
      }
      if (results[5].status === 'fulfilled') {
        setSettings(results[5].value);
      }
      if (results[6].status === 'fulfilled') {
        setWhatsAppState(results[6].value);
      }
    } catch (err) {
      console.error('Erro ao sincronizar dados:', err);
    }
  };

  const fetchWhatsAppStatusOnly = async () => {
    try {
      const st = await apiClient.getWhatsAppStatus();
      setWhatsAppState(st);
    } catch (err) {
      console.error('Erro ao obter status WhatsApp:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
    // Continuous background sync every 5 seconds to keep all metrics permanently online
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [currentTab]);

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          title: 'Painel Acadêmico Geral',
          subtitle: 'Visão consolidada de orientandos, turmas (TPE, TCC1, TCC2) e taxas de entrega',
        };
      case 'students':
        return {
          title: 'Gestão de Alunos & Turmas',
          subtitle: 'Base de contatos, importação de planilhas e filtros por segmento',
        };
      case 'evaluations':
        return {
          title: 'Avaliação de Pesquisas',
          subtitle: 'Avaliação contínua por etapas de anteprojetos e artigos com Agente IA Orientador',
        };
      case 'templates':
        return {
          title: 'Modelos de Mensagens & Notificações',
          subtitle: 'Crie e personalize templates com variáveis dinâmicas ({nome}, {tema}, {prazo})',
        };
      case 'campaigns':
        return {
          title: 'Campanhas de Disparo WhatsApp',
          subtitle: 'Disparos em massa segmentados por turma ou status com controle de cadência',
        };
      case 'reports':
        return {
          title: 'Relatórios de Envio & Auditoria',
          subtitle: 'Histórico detalhado de entregas, erros e logs individuais por aluno',
        };
      case 'settings':
        return {
          title: 'Configurações do Sistema',
          subtitle: 'Parâmetros de envio, horários de silêncio e limites de mensagens',
        };
      case 'whatsapp':
        return {
          title: 'Conexão WhatsApp (Baileys)',
          subtitle: 'Gerenciamento da sessão e leitura de QR Code para disparo real',
        };
    }
  };

  const currentTitle = getPageTitle(currentTab);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMock={Boolean(whatsAppState?.isMock || whatsAppState?.status === 'MOCK_ACTIVE')}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Sticky Top Navbar */}
        <Navbar
          whatsAppState={whatsAppState}
          onOpenWhatsAppModal={() => setCurrentTab('whatsapp')}
          title={currentTitle.title}
          subtitle={currentTitle.subtitle}
        />

        {/* Dynamic Page Views */}
        <main className="p-8 flex-1">
          {currentTab === 'dashboard' && (
            <DashboardPage
              stats={stats}
              students={students}
              recentCampaigns={campaigns}
              whatsAppState={whatsAppState}
              onNavigateToCampaigns={() => setCurrentTab('campaigns')}
              onNavigateToStudents={() => setCurrentTab('students')}
              onNavigateToWhatsApp={() => setCurrentTab('whatsapp')}
              onOpenMonitor={(campId) => {
                setActiveMonitorCampaignId(campId);
                setCurrentTab('campaigns');
              }}
            />
          )}

          {currentTab === 'students' && (
            <StudentsPage students={students} onRefresh={fetchAllData} />
          )}

          {currentTab === 'evaluations' && (
            <EvaluationsPage students={students} />
          )}

          {currentTab === 'templates' && (
            <TemplatesPage
              templates={templates}
              students={students}
              onRefresh={fetchAllData}
              onUseInCampaign={(tpl) => {
                setCurrentTab('campaigns');
              }}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsPage
              campaigns={campaigns}
              students={students}
              templates={templates}
              activeMonitorCampaignId={activeMonitorCampaignId}
              onOpenMonitor={setActiveMonitorCampaignId}
              onRefresh={fetchAllData}
            />
          )}

          {currentTab === 'reports' && <ReportsPage logs={logs} onRefresh={fetchAllData} />}

          {currentTab === 'whatsapp' && (
            <WhatsAppPage state={whatsAppState} onRefreshState={fetchWhatsAppStatusOnly} />
          )}

          {currentTab === 'settings' && (
            <SettingsPage settings={settings} onRefresh={fetchAllData} />
          )}
        </main>
      </div>
    </div>
  );
};
