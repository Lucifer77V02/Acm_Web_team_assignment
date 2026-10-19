import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../api/axios'
import { useAuth } from '../context/Authcontext'

const emptyForm = { name: '', description: '' }

const parseError = (err) => {
  if (err.response?.status === 403) return 'Only admins can do this.'
  const data = err.response?.data
  if (!data) return 'Could not reach the server.'
  if (data.detail) return data.detail
  return Object.entries(data).map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(' ') : m}`).join(' | ')
}

function Teams() {
  const { isAdmin } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchTeams = () => {
    API.get('/teams/').then(res => setTeams(res.data.results || res.data))
      .catch(err => console.error(err)).finally(() => setLoading(false))
  }
  useEffect(() => { fetchTeams() }, [])
  useEffect(() => {
    if (!showModal) return
    const onKey = (e) => e.key === 'Escape' && setShowModal(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setError(''); setShowModal(true) }
  const openEdit = (t) => { setForm({ name: t.name, description: t.description || '' }); setEditingId(t.id); setError(''); setShowModal(true) }

  const handleSubmit = () => {
    if (!form.name.trim()) return setError('Team name is required.')
    setSaving(true)
    const request = editingId ? API.put(`/teams/${editingId}/`, form) : API.post('/teams/', form)
    request.then(() => { setShowModal(false); fetchTeams() })
      .catch(err => setError(parseError(err))).finally(() => setSaving(false))
  }
  const handleDelete = (id) => {
    if (!window.confirm('Delete this team? Its memberships will be removed.')) return
    API.delete(`/teams/${id}/`).then(fetchTeams).catch(err => alert(parseError(err)))
  }

  return (
    <div>
      <div className="page-head">
        <div><h1>Teams</h1><p>{teams.length} {teams.length === 1 ? 'team' : 'teams'}</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add team</button>}
      </div>

      {loading && <div className="empty"><div className="spinner" />Loading teams...</div>}
      {!loading && teams.length === 0 && (
        <div className="panel empty"><p>No teams yet.</p>
          {isAdmin && <button className="btn btn-primary" onClick={openAdd}>Create the first team</button>}</div>
      )}

      <div className="grid">
        {teams.map(t => (
          <div key={t.id} className="card">
            <h3><Link to={`/teams/${t.id}`}>{t.name}</Link></h3>
            <div className="muted" style={{ fontSize: '.88rem' }}>{t.description || 'No description'}</div>
            <div><span className="chip">{t.member_count} {t.member_count === 1 ? 'member' : 'members'}</span></div>
            {isAdmin && (
              <div className="card-actions">
                <button className="btn btn-good btn-sm" onClick={() => openEdit(t)}>Edit</button>
                <button className="btn btn-bad btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && showModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <h2>{editingId ? 'Edit team' : 'Add team'}</h2>
            {error && <div className="form-error">{error}</div>}
            <input className="input" placeholder="Team name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea className="input" style={{ height: 90 }} placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="row">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add team'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Teams
