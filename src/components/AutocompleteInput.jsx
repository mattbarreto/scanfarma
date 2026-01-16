import { useState, useEffect, useRef } from 'react'
import { memoryService } from '../lib/memoryService'
import Icon from './Icon'

export default function AutocompleteInput({
    userId,
    value,
    onChange,
    onSelect,
    placeholder,
    className = '',
    ...props
}) {
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const wrapperRef = useRef(null)

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [wrapperRef])

    const handleInputChange = async (e) => {
        const newValue = e.target.value
        onChange(newValue)

        if (newValue.length > 1 && userId) {
            try {
                const results = await memoryService.getSuggestions(userId, newValue)
                setSuggestions(results)
                setShowSuggestions(true)
            } catch (err) {
                console.error('Error fetching suggestions:', err)
            }
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }

    const handleSelectSuggestion = (item) => {
        onChange(item.product_name)
        if (onSelect) onSelect(item)
        setShowSuggestions(false)
    }

    return (
        <div className="autocomplete-wrapper" ref={wrapperRef} style={{ position: 'relative' }}>
            <input
                type="text"
                className={className}
                value={value}
                onChange={handleInputChange}
                onFocus={() => value && value.length > 1 && setShowSuggestions(true)}
                placeholder={placeholder}
                autoComplete="off"
                {...props}
            />

            {showSuggestions && suggestions.length > 0 && (
                <div className="suggestions-dropdown" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {suggestions.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleSelectSuggestion(item)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--color-border-light)',
                                fontSize: '0.9rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <span>{item.product_name}</span>
                            {item.laboratory && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                    {item.laboratory}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
