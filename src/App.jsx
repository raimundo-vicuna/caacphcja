import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { inject } from '@vercel/analytics'
import { ContentProvider } from './lib/content'
import Site from './Site'
import NotFound from './NotFound'
import AdminApp from './admin/AdminApp'
import './App.css'
import './admin/admin.css'

export default function App() {
  useEffect(() => {
    inject({ mode: 'auto' })
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ContentProvider><Site /></ContentProvider>} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<ContentProvider><NotFound /></ContentProvider>} />
      </Routes>
    </HashRouter>
  )
}
