import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Authcontext'

function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav style={{
      background: '#1e1e2e', padding: '16px 32px',
      display: 'flex', gap: '24px', alignItems: 'center'
    }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
        ACM NITK
      </span>
      <Link to="/" style={linkStyle}>Dashboard</Link>
      <Link to="/members" style={linkStyle}>Members</Link>
      <Link to="/teams" style={linkStyle}>Teams</Link>
      {isAdmin && <Link to="/users" style={linkStyle}>Users</Link>}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <span style={{ color: '#cdd6f4' }}>
              👤 {user.username}{' '}
              <span style={{
                background: isAdmin ? '#cba6f7' : '#313244',
                color: isAdmin ? '#1e1e2e' : '#cdd6f4',
                padding: '2px 8px', borderRadius: '12px',
                fontSize: '12px', fontWeight: 'bold'
              }}>
                {isAdmin ? 'Admin' : 'Viewer'}
              </span>
            </span>
            <button onClick={handleLogout} style={{
              background: '#f38ba8', border: 'none', padding: '8px 16px',
              borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
            }}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={{
            background: '#89b4fa', padding: '8px 16px',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold'
          }}>
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}

const linkStyle = { color: '#cdd6f4', textDecoration: 'none' }

export default Navbar
