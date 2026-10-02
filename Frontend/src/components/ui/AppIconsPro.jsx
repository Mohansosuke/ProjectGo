import React from "react";

const iconProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
};

export function DashboardIcon({ size = 24, stroke = "currentColor", strokeWidth = 1.8, className = "" }) {
    return (
        <svg {...iconProps} width={size} height={size} className={className}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} />
            <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} />
            <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} />
            <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
    );
}

export function WorkspaceIcon({ size = 24, stroke = "currentColor", strokeWidth = 1.8, className = "" }) {
    return (
        <svg {...iconProps} width={size} height={size} className={className}>
            <path
                d="M12 3 21 8 12 13 3 8 12 3Z"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
            />
            <path
                d="m3 12 9 5 9-5M3 16l9 5 9-5"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function PlannerIcon({ size = 24, stroke = "currentColor", strokeWidth = 1.8, className = "" }) {
    return (
        <svg {...iconProps} width={size} height={size} className={className}>
            <rect x="3" y="5" width="18" height="16" rx="2.5" stroke={stroke} strokeWidth={strokeWidth} />
            <path d="M7 3v4M17 3v4M3 10h18" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
    );
}

export function TeamsIcon({ size = 24, stroke = "currentColor", strokeWidth = 1.8, className = "" }) {
    return (
        <svg {...iconProps} width={size} height={size} className={className}>
            <circle cx="9" cy="8" r="3" stroke={stroke} strokeWidth={strokeWidth} />
            <path
                d="M3.5 20a5.5 5.5 0 0 1 11 0"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
            <circle cx="17" cy="9" r="2.4" stroke={stroke} strokeWidth={strokeWidth} />
            <path
                d="M15.5 15.2a4.5 4.5 0 0 1 5 4.8"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
        </svg>
    );
}

export const TeamIcon = TeamsIcon;

export function DocsIcon({ size = 24, stroke = "currentColor", strokeWidth = 1.8, className = "" }) {
    return (
        <svg {...iconProps} width={size} height={size} className={className}>
            <path
                d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V3.5Z"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
            />
            <path
                d="M14 3.5V8h4M9 12h6M9 16h6"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export const navItems = [
    { label: "Dashboard", icon: DashboardIcon },
    { label: "Workspace", icon: WorkspaceIcon },
    { label: "Planner", icon: PlannerIcon },
    { label: "Teams", icon: TeamsIcon },
    { label: "Docs", icon: DocsIcon },
];

export const NavIcons = navItems;

export default function NavigationIcons({
    active = "Dashboard",
    onNavigate,
    size = 22,
    className = "",
}) {
    return (
        <nav className={className} aria-label="Main navigation">
            {navItems.map(({ label, icon: Icon }) => {
                const isActive = active === label;

                return (
                    <button
                        key={label}
                        type="button"
                        onClick={() => onNavigate?.(label)}
                        aria-current={isActive ? "page" : undefined}
                        title={label}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 40,
                            height: 40,
                            padding: 0,
                            border: 0,
                            borderRadius: 12,
                            background: isActive ? "rgba(99, 102, 241, 0.10)" : "transparent",
                            color: isActive ? "#6366F1" : "#64748B",
                            cursor: "pointer",
                            transition: "all 160ms ease",
                        }}
                    >
                        <Icon size={size} />
                    </button>
                );
            })}
        </nav>
    );
}
