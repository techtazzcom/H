import React from 'react';
import { Home, Users, PlusCircle, Bell, BarChart3 } from 'lucide-react';
import { cn } from '../utils';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'হোম', icon: Home },
  { id: 'customers', label: 'খাতা', icon: Users },
  { id: 'add', label: 'এন্ট্রি', icon: PlusCircle, isCenter: true },
  { id: 'reminders', label: 'তাগাদা', icon: Bell },
  { id: 'reports', label: 'রিপোর্ট', icon: BarChart3 },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 safe-bottom z-50">
      <div className="flex justify-around items-end h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center -translate-y-4"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95",
                  isActive ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white"
                )}>
                  <Icon size={28} />
                </div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive ? "text-emerald-600" : "text-slate-500"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center justify-center w-full py-2 transition-colors active:bg-slate-50"
            >
              <Icon 
                size={22} 
                className={isActive ? "text-emerald-600" : "text-slate-400"} 
              />
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-emerald-600" : "text-slate-500"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
