import { useEffect, useState } from 'react'
import API from '../api/axios'
import { useAuth } from '../context/Authcontext'
import { colorFor } from '../components/Icons'

function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = () => {
    API.get('/users/')
      .then(res => { setUsers(res.data); setError('') })
      .catch(err => setError(err.response?.data?.detail || 'Could not load users.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    fetchUsers()
    window.addEventListener('focus', fetchUsers)
    return () => window.removeEventListener('focus', fetchUsers)
  }, [])

  const changeRole = (u) => {
    const newRole = u.role === 'admin' ? 'viewer' : 'admin'
    if (!window.confirm(`Make ${u.username} a ${newRole}?`)) return
    setBusyId(u.id); setError('')
    API.patch(`/users/${u.id}/role/`, { role: newRole })
      .then(res => setUsers(list => list.map(x => (x.id === u.id ? res.data : x))))
      .catch(err => setError(err.response?.data?.error || 'Could not change the role.'))
      .finally(() => setBusyId(null))
  }

  const q = search.trim().toLowerCase()
  const visible = users.filter(u =>
    (!q || u.username.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)) &&
    (!roleFilter || u.role === roleFilter))

  if (loading) return <div className="empty"><div className="spinner" />Loading users...</div>

  return (
    <div>
      <div className="page-head">
        <div><h1>Users &amp; roles</h1>
          <p>Admins can add, edit and delete. Viewers can only look. New sign-ups start as viewers.</p></div>
        <button className="btn btn-ghost" onClick={fetchUsers}>↻ Refresh</button>
      </div>

      <div className="toolbar">
        <input className="input grow" placeholder="Search by username or email" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option><option value="admin">Admins</option><option value="viewer">Viewers</option>
        </select>
        {(search || roleFilter) && <button className="btn btn-ghost" onClick={() => { setSearch(''); setRoleFilter('') }}>Clear</button>}
      </div>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

      <div className="panel" style={{ padding: 8 }}>
        {visible.length === 0 ? (
          <div className="empty">{users.length === 0 ? 'No users yet.' : 'No users match your search.'}</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>User</th><th>Joined</th><th>Role</th><th></th></tr></thead>
              <tbody>
                {visible.map(u => {
                  const isMe = u.id === me?.id
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="row">
                          <div className="avatar sm" style={{ background: colorFor(u.username) }}>{u.username[0].toUpperCase()}</div>
                          <div><div style={{ fontWeight: 700 }}>{u.username}{isMe && <span className="muted"> (you)</span>}</div>
                            <div className="sub">{u.email || 'No email'}</div></div>
                        </div>
                      </td>
                      <td className="muted">{u.date_joined}</td>
                      <td><span className={`badge ${u.role}`}>{u.role === 'admin' ? 'Admin' : 'Viewer'}</span></td>
                      <td>
                        <div className="actions">
                          {!isMe && (
                            <button className={`btn btn-sm ${u.role === 'admin' ? 'btn-bad' : 'btn-good'}`} disabled={busyId === u.id} onClick={() => changeRole(u)}>
                              {busyId === u.id ? '...' : u.role === 'admin' ? 'Make viewer' : 'Make admin'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Users
