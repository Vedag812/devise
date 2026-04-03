import * as React from "react"
import { Link, useNavigate } from "react-router-dom";

const SignIn1 = () => {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [error, setError] = React.useState("");

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSignIn = () => {
        if (!email || !password) {
            setError("SYS_ERR: MISSING_CREDENTIALS");
            return;
        }
        if (!validateEmail(email)) {
            setError("SYS_ERR: INVALID_FORMAT");
            return;
        }
        setError("");
        alert("ACCESS_GRANTED: REDIRECTING TO TERMINAL...");
    };

    const handleDemoLogin = () => {
        setEmail("admin@devise.trade");
        setPassword("********");
        setError("");
        setTimeout(() => {
            navigate("/dashboard");
        }, 800);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden w-full p-4">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                 style={{ 
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px' 
                 }} 
            />

            {/* Glowing Accent Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-flame/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3" />

            {/* Centered Brutalist card */}
            <div className="relative z-10 w-full max-w-[380px] bg-black border-2 border-white/20 shadow-[12px_12px_0px_0px_rgba(255,255,255,0.1)] p-6 sm:p-8 flex flex-col items-center">
                {/* Decorative corner brackets */}
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-flame"></div>
                <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-flame"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-flame"></div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-flame"></div>

                {/* Logo */}
                <div className="w-12 h-12 bg-flame text-black flex items-center justify-center font-black font-mono text-xl border-2 border-black shadow-[4px_4px_0px_0px_white] mb-6">
                    D
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white mb-1 text-center font-mono tracking-tighter uppercase">
                    SYSTEM_ACCESS
                </h2>
                <p className="text-gray-500 text-[10px] mb-8 text-center font-mono uppercase tracking-[0.2em]">
                    Initialize connection to Devise Pipeline
                </p>

                {/* Form */}
                <div className="flex flex-col w-full gap-4">
                    <div className="w-full flex flex-col gap-3">
                        <input
                            placeholder="AUTH_EMAIL"
                            type="email"
                            value={email}
                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-flame transition-all font-mono uppercase text-sm"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            placeholder="AUTH_PASSWORD"
                            type="password"
                            value={password}
                            className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-flame transition-all font-mono uppercase text-sm"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && (
                            <div className="text-sm text-red-400 text-left font-mono bg-red-500/10 p-2 rounded border border-red-500/20">{error}</div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <a href="#" className="text-xs text-text-secondary hover:text-white transition-colors font-mono">Forgot password?</a>
                    </div>

                    <div>
                        <button
                            onClick={handleSignIn}
                            className="w-full bg-flame py-4 text-black font-black font-mono uppercase tracking-widest hover:bg-white transition-colors mb-4 border-2 border-flame"
                        >
                            [ SIGN_IN ]
                        </button>

                        <button
                            onClick={handleDemoLogin}
                            className="w-full bg-transparent py-4 text-flame font-black font-mono uppercase tracking-widest border-2 border-flame/30 hover:border-flame hover:bg-flame/10 transition-all mb-6 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.1)] hover:shadow-[4px_4px_0px_0px_#ea580c]"
                        >
                            RUN_DEMO_INSTANCE
                        </button>

                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background-elevated px-2 text-text-muted font-mono">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        {/* Google Sign In */}
                        <button className="w-full flex items-center justify-center gap-4 bg-white/5 border-2 border-white/10 text-white hover:bg-white hover:text-black py-4 font-black font-mono uppercase tracking-widest transition-all mb-6">
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className="w-5 h-5"
                            />
                            Google_Auth
                        </button>

                        <div className="w-full text-center mt-6">
                            <span className="text-xs text-text-secondary font-mono">
                                Don&apos;t have an account?{" "}
                                <Link
                                    to="/signup"
                                    className="underline text-white hover:text-flame transition-colors font-bold"
                                >
                                    Sign up
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Request */}
            <div className="relative z-10 mt-8 text-center">
                <Link to="/" className="text-xs text-text-muted hover:text-white transition-colors font-mono">
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
};

export { SignIn1 };
