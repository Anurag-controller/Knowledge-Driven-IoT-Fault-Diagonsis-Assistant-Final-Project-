/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, ShieldCheck } from 'lucide-react';

export type NavTab =
  | 'monitor'
  | 'diagnosis'
  | 'physics'
  | 'alerts'
  | 'history'
  | 'architecture'
  | 'mlhealth';

interface TopNavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isEmergencyTripped: boolean;
  onToggleEmergency: () => void;
  activeAlertCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  onSelectTab,
  isEmergencyTripped,
  onToggleEmergency,
  activeAlertCount,
}) => {
  const navLinks: { id: NavTab; label: string }[] = [
    { id: 'monitor', label: 'Live Monitor' },
    { id: 'diagnosis', label: 'Hybrid AI/ML' },
    { id: 'physics', label: 'Physics Twin' },
    { id: 'alerts', label: activeAlertCount > 0 ? `Alerts (${activeAlertCount})` : 'Alerts' },
    { id: 'history', label: 'Historical Data' },
    { id: 'architecture', label: 'Edge & MQTT' },
    { id: 'mlhealth', label: 'Model Health' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('monitor');
        }}
        className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 hover:text-sky-400 transition-colors"
      >
        Fault Diagnosis System
      </a>

      {/* Zone 2: 4-7 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        {navLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
                isActive
                  ? 'text-sky-400 font-semibold border-b-2 border-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {isEmergencyTripped ? (
          <button
            onClick={onToggleEmergency}
            className="px-3.5 py-1.5 text-xs font-medium text-emerald-200 bg-emerald-950 border border-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Clear Safety Trip</span>
          </button>
        ) : (
          <button
            onClick={onToggleEmergency}
            className="px-3.5 py-1.5 text-xs font-medium text-red-200 bg-red-950/80 border border-red-800 rounded-lg hover:bg-red-900 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>Emergency Stop</span>
          </button>
        )}
      </div>
    </header>
  );
};
