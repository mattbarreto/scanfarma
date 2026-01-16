
import Icon from './Icon'

const illustrations = {
    search: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: 200 }}>
            <circle cx="100" cy="75" r="40" stroke="var(--border-color)" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="100" cy="75" r="30" fill="var(--bg-elevated)" opacity="0.5" />
            <path d="M125 100L145 120" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="75" r="10" fill="var(--text-muted)" opacity="0.2" />
        </svg>
    ),
    box: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: 200 }}>
            <rect x="60" y="60" width="80" height="60" rx="4" stroke="var(--border-color)" strokeWidth="2" />
            <path d="M60 80H140" stroke="var(--border-color)" strokeWidth="1" />
            <path d="M90 60V50C90 44.4772 94.4772 40 100 40C105.523 40 110 44.4772 110 50V60" stroke="var(--border-color)" strokeWidth="2" />
            <line x1="80" y1="100" x2="120" y2="100" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
        </svg>
    ),
    alert: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: 200 }}>
            <path d="M100 30L140 100H60L100 30Z" stroke="var(--border-color)" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="100" cy="115" r="40" stroke="var(--border-color)" strokeWidth="1" opacity="0.3" />
            <path d="M100 60V80" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="90" r="2" fill="var(--text-muted)" />
        </svg>
    ),
    success: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: 200 }}>
            <circle cx="100" cy="75" r="40" stroke="var(--color-success)" strokeWidth="2" opacity="0.2" />
            <path d="M80 75L95 90L120 60" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="160" cy="40" r="5" fill="var(--color-success)" opacity="0.4" />
            <circle cx="40" cy="110" r="3" fill="var(--color-success)" opacity="0.3" />
        </svg>
    ),
    chart: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: 200 }}>
            <line x1="50" y1="120" x2="150" y2="120" stroke="var(--border-color)" strokeWidth="2" />
            <line x1="50" y1="120" x2="50" y2="40" stroke="var(--border-color)" strokeWidth="2" />
            <rect x="70" y="80" width="20" height="40" rx="2" fill="var(--bg-elevated)" />
            <rect x="100" y="60" width="20" height="60" rx="2" fill="var(--bg-elevated)" opacity="0.7" />
            <rect x="130" y="90" width="20" height="30" rx="2" fill="var(--bg-elevated)" opacity="0.5" />
        </svg>
    )
}

export default function EmptyState({ type = 'box', title, description, action }) {
    return (
        <div className="empty-state-container" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-2xl)',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.5) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-color)',
            margin: 'var(--space-md) 0'
        }}>
            <div style={{ marginBottom: 'var(--space-lg)', opacity: 0.8 }}>
                {illustrations[type] || illustrations.box}
            </div>
            <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-xs)'
            }}>
                {title}
            </h3>
            {description && (
                <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--text-muted)',
                    maxWidth: '300px',
                    lineHeight: 1.5,
                    marginBottom: action ? 'var(--space-lg)' : 0
                }}>
                    {description}
                </p>
            )}
            {action}
        </div>
    )
}
