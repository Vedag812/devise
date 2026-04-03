"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import { LoginView } from "@/components/auth/login-view"

export function LoginPage() {
    const navigate = useNavigate()

    const handleLogin = () => {
        navigate("/dashboard")
    }

    return <LoginView onLogin={handleLogin} />
}
