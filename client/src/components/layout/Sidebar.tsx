import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  History,
  QrCode,
  Settings,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'students'
  | 'evaluations'
  | 'templates'
  | 'campaigns'
  | 'reports'
  | 'whatsapp'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMock: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, isMock }) => {
  const menuItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Painel Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'students' as NavigationTab,
      label: 'Alunos & Turmas',
      icon: Users,
      badge: 'TPE / TCC',
    },
    {
      id: 'evaluations' as NavigationTab,
      label: 'Avaliação de Pesquisas',
      icon: GraduationCap,
      badge: 'IA',
    },
    {
      id: 'templates' as NavigationTab,
      label: 'Modelos de Mensagem',
      icon: FileText,
      badge: null,
    },
    {
      id: 'campaigns' as NavigationTab,
      label: 'Disparador & Filas',
      icon: Send,
      badge: null,
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Histórico & Relatórios',
      icon: History,
      badge: null,
    },
    {
      id: 'whatsapp' as NavigationTab,
      label: 'Conexão WhatsApp',
      icon: QrCode,
      badge: isMock ? 'Mock' : null,
    },
    {
      id: 'settings' as NavigationTab,
      label: 'Configurações',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 leading-tight">Disparador Acadêmico</h1>
            <p className="text-[11px] text-emerald-400 font-medium">TPE • TCC1 • TCC2</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                      item.badge === 'Mock'
                        ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Proteção Anti-Bloqueio</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Delays randômicos e pausas de lote ativos para segurança da sua linha.
          </p>
        </div>
      </div>
    </aside>
  );
};
