import React, { useState, useEffect } from 'react';
import { Setting } from '../types';
import { apiClient } from '../services/api';
import { Settings, ShieldAlert, Building, Save, CheckCircle2 } from 'lucide-react';

interface SettingsPageProps {
  settings: Setting | null;
  onRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onRefresh }) => {
  const [defaultMinDelay, setDefaultMinDelay] = useState(5);
  const [defaultMaxDelay, setDefaultMaxDelay] = useState(15);
  const [batchSize, setBatchSize] = useState(20);
  const [batchPauseSeconds, setBatchPauseSeconds] = useState(60);
  const [institutionName, setInstitutionName] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDefaultMinDelay(settings.defaultMinDelay || 5);
      setDefaultMaxDelay(settings.defaultMaxDelay || 15);
      setBatchSize(settings.batchSize || 20);
      setBatchPauseSeconds(settings.batchPauseSeconds || 60);
      setInstitutionName(settings.institutionName || 'Coordenação Acadêmica de TCC & Estágio');
      setCoordinatorName(settings.coordinatorName || 'Coordenação de Curso');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      await apiClient.updateSettings({
        defaultMinDelay,
        defaultMaxDelay,
        batchSize,
        batchPauseSeconds,
        institutionName,
        coordinatorName,
      });
      setSuccess(true);
      onRefresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>Configurações do Sistema</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ajuste as diretrizes de proteção anti-bloqueio e dados da instituição para substituição dinâmica nas mensagens
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {success && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Configurações atualizadas com sucesso!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl">
            {error}
          </div>
        )}

        {/* Anti-Ban Protection Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 text-emerald-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Parâmetros de Proteção Anti-Bloqueio (Anti-Ban)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Delay Mínimo Padrão (segundos)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={defaultMinDelay}
                onChange={(e) => setDefaultMinDelay(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Tempo mínimo de espera entre cada envio</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Delay Máximo Padrão (segundos)
              </label>
              <input
                type="number"
                min={defaultMinDelay}
                max={60}
                value={defaultMaxDelay}
                onChange={(e) => setDefaultMaxDelay(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Tempo máximo de variação randômica</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Tamanho do Lote de Envio (mensagens)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A cada X mensagens enviadas, a fila pausa temporariamente
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Duração da Pausa de Lote (segundos)
              </label>
              <input
                type="number"
                min={15}
                max={300}
                value={batchPauseSeconds}
                onChange={(e) => setBatchPauseSeconds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Pausa para simular comportamento humano</p>
            </div>
          </div>
        </div>

        {/* Institution & Identification Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800 text-teal-400 font-bold text-sm">
            <Building className="w-5 h-5" />
            <span>Dados da Instituição & Coordenação</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Nome da Instituição / Faculdade (Tag {'{instituicao}'})
            </label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Nome do Coordenador / Departamento
            </label>
            <input
              type="text"
              value={coordinatorName}
              onChange={(e) => setCoordinatorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
