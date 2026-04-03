import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/pages/landing-page'
import { PipelineDashboard } from '@/components/dashboard/pipeline-dashboard'
import { LoginPage } from '@/pages/login-page'

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<PipelineDashboard />} />
        </Routes>
    )
}

export default App
