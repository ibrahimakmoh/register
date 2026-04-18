import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from '@e965/xlsx';
import {
  Upload, Download, Search, Plus, ArrowLeft, Trash2, Check, X,
  UserPlus, Users, FileSpreadsheet, Phone, Calendar,
  MoreHorizontal, Pencil, Archive, AlertCircle, Coins
} from 'lucide-react';

/* ---------------------------------------------------------------------------
   window.storage fallback — Claude's artifact environment provides
   window.storage natively. When running standalone (GitHub Pages / Vercel /
   local dev), fall back to localStorage with the same async API shape.
--------------------------------------------------------------------------- */
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      if (value === null) return null;
      return { key, value, shared: false };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      window.localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    },
    async list(prefix = '') {
      const keys = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (!prefix || (k && k.startsWith(prefix))) keys.push(k);
      }
      return { keys, prefix };
    },
  };
}

/* ---------------------------------------------------------------------------
   Theme — warm, scholarly, refined. Not a SaaS dashboard.
   Fonts: Instrument Serif (display) + Instrument Sans (body)
--------------------------------------------------------------------------- */
const THEME = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&display=swap');

  :root {
    --bg:        #F4EFE4;
    --bg-soft:  #EEE7D6;
    --surface:   #FBF8F0;
    --surface-2: #FFFFFF;
    --ink:       #1A1A1A;
    --ink-soft:  #5B564C;
    --ink-faint: #9A948A;
    --line:      #E2DCCB;
    --line-strong: #C9C1AC;
    --accent:    #2B4A3A;
    --accent-soft:#DDE6DC;
    --gold:      #8B6F3F;
    --gold-soft: #EFE4CC;
    --danger:    #B4412F;
    --danger-soft:#F2DBD4;
  }

  .register-app, .register-app * {
    box-sizing: border-box;
  }
  .register-app {
    font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
    color: var(--ink);
    background: var(--bg);
    min-height: 100vh;
    width: 100%;
    letter-spacing: -0.005em;
    -webkit-font-smoothing: antialiased;
    position: relative;
  }
  .register-app::before {
    /* subtle grain */
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(0,0,0,0.035) 1px, transparent 0);
    background-size: 3px 3px;
    pointer-events: none;
    z-index: 0;
  }
  .serif { font-family: 'Instrument Serif', ui-serif, Georgia, serif; letter-spacing: -0.01em; }

  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.75rem 1.15rem; border-radius: 999px;
    font-weight: 500; font-size: 0.95rem;
    border: 1px solid transparent; cursor: pointer;
    transition: all 180ms cubic-bezier(.2,.7,.3,1);
    user-select: none; -webkit-tap-highlight-color: transparent;
  }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: var(--ink); color: var(--surface); }
  .btn-primary:hover { background: #000; }
  .btn-ghost { background: transparent; color: var(--ink); border-color: var(--line-strong); }
  .btn-ghost:hover { background: var(--bg-soft); }
  .btn-accent { background: var(--accent); color: #fff; }
  .btn-accent:hover { background: #1F3A2C; }
  .btn-danger { background: transparent; color: var(--danger); border-color: var(--danger-soft); }
  .btn-danger:hover { background: var(--danger-soft); }

  .icon-btn {
    width: 40px; height: 40px; border-radius: 999px;
    display: inline-flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid var(--line);
    color: var(--ink-soft); cursor: pointer;
    transition: all 150ms ease;
    -webkit-tap-highlight-color: transparent;
  }
  .icon-btn:hover { background: var(--bg-soft); color: var(--ink); }
  .icon-btn:active { transform: scale(0.94); }

  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
  }

  .input {
    width: 100%;
    background: var(--surface-2);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
    font-family: inherit; font-size: 0.95rem;
    color: var(--ink);
    transition: border-color 150ms ease;
  }
  .input:focus { outline: none; border-color: var(--accent); }

  .pill {
    display: inline-flex; align-items: center; gap: 0.35rem;
    padding: 0.25rem 0.6rem; border-radius: 999px;
    font-size: 0.78rem; font-weight: 500;
    border: 1px solid var(--line);
    background: var(--surface-2);
    color: var(--ink-soft);
    white-space: nowrap;
  }
  .pill.paid { background: var(--gold-soft); color: var(--gold); border-color: transparent; }
  .pill.unpaid { background: var(--danger-soft); color: var(--danger); border-color: transparent; }
  .pill.paid-today { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
  .pill.gender-m { background: var(--accent-soft); color: var(--accent); border-color: transparent; font-weight: 600; letter-spacing: 0.05em; }
  .pill.gender-f { background: var(--gold-soft); color: var(--gold); border-color: transparent; font-weight: 600; letter-spacing: 0.05em; }

  /* Attendance row — the star of the show */
  .row {
    display: flex; align-items: center; gap: 0.9rem;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 0.85rem 0.9rem 0.85rem 1.1rem;
    transition: all 200ms cubic-bezier(.2,.7,.3,1);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .row:active { transform: scale(0.99); }
  .row.present {
    background: linear-gradient(180deg, #F0F5EF 0%, #E8EFE7 100%);
    border-color: #C5D4C1;
  }
  .row .check-circle {
    flex-shrink: 0;
    width: 34px; height: 34px; border-radius: 999px;
    border: 1.5px solid var(--line-strong);
    display: flex; align-items: center; justify-content: center;
    background: var(--surface-2);
    transition: all 180ms cubic-bezier(.2,.7,.3,1);
  }
  .row.present .check-circle {
    background: var(--accent); border-color: var(--accent); color: white;
    transform: scale(1.05);
  }
  .row .row-body { flex: 1; min-width: 0; }
  .row .row-name {
    font-family: 'Instrument Serif', serif;
    font-size: 1.25rem;
    line-height: 1.1;
    color: var(--ink);
    margin: 0 0 0.2rem 0;
    word-break: break-word;
  }
  .row .row-meta {
    font-size: 0.82rem; color: var(--ink-soft);
    display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
  }
  .row .row-actions {
    display: flex; align-items: center; gap: 0.35rem;
    flex-shrink: 0;
  }

  /* Sticky header */
  .sticky-head {
    position: sticky; top: 0; z-index: 10;
    background: rgba(244, 239, 228, 0.88);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--line);
  }

  /* Stats strip — editorial numerals */
  .stat-value {
    font-family: 'Instrument Serif', serif;
    font-size: 1.9rem; line-height: 1;
    color: var(--ink);
    letter-spacing: -0.02em;
  }
  .stat-label {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--ink-faint);
    margin-top: 0.35rem;
  }

  /* Empty states */
  .empty {
    text-align: center;
    padding: 3rem 1.5rem;
    color: var(--ink-soft);
  }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(26, 26, 26, 0.45);
    backdrop-filter: blur(4px);
    display: flex; align-items: flex-end;
    animation: fadeIn 180ms ease;
  }
  @media (min-width: 640px) { .modal-overlay { align-items: center; justify-content: center; } }
  .modal {
    background: var(--surface);
    border-radius: 20px 20px 0 0;
    padding: 1.5rem; width: 100%;
    max-width: 480px;
    max-height: 90vh; overflow-y: auto;
    animation: slideUp 260ms cubic-bezier(.2,.7,.3,1);
  }
  @media (min-width: 640px) {
    .modal { border-radius: 20px; margin: 1rem; }
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* FAB */
  .fab {
    position: fixed; right: 1rem; bottom: 1.25rem;
    width: 56px; height: 56px; border-radius: 999px;
    background: var(--ink); color: var(--surface);
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer;
    box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.1);
    transition: all 180ms ease;
    z-index: 20;
  }
  .fab:active { transform: scale(0.94); }
  .fab:hover { background: #000; }

  /* Logo glyph */
  .glyph {
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 1.5rem;
    color: var(--accent);
    line-height: 1;
  }

  /* Thin divider */
  .rule {
    height: 1px; background: var(--line); border: 0; margin: 0;
  }

  /* Checkbox for bulk-ish actions */
  .tiny-label {
    font-size: 0.72rem; text-transform: uppercase;
    letter-spacing: 0.14em; color: var(--ink-faint);
    font-weight: 500;
  }
`;

/* ---------------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const money = (n) => {
  if (!n && n !== 0) return '—';
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { style: 'decimal', maximumFractionDigits: 2 });
};

const formatDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

const normaliseHeader = (s) => String(s || '').trim().toLowerCase().replace(/[_\s-]+/g, ' ');

// Detect likely name/phone/email/amount columns
const guessColumn = (headers, candidates) => {
  const norm = headers.map(normaliseHeader);
  for (const c of candidates) {
    const idx = norm.findIndex(h => h === c);
    if (idx >= 0) return headers[idx];
  }
  for (const c of candidates) {
    const idx = norm.findIndex(h => h.includes(c));
    if (idx >= 0) return headers[idx];
  }
  return null;
};

const NAME_KEYS = ['full name', 'name', 'student name', 'student', 'full name of student'];
const PHONE_KEYS = ['phone', 'mobile', 'whatsapp', 'contact number', 'contact', 'cell'];
const EMAIL_KEYS = ['email', 'email address', 'e-mail'];
const AMOUNT_KEYS = ['amount', 'fee', 'fees', 'course fee', 'price', 'total'];
const PAID_KEYS = ['paid', 'payment', 'payment status', 'has paid'];
const ATTENDED_KEYS = ['attendance', 'present', 'attended', 'attendance status'];
const PAID_TODAY_KEYS = ['paid on day', 'paid today', 'day of payment'];
const GENDER_KEYS = ['gender', 'sex', 'brother sister', 'male female', 'm f'];

const normaliseGender = (v) => {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return '';
  if (['m', 'male', 'man', 'boy', 'brother', 'br'].includes(s)) return 'M';
  if (['f', 'female', 'woman', 'girl', 'sister', 'sr'].includes(s)) return 'F';
  // fall through — try first letter
  if (s[0] === 'm') return 'M';
  if (s[0] === 'f') return 'F';
  return '';
};

const isTruthy = (v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v > 0;
  const s = String(v || '').trim().toLowerCase();
  return ['yes', 'y', 'true', '1', 'paid', 'present', '✓', '✔'].includes(s);
};

/* ---------------------------------------------------------------------------
   Storage helpers (window.storage is personal by default)
--------------------------------------------------------------------------- */
async function listSessions() {
  try {
    const res = await window.storage.list('session:');
    const keys = res?.keys || [];
    const out = [];
    for (const k of keys) {
      try {
        const r = await window.storage.get(k);
        if (r?.value) out.push(JSON.parse(r.value));
      } catch {}
    }
    return out.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (e) {
    console.error('listSessions failed', e);
    return [];
  }
}

async function saveSessionToStorage(session) {
  session.updatedAt = Date.now();
  try {
    await window.storage.set(`session:${session.id}`, JSON.stringify(session));
  } catch (e) { console.error('save failed', e); }
}

async function deleteSessionFromStorage(id) {
  try { await window.storage.delete(`session:${id}`); } catch (e) { console.error(e); }
}

/* ---------------------------------------------------------------------------
   Small presentational components
--------------------------------------------------------------------------- */
function Stat({ value, label, tone }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="stat-value" style={{ color: tone || 'var(--ink)' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Modal({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 className="serif" style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h3>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   HOME — list of saved sessions + new session CTA
--------------------------------------------------------------------------- */
function HomeScreen({ sessions, onOpen, onNew, onDelete }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem 6rem' }}>
      {/* Masthead */}
      <header style={{ padding: '1rem 0 2rem', textAlign: 'center' }}>
        <div className="glyph" style={{ marginBottom: '0.5rem' }}>✦</div>
        <h1 className="serif" style={{ fontSize: '3rem', lineHeight: 0.95, margin: 0, fontStyle: 'italic' }}>Register</h1>
        <p style={{ color: 'var(--ink-soft)', margin: '0.6rem 0 0', fontSize: '0.95rem' }}>
          First-day attendance, made quick.
        </p>
      </header>

      {/* Primary action */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <button className="btn btn-accent" onClick={onNew} style={{ padding: '0.85rem 1.5rem' }}>
          <Plus size={18} />
          New session
        </button>
      </div>

      <hr className="rule" style={{ marginBottom: '1.5rem' }} />

      <div className="tiny-label" style={{ marginBottom: '0.75rem' }}>
        Saved sessions · {sessions.length}
      </div>

      {sessions.length === 0 ? (
        <div className="empty card" style={{ padding: '3rem 1.5rem' }}>
          <FileSpreadsheet size={32} style={{ color: 'var(--ink-faint)', margin: '0 auto 1rem' }} />
          <p className="serif" style={{ fontSize: '1.35rem', margin: '0 0 0.35rem', fontStyle: 'italic' }}>Nothing here yet</p>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>Start a new session to upload your student list.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {sessions.map(s => {
            const total = s.students?.length || 0;
            const present = s.students?.filter(x => x.present).length || 0;
            return (
              <div key={s.id} className="card" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  onClick={() => onOpen(s.id)}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div className="serif" style={{ fontSize: '1.35rem', lineHeight: 1.1, marginBottom: '0.2rem' }}>
                    {s.name || 'Untitled session'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {s.date && <span>{formatDate(s.date)}</span>}
                    <span>·</span>
                    <span>{present} / {total} present</span>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => onDelete(s.id)} aria-label="Delete session">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--line)', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
        Data stays on this device. Export to Excel to share or back up.
      </footer>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   SETUP — upload file, map columns, name the session
--------------------------------------------------------------------------- */
function SetupScreen({ onBack, onCreate }) {
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [nameCol, setNameCol] = useState('');
  const [phoneCol, setPhoneCol] = useState('');
  const [emailCol, setEmailCol] = useState('');
  const [amountCol, setAmountCol] = useState('');
  const [paidCol, setPaidCol] = useState('');
  const [attendedCol, setAttendedCol] = useState('');
  const [paidTodayCol, setPaidTodayCol] = useState('');
  const [genderCol, setGenderCol] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
      if (!json.length) throw new Error('File is empty.');
      const hdrs = Object.keys(json[0]);
      setHeaders(hdrs);
      setRows(json);
      setNameCol(guessColumn(hdrs, NAME_KEYS) || hdrs[0]);
      setPhoneCol(guessColumn(hdrs, PHONE_KEYS) || '');
      setEmailCol(guessColumn(hdrs, EMAIL_KEYS) || '');
      setAmountCol(guessColumn(hdrs, AMOUNT_KEYS) || '');
      setPaidCol(guessColumn(hdrs, PAID_KEYS) || '');
      setAttendedCol(guessColumn(hdrs, ATTENDED_KEYS) || '');
      setPaidTodayCol(guessColumn(hdrs, PAID_TODAY_KEYS) || '');
      setGenderCol(guessColumn(hdrs, GENDER_KEYS) || '');
      if (!sessionName) {
        // guess name from filename
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
        setSessionName(base.slice(0, 60));
      }
    } catch (e) {
      setError(e.message || 'Could not read that file.');
    }
  };

  const canCreate = rows.length > 0 && nameCol && sessionName.trim();

  const create = () => {
    const students = rows.map((r, i) => {
      const name = String(r[nameCol] ?? '').trim();
      if (!name) return null;
      const amountRaw = amountCol ? r[amountCol] : '';
      const amount = Number(String(amountRaw).replace(/[^0-9.-]/g, '')) || 0;
      const paid = paidCol ? isTruthy(r[paidCol]) : false;
      const paidToday = paidTodayCol ? isTruthy(r[paidTodayCol]) : false;
      const present = attendedCol ? isTruthy(r[attendedCol]) : false;
      const gender = genderCol ? normaliseGender(r[genderCol]) : '';
      // preserve extra columns
      const extras = {};
      for (const h of headers) {
        if ([nameCol, phoneCol, emailCol, amountCol, paidCol, attendedCol, paidTodayCol, genderCol].includes(h)) continue;
        const v = r[h];
        if (v !== '' && v !== null && v !== undefined) extras[h] = v;
      }
      return {
        id: uid(),
        name,
        phone: phoneCol ? String(r[phoneCol] ?? '').trim() : '',
        email: emailCol ? String(r[emailCol] ?? '').trim() : '',
        amount,
        paid,
        paidToday,
        present,
        gender,
        notes: '',
        extras,
      };
    }).filter(Boolean);

    onCreate({
      id: uid(),
      name: sessionName.trim(),
      date: sessionDate,
      students,
      columnMap: { nameCol, phoneCol, emailCol, amountCol, paidCol, attendedCol, paidTodayCol, genderCol },
      originalHeaders: headers,
    });
  };

  const hasFile = rows.length > 0;

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto', padding: '0 1rem 3rem' }}>
      <div className="sticky-head" style={{ margin: '0 -1rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button className="icon-btn" onClick={onBack}><ArrowLeft size={18} /></button>
        <h2 className="serif" style={{ margin: 0, fontSize: '1.4rem', fontStyle: 'italic' }}>New session</h2>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Session meta */}
        <section>
          <div className="tiny-label" style={{ marginBottom: '0.5rem' }}>Step 1 · Name it</div>
          <input
            className="input"
            placeholder="e.g. Tilawah Advanced — Frankston Campus"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
          />
          <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} style={{ color: 'var(--ink-soft)' }} />
            <input
              type="date"
              className="input"
              style={{ maxWidth: '200px' }}
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
            />
          </div>
        </section>

        {/* File upload */}
        <section>
          <div className="tiny-label" style={{ marginBottom: '0.5rem' }}>Step 2 · Upload student list</div>
          <div
            className="card"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              borderStyle: 'dashed',
              background: hasFile ? 'var(--accent-soft)' : 'var(--surface)',
              borderColor: hasFile ? 'var(--accent)' : 'var(--line)',
              transition: 'all 150ms',
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files?.[0])}
            />
            {hasFile ? (
              <div>
                <Check size={24} style={{ color: 'var(--accent)', margin: '0 auto 0.5rem' }} />
                <div className="serif" style={{ fontSize: '1.2rem', color: 'var(--accent)' }}>{rows.length} rows loaded</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>Tap to choose a different file</div>
              </div>
            ) : (
              <div>
                <Upload size={24} style={{ color: 'var(--ink-soft)', margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>Upload Excel or CSV</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: '0.3rem' }}>
                  .xlsx · .xls · .csv — e.g. exported from Microsoft Forms
                </div>
              </div>
            )}
          </div>
          {error && (
            <div style={{ marginTop: '0.6rem', color: 'var(--danger)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </section>

        {/* Column mapping */}
        {hasFile && (
          <section>
            <div className="tiny-label" style={{ marginBottom: '0.5rem' }}>Step 3 · Map your columns</div>
            <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <MapRow label="Name" required value={nameCol} onChange={setNameCol} headers={headers} />
              <MapRow label="Gender" value={genderCol} onChange={setGenderCol} headers={headers} />
              <MapRow label="Phone / WhatsApp" value={phoneCol} onChange={setPhoneCol} headers={headers} />
              <MapRow label="Email" value={emailCol} onChange={setEmailCol} headers={headers} />
              <MapRow label="Course fee" value={amountCol} onChange={setAmountCol} headers={headers} />
              <MapRow label="Already paid (yes/no)" value={paidCol} onChange={setPaidCol} headers={headers} />
              <MapRow label="Attendance (returning upload)" value={attendedCol} onChange={setAttendedCol} headers={headers} />
              <MapRow label="Paid on day (returning upload)" value={paidTodayCol} onChange={setPaidTodayCol} headers={headers} />
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', lineHeight: 1.5, paddingTop: '0.25rem' }}>
                Only Name is required. Any columns you don't map are kept and included in your export.
              </div>
            </div>
          </section>
        )}

        {/* Create */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onBack}>Cancel</button>
          <button className="btn btn-accent" onClick={create} disabled={!canCreate} style={{ opacity: canCreate ? 1 : 0.4, pointerEvents: canCreate ? 'auto' : 'none' }}>
            Create session
          </button>
        </div>
      </div>
    </div>
  );
}

function MapRow({ label, value, onChange, headers, required }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ flex: '0 0 42%', fontSize: '0.9rem' }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </div>
      <select
        className="input"
        style={{ flex: 1, padding: '0.55rem 0.7rem' }}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— not used —</option>
        {headers.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   ATTENDANCE — the main workhorse view
--------------------------------------------------------------------------- */
function AttendanceScreen({ session, onBack, onUpdate, onDeleteSession }) {
  const [query, setQuery] = useState('');
  const [openRowMenu, setOpenRowMenu] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(null); // student id
  const [editSessionOpen, setEditSessionOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'present' | 'absent' | 'unpaid'

  const updateStudent = (id, patch) => {
    const students = session.students.map(s => s.id === id ? { ...s, ...patch } : s);
    onUpdate({ ...session, students });
  };
  const addStudent = (s) => {
    onUpdate({ ...session, students: [...session.students, { extras: {}, ...s, id: uid() }] });
  };
  const removeStudent = (id) => {
    onUpdate({ ...session, students: session.students.filter(s => s.id !== id) });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return session.students.filter(s => {
      if (q) {
        const hay = `${s.name} ${s.phone || ''} ${s.email || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filter === 'present' && !s.present) return false;
      if (filter === 'absent' && s.present) return false;
      if (filter === 'unpaid' && (s.paid || s.paidToday)) return false;
      if (filter === 'males' && s.gender !== 'M') return false;
      if (filter === 'females' && s.gender !== 'F') return false;
      return true;
    });
  }, [session.students, query, filter]);

  const stats = useMemo(() => {
    const total = session.students.length;
    const present = session.students.filter(s => s.present).length;
    const presentM = session.students.filter(s => s.present && s.gender === 'M').length;
    const presentF = session.students.filter(s => s.present && s.gender === 'F').length;
    const totalM = session.students.filter(s => s.gender === 'M').length;
    const totalF = session.students.filter(s => s.gender === 'F').length;
    const paidBefore = session.students.filter(s => s.paid).reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const paidToday = session.students.filter(s => s.paidToday).reduce((a, s) => a + (Number(s.amount) || 0), 0);
    const outstanding = session.students.filter(s => !s.paid && !s.paidToday).reduce((a, s) => a + (Number(s.amount) || 0), 0);
    return { total, present, presentM, presentF, totalM, totalF, paidBefore, paidToday, collected: paidBefore + paidToday, outstanding };
  }, [session.students]);

  const exportExcel = () => {
    const cols = session.columnMap || {};
    // Preserve original columns + append our tracking
    const data = session.students.map(s => {
      const row = {};
      if (cols.nameCol) row[cols.nameCol] = s.name;
      if (cols.genderCol) row[cols.genderCol] = s.gender || '';
      else if (s.gender) row['Gender'] = s.gender;
      if (cols.phoneCol) row[cols.phoneCol] = s.phone || '';
      if (cols.emailCol) row[cols.emailCol] = s.email || '';
      if (cols.amountCol) row[cols.amountCol] = s.amount || 0;
      if (cols.paidCol) row[cols.paidCol] = s.paid ? 'Yes' : 'No';
      // extras
      if (s.extras) for (const [k, v] of Object.entries(s.extras)) row[k] = v;
      // appended tracking columns
      row['Attendance'] = s.present ? 'Present' : 'Absent';
      row['Paid on day'] = s.paidToday ? 'Yes' : 'No';
      row['Payment status'] = s.paid ? 'Paid (prior)' : s.paidToday ? 'Paid today' : 'Unpaid';
      if (s.notes) row['Notes'] = s.notes;
      return row;
    });
    // summary sheet
    const summary = [
      ['Session', session.name],
      ['Date', session.date],
      ['Total registered', stats.total],
      ['Present', stats.present],
      ['Absent', stats.total - stats.present],
      ['Attendance rate', stats.total ? `${Math.round((stats.present / stats.total) * 100)}%` : '—'],
    ];
    if (stats.totalM > 0 || stats.totalF > 0) {
      summary.push([]);
      summary.push(['Males registered', stats.totalM]);
      summary.push(['Males present', stats.presentM]);
      summary.push(['Females registered', stats.totalF]);
      summary.push(['Females present', stats.presentF]);
    }
    summary.push([]);
    summary.push(['Collected (prior)', stats.paidBefore]);
    summary.push(['Collected today', stats.paidToday]);
    summary.push(['Total collected', stats.collected]);
    summary.push(['Outstanding', stats.outstanding]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Register');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');
    const safe = (session.name || 'session').replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
    XLSX.writeFile(wb, `${safe}_${session.date || 'register'}.xlsx`);
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div className="sticky-head">
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="icon-btn" onClick={onBack}><ArrowLeft size={18} /></button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="serif" style={{ fontSize: '1.4rem', fontStyle: 'italic', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.name}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{formatDate(session.date)}</div>
            </div>
            <button className="icon-btn" onClick={() => setEditSessionOpen(true)} aria-label="Session options"><MoreHorizontal size={18} /></button>
            <button className="icon-btn" onClick={exportExcel} aria-label="Export Excel"><Download size={18} /></button>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', padding: '0.65rem 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.present}/{stats.total}</div>
              <div className="stat-label">Present</div>
              {(stats.totalM > 0 || stats.totalF > 0) && (
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-soft)', marginTop: '0.25rem', letterSpacing: '0.02em' }}>
                  {stats.totalM > 0 && <span>{stats.presentM}/{stats.totalM} M</span>}
                  {stats.totalM > 0 && stats.totalF > 0 && <span style={{ margin: '0 0.35rem' }}>·</span>}
                  {stats.totalF > 0 && <span>{stats.presentF}/{stats.totalF} F</span>}
                </div>
              )}
            </div>
            <Stat value={money(stats.collected)} label="Collected" tone="var(--gold)" />
            <Stat value={money(stats.outstanding)} label="Outstanding" tone="var(--danger)" />
          </div>

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
              <input
                className="input"
                style={{ paddingLeft: '2.2rem' }}
                placeholder="Search by name or phone…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select
              className="input"
              style={{ maxWidth: '130px' }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="unpaid">Unpaid</option>
              <option value="males">Males</option>
              <option value="females">Females</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student list */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem 1rem 6rem' }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <Users size={28} style={{ color: 'var(--ink-faint)', margin: '0 auto 0.75rem' }} />
            <p className="serif" style={{ fontSize: '1.2rem', fontStyle: 'italic', margin: '0 0 0.25rem' }}>No one matches</p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              {session.students.length === 0 ? 'Add your first student below.' : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {filtered.map(s => (
              <StudentRow
                key={s.id}
                student={s}
                onToggle={() => updateStudent(s.id, { present: !s.present })}
                onTogglePayToday={(e) => { e.stopPropagation(); updateStudent(s.id, { paidToday: !s.paidToday }); }}
                onMenu={(e) => { e.stopPropagation(); setOpenRowMenu(s.id); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAB for adding a student */}
      <button className="fab" onClick={() => setAddOpen(true)} aria-label="Add student">
        <UserPlus size={22} />
      </button>

      {/* Row action menu */}
      {openRowMenu && (
        <Modal open={true} onClose={() => setOpenRowMenu(null)} title="Options">
          {(() => {
            const s = session.students.find(x => x.id === openRowMenu);
            if (!s) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{s.name}</div>
                <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}
                  onClick={() => { updateStudent(s.id, { paid: !s.paid }); setOpenRowMenu(null); }}>
                  <Coins size={16} /> Mark as {s.paid ? 'not paid previously' : 'paid previously'}
                </button>
                <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}
                  onClick={() => { setEditOpen(s.id); setOpenRowMenu(null); }}>
                  <Pencil size={16} /> Edit details
                </button>
                <button className="btn btn-danger" style={{ justifyContent: 'flex-start' }}
                  onClick={() => { if (confirm(`Remove ${s.name} from this session?`)) { removeStudent(s.id); setOpenRowMenu(null); } }}>
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Add student */}
      {addOpen && <StudentModal onClose={() => setAddOpen(false)} onSave={(s) => { addStudent(s); setAddOpen(false); }} title="Add student" />}

      {/* Edit student */}
      {editOpen && (() => {
        const s = session.students.find(x => x.id === editOpen);
        if (!s) return null;
        return (
          <StudentModal
            initial={s}
            title="Edit student"
            onClose={() => setEditOpen(null)}
            onSave={(patch) => { updateStudent(s.id, patch); setEditOpen(null); }}
          />
        );
      })()}

      {/* Session options */}
      {editSessionOpen && (
        <Modal open={true} onClose={() => setEditSessionOpen(false)} title="Session options">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label className="tiny-label">Session name</label>
            <input className="input" value={session.name} onChange={e => onUpdate({ ...session, name: e.target.value })} />
            <label className="tiny-label">Date</label>
            <input className="input" type="date" value={session.date || ''} onChange={e => onUpdate({ ...session, date: e.target.value })} />
            <div className="rule" style={{ margin: '0.5rem 0' }} />
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={exportExcel}>
              <Download size={16} /> Export to Excel
            </button>
            <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}
              onClick={() => { if (confirm('Clear all attendance ticks (keeps students & payments)?')) {
                onUpdate({ ...session, students: session.students.map(s => ({ ...s, present: false })) });
                setEditSessionOpen(false);
              }}}>
              <Archive size={16} /> Reset attendance ticks
            </button>
            <button className="btn btn-danger" style={{ justifyContent: 'flex-start' }}
              onClick={() => { if (confirm('Delete the whole session? This cannot be undone.')) { onDeleteSession(); } }}>
              <Trash2 size={16} /> Delete session
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StudentRow({ student: s, onToggle, onTogglePayToday, onMenu }) {
  return (
    <div className={`row ${s.present ? 'present' : ''}`} onClick={onToggle}>
      <div className="check-circle">
        {s.present ? <Check size={18} strokeWidth={3} /> : null}
      </div>
      <div className="row-body">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <div className="row-name" style={{ margin: 0 }}>{s.name}</div>
          {s.gender === 'M' && <span className="pill gender-m">M</span>}
          {s.gender === 'F' && <span className="pill gender-f">F</span>}
        </div>
        <div className="row-meta">
          {s.phone && (
            <a href={`tel:${s.phone}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--ink-soft)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Phone size={12} /> {s.phone}
            </a>
          )}
          {s.amount > 0 && <span>· ${money(s.amount)}</span>}
          {s.paid
            ? <span className="pill paid">Paid</span>
            : s.paidToday
            ? <span className="pill paid-today">Paid today</span>
            : s.amount > 0 ? <span className="pill unpaid">Unpaid</span> : null
          }
        </div>
      </div>
      <div className="row-actions">
        {!s.paid && (
          <button
            className="icon-btn"
            onClick={onTogglePayToday}
            aria-label="Toggle paid today"
            title={s.paidToday ? 'Mark as not paid today' : 'Mark as paid today'}
            style={s.paidToday ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}}
          >
            <Coins size={16} />
          </button>
        )}
        <button className="icon-btn" onClick={onMenu} aria-label="More options">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}

function StudentModal({ initial, title, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || '');
  const [gender, setGender] = useState(initial?.gender || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [amount, setAmount] = useState(initial?.amount || '');
  const [paid, setPaid] = useState(initial?.paid || false);
  const [notes, setNotes] = useState(initial?.notes || '');

  return (
    <Modal open={true} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <label className="tiny-label">Name *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <label className="tiny-label">Gender</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { v: '', label: '—' },
            { v: 'M', label: 'Male' },
            { v: 'F', label: 'Female' },
          ].map(opt => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setGender(opt.v)}
              className="btn"
              style={{
                flex: 1,
                background: gender === opt.v ? 'var(--ink)' : 'transparent',
                color: gender === opt.v ? 'var(--surface)' : 'var(--ink)',
                borderColor: gender === opt.v ? 'var(--ink)' : 'var(--line-strong)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="tiny-label">Phone</label>
        <input className="input" value={phone} onChange={e => setPhone(e.target.value)} />
        <label className="tiny-label">Email</label>
        <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="tiny-label">Course fee</label>
        <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={paid} onChange={e => setPaid(e.target.checked)} />
          <span>Already paid before today</span>
        </label>
        <label className="tiny-label">Notes</label>
        <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={() => {
            if (!name.trim()) return;
            onSave({
              name: name.trim(),
              gender,
              phone: phone.trim(),
              email: email.trim(),
              amount: Number(amount) || 0,
              paid,
              notes: notes.trim(),
            });
          }}>Save</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------------
   App root
--------------------------------------------------------------------------- */
export default function App() {
  const [view, setView] = useState('home'); // 'home' | 'setup' | 'attendance'
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await listSessions();
      setSessions(s);
      setLoaded(true);
    })();
  }, []);

  const active = sessions.find(s => s.id === activeId) || null;

  const updateSession = async (s) => {
    await saveSessionToStorage(s);
    setSessions(prev => {
      const filtered = prev.filter(x => x.id !== s.id);
      return [s, ...filtered].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    });
  };

  const createSession = async (s) => {
    await updateSession(s);
    setActiveId(s.id);
    setView('attendance');
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this session? This cannot be undone.')) return;
    await deleteSessionFromStorage(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) { setActiveId(null); setView('home'); }
  };

  return (
    <div className="register-app">
      <style>{THEME}</style>

      {!loaded && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
          <span className="serif" style={{ fontSize: '1.2rem', fontStyle: 'italic' }}>Loading…</span>
        </div>
      )}

      {loaded && view === 'home' && (
        <HomeScreen
          sessions={sessions}
          onOpen={(id) => { setActiveId(id); setView('attendance'); }}
          onNew={() => setView('setup')}
          onDelete={deleteSession}
        />
      )}

      {loaded && view === 'setup' && (
        <SetupScreen
          onBack={() => setView('home')}
          onCreate={createSession}
        />
      )}

      {loaded && view === 'attendance' && active && (
        <AttendanceScreen
          session={active}
          onBack={() => { setView('home'); setActiveId(null); }}
          onUpdate={updateSession}
          onDeleteSession={() => deleteSession(active.id)}
        />
      )}
    </div>
  );
}
