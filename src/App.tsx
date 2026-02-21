/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Search, 
  ChevronRight, 
  Bell, 
  Calendar, 
  UserPlus, 
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Filter,
  X,
  PlusCircle,
  Phone,
  User,
  Check
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { BottomNav } from './components/BottomNav';
import { SummaryCard } from './components/SummaryCard';
import { Customer, Transaction, Reminder, TransactionType } from './types';
import { cn, formatCurrency } from './utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [summary, setSummary] = useState({ todayExpense: 0, iGet: 0, theyGet: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState<{show: boolean, type: TransactionType | null, customerId?: string}>({ show: false, type: null });
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', type: 'CUSTOMER' as const });
  const [newTransaction, setNewTransaction] = useState({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  const fetchData = async () => {
    try {
      const [custRes, remRes, sumRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/reminders'),
        fetch('/api/summary')
      ]);
      
      const custData = await custRes.json();
      const remData = await remRes.json();
      const sumData = await sumRes.json();
      
      setCustomers(custData);
      setReminders(remData);
      setSummary(sumData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const customer = {
      id: Math.random().toString(36).substr(2, 9),
      ...newCustomer
    };

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      if (res.ok) {
        setShowAddCustomer(false);
        setNewCustomer({ name: '', phone: '', type: 'CUSTOMER' });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add customer:", error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.amount || !showAddTransaction.type) return;

    const transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: showAddTransaction.type,
      amount: parseFloat(newTransaction.amount),
      date: newTransaction.date,
      note: newTransaction.note,
      customerId: showAddTransaction.customerId
    };

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      if (res.ok) {
        setShowAddTransaction({ show: false, type: null });
        setNewTransaction({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
        fetchData();
        if (selectedCustomer) {
           // Refresh selected customer balance locally or refetch
           const updatedCustRes = await fetch('/api/customers');
           const updatedCusts = await updatedCustRes.json();
           const updated = updatedCusts.find((c: Customer) => c.id === selectedCustomer.id);
           if (updated) setSelectedCustomer(updated);
        }
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  };

  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', date: new Date().toISOString().split('T')[0], amount: '', type: 'COLLECTION' as const });

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminder.title) return;

    const reminder = {
      id: Math.random().toString(36).substr(2, 9),
      ...newReminder,
      amount: newReminder.amount ? parseFloat(newReminder.amount) : undefined
    };

    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reminder)
      });
      if (res.ok) {
        setShowAddReminder(false);
        setNewReminder({ title: '', date: new Date().toISOString().split('T')[0], amount: '', type: 'COLLECTION' });
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add reminder:", error);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [searchQuery, customers]);

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard title="আজকের খরচ" amount={summary.todayExpense} type="expense" />
        <SummaryCard title="আমি পাই" amount={summary.iGet} type="sale" />
        <SummaryCard title="আমার থেকে পায়" amount={summary.theyGet} type="cash" />
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-600 mb-3 px-1">দ্রুত কাজ (Quick Actions)</h3>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setActiveTab('customers')}
            className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-medium active:scale-95 transition-transform"
          >
            <div className="bg-emerald-600 text-white p-2 rounded-xl">
              <Plus size={20} />
            </div>
            আমি পাবো
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className="flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 font-medium active:scale-95 transition-transform"
          >
            <div className="bg-rose-600 text-white p-2 rounded-xl">
              <Minus size={20} />
            </div>
            আমার থেকে পাবে
          </button>
          <button 
            onClick={() => setShowAddTransaction({ show: true, type: 'EXPENSE' })}
            className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 font-medium active:scale-95 transition-transform"
          >
            <div className="bg-amber-600 text-white p-2 rounded-xl">
              <ArrowRightLeft size={20} />
            </div>
            খরচ যোগ করুন
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 font-medium active:scale-95 transition-transform"
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <TrendingUp size={20} />
            </div>
            রিপোর্ট দেখুন
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-600">সাম্প্রতিক খাতা (Recent Ledger)</h3>
          <button onClick={() => setActiveTab('customers')} className="text-emerald-600 text-xs font-medium">সব দেখুন</button>
        </div>
        <div className="space-y-4">
          {customers.slice(0, 5).map(customer => (
            <div key={customer.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  {customer.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                  <p className="text-[10px] text-slate-400">{customer.lastTransactionDate || 'কোন লেনদেন নেই'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-sm font-bold",
                  customer.balance > 0 ? "text-emerald-600" : customer.balance < 0 ? "text-rose-600" : "text-slate-400"
                )}>
                  {formatCurrency(Math.abs(customer.balance))}
                </p>
                <p className="text-[10px] text-slate-400">
                  {customer.balance > 0 ? "পাবেন" : customer.balance < 0 ? "দেবেন" : "পরিশোধিত"}
                </p>
              </div>
            </div>
          ))}
          {customers.length === 0 && (
            <p className="text-center text-slate-400 text-xs py-4">কোন হিসাব নেই</p>
          )}
        </div>
      </section>
    </motion.div>
  );

  const renderCustomers = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-4"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="নাম খুঁজুন..."
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <button 
          onClick={() => setShowAddCustomer(true)}
          className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-95 transition-transform"
        >
          <UserPlus size={18} />
          নতুন পাওনাদার/দেনাদার
        </button>
        <button className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-600 active:bg-slate-50">
          <Filter size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredCustomers.map((customer, idx) => (
          <button 
            key={customer.id}
            onClick={() => setSelectedCustomer(customer)}
            className={cn(
              "w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors",
              idx !== filteredCustomers.length - 1 && "border-b border-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                customer.balance > 0 ? "bg-emerald-500" : customer.balance < 0 ? "bg-rose-500" : "bg-slate-300"
              )}>
                {customer.name[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">{customer.name}</p>
                <p className="text-xs text-slate-400">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className={cn(
                  "text-sm font-bold",
                  customer.balance > 0 ? "text-emerald-600" : customer.balance < 0 ? "text-rose-600" : "text-slate-400"
                )}>
                  {formatCurrency(Math.abs(customer.balance))}
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                  {customer.balance > 0 ? "পাবেন" : customer.balance < 0 ? "দেবেন" : "পরিশোধিত"}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          </button>
        ))}
        {filteredCustomers.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">কোন কাস্টমার পাওয়া যায়নি</p>
        )}
      </div>
    </motion.div>
  );

  const renderReminders = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-4"
    >
      <div className="bg-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-emerald-100 text-xs font-medium mb-1 uppercase tracking-widest">আজকের তাগাদা</p>
          <h2 className="text-2xl font-bold">{reminders.filter(r => r.status !== 'COMPLETED').length}টি বাকি আছে</h2>
          <button 
            onClick={() => setShowAddReminder(true)}
            className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            নতুন এলার্ম সেট করুন
          </button>
        </div>
        <Bell className="absolute -right-4 -bottom-4 text-white/10" size={120} />
      </div>

      <div className="space-y-3">
        {reminders.map(reminder => (
          <div key={reminder.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                reminder.status === 'OVERDUE' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
              )}>
                {reminder.type === 'COLLECTION' ? <TrendingUp size={24} /> : reminder.type === 'PAYMENT' ? <TrendingDown size={24} /> : <Calendar size={24} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{reminder.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase",
                    reminder.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {reminder.status === 'OVERDUE' ? 'সময় পার হয়েছে' : 'আসন্ন'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{reminder.date}</span>
                </div>
              </div>
            </div>
            {reminder.amount && (
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{formatCurrency(reminder.amount)}</p>
                <button className="text-emerald-600 text-[10px] font-bold mt-1">তাগাদা দিন</button>
              </div>
            )}
          </div>
        ))}
        {reminders.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-8">কোন তাগাদা নেই</p>
        )}
      </div>
    </motion.div>
  );

  const renderReports = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-600">সাপ্তাহিক রিপোর্ট</h3>
            <p className="text-[10px] text-slate-400">সাম্প্রতিক লেনদেন</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { name: 'শনি', income: 4000, expense: 2400 },
              { name: 'রবি', income: 3000, expense: 1398 },
              { name: 'সোম', income: 2000, expense: 9800 },
              { name: 'মঙ্গল', income: 2780, expense: 3908 },
              { name: 'বুধ', income: 1890, expense: 4800 },
              { name: 'বৃহ', income: 2390, expense: 3800 },
              { name: 'শুক্র', income: 3490, expense: 4300 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis hide />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-slate-500">আদায় (Collection)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-medium text-slate-500">পেমেন্ট (Payment)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-4 z-40">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
            <h1 className="text-lg font-bold text-slate-900">টালিখাতা <span className="text-emerald-600">লাইট</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <button 
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs"
            >
              JS
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'home' && renderHome()}
            {activeTab === 'customers' && renderCustomers()}
            {activeTab === 'reminders' && renderReminders()}
            {activeTab === 'reports' && renderReports()}
            {activeTab === 'add' && (
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[60vh] text-center"
               >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <PlusCircle size={40} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">নতুন এন্ট্রি যোগ করুন</h2>
                  <p className="text-sm text-slate-500 mt-2 px-8">এখানে আপনি পাওনা, দেনা বা খরচের হিসাব দ্রুত যোগ করতে পারবেন।</p>
                  <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                    <button 
                      onClick={() => setActiveTab('customers')}
                      className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-slate-700 active:bg-slate-50"
                    >
                      <Plus className="text-emerald-600" />
                      আমি পাবো
                    </button>
                    <button 
                      onClick={() => setActiveTab('customers')}
                      className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-slate-700 active:bg-slate-50"
                    >
                      <Minus className="text-rose-600" />
                      আমার থেকে পাবে
                    </button>
                  </div>
               </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Modals */}
      
      {/* Add Customer Modal */}
      <AnimatePresence>
        {showAddCustomer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">নতুন পাওনাদার/দেনাদার</h2>
                <button onClick={() => setShowAddCustomer(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">নাম</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="নাম লিখুন"
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">ফোন নম্বর</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="০১৭XXXXXXXX"
                      value={newCustomer.phone}
                      onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setNewCustomer({...newCustomer, type: 'CUSTOMER'})}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-xs font-bold transition-all",
                      newCustomer.type === 'CUSTOMER' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    দেনাদার (পাবো)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewCustomer({...newCustomer, type: 'SUPPLIER'})}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-xs font-bold transition-all",
                      newCustomer.type === 'SUPPLIER' ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    পাওনাদার (দেবো)
                  </button>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
                  যোগ করুন
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddTransaction.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  {showAddTransaction.type === 'GIVE_CREDIT' ? 'বাকি দিলাম (পাওনা)' : 
                   showAddTransaction.type === 'TAKE_CREDIT' ? 'বাকি নিলাম (দেনা)' :
                   showAddTransaction.type === 'EXPENSE' ? 'খরচ যোগ' : 
                   showAddTransaction.type === 'PAYMENT_RECEIVED' ? 'টাকা পেলাম' : 'টাকা দিলাম'}
                </h2>
                <button onClick={() => setShowAddTransaction({ show: false, type: null })} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">পরিমাণ (টাকা)</label>
                  <input 
                    type="number" 
                    required
                    autoFocus
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                    placeholder="০.০০"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">বিবরণ (ঐচ্ছিক)</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="লেনদেনের বিবরণ"
                    value={newTransaction.note}
                    onChange={e => setNewTransaction({...newTransaction, note: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">তারিখ</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-emerald-200 active:scale-95 transition-transform flex items-center justify-center gap-2">
                  <Check size={20} />
                  নিশ্চিত করুন
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddReminder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">নতুন তাগাদা</h2>
                <button onClick={() => setShowAddReminder(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddReminder} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">শিরোনাম</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="যেমন: রহিম সাহেবের থেকে আদায়"
                    value={newReminder.title}
                    onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">পরিমাণ (ঐচ্ছিক)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="০.০০"
                    value={newReminder.amount}
                    onChange={e => setNewReminder({...newReminder, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">তারিখ</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={newReminder.date}
                    onChange={e => setNewReminder({...newReminder, date: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setNewReminder({...newReminder, type: 'COLLECTION'})}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-[10px] font-bold transition-all",
                      newReminder.type === 'COLLECTION' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    আদায়
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewReminder({...newReminder, type: 'PAYMENT'})}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-[10px] font-bold transition-all",
                      newReminder.type === 'PAYMENT' ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    পেমেন্ট
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewReminder({...newReminder, type: 'PERSONAL'})}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-[10px] font-bold transition-all",
                      newReminder.type === 'PERSONAL' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    ব্যক্তিগত
                  </button>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-emerald-200 active:scale-95 transition-transform">
                  সেভ করুন
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile / Settings Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center"
            onClick={() => setShowProfile(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 sm:pb-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900">প্রোফাইল ও সেটিংস</h2>
                <button onClick={() => setShowProfile(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold">JS</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">জসিম স্টোর</h3>
                  <p className="text-sm text-slate-500">০১৭০০০০০০০০</p>
                  <button className="text-emerald-600 text-xs font-bold mt-1">প্রোফাইল এডিট করুন</button>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                      <User size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">ব্যবসায়িক তথ্য</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">ভাষা (Language)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">বাংলা</span>
                    <ChevronRight size={18} className="text-slate-300" />
                  </div>
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <Bell size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">নোটিফিকেশন সেটিংস</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <Check size={20} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">ব্যাকআপ ও রিসেট</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
              </div>

              <button className="w-full mt-8 py-4 text-rose-600 font-bold border border-rose-100 rounded-2xl hover:bg-rose-50 transition-colors">
                লগ আউট করুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 sm:pb-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">নোটিফিকেশন</h2>
                <button onClick={() => setShowNotifications(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {[
                  { id: 1, title: 'নতুন পেমেন্ট', desc: 'রহিম সাহেব ১২০০ টাকা পরিশোধ করেছেন', time: '১০ মিনিট আগে', type: 'success' },
                  { id: 2, title: 'তাগাদা এলার্ম', desc: 'করিম এন্টারপ্রাইজকে পেমেন্ট করার সময় হয়েছে', time: '১ ঘণ্টা আগে', type: 'warning' },
                  { id: 3, title: 'সিস্টেম আপডেট', desc: 'টালিখাতা লাইট এখন আরও দ্রুত কাজ করে', time: 'গতকাল', type: 'info' }
                ].map(notif => (
                  <div key={notif.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      notif.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                      notif.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.desc}</p>
                      <p className="text-[10px] text-slate-400 mt-2">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 text-emerald-600 font-bold text-sm">
                সবগুলো পড়া হয়েছে হিসেবে চিহ্নিত করুন
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end"
            onClick={() => setSelectedCustomer(null)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md mx-auto rounded-t-[32px] p-6 pb-12 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold",
                    selectedCustomer.balance > 0 ? "bg-emerald-500" : selectedCustomer.balance < 0 ? "bg-rose-500" : "bg-slate-300"
                  )}>
                    {selectedCustomer.name[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCustomer.name}</h2>
                    <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xl font-black",
                    selectedCustomer.balance > 0 ? "text-emerald-600" : selectedCustomer.balance < 0 ? "text-rose-600" : "text-slate-400"
                  )}>
                    {formatCurrency(Math.abs(selectedCustomer.balance))}
                  </p>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    {selectedCustomer.balance > 0 ? "আপনি পাবেন" : selectedCustomer.balance < 0 ? "সাপ্লায়ার পাবে" : "পরিশোধিত"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => setShowAddTransaction({ show: true, type: 'PAYMENT_RECEIVED', customerId: selectedCustomer.id })}
                  className="flex flex-col items-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold active:scale-95 transition-transform"
                >
                  <TrendingUp size={24} />
                  টাকা পেলাম
                </button>
                <button 
                  onClick={() => setShowAddTransaction({ show: true, type: 'GIVE_CREDIT', customerId: selectedCustomer.id })}
                  className="flex flex-col items-center gap-2 p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100 font-bold active:scale-95 transition-transform"
                >
                  <TrendingDown size={24} />
                  বাকি দিলাম
                </button>
              </div>

              <button className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                <Bell size={18} />
                তাগাদা মেসেজ পাঠান
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
