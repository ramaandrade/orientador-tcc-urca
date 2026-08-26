import React, { useState } from 'react';
import { WhatsAppState } from '../types';
import { apiClient } from '../services/api';
import {
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Power,
  Sparkles,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface WhatsAppPageProps {
  state: WhatsAppState | null;
  onRefreshState: () => void;
}

export const WhatsAppPage: React.FC<WhatsAppPageProps> = ({ state, onRefreshState }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.connectWhatsApp();
      onRefreshState();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar a sessão do WhatsApp?')) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.disconnectWhatsApp();
      onRefreshState();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.restartWhatsApp();
      onRefreshState();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao reiniciar');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMock = async (enabled: boolean) => {
    setLoading(true);
    try {
      await apiClient.toggleMockWhatsApp(enabled);
      onRefreshState();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao alterar modo mock');
    } finally {
      setLoading(false);
    }
  };

  const isMock = state?.isMock || state?.status === 'MOCK_ACTIVE';
  const isConnected = state?.status === 'CONNECTED';
  const isQrReady = state?.status === 'QR_READY';
  const isConnecting = state?.status === 'CONNECTING';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span>Gerenciamento da Sessão WhatsApp Web</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Conecte o WhatsApp do orientador ou da coordenação via QR Code para realizar os disparos.
          </p>
        </div>

        {/* Mock Mode Switch */}
        <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-2xl">
          <div>
            <span className="block text-xs font-bold text-slate-200">Modo Simulação (Mock)</span>
            <span className="block text-[10px] text-slate-400">Testar sem conectar celular</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isMock}
              onChange={(e) => handleToggleMock(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Main Connection Status Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Status Display */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status da Conexão
              </span>
              <button
                onClick={onRefreshState}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1"
                title="Atualizar Status"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
            </div>

            {/* Status Card */}
            {isMock ? (
              <div className="p-5 bg-indigo-950/60 border border-indigo-700/60 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Modo Simulação Ativo</span>
                </div>
                <p className="text-xs text-indigo-300/90 leading-relaxed">
                  Todas as campanhas e mensagens disparadas serão processadas e registradas nos logs
                  como entregues com sucesso, sem enviar mensagens reais para o WhatsApp dos alunos.
                </p>
              </div>
            ) : isConnected ? (
              <div className="p-5 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>WhatsApp Conectado e Pronto para Disparar</span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <p>
                    <strong>Identificação:</strong> {state?.userName || 'Coordenação Acadêmica'}
                  </p>
                  <p>
                    <strong>Número WhatsApp:</strong> +{state?.phoneNumber}
                  </p>
                </div>
              </div>
            ) : isQrReady ? (
              <div className="p-5 bg-amber-950/60 border border-amber-700/60 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span>Aguardando Leitura do QR Code</span>
                </div>
                <p className="text-xs text-amber-300/90">
                  Abra o WhatsApp no seu smartphone, vá em <strong>Aparelhos Conectados</strong> e
                  escaneie o código ao lado.
                </p>
              </div>
            ) : isConnecting ? (
              <div className="p-5 bg-blue-950/60 border border-blue-700/60 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-blue-300 font-bold text-sm">
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                  <span>Iniciando Conexão com o WhatsApp...</span>
                </div>
                <p className="text-xs text-blue-300/90">
                  Aguarde enquanto geramos a sessão segura de autenticação.
                </p>
              </div>
            ) : (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm">
                  <WifiOff className="w-5 h-5" />
                  <span>Sessão Desconectada</span>
                </div>
                <p className="text-xs text-slate-400">
                  Clique no botão abaixo para gerar um QR Code e conectar seu WhatsApp à aplicação.
                </p>
              </div>
            )}

            {/* Instruction Checklist */}
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/40 space-y-2.5 text-xs text-slate-400">
              <span className="font-bold text-slate-300 block">Como conectar seu WhatsApp:</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    1
                  </span>
                  <span>Abra o WhatsApp no seu celular</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <span>
                    Toque em <strong>Configurações</strong> &gt; <strong>Aparelhos Conectados</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <span>
                    Toque em <strong>Conectar um aparelho</strong> e aponte para o QR Code
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center space-x-3 text-xs">
            {!isConnected && !isMock && (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>{loading ? 'Carregando...' : 'Gerar QR Code'}</span>
              </button>
            )}

            {isConnected && (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-semibold transition-all"
              >
                <Power className="w-4 h-4" />
                <span>Desconectar Sessão</span>
              </button>
            )}

            <button
              onClick={handleRestart}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Reiniciar Engine
            </button>
          </div>
        </div>

        {/* Right QR Code Box */}
        <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
          {state?.qrCodeUrl && !isMock && !isConnected ? (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-2xl shadow-2xl inline-block border-4 border-emerald-500">
                <img
                  src={state.qrCodeUrl}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 object-contain"
                />
              </div>
              <p className="text-xs font-semibold text-emerald-400 animate-pulse">
                Aponte a câmera do WhatsApp para escanear
              </p>
            </div>
          ) : isConnected ? (
            <div className="space-y-3">
              <div className="w-24 h-24 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                <Smartphone className="w-12 h-12" />
              </div>
              <h4 className="font-bold text-sm text-slate-100">Dispositivo Sincronizado</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                Sua sessão está ativa. Todas as mensagens disparadas sairão pelo seu WhatsApp com total
                criptografia ponta a ponta.
              </p>
            </div>
          ) : isMock ? (
            <div className="space-y-3">
              <div className="w-24 h-24 rounded-full bg-indigo-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 mx-auto">
                <Sparkles className="w-12 h-12" />
              </div>
              <h4 className="font-bold text-sm text-indigo-200">Simulador Pronto</h4>
              <p className="text-xs text-slate-400 max-w-xs">
                O modo simulação está ativo. Você pode realizar testes completos e verificar as filas e
                relatórios sem necessidade de escanear QR Code.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-24 h-24 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
                <QrCode className="w-12 h-12" />
              </div>
              <h4 className="font-bold text-sm text-slate-400">Nenhum QR Code Ativo</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Clique no botão "Gerar QR Code" para iniciar a conexão com o WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
