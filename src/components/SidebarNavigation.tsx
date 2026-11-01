/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavTab } from './TopNavigation';
import {
  LayoutDashboard,
  Activity,
  Flame,
  LineChart,
  Target,
  FileText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface SidebarNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isEmergencyTripped: boolean;
  onToggleEmergency: () => void;
  activeAlertCount: number;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  onSelectTab,
  isEmergencyTripped,
  onToggleEmergency,
  activeAlertCount,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'monitor',
      label: 'DASHBOARD',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'diagnosis',
      label: 'AI DIAGNOSIS',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'physics',
      label: 'DIGITAL TWIN',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'alerts',
      label: 'ALERTS & SOP',
      icon: <Flame className="w-4 h-4" />,
      badge: activeAlertCount,
    },
    {
      id: 'history',
      label: 'ANALYTICS',
      icon: <LineChart className="w-4 h-4" />,
    },
    {
      id: 'architecture',
      label: 'MQTT & EDGE',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'mlhealth',
      label: 'MODEL HEALTH',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#070b07] border-r border-[#192419] flex flex-col justify-between p-4 shrink-0 select-none min-h-screen">
      <div>
        {/* Top Insignia / Brand Crest */}
        <div className="flex flex-col items-center text-center pb-6 pt-2 border-b border-[#162016]">
          {/* Spartan Helmet Crest SVG in Neon Lime */}
          <div className="relative mb-2">
            <svg
              viewBox="0 0 100 100"
              className="w-12 h-12 text-[#a3e635] drop-shadow-[0_0_12px_rgba(163,230,53,0.5)]"
              fill="currentColor"
            >
              {/* Stylized Spartan Helmet */}
              <path d="M 50 5 C 38 5 28 15 28 28 L 28 45 C 28 55 35 65 50 95 C 65 65 72 55 72 45 L 72 28 C 72 15 62 5 50 5 Z M 50 15 C 56 15 62 20 62 28 L 62 42 L 53 42 L 53 65 L 47 65 L 47 42 L 38 42 L 38 28 C 38 20 44 15 50 15 Z" />
              <rect x="47" y="2" width="6" height="24" rx="2" fill="#bef264" />
            </svg>
          </div>
          <h1 className="font-display tracking-[0.2em] text-sm font-black text-slate-100">
            DISCIPLINE
          </h1>
          <div className="text-[10px] tracking-[0.25em] text-[#71826f] font-mono font-medium mt-0.5">
            OVER EVERYTHING
          </div>
          <div className="text-[9px] tracking-wider text-[#a3e635] font-mono mt-1 bg-[#121c11] border border-[#23351f] px-2 py-0.5 rounded">
            ASSET: MOTOR01
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wider font-display transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#182915] text-[#bef264] border border-[#4d7c0f] shadow-[0_0_14px_rgba(163,230,53,0.18)]'
                    : 'text-[#748772] hover:text-[#d4e2d2] hover:bg-[#0e160e] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#a3e635]' : 'text-[#647562]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="font-mono text-[10px] bg-red-950/80 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Motivational Sidebar Callout matching screenshot */}
        <div className="mt-8 p-3 bg-[#0a0f0a] border border-[#182418] rounded-lg">
          <p className="text-[11px] text-[#788a76] italic leading-relaxed text-center font-serif">
            "The discipline you apply today will be the operational uptime you rely on tomorrow."
          </p>
        </div>
      </div>

      {/* Bottom Emergency Trip Action & Silhouette */}
      <div className="pt-6 border-t border-[#162016]">
        {isEmergencyTripped ? (
          <button
            onClick={onToggleEmergency}
            className="w-full py-2.5 px-3 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-display font-bold tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>RESET SAFETY TRIP</span>
          </button>
        ) : (
          <button
            onClick={onToggleEmergency}
            className="w-full py-2.5 px-3 bg-[#111710] hover:bg-[#192418] border border-[#2b3d28] text-slate-300 hover:text-red-400 text-xs font-display font-bold tracking-wider rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer group"
          >
            <ShieldAlert className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
            <span>EMERGENCY STOP</span>
          </button>
        )}

        <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[#586856]">
          <span>WAL PERSISTENCE</span>
          <span className="text-[#a3e635]">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
