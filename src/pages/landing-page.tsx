import { MynaHero } from "@/components/ui/myna-hero"
import { DeviceArchitectureScroll } from "@/components/ui/device-architecture-scroll"
import { AttackScenariosScroll } from "@/components/ui/attack-scenarios-scroll"
import { UnifiedFeatures } from "@/components/ui/unified-features"
import { Pricing } from "@/components/ui/pricing"
import { FAQ } from "@/components/ui/faq"
import { FooterSection } from "@/components/ui/footer-section"

const tradingPlans = [
    {
        name: "DEV SANDBOX",
        price: "0",
        yearlyPrice: "0",
        period: "month",
        features: [
            "Local environment only",
            "Swarm Analyst access",
            "Paper trading integration",
            "Basic DevicePolicy schema",
            "Community Support",
        ],
        description: "For developers testing AI agent safety features.",
        buttonText: "Start Building",
        href: "#signup",
        isPopular: false,
    },
    {
        name: "CLAUDE CLOUD",
        price: "$49",
        yearlyPrice: "$490",
        period: "month",
        features: [
            "Anthropic Claude backend",
            "Zero local hardware requirements",
            "Cloud-hosted Swarm Analyst",
            "Standard DevisePolicy limits",
            "Email Support",
        ],
        description: "For users without the local compute to run Swarm Analyst at full capacity.",
        buttonText: "Deploy on Claude",
        href: "#claude",
        isPopular: false,
    },
    {
        name: "ENTERPRISE",
        price: "Contact",
        yearlyPrice: "Contact",
        period: "year",
        features: [
            "ArmorClaw primary enforcement",
            "Cryptographic DeviceTokens",
            "Live trading integration",
            "Custom ticker universes",
            "SLA guarantees",
            "Dedicated onboarding",
        ],
        description: "Full intent enforcement for financial institutions.",
        buttonText: "Contact Sales",
        href: "#contact",
        isPopular: true,
    }
];

import { Header } from "@/components/ui/header-2"

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background-base">
            <Header />
            <MynaHero />
            <DeviceArchitectureScroll />
            <AttackScenariosScroll />
            <UnifiedFeatures />
            <Pricing
                plans={tradingPlans}
                title="Deployment Options"
                description="Adopt intent-aware pipelines at any scale. Ensure your autonomous financial agents never exceed their authorized scope."
            />
            <FAQ />
            <FooterSection />
        </div>
    )
}
