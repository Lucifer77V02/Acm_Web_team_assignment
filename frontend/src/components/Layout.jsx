import { useState } from 'react'
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/Authcontext'
import Icon, { colorFor } from './Icons'

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const close = () => setOpen(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/members?search=${encodeURIComponent(q.trim())}` : '/members')
    setQ('')
  }

  return (
    <div className="app">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <Link to="/" className="brand" onClick={close}>
            <span className="brand-mark">A</span> ACM NITK
          </Link>
          <nav className="nav" onClick={close}>
            <NavLink to="/" end><Icon name="dashboard" /> Dashboard</NavLink>
            <NavLink to="/members"><Icon name="members" /> Members</NavLink>
            <NavLink to="/teams"><Icon name="teams" /> Teams</NavLink>
            {isAdmin && (
              <>
                <div className="nav-label">Admin</div>
                <NavLink to="/users"><Icon name="users" /> Users &amp; roles</NavLink>
              </>
            )}
          </nav>
          <div className="side-user">
            <div className="who">
              <div className="avatar" style={{ background: colorFor(user.username) }}>{user.username[0].toUpperCase()}</div>
              <div style={{ minWidth: 0 }}>
                <div className="name">{user.username}</div>
                <span className={`badge ${isAdmin ? 'admin' : 'viewer'}`}>{isAdmin ? 'Admin' : 'Viewer'}</span>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </aside>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={close} />

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <form className="search" onSubmit={submitSearch}>
            <Icon name="search" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members, then press Enter" />
          </form>
          <span className="top-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  )
}
