import React, { useState } from 'react';
import { MessageLog, AcademicGroup } from '../types';
import { LogTable } from '../components/reports/LogTable';
import { History, RefreshCw } from 'lucide-react';

interface ReportsPageProps {
  logs: MessageLog[];
  onRefresh: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ logs, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [groupFilter, setGroupFilter] = useState<AcademicGroup>('ALL');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-400" />
            <span>Histórico & Relatórios de Entrega</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe o status detalhado de cada mensagem individual e exporte relatórios em formato CSV.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Atualizar Logs</span>
        </button>
      </div>

      <LogTable
        logs={logs}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        onRefresh={onRefresh}
      />
    </div>
  );
};
