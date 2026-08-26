import React, { useState, useRef } from 'react';
import { apiClient } from '../../services/api';
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertTriangle, Download } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    importedCount: number;
    totalInFile: number;
    invalidCount: number;
    invalidRows: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.csv') || dropped.name.endsWith('.xls')) {
        setFile(dropped);
        setError(null);
        setResult(null);
      } else {
        setError('Por favor selecione um arquivo válido .xlsx ou .csv');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecione uma planilha para importar');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.importStudents(file);
      setResult(data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Erro ao importar planilha');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Importação em Lote de Alunos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300">
                <div className="flex items-center space-x-2 font-bold text-sm text-emerald-200 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Importação Concluída com Sucesso!</span>
                </div>
                <p className="text-xs text-emerald-300/90 mt-2">
                  Foram importados <strong>{result.importedCount}</strong> alunos com telefones sanitizados para o padrão E.164.
                </p>
                {result.invalidCount > 0 && (
                  <p className="text-xs text-amber-300 mt-1">
                    ⚠️ {result.invalidCount} linhas continham números ou dados inválidos e foram ignoradas.
                  </p>
                )}
              </div>

              {result.invalidRows && result.invalidRows.length > 0 && (
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/50 max-h-40 overflow-y-auto">
                  <h4 className="font-semibold text-slate-300 mb-2">Linhas não importadas:</h4>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    {result.invalidRows.map((r, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span>{r.name} ({r.originalPhone})</span>
                        <span className="text-rose-400">{r.validationError}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Importar Outro Arquivo
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-950"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                  file
                    ? 'border-emerald-500 bg-emerald-950/20'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-semibold text-slate-200">{file.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB • Clique para alterar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-slate-200">
                        Arraste sua planilha ou clique para selecionar
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Formatos suportados: .xlsx, .csv ou .xls
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions & Template Link */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-[11px] text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">Colunas reconhecidas:</span>
                  <a
                    href={apiClient.downloadSampleSpreadsheetUrl}
                    download
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar Modelo Exemplo</span>
                  </a>
                </div>
                <p className="text-slate-400">
                  <code className="text-emerald-300 font-mono">Nome</code>,{' '}
                  <code className="text-emerald-300 font-mono">Telefone (com DDD)</code>,{' '}
                  <code className="text-emerald-300 font-mono">Turma (TPE/TCC1/TCC2)</code>,{' '}
                  <code className="text-slate-300 font-mono">Orientador</code>,{' '}
                  <code className="text-slate-300 font-mono">Tema</code>,{' '}
                  <code className="text-slate-300 font-mono">Prazo</code>.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!file || loading}
                  onClick={handleUpload}
                  className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-950 transition-all disabled:opacity-40"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{loading ? 'Processando...' : 'Iniciar Importação'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
