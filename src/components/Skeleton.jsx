
export default function Skeleton({ type = 'text', width, height, className = '', style = {} }) {
    const baseStyle = {
        backgroundColor: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-sm)',
        display: 'inline-block',
        animation: 'shimmer 1.5s infinite linear',
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-secondary) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        ...style
    }

    if (width) baseStyle.width = width
    if (height) baseStyle.height = height

    let typeClass = ''
    if (type === 'circular') {
        baseStyle.borderRadius = '50%'
    } else if (type === 'card') {
        baseStyle.width = '100%'
        baseStyle.height = '120px'
        baseStyle.borderRadius = 'var(--radius-md)'
    }

    return (
        <div className={`skeleton ${typeClass} ${className}`} style={baseStyle}></div>
    )
}
