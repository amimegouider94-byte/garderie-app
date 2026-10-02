'use client';

import React from 'react';
import { Child, AttendanceRecord } from '@/lib/store';

interface AttendancePDFExportProps {
  daycareSettings: {
    name: string;
    address: string;
    phone: string;
    email: string;
    logo: string;
  };
  sectionName: string;
  educatorName?: string;
  date: string;
  children: Child[];
  getRecord: (childId: string) => AttendanceRecord;
}

const STATUS_FR: Record<string, string> = {
  present: '✅ Présent(e)',
  absent: '❌ Absent(e)',
  late: '⏰ En Retard',
  excused: '📋 Excusé(e)',
};

export const AttendancePDFExport: React.FC<AttendancePDFExportProps> = ({
  daycareSettings,
  sectionName,
  educatorName,
  date,
  children,
  getRecord,
}) => {
  const presentCount = children.filter((c) => {
    const s = getRecord(c.id).status;
    return s === 'present' || s === 'late';
  }).length;

  const absentCount = children.filter((c) => getRecord(c.id).status === 'absent').length;
  const excusedCount = children.filter((c) => getRecord(c.id).status === 'excused').length;
  const lateCount = children.filter((c) => getRecord(c.id).status === 'late').length;

  return (
    <div
      id="printable-attendance"
      style={{
        fontFamily: "'Outfit', Arial, sans-serif",
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
        background: '#fff',
        color: '#1e293b',
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: '3px solid #1e293b',
          paddingBottom: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', marginBottom: '4px' }}>
            {daycareSettings.logo} {daycareSettings.name}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{daycareSettings.address}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            {daycareSettings.phone} · {daycareSettings.email}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              background: '#1e293b',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '8px',
              marginBottom: '6px',
            }}
          >
            FEUILLE DE POINTAGE
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
            📅 {date}
          </div>
        </div>
      </div>

      {/* Section Info */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Classe / Section</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>{sectionName}</div>
          {educatorName && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Éducatrice responsable : <strong>{educatorName}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: 700 }}>
          <div style={{ textAlign: 'center', background: '#dcfce7', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#166534' }}>{presentCount}</div>
            <div style={{ color: '#166534' }}>Présents</div>
          </div>
          <div style={{ textAlign: 'center', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#991b1b' }}>{absentCount}</div>
            <div style={{ color: '#991b1b' }}>Absents</div>
          </div>
          <div style={{ textAlign: 'center', background: '#fef3c7', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#92400e' }}>{lateCount}</div>
            <div style={{ color: '#92400e' }}>En Retard</div>
          </div>
          <div style={{ textAlign: 'center', background: '#dbeafe', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e40af' }}>{excusedCount}</div>
            <div style={{ color: '#1e40af' }}>Excusés</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
        }}
      >
        <thead>
          <tr style={{ background: '#1e293b', color: '#fff' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, width: '32px' }}>#</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Enfant</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Statut</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Arrivée</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Départ</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Observations</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Signature</th>
          </tr>
        </thead>
        <tbody>
          {children.map((child, idx) => {
            const rec = getRecord(child.id);
            const rowBg = idx % 2 === 0 ? '#fff' : '#f8fafc';
            const statusColor =
              rec.status === 'present'
                ? '#dcfce7'
                : rec.status === 'absent'
                ? '#fee2e2'
                : rec.status === 'late'
                ? '#fef3c7'
                : '#dbeafe';

            return (
              <tr key={child.id} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>
                    {child.firstName} {child.lastName}
                  </div>
                  {child.hasMedicalAlert && (
                    <div style={{ fontSize: '10px', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                      ⚠️ {child.medicalNotes[0]}
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      background: statusColor,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}
                  >
                    {STATUS_FR[rec.status]}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>
                  {rec.checkInTime || '—'}
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>
                  {rec.checkOutTime || '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#64748b', fontStyle: 'italic', fontSize: '11px' }}>
                  {rec.note || ''}
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    borderLeft: '1px solid #e2e8f0',
                    minWidth: '80px',
                  }}
                >
                  {/* Signature line */}
                  <div
                    style={{
                      borderBottom: '1px solid #94a3b8',
                      marginTop: '16px',
                      width: '80px',
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: '2px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Total Inscrits: {children.length} enfant(s)</div>
          <div>
            Taux de présence :{' '}
            <strong style={{ color: '#16a34a' }}>
              {children.length > 0 ? Math.round((presentCount / children.length) * 100) : 0}%
            </strong>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, marginBottom: '24px' }}>Signature Éducatrice :</div>
          <div style={{ borderBottom: '1px solid #1e293b', width: '160px' }} />
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '10px',
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '10px',
        }}
      >
        Document généré par le Système de Gestion {daycareSettings.name} · {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}
      </div>
    </div>
  );
};
