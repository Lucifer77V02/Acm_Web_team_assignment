import axios from 'axios'

// Dev: Vite (:5173) talks to Django (:8000). Production: same origin, so a relative path works.
const API = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8000/api' : '/api',
  withCredentials: true,
})

export default API
