import { useState, useRef, useEffect, useCallback } from 'react'

export default function BarcodeScanner({ onScan, onClose }) {
    const videoRef = useRef(null)
    const [isScanning, setIsScanning] = useState(false)
    const [error, setError] = useState(null)
    const streamRef = useRef(null)
    const detectorRef = useRef(null)
    const animationRef = useRef(null)

    const stopCamera = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
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

    const detectBarcode = useCallback(async () => {
        if (!videoRef.current || !detectorRef.current || !isScanning) return

        try {
            const barcodes = await detectorRef.current.detect(videoRef.current)

            if (barcodes.length > 0) {
                const barcode = barcodes[0]
                console.log('Barcode detected:', barcode.rawValue)
                stopCamera()
                onScan(barcode.rawValue)
                return
            }
        } catch (err) {
            // Detection failed, continue scanning
        }

        animationRef.current = requestAnimationFrame(detectBarcode)
    }, [isScanning, onScan, stopCamera])

    useEffect(() => {
        // Check if BarcodeDetector is available
        if ('BarcodeDetector' in window) {
            detectorRef.current = new BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
            })
        } else {
            setError('Tu navegador no soporta la detección de códigos de barras. Usa Chrome o Edge.')
            return
        }

        startCamera()

        return () => {
            stopCamera()
        }
    }, [startCamera, stopCamera])

    useEffect(() => {
        if (isScanning && detectorRef.current) {
            detectBarcode()
        }
    }, [isScanning, detectBarcode])

    const handleClose = () => {
        stopCamera()
        onClose()
    }

    return (
        <div className="camera-container">
            {error ? (
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
                        style={{ transform: 'scaleX(1)' }}
                    />
                    <div className="camera-overlay">
                        <div className="scan-region"></div>
                    </div>
                </>
            )}
            <div className="camera-controls">
                <button className="btn btn-secondary" onClick={handleClose}>
                    ✕ Cancelar
                </button>
            </div>
        </div>
    )
}
