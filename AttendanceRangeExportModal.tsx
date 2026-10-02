'use client';

import React, { useState } from 'react';
import { useAppStore, AttendanceRecord, Child } from '@/lib/store';
import { X, FileText, Calendar } from 'lucide-react';

const STATUS_SHORT: Record<string, { label: string; bg: string; color: string }> = {
  present:  { label: 'P', bg: '#dcfce7', color: '#166534' },
  absent:   { label: 'A', bg: '#fee2e2', color: '#991b1b' },
  late:     { label: 'R', bg: '#fef3c7', color: '#92400e' },
  excused:  { label: 'E', bg: '#dbeafe', color: '#1e40af' },
  none:     { label: '—', bg: '#f8fafc', color: '#94a3b8' },
};

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + 'T12:00:00');
  const endD = new Date(end + 'T12:00:00');
  while (d <= endD) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDateFR(dateStr: string): string {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch {
    return dateStr;
  }
}

interface Props {
  filteredChildren: Child[];
  sectionName: string;
  educatorName?: string;
  onClose: () => void;
}

export const AttendanceRangeExportModal: React.FC<Props> = ({
  filteredChildren,
  sectionName,
  educatorName,
  onClose,
}) => {
  const { attendance, daycareSettings } = useAppStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  const defaultStart = firstOfMonth.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(todayStr);
  const [isGenerating, setIsGenerating] = useState(false);

  const getRecord = (childId: string, date: string): { status: string } => {
    const rec = attendance.find((a) => a.childId === childId && a.date === date);
    return rec ? rec : { status: 'none' };
  };

  const getDayCount = () => {
    if (!startDate || !endDate || startDate > endDate) return 0;
    const s = new Date(startDate + 'T12:00:00');
    const e = new Date(endDate + 'T12:00:00');
    return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleExport = () => {
    if (startDate > endDate) {
      alert('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }
    const dates = getDateRange(startDate, endDate);
    if (dates.length > 62) {
      alert('La plage de dates ne peut pas dépasser 62 jours.');
      return;
    }

    setIsGenerating(true);
    const children = filteredChildren;
    const settings = daycareSettings;
    const periodLabel = 'du ' + formatDateFR(startDate) + ' au ' + formatDateFR(endDate);
    const totalDays = dates.length;

    // Per-child stats
    const stats = children.map((child) => {
      let p = 0, a = 0, r = 0, e = 0;
      dates.forEach((d) => {
        const s = getRecord(child.id, d).status;
        if (s === 'present') p++;
        else if (s === 'absent') a++;
        else if (s === 'late') r++;
        else if (s === 'excused') e++;
      });
      return { childId: child.id, p, a, r, e };
    });

    // Per-date stats
    const dateStats = dates.map((date) => {
      let p = 0, a = 0;
      children.forEach((c) => {
        const s = getRecord(c.id, date).status;
        if (s === 'present' || s === 'late') p++;
        else if (s === 'absent') a++;
      });
      return { date, present: p, absent: a };
    });

    const childHeaders = children.map((c) =>
      '<th style="padding:6px 4px;text-align:center;min-width:52px;font-size:10px;font-weight:700;background:#1e293b;color:#fff;border-right:1px solid #334155;writing-mode:vertical-lr;transform:rotate(180deg);height:90px;white-space:nowrap">'
      + c.firstName + ' ' + c.lastName + '</th>'
    ).join('');

    const dateRows = dates.map((date, di) => {
      const ds = dateStats[di];
      const rowBg = di % 2 === 0 ? '#fff' : '#f8fafc';
      const presRate = children.length > 0 ? Math.round((ds.present / children.length) * 100) : 0;
      const cells = children.map((child) => {
        const s = getRecord(child.id, date).status;
        const meta = STATUS_SHORT[s] || STATUS_SHORT.none;
        return '<td style="padding:5px 3px;text-align:center;background:' + meta.bg + ';color:' + meta.color + ';font-weight:800;font-size:12px;border-right:1px solid #e2e8f0">' + meta.label + '</td>';
      }).join('');
      return '<tr style="background:' + rowBg + ';border-bottom:1px solid #e2e8f0">'
        + '<td style="padding:6px 8px;font-size:11px;font-weight:700;color:#1e293b;white-space:nowrap;border-right:1px solid #e2e8f0;min-width:120px">' + formatDateFR(date) + '</td>'
        + cells
        + '<td style="padding:5px 6px;text-align:center;font-weight:800;font-size:11px;color:#166534;background:#dcfce7;border-left:2px solid #86efac">' + ds.present + '</td>'
        + '<td style="padding:5px 6px;text-align:center;font-weight:800;font-size:11px;color:#991b1b;background:#fee2e2">' + ds.absent + '</td>'
        + '<td style="padding:5px 6px;text-align:center;font-weight:700;font-size:10px;color:#475569;background:#f1f5f9">' + presRate + '%</td>'
        + '</tr>';
    }).join('');

    const childTotals = children.map((child, ci) => {
      const s = stats[ci];
      return '<td style="padding:6px 3px;text-align:center;background:#f1f5f9;font-size:10px;font-weight:700;border-right:1px solid #e2e8f0">'
        + '<span style="color:#166534">' + s.p + '</span>/<span style="color:#991b1b">' + s.a + '</span></td>';
    }).join('');

    const legend =
      '<span style="color:#166534;background:#dcfce7;padding:2px 7px;border-radius:4px;font-weight:800;font-size:11px;margin-right:8px">P</span>Présent&nbsp;&nbsp;'
      + '<span style="color:#92400e;background:#fef3c7;padding:2px 7px;border-radius:4px;font-weight:800;font-size:11px;margin-right:8px">R</span>Retard&nbsp;&nbsp;'
      + '<span style="color:#991b1b;background:#fee2e2;padding:2px 7px;border-radius:4px;font-weight:800;font-size:11px;margin-right:8px">A</span>Absent&nbsp;&nbsp;'
      + '<span style="color:#1e40af;background:#dbeafe;padding:2px 7px;border-radius:4px;font-weight:800;font-size:11px;margin-right:8px">E</span>Excusé&nbsp;&nbsp;'
      + '<span style="color:#94a3b8;background:#f8fafc;padding:2px 7px;border-radius:4px;font-weight:800;font-size:11px;margin-right:8px">—</span>Non saisi';

    const html = '<!DOCTYPE html>\n'
      + '<html lang="fr">\n'
      + '<head>\n'
      + '  <meta charset="UTF-8"/>\n'
      + '  <title>Registre de Presence - ' + sectionName + '</title>\n'
      + '  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">\n'
      + '  <style>\n'
      + '    * { margin:0; padding:0; box-sizing:border-box; }\n'
      + '    body { font-family:"Outfit",Arial,sans-serif; background:white; font-size:12px; color:#1e293b; }\n'
      + '    table { border-collapse:collapse; width:100%; }\n'
      + '    @media print { @page { margin:8mm; size:landscape; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }\n'
      + '  </style>\n'
      + '</head>\n'
      + '<body style="padding:16px">\n'

      // Header
      + '  <div style="border-bottom:3px solid #1e293b;padding-bottom:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:flex-start">\n'
      + '    <div>\n'
      + '      <div style="font-size:19px;font-weight:900;color:#1e293b;margin-bottom:3px">' + settings.logo + ' ' + settings.name + '</div>\n'
      + '      <div style="font-size:11px;color:#64748b">' + settings.address + '</div>\n'
      + '      <div style="font-size:11px;color:#64748b">' + settings.phone + ' · ' + settings.email + '</div>\n'
      + '    </div>\n'
      + '    <div style="text-align:right">\n'
      + '      <div style="font-size:13px;font-weight:800;background:#1e293b;color:#fff;padding:6px 14px;border-radius:8px;margin-bottom:5px">REGISTRE DE PRÉSENCE</div>\n'
      + '      <div style="font-size:11px;font-weight:700;color:#475569">📅 ' + periodLabel + '</div>\n'
      + '    </div>\n'
      + '  </div>\n'

      // Section info
      + '  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">\n'
      + '    <div>\n'
      + '      <div style="font-size:11px;color:#64748b;font-weight:600">Classe / Section</div>\n'
      + '      <div style="font-size:15px;font-weight:800;color:#1e293b">' + sectionName + '</div>\n'
      + (educatorName ? '      <div style="font-size:11px;color:#64748b;margin-top:2px">Éducatrice : <strong>' + educatorName + '</strong></div>\n' : '')
      + '    </div>\n'
      + '    <div style="display:flex;gap:10px;font-size:11px">\n'
      + '      <div style="text-align:center;background:#dbeafe;padding:6px 10px;border-radius:8px"><div style="font-size:15px;font-weight:900;color:#1e40af">' + children.length + '</div><div style="color:#1e40af">Enfants</div></div>\n'
      + '      <div style="text-align:center;background:#f0fdf4;padding:6px 10px;border-radius:8px"><div style="font-size:15px;font-weight:900;color:#166534">' + totalDays + '</div><div style="color:#166534">Jours</div></div>\n'
      + '    </div>\n'
      + '  </div>\n'

      // Legend
      + '  <div style="margin-bottom:10px;font-size:11px;color:#475569">' + legend + '</div>\n'

      // Table
      + '  <table>\n'
      + '    <thead>\n'
      + '      <tr>\n'
      + '        <th style="padding:8px 10px;text-align:left;background:#1e293b;color:#fff;font-size:11px;font-weight:700;border-right:1px solid #334155;min-width:120px">📅 Date</th>\n'
      + '        ' + childHeaders + '\n'
      + '        <th style="padding:6px 8px;text-align:center;background:#166534;color:#fff;font-size:10px;font-weight:700;min-width:40px">Prés.</th>\n'
      + '        <th style="padding:6px 8px;text-align:center;background:#991b1b;color:#fff;font-size:10px;font-weight:700;min-width:40px">Abs.</th>\n'
      + '        <th style="padding:6px 8px;text-align:center;background:#475569;color:#fff;font-size:10px;font-weight:700;min-width:46px">Taux</th>\n'
      + '      </tr>\n'
      + '    </thead>\n'
      + '    <tbody>\n'
      + dateRows + '\n'
      + '      <tr style="background:#1e293b;border-top:3px solid #64748b">\n'
      + '        <td style="padding:8px 10px;font-size:11px;font-weight:800;color:#fff">TOTAL (' + totalDays + ' jours)</td>\n'
      + '        ' + childTotals + '\n'
      + '        <td colspan="3" style="padding:8px;text-align:center;font-size:10px;color:#94a3b8;font-style:italic">Présents / Absents</td>\n'
      + '      </tr>\n'
      + '    </tbody>\n'
      + '  </table>\n'

      // Footer
      + '  <div style="margin-top:18px;padding-top:10px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#64748b">\n'
      + '    <div><div style="font-weight:700;margin-bottom:3px">Total enfants : ' + children.length + '</div><div>Période : <strong>' + periodLabel + '</strong> (' + totalDays + ' jour' + (totalDays > 1 ? 's' : '') + ')</div></div>\n'
      + '    <div style="text-align:right"><div style="font-weight:700;margin-bottom:22px">Signature Directrice :</div><div style="border-bottom:1px solid #1e293b;width:160px"></div></div>\n'
      + '  </div>\n'
      + '  <div style="text-align:center;margin-top:10px;font-size:9px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:8px">Document généré le ' + new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' }) + ' · ' + settings.name + '</div>\n'
      + '</body></html>';

    const printWindow = window.open('', '_blank', 'width=1100,height=750');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour ce site afin de générer le PDF.');
      setIsGenerating(false);
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => { printWindow.close(); };
      setTimeout(() => { try { printWindow.close(); } catch (err) { /* ignored */ } }, 30000);
    };
    setIsGenerating(false);
    onClose();
  };

  const dayCount = getDayCount();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-nursery-sand overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl">📊</div>
            <div>
              <h3 className="font-bold text-lg">Exporter Registre de Présence</h3>
              <p className="text-xs text-white/70">Rapport trié par date sur une plage choisie</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Section info */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Section</p>
            <p className="font-bold text-slate-800">{sectionName}</p>
            {educatorName && <p className="text-xs text-slate-500 mt-0.5">Éducatrice : {educatorName}</p>}
            <p className="text-xs text-slate-400 mt-1">{filteredChildren.length} enfant(s)</p>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Début
              </label>
              <input
                type="date"
                value={startDate}
                max={todayStr}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1" />
                Fin
              </label>
              <input
                type="date"
                value={endDate}
                max={todayStr}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Quick shortcuts */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Raccourcis</p>
            <div className="flex flex-wrap gap-2">
              <button type="button"
                onClick={() => { const s = new Date(); s.setDate(s.getDate()-6); setStartDate(s.toISOString().split('T')[0]); setEndDate(todayStr); }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >Cette semaine</button>
              <button type="button"
                onClick={() => { const s = new Date(); s.setDate(s.getDate()-13); setStartDate(s.toISOString().split('T')[0]); setEndDate(todayStr); }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >2 semaines</button>
              <button type="button"
                onClick={() => { const s = new Date(); s.setDate(1); setStartDate(s.toISOString().split('T')[0]); setEndDate(todayStr); }}
                className="px-3 py-1.5 bg-nursery-mint/20 hover:bg-nursery-mint/30 text-emerald-800 text-xs font-bold rounded-xl transition-all"
              >Ce mois</button>
              <button type="button"
                onClick={() => { const n = new Date(); const s = new Date(n.getFullYear(), n.getMonth()-1, 1); const e2 = new Date(n.getFullYear(), n.getMonth(), 0); setStartDate(s.toISOString().split('T')[0]); setEndDate(e2.toISOString().split('T')[0]); }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >Mois dernier</button>
            </div>
          </div>

          {/* Preview */}
          {dayCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
              <p className="font-bold mb-1">📋 Aperçu du rapport</p>
              <p>• <strong>{dayCount} jour{dayCount > 1 ? 's' : ''}</strong> · <strong>{filteredChildren.length} enfants</strong></p>
              <p className="mt-0.5">• Format <strong>paysage</strong> · Colonnes : Date + 1 par enfant + Totaux</p>
              {dayCount > 31 && <p className="mt-1 text-amber-700 font-bold">⚠️ Plage longue — le tableau sera large. Utilisez « Ajuster à la page » lors de l'impression.</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-sm"
            >Annuler</button>
            <button
              onClick={handleExport}
              disabled={isGenerating || dayCount === 0 || dayCount > 62}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              {isGenerating ? 'Génération...' : 'Générer PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
