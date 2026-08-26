import React from 'react';
import { WhatsAppState } from '../../types';
import { ConnectionBadge } from './ConnectionBadge';
import { GraduationCap, Bell } from 'lucide-react';

interface NavbarProps {
  whatsAppState: WhatsAppState | null;
  onOpenWhatsAppModal: () => void;
  title: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  whatsAppState,
  onOpenWhatsAppModal,
  title,
  subtitle,
}) => {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h2 className="text-base font-bold text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* WhatsApp Connection Badge */}
        <ConnectionBadge
          state={whatsAppState}
          onOpenConnectModal={onOpenWhatsAppModal}
        />

        {/* User indicator */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="hidden md:block">
            <span className="block text-xs font-semibold text-slate-200">Coordenação</span>
            <span className="block text-[10px] text-slate-400">TPE & TCC</span>
          </div>
        </div>
      </div>
    </header>
  );
};
