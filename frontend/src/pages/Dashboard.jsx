import { useEffect, useState } from 'react'
import API from '../api/axios'
import { colorFor } from '../components/Icons'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'

// recharts needs real color values (CSS variables don't work in SVG attributes)
const C = { blue: '#3b9cff', green: '#3ddc97', amber: '#ffb454', violet: '#8b7bff', red: '#ff6b81', muted: '#8793a9', line: '#1f2a3d' }
const PALETTE = [C.blue, C.green, C.amber, C.violet, C.red, '#5eead4']
const tip = { contentStyle: { background: '#172033', border: '1px solid #1f2a3d', borderRadius: 10, color: '#e8edf7' }, cursor: { fill: 'rgba(255,255,255,.04)' } }
const axis = { stroke: C.muted, tickLine: false, axisLine: false, fontSize: 12 }

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    API.get('/members/stats/').then(res => setStats(res.data)).catch(() => setError('Could not load the dashboard.'))
    API.get('/teams/').then(res => setTeams(res.data.results || res.data)).catch(() => {})
  }, [])

  if (error) return <p style={{ color: C.red }}>{error}</p>
  if (!stats) return <div className="empty"><div className="spinner" />Loading dashboard...</div>

  const pctActive = stats.total ? Math.round((stats.active / stats.total) * 100) : 0
  const teamData = teams.map(t => ({ name: t.name, count: t.member_count }))

  return (
    <div>
      <div className="page-head">
        <div><h1>Dashboard</h1><p>Overview of the ACM NITK community</p></div>
      </div>

      <div className="stat-grid">
        <Stat label="Total members" value={stats.total} hint="Across all years" />
        <Stat label="Active members" value={stats.active} hint={`${pctActive}% of everyone`} hl />
        <Stat label="Inactive members" value={stats.inactive} hint="Not currently active" />
        <Stat label="Teams" value={teams.length} hint="Working groups" />
      </div>

      <div className="chart-grid">
        <Panel title="Members by department" className="span-2">
          {stats.by_department.length === 0 ? <None /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.by_department}>
                <defs>
                  <linearGradient id="fillBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.blue} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip {...tip} />
                <Area type="monotone" dataKey="count" name="Members" stroke={C.blue} strokeWidth={3} fill="url(#fillBlue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Members by year">
          {stats.by_year.length === 0 ? <None /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.by_year}>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip {...tip} />
                <Bar dataKey="count" name="Members" fill={C.violet} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Active vs inactive">
          {stats.total === 0 ? <None /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={[{ name: 'Active', value: stats.active }, { name: 'Inactive', value: stats.inactive }]}
                  dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  <Cell fill={C.green} /><Cell fill={C.red} />
                </Pie>
                <Legend /><Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Members per team">
          {teamData.length === 0 ? <None /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={teamData}>
                <CartesianGrid stroke={C.line} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip {...tip} />
                <Bar dataKey="count" name="Members" fill={C.amber} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Team distribution">
          {teamData.length === 0 ? <None /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={teamData.map(t => ({ name: t.name, value: t.count }))} dataKey="value" outerRadius={85} stroke="none">
                  {teamData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Legend /><Tooltip {...tip} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

      <Panel title="Recently joined" sub="Latest members">
        {stats.recent_members.length === 0 ? <None /> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Member</th><th>Department</th><th>Year</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {stats.recent_members.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="row">
                        <div className="avatar sm" style={{ background: colorFor(m.name) }}>{m.name[0].toUpperCase()}</div>
                        <div><div style={{ fontWeight: 700 }}>{m.name}</div><div className="sub">{m.email}</div></div>
                      </div>
                    </td>
                    <td>{m.department}</td>
                    <td>Year {m.year}</td>
                    <td><span className={`status ${m.status}`}>{m.status === 'active' ? 'Active' : 'Inactive'}</span></td>
                    <td className="muted">{m.date_joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

const Stat = ({ label, value, hint, hl }) => (
  <div className={`stat ${hl ? 'hl' : ''}`}>
    <div className="label">{label}</div><div className="value">{value}</div><div className="hint">{hint}</div>
  </div>
)
const Panel = ({ title, sub, className = '', children }) => (
  <section className={`panel ${className}`}>
    <div className="panel-title"><h2>{title}</h2>{sub && <span>{sub}</span>}</div>{children}
  </section>
)
const None = () => <p className="muted" style={{ textAlign: 'center', padding: 24 }}>No data yet.</p>

export default Dashboard
