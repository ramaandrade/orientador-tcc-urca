import React from 'react';
import { WhatsAppState } from '../../types';
import { Wifi, WifiOff, QrCode, Sparkles, RefreshCw } from 'lucide-react';

interface ConnectionBadgeProps {
  state: WhatsAppState | null;
  onOpenConnectModal?: () => void;
  loading?: boolean;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  state,
  onOpenConnectModal,
  loading = false,
}) => {
  if (loading || !state) {
    return (
      <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-xs text-slate-400">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Verificando status...</span>
      </div>
    );
  }

  if (state.isMock || state.status === 'MOCK_ACTIVE') {
    return (
      <button
        onClick={onOpenConnectModal}
        className="flex items-center space-x-2 bg-indigo-950/80 border border-indigo-700/60 hover:border-indigo-500/80 px-3 py-1.5 rounded-full text-xs text-indigo-300 font-medium transition-all shadow-sm shadow-indigo-950"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
        <span>Modo Simulação (Mock)</span>
        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
      </button>
    );
  }

  switch (state.status) {
    case 'CONNECTED':
      return (
        <button
          onClick={onOpenConnectModal}
          className="flex items-center space-x-2 bg-emerald-950/80 border border-emerald-700/60 hover:border-emerald-500/80 px-3 py-1.5 rounded-full text-xs text-emerald-300 font-medium transition-all shadow-sm shadow-emerald-950"
          title={`Conectado como ${state.userName || state.phoneNumber}`}
        >
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>WhatsApp Conectado</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </button>
      );

    case 'QR_READY':
      return (
        <button
          onClick={onOpenConnectModal}
          className="flex items-center space-x-2 bg-amber-950/80 border border-amber-600/70 hover:border-amber-400 px-3 py-1.5 rounded-full text-xs text-amber-300 font-semibold transition-all animate-bounce shadow-sm shadow-amber-950"
        >
          <QrCode className="w-3.5 h-3.5 text-amber-400" />
          <span>Escanear QR Code</span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </button>
      );

    case 'CONNECTING':
      return (
        <button
          onClick={onOpenConnectModal}
          className="flex items-center space-x-2 bg-blue-950/80 border border-blue-700/60 px-3 py-1.5 rounded-full text-xs text-blue-300 font-medium transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Conectando WhatsApp...</span>
        </button>
      );

    case 'DISCONNECTED':
    default:
      return (
        <button
          onClick={onOpenConnectModal}
          className="flex items-center space-x-2 bg-rose-950/80 border border-rose-700/60 hover:border-rose-500 px-3 py-1.5 rounded-full text-xs text-rose-300 font-medium transition-all"
        >
          <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          <span>WhatsApp Desconectado</span>
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
        </button>
      );
  }
};
