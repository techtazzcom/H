import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils';

interface SummaryCardProps {
  title: string;
  amount: number;
  type: 'sale' | 'expense' | 'cash';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'sale': return <ArrowUpRight className="text-emerald-600" size={20} />;
      case 'expense': return <ArrowDownLeft className="text-rose-600" size={20} />;
      case 'cash': return <Wallet className="text-blue-600" size={20} />;
    }
  };

  const getBg = () => {
    switch (type) {
      case 'sale': return 'bg-emerald-50';
      case 'expense': return 'bg-rose-50';
      case 'cash': return 'bg-blue-50';
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{title}</span>
        <div className={`p-1.5 rounded-lg ${getBg()}`}>
          {getIcon()}
        </div>
      </div>
      <span className="text-lg font-bold text-slate-900">
        {formatCurrency(amount)}
      </span>
    </div>
  );
};
