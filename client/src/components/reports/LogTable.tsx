import React, { useState } from 'react';
import { MessageLog, AcademicGroup } from '../../types';
import { apiClient } from '../../services/api';
import {
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  FileSpreadsheet,
  FileText,
  Filter,
} from 'lucide-react';

interface LogTableProps {
  logs: MessageLog[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  groupFilter: AcademicGroup;
  onGroupFilterChange: (val: AcademicGroup) => void;
  onRefresh: () => void;
}

export const LogTable: React.FC<LogTableProps> = ({
  logs,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  groupFilter,
  onGroupFilterChange,
  onRefresh,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (groupFilter !== 'ALL' && log.recipientGroup !== groupFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = log.recipientName.toLowerCase().includes(q);
      const matchPhone = log.recipientPhone.includes(q);
      const matchMsg = log.renderedMessage.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Enviado</span>
          </span>
        );
      case 'SENDING':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
            <Send className="w-3 h-3 text-blue-400 animate-spin" />
            <span>Enviando</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Falha</span>
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Pendente</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por aluno, telefone ou trecho da mensagem..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters and Export Button */}
        <div className="flex items-center space-x-2 flex-wrap text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="SENT">Enviados</option>
            <option value="PENDING">Pendentes</option>
            <option value="FAILED">Falhas</option>
          </select>

          {/* Group Filter */}
          <select
            value={groupFilter}
            onChange={(e) => onGroupFilterChange(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
          >
            <option value="ALL">Todas as Turmas</option>
            <option value="TPE">TPE</option>
            <option value="TCC1">TCC 1</option>
            <option value="TCC2">TCC 2</option>
          </select>

          {/* Export CSV */}
          <a
            href={apiClient.exportCsvUrl()}
            download
            className="flex items-center space-x-1.5 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 px-3.5 py-2 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </a>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Destinatário</th>
                <th className="py-3 px-4">Turma</th>
                <th className="py-3 px-4">WhatsApp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Mensagem Enviada</th>
                <th className="py-3 px-4">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nenhum registro de envio encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedMessage(log)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-100">{log.recipientName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {log.recipientGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400 text-[11px]">
                      +{log.recipientPhone}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="truncate text-slate-400 text-[11px]">{log.renderedMessage}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {log.sentAt
                        ? new Date(log.sentAt).toLocaleString('pt-BR')
                        : new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message detail modal when clicked */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-100">{selectedMessage.recipientName}</h4>
                <p className="text-slate-400 text-[11px]">
                  Turma: {selectedMessage.recipientGroup} • Telefone: +{selectedMessage.recipientPhone}
                </p>
              </div>
              <div>{getStatusBadge(selectedMessage.status)}</div>
            </div>

            {selectedMessage.errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl">
                <strong>Motivo da Falha:</strong> {selectedMessage.errorMessage}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Conteúdo Exato Enviado:</label>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedMessage.renderedMessage}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
