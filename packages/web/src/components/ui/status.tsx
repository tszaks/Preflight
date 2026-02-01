import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utiliy for merging tailwind classes with standard Vercel logic
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function StatusLight({
    status,
    label,
    pulse
}: {
    status: 'neutral' | 'ready' | 'processing' | 'warning' | 'critical',
    label?: string,
    pulse?: boolean
}) {
    const statusColors = {
        neutral: 'bg-gray-500 shadow-[0_0_8px_#6b7280]',
        ready: 'bg-green-500 shadow-[0_0_8px_#22c55e]',
        processing: 'bg-blue-500 shadow-[0_0_8px_#3b82f6]',
        warning: 'bg-yellow-500 shadow-[0_0_8px_#eab308]',
        critical: 'bg-red-500 shadow-[0_0_8px_#ef4444]',
    };

    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "w-2 h-2 rounded-full",
                statusColors[status],
                pulse && "animate-pulse"
            )} />
            {label && <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{label}</span>}
        </div>
    );
}
