import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import API from '../api/axios'

function MemberDetail() {
  const { id } = useParams()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    API.get(`/members/${id}/`)
      .then(res => setMember(res.data))
      .catch(err => {
        setError(err.response?.status === 404 ? 'Member not found.' : 'Could not load this member.')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p style={{ textAlign: 'center', padding: '60px', color: '#6c7086' }}>Loading member...</p>
  if (error) return (
    <div>
      <Link to="/members" style={backLink}>← Back to members</Link>
      <p style={{ color: '#f38ba8' }}>{error}</p>
    </div>
  )

  return (
    <div>
      <Link to="/members" style={backLink}>← Back to members</Link>

      <div style={{ ...card, marginTop: '16px', maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%', background: '#89b4fa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 'bold', color: '#1e1e2e'
          }}>
            {member.name[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{member.name}</h1>
            <span style={{
              background: member.status === 'active' ? '#a6e3a1' : '#f38ba8',
              color: '#1e1e2e', padding: '2px 10px', borderRadius: '12px',
              fontSize: '12px', fontWeight: 'bold'
            }}>
              {member.status}
            </span>
          </div>
        </div>

        <dl style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '120px 1fr', rowGap: '10px' }}>
          <dt style={dt}>Email</dt><dd style={dd}>{member.email}</dd>
          <dt style={dt}>Department</dt><dd style={dd}>{member.department}</dd>
          <dt style={dt}>Year</dt><dd style={dd}>Year {member.year}</dd>
          <dt style={dt}>Joined</dt><dd style={dd}>{member.date_joined}</dd>
        </dl>

        <h2 style={{ marginBottom: '8px' }}>Teams</h2>
        {member.memberships.length === 0 ? (
          <p style={{ color: '#6c7086' }}>Not part of any team yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {member.memberships.map((m, i) => (
              <li key={m.id ?? i} style={{ background: '#313244', padding: '10px 14px', borderRadius: '8px' }}>
                {m.team ? (
                  <Link to={`/teams/${m.team}`} style={{ color: '#89b4fa', textDecoration: 'none', fontWeight: 'bold' }}>
                    {m.team_name}
                  </Link>
                ) : (
                  <strong>{m.team_name}</strong>
                )}
                {m.designation && <span style={{ color: '#cdd6f4' }}> — {m.designation}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const card = { background: '#1e1e2e', padding: '24px', borderRadius: '12px' }
const backLink = { color: '#89b4fa', textDecoration: 'none' }
const dt = { color: '#6c7086', margin: 0 }
const dd = { color: '#cdd6f4', margin: 0 }

export default MemberDetail
