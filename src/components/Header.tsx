import React from 'react';
import { Search, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className={`h-16 px-8 flex items-center justify-between shrink-0 border-b transition-colors ${
      isDarkMode 
        ? 'bg-[#111419] border-[#2D3139] text-[#E2E8F0]' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
            isDarkMode ? 'text-[#64748B]' : 'text-slate-400'
          }`} />
          <input
            type="text"
            placeholder="Search audit ledger..."
            className={`pl-9 pr-3 py-1.5 text-xs rounded-md w-56 focus:outline-none transition-all ${
              isDarkMode 
                ? 'bg-[#0F1115] border border-[#2D3139] text-[#E2E8F0] placeholder-[#64748B] focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500' 
                : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            }`}
          />
        </div>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
            isDarkMode 
              ? 'bg-[#1C2128] border-[#2D3139] text-amber-400 hover:bg-[#252B35]' 
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dark Theme</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button className={`p-2 rounded-full relative cursor-pointer transition-colors ${
          isDarkMode ? 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1C2128]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}>
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-1.5 right-1.5 ring-2 ring-current" />
        </button>

        {/* User Role Badge */}
        <div className={`flex items-center gap-2 pl-3 border-l cursor-pointer ${
          isDarkMode ? 'border-[#2D3139]' : 'border-slate-200'
        }`}>
          <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-500 font-bold flex items-center justify-center text-xs border border-blue-500/30">
            A
          </div>
          <span className="text-xs font-medium">
            Audit operator
          </span>
          <ChevronDown className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#64748B]' : 'text-slate-400'}`} />
        </div>
      </div>
    </header>
  );
};

