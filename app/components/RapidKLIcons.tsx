/**
 * RapidKL-style icons matching their official design
 */

export function InterchangeIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2 8L6 4M6 4L10 4M6 4L6 8M14 8L10 12M10 12L6 12M10 12L10 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function ConnectingIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="8" cy="5" r="1.5" fill="currentColor" />
            <path
                d="M5 12C5 10 6.5 8.5 8 8.5C9.5 8.5 11 10 11 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
            <path
                d="M3 12L5 10M13 12L11 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function StationIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="2" y="6" width="16" height="10" rx="1" fill={color} />
            <path
                d="M6 6V4C6 2.89543 6.89543 2 8 2H12C13.1046 2 14 2.89543 14 4V6"
                stroke={color}
                strokeWidth="1.5"
                fill="none"
            />
            <circle cx="7" cy="11" r="1" fill="white" />
            <circle cx="13" cy="11" r="1" fill="white" />
            <rect x="8" y="9" width="4" height="1.5" fill="white" />
        </svg>
    );
}

