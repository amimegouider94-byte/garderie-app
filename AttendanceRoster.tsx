'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore, AttendanceRecord, Child } from '@/lib/store';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Check,
  Database,
  RefreshCw,
  LogOut as LogOutIcon,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { AttendancePDFExport } from './AttendancePDFExport';
import { AttendanceRangeExportModal } from './AttendanceRangeExportModal';

export const AttendanceRoster: React.FC = () => {
  const {
    children,
    sections,
    attendance,
    setAttendanceStatus,
    selectedSectionFilter,
    setSelectedSectionFilter,
    role,
    staff,
    currentUser,
    fetchSupabaseData,
    isSupabaseLoading,
    daycareSettings,
    t,
  } = useAppStore();

  const labels = t();

  const [activeNoteInputId, setActiveNoteInputId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [showRangeExportModal, setShowRangeExportModal] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  useEffect(() => {
    fetchSupabaseData();
  }, [fetchSupabaseData]);

  // Lock educator to their own assigned section using currentUser.id
  const isEducator = role === 'educator' || role === 'staff';
  const currentStaff = isEducator ? staff.find((s) => s.id === currentUser?.id) : null;
  const staffSectionId = currentStaff?.assignedSectionId || null;

  // Determine active section for display
  const activeSectionObj = sections.find((s) =>
    isEducator ? s.id === staffSectionId : s.id === selectedSectionFilter
  );

  // Filter children — educators only see their section, admin sees all
  const filteredChildren = children.filter((child) => {
    if (isEducator) {
      return staffSectionId ? child.sectionId === staffSectionId : false;
    }
    return selectedSectionFilter === 'all' || child.sectionId === selectedSectionFilter;
  });

  // Get or create a default attendance record for a child on the selected date
  const getChildStatus = (childId: string): AttendanceRecord => {
    const rec = attendance.find((a) => a.childId === childId && a.date === selectedDate);
    if (rec) return rec;
    return {
      id: `fallback-${childId}-${selectedDate}`,
      childId,
      date: selectedDate,
      status: 'present',
      checkInTime: undefined,
    };
  };

  const presentCount = filteredChildren.filter((c) => {
    const s = getChildStatus(c.id).status;
    return s === 'present' || s === 'late';
  }).length;
  const absentCount = filteredChildren.filter((c) => getChildStatus(c.id).status === 'absent').length;
  const lateCount = filteredChildren.filter((c) => getChildStatus(c.id).status === 'late').length;
  const excusedCount = filteredChildren.filter((c) => getChildStatus(c.id).status === 'excused').length;

  const handleStatusChange = (childId: string, status: AttendanceRecord['status']) => {
    setAttendanceStatus(childId, status, undefined, selectedDate);
  };

  const handleCheckOut = (childId: string) => {
    const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    setAttendanceStatus(childId, getChildStatus(childId).status, undefined, selectedDate, currentTime);
  };

  const handleSaveNote = (childId: string) => {
    const currentStatus = getChildStatus(childId).status;
    setAttendanceStatus(childId, currentStatus, noteText, selectedDate);
    setActiveNoteInputId(null);
    setNoteText('');
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
    setShowPDFPreview(false);
  };

  const displayDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handlePrintPDF = () => {
    // Render the component off-screen, then grab its HTML and open in a new print window
    setShowPDFPreview(true);
    setTimeout(() => {
      const el = document.getElementById('printable-attendance');
      if (!el) {
        window.print();
        setShowPDFPreview(false);
        return;
      }
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        // Popup blocked — fallback to window.print()
        window.print();
        setShowPDFPreview(false);
        return;
      }
      printWindow.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Feuille de Pointage — ${displayDate}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', Arial, sans-serif; background: white; }
    @media print {
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
</body>
</html>`);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
          setShowPDFPreview(false);
        };
        // Fallback close after 30s if onafterprint not triggered
        setTimeout(() => { try { printWindow.close(); } catch {} setShowPDFPreview(false); }, 30000);
      };
    }, 350);
  };

  return (
    <div className="space-y-5">
      {/* PDF Export: render off-screen so we can grab outerHTML */}
      {showPDFPreview && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '800px',
            pointerEvents: 'none',
          }}
        >
          <AttendancePDFExport
            daycareSettings={daycareSettings}
            sectionName={
              isEducator
                ? currentStaff?.assignedSectionName || 'Classe'
                : selectedSectionFilter === 'all'
                ? 'Toutes les Sections'
                : activeSectionObj?.codeName || selectedSectionFilter
            }
            educatorName={
              isEducator ? currentStaff?.name : activeSectionObj?.educatorName
            }
            date={displayDate}
            children={filteredChildren}
            getRecord={getChildStatus}
          />
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-nursery-mint" />
            Pointage Quotidien
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">{displayDate}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchSupabaseData()}
            disabled={isSupabaseLoading}
            className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-2xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isSupabaseLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            title="Exporter le pointage du jour"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>PDF du Jour</span>
          </button>

          <button
            onClick={() => setShowRangeExportModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-sm transition-all flex items-center gap-2 active:scale-95"
            title="Exporter le registre de présence trié par date sur une période"
          >
            <FileText className="w-4 h-4 text-nursery-mint" />
            <span>Registre PDF (Multi-Dates)</span>
          </button>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="bg-white rounded-2xl border border-nursery-sand shadow-card flex items-center gap-2 p-3">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <Calendar className="w-4 h-4 text-nursery-mint shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setShowPDFPreview(false); }}
            max={todayStr}
            className="bg-transparent text-slate-800 font-bold text-sm text-center focus:outline-none cursor-pointer"
          />
          {isToday && (
            <span className="text-[10px] font-extrabold bg-nursery-mint text-white px-2 py-0.5 rounded-full">
              Aujourd'hui
            </span>
          )}
        </div>

        <button
          onClick={() => changeDate(1)}
          disabled={isToday}
          className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800">Présents</span>
            <p className="text-2xl font-black text-emerald-950 mt-0.5">{presentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800">En Retard</span>
            <p className="text-2xl font-black text-amber-950 mt-0.5">{lateCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-800">Absents</span>
            <p className="text-2xl font-black text-rose-950 mt-0.5">{absentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-800">Excusés</span>
            <p className="text-2xl font-black text-blue-950 mt-0.5">{excusedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section Selector Tabs */}
      {isEducator ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <span>🔒 Espace Éducatrice — {currentStaff?.assignedSectionName || 'Classe Affectée'} : {filteredChildren.length} enfant(s)</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setSelectedSectionFilter('all')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              selectedSectionFilter === 'all'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Toutes ({children.length})
          </button>
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSectionFilter(sec.id)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                selectedSectionFilter === sec.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sec.codeName}
            </button>
          ))}
        </div>
      )}

      {/* Attendance Roster — Card view on mobile, Table on desktop */}
      {/* Mobile Cards */}
      <div className="space-y-3 sm:hidden">
        {filteredChildren.map((child) => {
          const attRec = getChildStatus(child.id);
          const statusColors: Record<string, string> = {
            present: 'border-l-4 border-l-emerald-500',
            late: 'border-l-4 border-l-amber-500',
            absent: 'border-l-4 border-l-rose-500',
            excused: 'border-l-4 border-l-blue-500',
          };
          return (
            <div
              key={child.id}
              className={`bg-white rounded-2xl shadow-card p-4 space-y-3 ${statusColors[attRec.status]}`}
            >
              <div className="flex items-center gap-3">
                <img src={child.photo} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {child.firstName} {child.lastName}
                  </p>
                  <span className="text-[10px] text-slate-400">{child.sectionName}</span>
                  {child.hasMedicalAlert && (
                    <span className="block text-[10px] text-amber-700 font-bold">⚠️ {child.medicalNotes[0]}</span>
                  )}
                </div>
                {attRec.checkInTime && (
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Arrivée</div>
                    <div className="text-sm font-bold text-slate-800">{attRec.checkInTime}</div>
                  </div>
                )}
              </div>

              {/* Status Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {(['present', 'late', 'absent', 'excused'] as AttendanceRecord['status'][]).map((s) => {
                  const cfg: Record<string, { label: string; active: string; inactive: string }> = {
                    present: { label: '✅ Présent', active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-50 text-emerald-700' },
                    late: { label: '⏰ Retard', active: 'bg-amber-500 text-white', inactive: 'bg-amber-50 text-amber-700' },
                    absent: { label: '❌ Absent', active: 'bg-rose-500 text-white', inactive: 'bg-rose-50 text-rose-700' },
                    excused: { label: '📋 Excusé', active: 'bg-blue-500 text-white', inactive: 'bg-blue-50 text-blue-700' },
                  };
                  const c = cfg[s];
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(child.id, s)}
                      className={`py-2 px-1 rounded-xl font-bold text-[10px] transition-all text-center ${
                        attRec.status === s ? c.active : c.inactive
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Note + Checkout */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                {activeNoteInputId === child.id ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ajouter une observation..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                    <button onClick={() => handleSaveNote(child.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveNoteInputId(child.id); setNoteText(attRec.note || ''); }}
                    className="flex-1 text-left text-xs text-slate-400 italic truncate hover:text-slate-600"
                  >
                    {attRec.note || '+ Ajouter une note...'}
                  </button>
                )}
                {isToday && (attRec.status === 'present' || attRec.status === 'late') && (
                  <button
                    onClick={() => handleCheckOut(child.id)}
                    className="flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all shrink-0"
                  >
                    <LogOutIcon className="w-3 h-3" />
                    {attRec.checkOutTime || 'Départ'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filteredChildren.length === 0 && (
          <div className="bg-white rounded-2xl border border-nursery-sand p-8 text-center text-slate-400">
            <CalendarCheck2 className="w-10 h-10 mx-auto opacity-30 mb-2" />
            <p className="font-bold text-slate-600">Aucun enfant dans cette classe</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-3xl border border-nursery-sand shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Enfant & Section</th>
                <th className="p-4">Statut (1-Clic)</th>
                <th className="p-4">Arrivée</th>
                <th className="p-4">Départ</th>
                <th className="p-4">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredChildren.map((child) => {
                const attRec = getChildStatus(child.id);
                return (
                  <tr key={child.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={child.photo}
                          alt=""
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {child.firstName} {child.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{child.sectionName}</span>
                          {child.hasMedicalAlert && (
                            <span className="text-[10px] text-amber-700 font-bold block">⚠️ {child.medicalNotes[0]}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 1-Click Status Toggles */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleStatusChange(child.id, 'present')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                            attRec.status === 'present'
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Présent
                        </button>
                        <button
                          onClick={() => handleStatusChange(child.id, 'late')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                            attRec.status === 'late'
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" /> Retard
                        </button>
                        <button
                          onClick={() => handleStatusChange(child.id, 'absent')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                            attRec.status === 'absent'
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </button>
                        <button
                          onClick={() => handleStatusChange(child.id, 'excused')}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                            attRec.status === 'excused'
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" /> Excusé
                        </button>
                      </div>
                    </td>

                    {/* Check-In Time */}
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      {attRec.checkInTime ? (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg">⏱️ {attRec.checkInTime}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Check-Out Time */}
                    <td className="p-4 text-xs font-semibold text-slate-600">
                      {attRec.checkOutTime ? (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🚪 {attRec.checkOutTime}</span>
                      ) : isToday && (attRec.status === 'present' || attRec.status === 'late') ? (
                        <button
                          onClick={() => handleCheckOut(child.id)}
                          className="flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-all"
                        >
                          <LogOutIcon className="w-3.5 h-3.5" /> Enreg. départ
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Note */}
                    <td className="p-4">
                      {activeNoteInputId === child.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="ex: Amené par sa grand-mère"
                            className="px-3 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none w-48"
                          />
                          <button
                            onClick={() => handleSaveNote(child.id)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => { setActiveNoteInputId(child.id); setNoteText(attRec.note || ''); }}
                          className="cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg text-xs text-slate-500 italic flex items-center gap-1 max-w-[200px]"
                        >
                          <span className="truncate">{attRec.note || 'Clic pour ajouter une note...'}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredChildren.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">
                    <CalendarCheck2 className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    <p className="font-bold text-slate-600">Aucun enfant dans cette sélection</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Range Export PDF (Multi-Dates) */}
      {showRangeExportModal && (
        <AttendanceRangeExportModal
          filteredChildren={filteredChildren}
          sectionName={
            isEducator
              ? currentStaff?.assignedSectionName || 'Classe'
              : selectedSectionFilter === 'all'
              ? 'Toutes les Sections'
              : activeSectionObj?.codeName || selectedSectionFilter
          }
          educatorName={
            isEducator ? currentStaff?.name : activeSectionObj?.educatorName
          }
          onClose={() => setShowRangeExportModal(false)}
        />
      )}
    </div>
  );
};
