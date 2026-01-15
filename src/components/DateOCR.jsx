import { useState, useRef, useCallback } from 'react'
import Tesseract from 'tesseract.js'

// Regex patterns for date formats
const DATE_PATTERNS = [
    // DD/MM/YYYY or DD-MM-YYYY
    { regex: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}|\d{2})/, format: 'DMY' },
    // MM/YYYY or MM-YYYY
    { regex: /(\d{1,2})[\/\-](\d{4})/, format: 'MY' },
    // YYYY-MM-DD
    { regex: /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, format: 'YMD' },
    // MMYYYY or MMYY (common in pharma)
    { regex: /(\d{2})(\d{4}|\d{2})/, format: 'MY_NO_SEP' },
    // Venc or EXP followed by date
    { regex: /(?:venc|exp|vto|cad)[:\s]*(\d{1,2})[\/\-]?(\d{1,2})?[\/\-]?(\d{2,4})/i, format: 'VENC' }
]

function parseDate(text) {
    const cleanText = text.replace(/[oO]/g, '0').replace(/[lI]/g, '1')

    for (const { regex, format } of DATE_PATTERNS) {
        const match = cleanText.match(regex)
        if (match) {
            let day, month, year

            switch (format) {
                case 'DMY':
                    day = parseInt(match[1])
                    month = parseInt(match[2])
                    year = parseInt(match[3])
                    break
                case 'MY':
                    day = 1
                    month = parseInt(match[1])
                    year = parseInt(match[2])
                    break
                case 'YMD':
                    year = parseInt(match[1])
                    month = parseInt(match[2])
                    day = parseInt(match[3])
                    break
                case 'MY_NO_SEP':
                    day = 1
                    month = parseInt(match[1])
                    year = parseInt(match[2])
                    break
                case 'VENC':
                    if (match[2]) {
                        day = parseInt(match[1])
                        month = parseInt(match[2])
                        year = parseInt(match[3])
                    } else {
                        day = 1
                        month = parseInt(match[1])
                        year = parseInt(match[3])
                    }
                    break
            }

            // Fix 2-digit year
            if (year < 100) {
                year = year > 50 ? 1900 + year : 2000 + year
            }

            // Validate ranges
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2020 && year <= 2040) {
                const monthStr = String(month).padStart(2, '0')
                const dayStr = String(day).padStart(2, '0')
                return `${year}-${monthStr}-${dayStr}`
            }
        }
    }

    return null
}

export default function DateOCR({ onDateDetected, onClose }) {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const [isScanning, setIsScanning] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState(null)
    const [detectedText, setDetectedText] = useState('')

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setIsScanning(false)
    }, [])

    const startCamera = useCallback(async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            })

            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
                setIsScanning(true)
            }
        } catch (err) {
            console.error('Error accessing camera:', err)
            setError('No se pudo acceder a la cámara. Verifica los permisos.')
        }
    }, [])

    const captureAndProcess = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return

        setIsProcessing(true)

        try {
            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')

            // Set canvas size to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0)

            // Get image data for OCR
            const imageData = canvas.toDataURL('image/png')

            // Run Tesseract OCR
            const result = await Tesseract.recognize(imageData, 'eng', {
                logger: m => console.log(m)
            })

            const text = result.data.text
            setDetectedText(text)
            console.log('OCR Result:', text)

            // Try to parse date from text
            const parsedDate = parseDate(text)

            if (parsedDate) {
                stopCamera()
                onDateDetected(parsedDate)
            } else {
                setError('No se detectó una fecha válida. Intenta de nuevo.')
                setTimeout(() => setError(null), 2000)
            }
        } catch (err) {
            console.error('OCR Error:', err)
            setError('Error al procesar la imagen.')
        } finally {
            setIsProcessing(false)
        }
    }, [onDateDetected, stopCamera])

    const handleClose = () => {
        stopCamera()
        onClose()
    }

    // Start camera on mount
    useState(() => {
        startCamera()
        return () => stopCamera()
    })

    return (
        <div>
            <div className="camera-container">
                {error && !isScanning ? (
                    <div className="empty-state">
                        <span className="icon">📷</span>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                            onLoadedMetadata={() => setIsScanning(true)}
                        />
                        <div className="camera-overlay">
                            <div className="scan-region" style={{ height: '20%' }}></div>
                        </div>
                        {isProcessing && (
                            <div className="loading-overlay" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)' }}>
                                <div className="spinner"></div>
                                <span className="loading-text">Procesando imagen...</span>
                            </div>
                        )}
                    </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {error && isScanning && (
                <p style={{ color: 'var(--color-warning)', textAlign: 'center', marginBottom: 'var(--space-md)' }}>
                    {error}
                </p>
            )}

            <div className="camera-controls">
                <button
                    className="btn btn-primary"
                    onClick={captureAndProcess}
                    disabled={!isScanning || isProcessing}
                >
                    📸 Capturar Fecha
                </button>
                <button className="btn btn-secondary" onClick={handleClose}>
                    ✕ Cancelar
                </button>
            </div>

            {detectedText && (
                <div className="card mt-md">
                    <p className="form-label">Texto detectado:</p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{detectedText}</p>
                </div>
            )}
        </div>
    )
}
