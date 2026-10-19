import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import API from '../api/axios'

// The members endpoint may return plain members or membership rows; handle both
const readMember = (row) => {
  const m = row.member && typeof row.member === 'object' ? row.member : row
  return {
    id: row.member_id ?? (typeof row.member === 'number' ? row.member : m.id),
    name: row.member_name ?? m.name ?? 'Unknown',
    email: row.member_email ?? m.email ?? '',
    designation: row.designation ?? '',
  }
}

function TeamDetail() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      API.get(`/teams/${id}/`),
      API.get(`/teams/${id}/members/`),
    ])
      .then(([teamRes, memRes]) => {
        setTeam(teamRes.data)
        setMembers(memRes.data.results || memRes.data)
      })
      .catch(err => {
        setError(err.response?.status === 404 ? 'Team not found.' : 'Could not load this team.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p style={{ textAlign: 'center', padding: '60px', color: '#6c7086' }}>Loading team...</p>
  if (error) return (
    <div>
      <Link to="/teams" style={backLink}>← Back to teams</Link>
      <p style={{ color: '#f38ba8' }}>{error}</p>
    </div>
  )

  return (
    <div>
      <Link to="/teams" style={backLink}>← Back to teams</Link>

      <div style={{ ...card, marginTop: '16px', maxWidth: '720px' }}>
        <h1 style={{ margin: '0 0 8px' }}>{team.name}</h1>
        <p style={{ color: '#cdd6f4', marginTop: 0 }}>{team.description || 'No description'}</p>

        <h2 style={{ marginBottom: '8px' }}>
          Members <span style={{ fontSize: '16px', color: '#6c7086' }}>({members.length})</span>
        </h2>

        {members.length === 0 ? (
          <p style={{ color: '#6c7086' }}>No members in this team yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {members.map((row, i) => {
              const m = readMember(row)
              return (
                <li key={m.id ?? i} style={{
                  background: '#313244', padding: '10px 14px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', background: '#89b4fa',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', color: '#1e1e2e', flexShrink: 0
                  }}>
                    {m.name[0].toUpperCase()}
                  </div>
                  <div>
                    {m.id ? (
                      <Link to={`/members/${m.id}`} style={{ color: '#89b4fa', textDecoration: 'none', fontWeight: 'bold' }}>
                        {m.name}
                      </Link>
                    ) : (
                      <strong>{m.name}</strong>
                    )}
                    <div style={{ fontSize: '13px', color: '#cdd6f4' }}>
                      {m.designation || m.email}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

const card = { background: '#1e1e2e', padding: '24px', borderRadius: '12px' }
const backLink = { color: '#89b4fa', textDecoration: 'none' }

export default TeamDetail
