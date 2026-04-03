import { cn } from '@/lib/utils';
import React from 'react';

type FeatureType = {
    title: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    description: string;
};

type FeatureCardPorps = React.ComponentProps<'div'> & {
    feature: FeatureType;
};

export function FeatureCard({ feature, className, ...props }: FeatureCardPorps) {
    const p = genRandomPattern();

    return (
        <div className={cn('relative overflow-hidden p-8 md:p-12 min-h-[280px] md:min-h-[320px] transition-all duration-300 hover:scale-[1.02] hover:border-flame/30 group cursor-pointer', className)} {...props}>
            <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
                <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100 group-hover:opacity-150 transition-opacity duration-300">
                    <GridPattern
                        width={20}
                        height={20}
                        x="-12"
                        y="4"
                        squares={p}
                        className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
                    />
                </div>
            </div>
            <feature.icon className="text-flame size-8 md:size-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" strokeWidth={1.5} aria-hidden />
            <h3 className="mt-12 md:mt-16 text-lg md:text-xl font-mono font-bold text-text-primary transition-colors duration-300 group-hover:text-flame">{feature.title}</h3>
            <p className="text-text-secondary relative z-20 mt-3 md:mt-4 text-sm md:text-base font-mono leading-relaxed">{feature.description}</p>
        </div>
    );
}

function GridPattern({
    width,
    height,
    x,
    y,
    squares,
    ...props
}: React.ComponentProps<'svg'> & { width: number; height: number; x: string; y: string; squares?: number[][] }) {
    const patternId = React.useId();

    return (
        <svg aria-hidden="true" {...props}>
            <defs>
                <pattern id={patternId} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
                    <path d={`M.5 ${height}V.5H${width}`} fill="none" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
            {squares && (
                <svg x={x} y={y} className="overflow-visible">
                    {squares.map(([x, y], index) => (
                        <rect strokeWidth="0" key={index} width={width + 1} height={height + 1} x={x * width} y={y * height} />
                    ))}
                </svg>
            )}
        </svg>
    );
}

function genRandomPattern(length?: number): number[][] {
    length = length ?? 5;
    return Array.from({ length }, () => [
        Math.floor(Math.random() * 4) + 7, // random x between 7 and 10
        Math.floor(Math.random() * 6) + 1, // random y between 1 and 6
    ]);
}
