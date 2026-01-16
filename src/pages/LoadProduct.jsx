import { useState, useEffect } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'
import Icon from '../components/Icon'
import DateOCR from '../components/DateOCR'
import Skeleton from '../components/Skeleton'
import { supabase } from '../lib/supabase'

export default function LoadProduct() {
    // Scanning states
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
    const [showDateScanner, setShowDateScanner] = useState(false)

    // Product data
    const [product, setProduct] = useState(null)
    const [barcode, setBarcode] = useState('')

    // Form data
    const [expirationDate, setExpirationDate] = useState('')
    const [lotNumber, setLotNumber] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [location, setLocation] = useState('')

    // UI states
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [toast, setToast] = useState(null)
    const [isNewProduct, setIsNewProduct] = useState(false)
    const [newProductName, setNewProductName] = useState('')
    const [newProductBrand, setNewProductBrand] = useState('')

    const showToast = (message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleBarcodeScan = async (scannedBarcode) => {
        setShowBarcodeScanner(false)
        setBarcode(scannedBarcode)
        setIsLoading(true)

        try {
            // Search for product in database
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('barcode', scannedBarcode)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching product:', error)
                showToast('Error al buscar producto', 'error')
                return
            }

            if (data) {
                setProduct(data)
                setIsNewProduct(false)
                showToast(`Producto encontrado: ${data.name}`)
            } else {
                // Product not found, allow user to create it
                setProduct(null)
                setIsNewProduct(true)
                showToast('Producto nuevo - completa los datos', 'warning')
            }
        } catch (err) {
            console.error('Error:', err)
            showToast('Error de conexión', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDateDetected = (date) => {
        setShowDateScanner(false)
        setExpirationDate(date)
        showToast('Fecha detectada correctamente')
    }

    const handleSave = async () => {
        // Validation
        if (!barcode) {
            showToast('Escanea un código de barras primero', 'error')
            return
        }
        if (!expirationDate) {
            showToast('Ingresa la fecha de vencimiento', 'error')
            return
        }
        if (!lotNumber) {
            showToast('Ingresa el número de lote', 'error')
            return
        }

        setIsSaving(true)

        try {
            let productId = product?.id

            // If it's a new product, create it first
            if (isNewProduct) {
                if (!newProductName) {
                    showToast('Ingresa el nombre del producto', 'error')
                    setIsSaving(false)
                    return
                }

                const { data: newProduct, error: productError } = await supabase
                    .from('products')
                    .insert({
                        barcode,
                        name: newProductName,
                        brand: newProductBrand || null
                    })
                    .select()
                    .single()

                if (productError) {
                    console.error('Error creating product:', productError)
                    showToast('Error al crear producto', 'error')
                    setIsSaving(false)
                    return
                }

                productId = newProduct.id
                setProduct(newProduct)
                setIsNewProduct(false)
            }

            // Create the batch
            const { error: batchError } = await supabase
                .from('batches')
                .insert({
                    product_id: productId,
                    lot_number: lotNumber,
                    expiration_date: expirationDate,
                    quantity: quantity,
                    quantity_remaining: quantity,  // Track remaining stock (for sales integration)
                    location: location || null
                })

            if (batchError) {
                console.error('Error creating batch:', batchError)
                showToast('Error al guardar lote', 'error')
                setIsSaving(false)
                return
            }

            showToast('¡Lote guardado correctamente!')

            // Reset form for next scan
            resetForm()

        } catch (err) {
            console.error('Error:', err)
            showToast('Error de conexión', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const resetForm = () => {
        setProduct(null)
        setBarcode('')
        setExpirationDate('')
        setLotNumber('')
        setQuantity(1)
        setLocation('')
        setIsNewProduct(false)
        setNewProductName('')
        setNewProductBrand('')
    }

    // Format date for display
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return ''
        return dateStr // Already in YYYY-MM-DD format
    }

    return (
        <div className="app-container">
            <div className="page-header">
                <h1><Icon name="package" size={32} style={{ marginRight: 'var(--space-sm)' }} /> Cargar Producto</h1>
            </div>

            {/* Barcode Scanner Section */}
            {showBarcodeScanner ? (
                <BarcodeScanner
                    onScan={handleBarcodeScan}
                    onClose={() => setShowBarcodeScanner(false)}
                />
            ) : (
                <button
                    className={`scanner-btn ${barcode ? 'active' : ''}`}
                    onClick={() => setShowBarcodeScanner(true)}
                    aria-label="Escanear código de barras"
                >
                    <Icon name="scan" size={48} className="icon" />
                    <span className="label">
                        {barcode ? `Código: ${barcode}` : 'Escanear Código de Barras'}
                    </span>
                </button>
            )}

            {/* Loading indicator with Skeleton */}
            {isLoading && (
                <div className="card" style={{ padding: 'var(--space-lg)' }}>
                    <Skeleton width="60%" height="24px" style={{ marginBottom: 'var(--space-sm)' }} />
                    <Skeleton width="40%" height="16px" />
                </div>
            )}

            {/* Product Info Card */}
            {product && !isLoading && (
                <div className="card product-card animate-slide-up">
                    <span className="product-name">{product.name}</span>
                    {product.brand && <span className="product-brand">{product.brand}</span>}
                </div>
            )}

            {/* New Product Form */}
            {isNewProduct && !isLoading && (
                <div className="card animate-slide-up">
                    <p style={{ marginBottom: 'var(--space-md)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="alertTriangle" size={20} /> Producto no encontrado. Ingresa los datos:
                    </p>
                    <div className="form-group">
                        <label className="form-label">Nombre del Producto *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: Ibuprofeno 400mg"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Marca</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: Bayer"
                            value={newProductBrand}
                            onChange={(e) => setNewProductBrand(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Date Scanner Section */}
            {(product || isNewProduct) && !isLoading && (
                <div className="animate-slide-up">
                    {showDateScanner ? (
                        <DateOCR
                            onDateDetected={handleDateDetected}
                            onClose={() => setShowDateScanner(false)}
                        />
                    ) : (
                        <button
                            className={`scanner-btn ${expirationDate ? 'active' : ''}`}
                            onClick={() => setShowDateScanner(true)}
                            aria-label="Escanear fecha de vencimiento"
                        >
                            <Icon name="calendar" size={48} className="icon" />
                            <span className="label">
                                {expirationDate ? `Vencimiento: ${expirationDate}` : 'Escanear Fecha de Vencimiento'}
                            </span>
                        </button>
                    )}

                    {/* Manual date input */}
                    <div className="form-group">
                        <label className="form-label">Fecha de Vencimiento</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formatDateForInput(expirationDate)}
                            onChange={(e) => setExpirationDate(e.target.value)}
                        />
                    </div>

                    {/* Lot and Quantity */}
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Lote *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="ABC123"
                                value={lotNumber}
                                onChange={(e) => setLotNumber(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cantidad</label>
                            <input
                                type="number"
                                className="form-input"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="form-group">
                        <label className="form-label">Ubicación</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej: Estante A, Góndola 3"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        className="btn btn-success"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                Guardando...
                            </>
                        ) : (
                            <><Icon name="check" size={20} /> Guardar</>
                        )}
                    </button>
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}
