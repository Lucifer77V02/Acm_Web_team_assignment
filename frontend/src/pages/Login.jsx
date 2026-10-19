import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Authcontext'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    if (!form.username || !form.password) {
      setError('Username and password are required.')
      return
    }
    try {
      if (isRegister) {
        await register(form.username, form.email, form.password)
      } else {
        await login(form.username, form.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#181825'
    }}>
      <div style={{
        background: '#1e1e2e', padding: '40px', borderRadius: '12px',
        display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '320px'
      }}>
        <h2 style={{ color: 'white', margin: 0 }}>
          {isRegister ? 'Create Account' : 'Login'}
        </h2>

        {error && <p style={{ color: '#f38ba8', margin: 0 }}>{error}</p>}

        <input
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          style={inputStyle}
        />
        {isRegister && (
          <input
            placeholder="Email (optional)"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
        )}
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inputStyle}
        />
        <button onClick={handleSubmit} style={{
          background: '#89b4fa', border: 'none', padding: '10px',
          borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold',
          fontSize: '16px'
        }}>
          {isRegister ? 'Register' : 'Login'}
        </button>
        <p
          onClick={() => setIsRegister(!isRegister)}
          style={{ color: '#cdd6f4', cursor: 'pointer', textAlign: 'center', margin: 0 }}
        >
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '10px', borderRadius: '6px', border: '1px solid #444',
  background: '#313244', color: 'white', width: '100%',
  boxSizing: 'border-box'
}

export default Login