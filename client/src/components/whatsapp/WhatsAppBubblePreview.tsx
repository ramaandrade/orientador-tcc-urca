import React from 'react';
import { Student } from '../../types';
import { FileText, Image as ImageIcon, CheckCheck, User, Phone } from 'lucide-react';

interface WhatsAppBubblePreviewProps {
  content: string;
  student?: Partial<Student>;
  attachmentName?: string;
  attachmentType?: string;
  institutionName?: string;
}

export const WhatsAppBubblePreview: React.FC<WhatsAppBubblePreviewProps> = ({
  content,
  student,
  attachmentName,
  attachmentType,
  institutionName = 'Faculdade / Universidade',
}) => {
  // Default mock student if none provided
  const activeStudent: Partial<Student> = student || {
    name: 'Mariana Souza Silva',
    phone: '+55 (11) 98765-4321',
    group: 'TCC2',
    advisor: 'Prof. Dr. Carlos Mendes',
    topic: 'Inteligência Artificial na Educação',
    deadline: '15/11/2026',
    email: 'mariana.souza@universidade.edu.br',
  };

  const firstName = activeStudent.name ? activeStudent.name.split(' ')[0] : 'Aluno';

  // Substitute tags
  const renderedText = (content || '')
    .replace(/{nome}/gi, activeStudent.name || 'Nome do Aluno')
    .replace(/{primeiro_nome}/gi, firstName)
    .replace(/{turma}/gi, activeStudent.group || 'TCC')
    .replace(/{orientador}/gi, activeStudent.advisor || 'Coordenação')
    .replace(/{titulo_pesquisa}/gi, activeStudent.topic || 'Tema do Trabalho')
    .replace(/{tema}/gi, activeStudent.topic || 'Tema do Trabalho')
    .replace(/{data_defesa}/gi, activeStudent.defenseDate || activeStudent.deadline || '30/11/2026')
    .replace(/{defesa}/gi, activeStudent.defenseDate || activeStudent.deadline || '30/11/2026')
    .replace(/{prazo}/gi, activeStudent.defenseDate || activeStudent.deadline || '30/11/2026')
    .replace(/{nota}/gi, activeStudent.grade || '10.0')
    .replace(/{email}/gi, activeStudent.email || 'aluno@universidade.edu.br')
    .replace(/{instituicao}/gi, institutionName);

  // Formatter for WhatsApp markdown: *bold*, _italic_, ~strikethrough~, ```code```
  const formatWhatsAppText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIndex) => {
      // Bold
      let formattedLine = line.replace(/\*(.*?)\*/g, '<strong class="font-bold text-emerald-100">$1</strong>');
      // Italic
      formattedLine = formattedLine.replace(/_(.*?)_/g, '<em class="italic text-slate-300">$1</em>');
      // Strikethrough
      formattedLine = formattedLine.replace(/~(.*?)~/g, '<del class="line-through opacity-75">$1</del>');
      // Code
      formattedLine = formattedLine.replace(/```(.*?)```/g, '<code class="bg-black/30 px-1 py-0.5 rounded font-mono text-xs text-amber-200">$1</code>');

      return (
        <span
          key={lIndex}
          className="block min-h-[1.25rem]"
          dangerouslySetInnerHTML={{ __html: formattedLine || '&nbsp;' }}
        />
      );
    });
  };

  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full max-w-sm mx-auto bg-[#0b141a] rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* Smartphone / WhatsApp Chat Header */}
      <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-emerald-700/50 border border-emerald-500/40 flex items-center justify-center text-emerald-200">
              <User className="w-5 h-5" />
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute bottom-0 right-0 border-2 border-[#202c33]"></span>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-100 leading-none truncate max-w-[170px]">
              {activeStudent.name}
            </h4>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
              {activeStudent.group} • {activeStudent.phone}
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          <Phone className="w-4 h-4 opacity-70" />
        </div>
      </div>

      {/* Chat Area with WhatsApp wallpaper */}
      <div className="whatsapp-pattern p-4 min-h-[260px] flex flex-col justify-end space-y-2">
        {/* Date Pill */}
        <div className="flex justify-center mb-1">
          <span className="bg-[#182229]/90 text-[10px] text-slate-400 px-2.5 py-0.5 rounded-md uppercase font-medium shadow-sm">
            Hoje
          </span>
        </div>

        {/* Message Bubble Outgoing (Coordination to Student) */}
        <div className="self-end max-w-[90%] bg-[#005c4b] text-slate-100 rounded-xl rounded-tr-none p-3 shadow-md border border-emerald-800/40 relative">
          {/* Attachment card if any */}
          {attachmentName && (
            <div className="mb-2 bg-[#02493b] rounded-lg p-2.5 flex items-center space-x-3 border border-emerald-700/50">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 flex items-center justify-center text-emerald-300 shrink-0">
                {attachmentType?.includes('image') ? (
                  <ImageIcon className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-medium text-slate-100 truncate">
                  {attachmentName}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">
                  {attachmentType?.split('/')[1] || 'Documento PDF'}
                </span>
              </div>
            </div>
          )}

          {/* Text Message Content */}
          <div className="text-xs text-slate-100 leading-relaxed break-words whitespace-pre-wrap">
            {renderedText ? (
              formatWhatsAppText(renderedText)
            ) : (
              <span className="italic text-slate-400">Digite sua mensagem para visualizar...</span>
            )}
          </div>

          {/* Timestamp and Double Check */}
          <div className="flex items-center justify-end space-x-1 mt-1.5 text-[10px] text-emerald-200/80">
            <span>{currentTime}</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-[#182229] px-3 py-1.5 text-center text-[10px] text-slate-400 border-t border-slate-800">
        Simulação em tempo real para: <strong className="text-slate-200">{activeStudent.name}</strong>
      </div>
    </div>
  );
};
