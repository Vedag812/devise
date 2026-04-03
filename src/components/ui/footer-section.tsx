"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Briefcase, Send, X } from "lucide-react"

function FooterSection() {
    return (
        <footer className="relative bg-black text-white py-16 border-t-2 border-white/20">
            {/* Grid Background */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                 style={{ 
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px' 
                 }} 
            />

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="grid gap-12 md:gap-16 md:grid-cols-2 lg:grid-cols-4">
                    
                    {/* Newsletter Section */}
                    <div className="relative border-2 border-white/10 p-6 bg-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                        <div className="absolute -top-3 left-4 bg-black px-2 font-mono text-flame text-sm font-bold tracking-widest">
                            [ NETWORK_LINK ]
                        </div>
                        <p className="mb-6 text-gray-400 font-mono text-sm leading-relaxed uppercase">
                            Establish persistent connection for security patches and enforcement logs.
                        </p>
                        <form className="relative flex">
                            <Input
                                type="email"
                                placeholder="SYS_ADMIN_EMAIL"
                                className="rounded-none border-2 border-white/20 bg-transparent text-white font-mono placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-flame"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className="rounded-none bg-flame hover:bg-white text-black border-2 border-l-0 border-flame transition-colors w-12 h-10 px-0"
                            >
                                <Send className="h-5 w-5" />
                                <span className="sr-only">Subscribe</span>
                            </Button>
                        </form>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-black font-mono text-white tracking-widest border-l-4 border-flame pl-3 uppercase">
                            Registry
                        </h3>
                        <nav className="space-y-3 text-sm font-mono tracking-widest flex flex-col items-start">
                            {['ArmorClaw Core', 'Swarm Topologies', 'Policy Schemas', 'Audit Logs', 'Token Decryption'].map((link) => (
                                <a key={link} href="#" className="border-b border-transparent hover:border-flame hover:text-flame text-gray-400 transition-colors uppercase">
                                    {link}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Contact Us */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-black font-mono text-white tracking-widest border-l-4 border-flame pl-3 uppercase">
                            Terminal Access
                        </h3>
                        <address className="space-y-3 text-sm font-mono not-italic text-gray-400 uppercase tracking-widest">
                            <p className="text-white font-bold">DEVISE ENGINE</p>
                            <p>NODE=0x4A_MUMBAI</p>
                            <p>PORT=SYS_DEF</p>
                            <p className="text-cyan-500">COMM=SYS@DEVISE.TRADE</p>
                        </address>
                    </div>

                    {/* Follow Us */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-black font-mono text-white tracking-widest border-l-4 border-flame pl-3 uppercase">
                            Broadcast
                        </h3>
                        <div className="flex space-x-4">
                            {[X, Briefcase, Camera].map((Icon, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    size="icon"
                                    className="rounded-none border-2 border-white/20 bg-transparent text-white hover:border-flame hover:bg-flame hover:text-black transition-colors min-w-[48px] min-h-[48px]"
                                >
                                    <Icon className="h-5 w-5" />
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t-2 border-white/20 pt-8 text-center md:flex-row">
                    <p className="text-sm text-gray-500 font-mono tracking-widest uppercase">
                        © 2026 DEVISE. NO RIGHTS RESERVED. <span className="text-flame font-bold">FAIL CLOSED.</span>
                    </p>
                    <nav className="flex flex-wrap justify-center gap-6 text-sm font-mono tracking-widest">
                        {['Privacy_Policy', 'Zero_Trust_Terms', 'Risk_Disclosure'].map((link) => (
                            <a key={link} href="#" className="text-gray-500 hover:text-white transition-colors uppercase">
                                {link}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>
        </footer>
    )
}

export { FooterSection }
