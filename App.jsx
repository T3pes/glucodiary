import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabaseClient'

const timeSlots = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)
const TAGS = ['digiuno', 'pre-pasto', 'post-pasto', 'esercizio', 'ipoglicemia', 'iperglicemia', 'malessere']

function formatISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  )
}

function useAuthSession() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub?.subscription?.unsubscribe()
  }, [])

  return session
}

function AuthView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: 0, fontSize: 24, marginBottom: 4 }}>Glucodiary</h1>
        <p style={{ margin: 0, marginBottom: 16, fontSize: 14, color: '#6b7280' }}>Accedi o registrati per iniziare</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </div>
          {error && <p style={{ fontSize: 13, color: '#b91c1c' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                background: '#111827',
                color: 'white',
                fontSize: 14,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Attendere…' : mode === 'login' ? 'Accedi' : 'Registrati'}
            </button>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#4b5563', textDecoration: 'underline' }}
            >
              {mode === 'login' ? 'Crea un account' : 'Ho già un account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DayStats({ entries }) {
  const stats = useMemo(() => {
    if (!entries.length) return null
    const values = entries.map((e) => e.glucose)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const inRange = entries.filter((e) => e.glucose >= 70 && e.glucose <= 180).length
    return { avg, min, max, inRange, total: entries.length }
  }, [entries])

  if (!stats) {
    return (
      <div style={{ padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', fontSize: 13 }}>
        Nessun dato per il giorno selezionato
      </div>
    )
  }

  const boxStyle = { padding: 8, borderRadius: 10, background: '#f3f4f6', fontSize: 13 }

  return (
    <div style={{ padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: 'white' }}>
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>Statistiche</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={boxStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Media</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.avg}</div>
        </div>
        <div style={boxStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Min</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.min}</div>
        </div>
        <div style={boxStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Max</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{stats.max}</div>
        </div>
        <div style={boxStyle}>
          <div style={{ color: '#6b7280', fontSize: 12 }}>Tempo nel range</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {stats.inRange}/{stats.total}
          </div>
        </div>
      </div>
    </div>
  )
}

function EntryForm({ date, defaultTimeSlot, onSaved, onClose }) {
  const [glucose, setGlucose] = useState('')
  const [time, setTime] = useState(defaultTimeSlot || '08:00')
  const [carbs, setCarbs] = useState('')
  const [insulin, setInsulin] = useState('')
  const [tags, setTags] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleTag = (t) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const save = async (e) => {
    e.preventDefault()
    if (!glucose) return
    setSaving(true)
    const [h, m] = time.split(':').map(Number)
    const d = new Date(date)
    d.setHours(h, m, 0, 0)
    const ts = toLocalISOString(d)
    await supabase.from('glucose_entries').insert({
      glucose: Number(glucose),
      carbs: carbs ? Number(carbs) : null,
      insulin_units: insulin ? Number(insulin) : null,
      tags,
      notes: notes || null,
      ts,
    })
    setSaving(false)
    onSaved?.()
    onClose?.()
  }

  return (
    <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Valore (mg/dL)</label>
          <input
            inputMode="numeric"
            value={glucose}
            onChange={(e) => setGlucose(e.target.value)}
            placeholder="es. 110"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Ora</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Carbo (g)</label>
          <input
            inputMode="numeric"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="opzionale"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </div>
        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Insulina (U)</label>
          <input
            inputMode="numeric"
            value={insulin}
            onChange={(e) => setInsulin(e.target.value)}
            placeholder="opzionale"
            style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Tag</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid #d1d5db',
                fontSize: 12,
                background: tags.includes(t) ? '#111827' : 'white',
                color: tags.includes(t) ? 'white' : '#111827',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Note</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Sintomi, attività, pasti, ecc."
          rows={3}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db', resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ padding: '6px 12px', borderRadius: 999, border: '1px solid #d1d5db', background: 'white', fontSize: 13 }}
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            border: 'none',
            background: '#111827',
            color: 'white',
            fontSize: 13,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>
      </div>
    </form>
  )
}

function Timeline({ date, entries, onChanged }) {
  const [openSlot, setOpenSlot] = useState(null)

  const byHour = useMemo(() => {
    const map = new Map()
    timeSlots.forEach((h) => map.set(h, []))
    entries.forEach((e) => {
      const dt = new Date(e.ts)
      const slot = `${String(dt.getHours()).padStart(2, '0')}:00`
      map.get(slot).push(e)
    })
    return map
  }, [entries])

  const removeEntry = async (id) => {
    await supabase.from('glucose_entries').delete().eq('id', id)
    onChanged?.()
  }

  return (
    <div style={{ borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', background: 'white' }}>
      {timeSlots.map((slot) => (
        <div
          key={slot}
          style={{
            padding: 8,
            borderBottom: '1px solid #e5e7eb',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{slot}</div>
            <button
              type="button"
              onClick={() => setOpenSlot(slot)}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid #d1d5db',
                background: 'white',
                fontSize: 12,
              }}
            >
              + Aggiungi
            </button>
          </div>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(byHour.get(slot) || [])
              .sort((a, b) => new Date(a.ts) - new Date(b.ts))
              .map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    background: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 600 }}>{e.glucose} mg/dL</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>
                      {new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {e.tags?.map((t) => (
                        <span
                          key={t}
                          style={{
                            padding: '2px 6px',
                            borderRadius: 999,
                            border: '1px solid #d1d5db',
                            fontSize: 11,
                            background: 'white',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                      {e.carbs != null && (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 999,
                            border: '1px solid #d1d5db',
                            fontSize: 11,
                            background: 'white',
                          }}
                        >
                          {e.carbs} g
                        </span>
                      )}
                      {e.insulin_units != null && (
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 999,
                            border: '1px solid #d1d5db',
                            fontSize: 11,
                            background: 'white',
                          }}
                        >
                          {e.insulin_units} U
                        </span>
                      )}
                    </div>
                    {e.notes && (
                      <div style={{ marginTop: 4, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {e.notes}
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => removeEntry(e.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        fontSize: 11,
                        color: '#b91c1c',
                      }}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {openSlot === slot && (
            <div
              style={{
                marginTop: 8,
                padding: 8,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
              }}
            >
              <div style={{ fontSize: 12, marginBottom: 4 }}>Nuova voce — {slot}</div>
              <EntryForm
                date={date}
                defaultTimeSlot={slot}
                onSaved={onChanged}
                onClose={() => setOpenSlot(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ShareWithClinician({ user }) {
  const [email, setEmail] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shares')
      .select('id, clinician_email')
      .eq('patient_id', user.id)
      .order('clinician_email')
    setList(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!email) return
    await supabase.from('shares').insert({ patient_id: user.id, clinician_email: email })
    setEmail('')
    load()
  }

  const remove = async (id) => {
    await supabase.from('shares').delete().eq('id', id)
    load()
  }

  return (
    <div style={{ padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', fontSize: 13 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 14 }}>Condividi con il medico</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="email del medico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
        />
        <button
          type="button"
          onClick={add}
          style={{ padding: '8px 12px', borderRadius: 999, border: 'none', background: '#111827', color: 'white', fontSize: 13 }}
        >
          Aggiungi
        </button>
      </div>
      {loading ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>Caricamento…</p>
      ) : list.length === 0 ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>Nessuna condivisione attiva</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {list.map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 6,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            >
              <span>{s.clinician_email}</span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: '1px solid #d1d5db',
                  background: 'white',
                  fontSize: 12,
                }}
              >
                Revoca
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClinicianView({ user }) {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState('')
  const [date, setDate] = useState(formatISODate(new Date()))
  const [entries, setEntries] = useState([])

  useEffect(() => {
    const loadPatients = async () => {
      const { data } = await supabase
        .from('shares')
        .select('patient_id, clinician_email')
        .eq('clinician_email', user.email)
      const rows = data || []
      setPatients(rows.map((r) => ({ id: r.patient_id, label: r.patient_id })))
    }
    loadPatients()
  }, [user?.email])

  const loadEntries = async () => {
    if (!selected) return
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')
    const { data } = await supabase
      .from('glucose_entries')
      .select('*')
      .gte('ts', dayStart.toISOString())
      .lte('ts', dayEnd.toISOString())
      .eq('user_id', selected)
    setEntries(data || [])
  }

  useEffect(() => {
    loadEntries()
  }, [selected, date])

  return (
    <div style={{ padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', marginTop: 12 }}>
      <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Vista Medico</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Paziente</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
            >
              <option value="">Seleziona paziente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #d1d5db' }}
            />
          </div>
          <DayStats entries={entries} />
        </div>
        <div>
          <Timeline date={date} entries={entries} onChanged={loadEntries} />
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user }) {
  const [date, setDate] = useState(formatISODate(new Date()))
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [modeClinician, setModeClinician] = useState(false)

  const load = async () => {
    setLoading(true)
    const dayStart = new Date(date + 'T00:00:00')
    const dayEnd = new Date(date + 'T23:59:59')
    const { data } = await supabase
      .from('glucose_entries')
      .select('*')
      .gte('ts', dayStart.toISOString())
      .lte('ts', dayEnd.toISOString())
      .order('ts', { ascending: true })
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [date])

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{user.email}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Glucodiary</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setModeClinician((m) => !m)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #d1d5db',
                background: modeClinician ? '#111827' : 'white',
                color: modeClinician ? 'white' : '#111827',
                fontSize: 13,
              }}
            >
              {modeClinician ? 'Modalità Paziente' : 'Modalità Medico'}
            </button>
            <button
              type="button"
              onClick={logout}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #d1d5db',
                background: 'white',
                fontSize: 13,
              }}
            >
              Esci
            </button>
          </div>
        </header>

        {!modeClinician ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Giornata</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ padding: 6, borderRadius: 8, border: '1px solid #d1d5db' }}
                  />
                </div>
                {loading ? (
                  <p style={{ fontSize: 13, color: '#6b7280' }}>Caricamento…</p>
                ) : (
                  <Timeline date={date} entries={entries} onChanged={load} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DayStats entries={entries} />
              <ShareWithClinician user={user} />
            </div>
          </div>
        ) : (
          <ClinicianView user={user} />
        )}
      </div>
    </div>
  )
}

export default function App() {
  const session = useAuthSession()
  const user = session?.user || null
  return user ? <Dashboard user={user} /> : <AuthView />
}
