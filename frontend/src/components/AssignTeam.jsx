import { useEffect, useState } from 'react'
import API from '../api/axios'

function AssignTeam({ memberId, currentMemberships, onUpdate }) {
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [designation, setDesignation] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    API.get('/teams/').then(res => setTeams(res.data.results || res.data))
  }, [])

  const assignedTeamIds = currentMemberships.map(m => m.team)

  const handleAssign = () => {
    if (!selectedTeam) {
      setError('Please select a team.')
      return
    }
    API.post('/memberships/', {
      member: memberId,
      team: selectedTeam,
      designation: designation,
    })
      .then(() => {
        setSelectedTeam('')
        setDesignation('')
        setError('')
        onUpdate()
      })
      .catch(err => {
        setError(err.response?.data?.non_field_errors?.[0] || 'Already in this team.')
      })
  }

  const handleRemove = (membershipId) => {
    if (!window.confirm('Remove from this team?')) return
    API.delete(`/memberships/${membershipId}/`)
      .then(() => onUpdate())
      .catch(err => console.error(err))
  }

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #444', paddingTop: '16px' }}>
      <h3>Team Assignments</h3>

      {currentMemberships.length === 0 && (
        <p style={{ color: '#6c7086' }}>Not assigned to any team yet.</p>
      )}

      {currentMemberships.map(m => (
        <div key={m.id} style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '8px',
          background: '#313244', padding: '8px', borderRadius: '6px'
        }}>
          <span>{m.team_name} {m.designation ? `— ${m.designation}` : ''}</span>
          <button
            onClick={() => handleRemove(m.id)}
            style={{ background: '#f38ba8', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Remove
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select a team...</option>
          {teams
            .filter(t => !assignedTeamIds.includes(t.id))
            .map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
        </select>
        <input
          placeholder="Designation (optional)"
          value={designation}
          onChange={e => setDesignation(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleAssign} style={btnStyle}>Assign</button>
      </div>
      {error && <p style={{ color: '#f38ba8', marginTop: '8px' }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  padding: '8px', borderRadius: '6px', border: '1px solid #444',
  background: '#313244', color: 'white', flex: 1
}
const btnStyle = {
  background: '#89b4fa', border: 'none', padding: '8px 16px',
  borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
}

export default AssignTeam