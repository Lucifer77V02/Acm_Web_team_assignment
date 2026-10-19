import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import API from '../api/axios'
import AssignTeam from '../components/AssignTeam'
import { useAuth } from '../context/Authcontext'
import { colorFor } from '../components/Icons'

const emptyForm = { name: '', email: '', department: '', year: '', status: 'active' }

const parseError = (err) => {
  if (err.response?.status === 403) return 'Only admins can do this.'
  const data = err.response?.data
  if (!data) return 'Could not reach the server.'
  if (data.detail) return data.detail
  return Object.entries(data).map(([f, m]) => `${f}: ${Array.isArray(m) ? m.join(' ') : m}`).join(' | ')
}

function Members() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [members, setMembers] = useState([])
  const [teams, setTeams] = useState([])
  const [search, setSearch] = useState(params.get('search') || '')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [ordering, setOrdering] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [currentMember, setCurrentMember] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const PAGE_SIZE = 6

  // the top-bar search sends ?search=...; keep the box in sync with it
  useEffect(() => { setSearch(params.get('search') || '') }, [params])

  const fetchMembers = () => {
    setLoading(true)
    API.get('/members/', { params: { search, status: filterStatus, year: filterYear, team: filterTeam, ordering, page } })
      .then(res => {
        if (res.data.results) { setMembers(res.data.results); setTotalCount(res.data.count) }
        else { setMembers(res.data); setTotalCount(res.data.length) }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { API.get('/teams/').then(res => setTeams(res.data.results || res.data)) }, [])
  useEffect(() => { setPage(1) }, [search, filterStatus, filterYear, filterTeam, ordering])
  useEffect(() => { fetchMembers() }, [search, filterStatus, filterYear, filterTeam, ordering, page])

  useEffect(() => {
    if (!showModal) return
    const onKey = (e) => e.key === 'Escape' && setShowModal(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  const clearFilters = () => {
    setSearch(''); setFilterStatus(''); setFilterYear(''); setFilterTeam(''); setOrdering(''); setPage(1)
    if (params.get('search')) setParams({})
  }

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setCurrentMember(null); setError(''); setShowModal(true) }
  const openEdit = (member) => {
    API.get(`/members/${member.id}/`).then(res => {
      setCurrentMember(res.data)
      setForm({ name: res.data.name, email: res.data.email, department: res.data.department, year: res.data.year, status: res.data.status })
      setEditingId(res.data.id); setError(''); setShowModal(true)
    })
  }

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.department || !form.year) return setError('All fields are required.')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email address.')
    const year = Number(form.year)
    if (!Number.isInteger(year) || year < 1 || year > 4) return setError('Year must be a whole number between 1 and 4.')
    setSaving(true)
    const request = editingId ? API.put(`/members/${editingId}/`, form) : API.post('/members/', form)
    request.then(() => { setShowModal(false); fetchMembers() })
      .catch(err => setError(parseError(err)))
      .finally(() => setSaving(false))
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this member? This cannot be undone.')) return
    API.delete(`/members/${id}/`).then(fetchMembers).catch(err => alert(parseError(err)))
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasFilters = search || filterStatus || filterYear || filterTeam || ordering

  return (
    <div>
      <div className="page-head">
        <div><h1>Members</h1><p>{totalCount} {totalCount === 1 ? 'member' : 'members'}{hasFilters ? ' match your filters' : ' in total'}</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd}>+ Add member</button>}
      </div>

      <div className="toolbar">
        <input className="input grow" placeholder="Search name, email, department" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
        <select className="input" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          <option value="">All years</option>{[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <select className="input" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
          <option value="">All teams</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" value={ordering} onChange={e => setOrdering(e.target.value)}>
          <option value="">Sort: default</option><option value="name">Name A–Z</option><option value="-name">Name Z–A</option>
          <option value="year">Year (low to high)</option><option value="-date_joined">Newest first</option><option value="date_joined">Oldest first</option>
        </select>
        {hasFilters && <button className="btn btn-ghost" onClick={clearFilters}>Clear</button>}
      </div>

      <div className="panel" style={{ padding: 8, opacity: loading && members.length ? 0.6 : 1 }}>
        {loading && members.length === 0 ? (
          <div className="empty"><div className="spinner" />Loading members...</div>
        ) : members.length === 0 ? (
          <div className="empty">
            <p>{hasFilters ? 'No members match these filters.' : 'No members yet.'}</p>
            {hasFilters ? <button className="btn btn-primary" onClick={clearFilters}>Clear filters</button>
              : isAdmin && <button className="btn btn-primary" onClick={openAdd}>Add the first member</button>}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Member</th><th>Department</th><th>Status</th><th>Teams</th><th>Joined</th><th></th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="row">
                        <div className="avatar sm" style={{ background: colorFor(m.name) }}>{m.name[0].toUpperCase()}</div>
                        <div><Link className="name" to={`/members/${m.id}`}>{m.name}</Link><div className="sub">{m.email}</div></div>
                      </div>
                    </td>
                    <td>{m.department}<div className="sub">Year {m.year}</div></td>
                    <td><span className={`status ${m.status}`}>{m.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      {m.memberships.length === 0 ? <span className="muted">—</span> : (
                        <div className="chips">{m.memberships.map((x, i) => <span key={x.id ?? i} className="chip">{x.team_name}</span>)}</div>
                      )}
                    </td>
                    <td className="muted">{m.date_joined || '—'}</td>
                    <td>
                      <div className="actions">
                        {isAdmin && <>
                          <button className="btn btn-good btn-sm" onClick={() => openEdit(m)}>Edit</button>
                          <button className="btn btn-bad btn-sm" onClick={() => handleDelete(m.id)}>Delete</button>
                        </>}
                        <Link className="btn btn-ghost btn-sm" to={`/members/${m.id}`} style={{ textDecoration: 'none' }}>View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pager">
          <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Prev</button>
          <span className="muted">Page {page} of {totalPages}</span>
          <button className="btn btn-ghost" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
        </div>
      )}

      {isAdmin && showModal && (
        <div className="overlay" onMouseDown={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" role="dialog" aria-modal="true">
            <h2>{editingId ? 'Edit member' : 'Add member'}</h2>
            {error && <div className="form-error">{error}</div>}
            <input className="input" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            <input className="input" type="number" min="1" max="4" placeholder="Year (1-4)" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
            {editingId && currentMember && (
              <AssignTeam memberId={editingId} currentMemberships={currentMember.memberships}
                onUpdate={() => API.get(`/members/${editingId}/`).then(res => { setCurrentMember(res.data); fetchMembers() })} />
            )}
            <div className="row">
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add member'}</button>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Members
