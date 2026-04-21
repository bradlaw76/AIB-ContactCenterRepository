import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ManifestProvider } from './context/ManifestContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Shell from './components/Shell/Shell'
import HomePage from './pages/HomePage/HomePage'
import BrowsePage from './pages/BrowsePage/BrowsePage'
import ResourceDetailPage from './pages/ResourceDetailPage/ResourceDetailPage'
import SearchPage from './pages/SearchPage/SearchPage'
import UploadPage from './pages/UploadPage/UploadPage'
import ManagePage from './pages/ManagePage/ManagePage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ManifestProvider>
            <Shell>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/browse" element={<BrowsePage />} />
                <Route path="/browse/:category" element={<BrowsePage />} />
                <Route path="/resource/:id" element={<ResourceDetailPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/manage" element={<ManagePage />} />
              </Routes>
            </Shell>
          </ManifestProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
