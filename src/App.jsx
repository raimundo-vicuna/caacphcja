import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ContentProvider } from './lib/content'
import Site from './Site'
import AdminApp from './admin/AdminApp'
import './App.css'
import './admin/admin.css'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ContentProvider><Site /></ContentProvider>} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
