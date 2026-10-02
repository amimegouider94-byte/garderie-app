'use client';

import React, { useState } from 'react';
import { useAppStore, Expense } from '@/lib/store';
import {
  TrendingDown,
  Plus,
  Trash2,
  X,
  Check,
  Pencil,
  ShoppingCart,
  Building2,
  Users,
  Wrench,
  Utensils,
  Package,
} from 'lucide-react';

const CATEGORY_META: Record<Expense['category'], { label: string; icon: React.ReactNode; color: string }> = {
  salaires: { label: 'Salaires', icon: <Users className="w-4 h-4" />, color: 'bg-blue-100 text-blue-900 border-blue-300' },
  loyer: { label: 'Loyer & Charges', icon: <Building2 className="w-4 h-4" />, color: 'bg-purple-100 text-purple-900 border-purple-300' },
  fournitures: { label: 'Fournitures', icon: <Package className="w-4 h-4" />, color: 'bg-amber-100 text-amber-900 border-amber-300' },
  alimentation: { label: 'Alimentation', icon: <Utensils className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  maintenance: { label: 'Maintenance', icon: <Wrench className="w-4 h-4" />, color: 'bg-orange-100 text-orange-900 border-orange-300' },
  autre: { label: 'Autre', icon: <ShoppingCart className="w-4 h-4" />, color: 'bg-slate-100 text-slate-900 border-slate-300' },
};

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function dateToMonthLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }
}

interface ExpenseFormProps {
  initial?: Expense;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id'>) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initial, onClose, onSave }) => {
  const { daycareSettings } = useAppStore();
  const currency = daycareSettings.currency || 'DT';
  const isEdit = !!initial;

  const nowStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initial?.date || nowStr);
  const [category, setCategory] = useState<Expense['category']>(initial?.category || 'autre');
  const [description, setDescription] = useState(initial?.description || '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [paymentMethod, setPaymentMethod] = useState<Expense['paymentMethod']>(initial?.paymentMethod || 'Espèces');
  const [month, setMonth] = useState(initial?.month || dateToMonthLabel(nowStr));

  // Auto-update month label when date changes
  const handleDateChange = (val: string) => {
    setDate(val);
    setMonth(dateToMonthLabel(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    onSave({ date, category, description: description.trim(), amount: parsedAmount, paymentMethod, month });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-nursery-sand overflow-hidden">
        <div className="bg-gradient-to-r from-rose-600 to-pink-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-xl">
              {isEdit ? '✏️' : '💸'}
            </div>
            <div>
              <h3 className="font-bold text-lg">{isEdit ? 'Modifier la Dépense' : 'Nouvelle Dépense'}</h3>
              <p className="text-xs text-white/80">Saisir une charge ou un décaissement</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mois de Référence</label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="ex: Octobre 2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Catégorie *</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_META) as Expense['category'][]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 justify-center transition-all ${
                    category === cat
                      ? CATEGORY_META[cat].color + ' border-2'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {CATEGORY_META[cat].icon}
                  <span>{CATEGORY_META[cat].label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ex: Salaires éducatrices — Octobre 2026"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Montant ({currency}) *</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mode de Paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Expense['paymentMethod'])}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                <option>Espèces</option>
                <option>Virement Bancaire</option>
                <option>Chèque</option>
                <option>Carte</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold shadow-lg hover:bg-rose-700 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEdit ? 'Mettre à Jour' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ExpensesManagement: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, daycareSettings, invoices } = useAppStore();
  const currency = daycareSettings.currency || 'DT';
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Collect all distinct months from expenses, ordered newest first
  const allMonths = Array.from(new Set(expenses.map((e) => e.month || dateToMonthLabel(e.date))))
    .sort((a, b) => {
      const toOrder = (s: string) => {
        const parts = s.split(' ');
        const y = parseInt(parts[1] || '0');
        const m = MONTH_NAMES.indexOf(parts[0]);
        return y * 12 + m;
      };
      return toOrder(b) - toOrder(a);
    });

  const filteredExpenses = expenses.filter((e) => {
    const expMonth = e.month || dateToMonthLabel(e.date);
    return monthFilter === 'all' || expMonth === monthFilter;
  });

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const totalRevenue = invoices
    .filter((inv) => monthFilter === 'all' || inv.month === monthFilter)
    .reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);

  const profit = totalRevenue - totalExpenses;

  const handleSaveNew = (data: Omit<Expense, 'id'>) => {
    addExpense(data);
  };

  const handleSaveEdit = (data: Omit<Expense, 'id'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
    }
  };

  const handleDelete = (expense: Expense) => {
    if (window.confirm(`Supprimer la dépense « ${expense.description} » (${expense.amount} ${currency}) ?`)) {
      deleteExpense(expense.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-500" />
            Gestion des Dépenses de la Garderie
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Charges, salaires, alimentation, matériel pédagogique.</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setShowForm(true); }}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Dépense</span>
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Total Dépenses</span>
            <p className="text-2xl font-black text-rose-800 mt-0.5">
              {totalExpenses.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {currency}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xl font-bold">−</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Recettes Encaissées</span>
            <p className="text-2xl font-black text-emerald-800 mt-0.5">
              {totalRevenue.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {currency}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold">+</div>
        </div>
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${profit >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-amber-50 border-amber-200'}`}>
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${profit >= 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
              Solde Net
            </span>
            <p className={`text-2xl font-black mt-0.5 ${profit >= 0 ? 'text-indigo-800' : 'text-amber-800'}`}>
              {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {currency}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center text-xl font-bold ${profit >= 0 ? 'bg-indigo-500' : 'bg-amber-500'}`}>
            {profit >= 0 ? '📈' : '📉'}
          </div>
        </div>
      </div>

      {/* Month Filter */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setMonthFilter('all')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            monthFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tous les mois
        </button>
        {allMonths.map((m) => (
          <button
            key={m}
            onClick={() => setMonthFilter(m)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              monthFilter === m
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-nursery-sand shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Mois</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Description</th>
                <th className="p-4">Mode Paiement</th>
                <th className="p-4 text-right">Montant ({currency})</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((expense) => {
                  const meta = CATEGORY_META[expense.category] || CATEGORY_META.autre;
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-slate-500 text-xs whitespace-nowrap">{expense.date}</td>
                      <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                        {expense.month || dateToMonthLabel(expense.date)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{expense.description}</td>
                      <td className="p-4 text-xs text-slate-500">{expense.paymentMethod}</td>
                      <td className="p-4 text-right font-black text-rose-700 text-base whitespace-nowrap">
                        {(expense.amount || 0).toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {currency}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => { setEditingExpense(expense); setShowForm(true); }}
                            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <TrendingDown className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-bold text-slate-600">Aucune dépense enregistrée</p>
                    <p className="text-xs text-slate-400 mt-1">Cliquez sur « Nouvelle Dépense » pour commencer</p>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-rose-50 border-t-2 border-rose-200">
                <tr>
                  <td colSpan={5} className="p-4 text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Total des Dépenses ({filteredExpenses.length} entrée{filteredExpenses.length > 1 ? 's' : ''})
                  </td>
                  <td className="p-4 text-right font-black text-rose-800 text-base">
                    {totalExpenses.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} {currency}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <ExpenseForm
          initial={editingExpense ?? undefined}
          onClose={() => { setShowForm(false); setEditingExpense(null); }}
          onSave={editingExpense ? handleSaveEdit : handleSaveNew}
        />
      )}
    </div>
  );
};
