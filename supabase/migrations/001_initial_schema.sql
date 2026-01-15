-- =============================================
-- ScanFarma - Esquema inicial de base de datos
-- =============================================

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de lotes con fecha de vencimiento
-- NOTA: El estado se calcula en las queries, no como columna generada
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    lot_number VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    quantity INTEGER DEFAULT 1,
    location VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de alertas enviadas (para futuro sistema de alertas)
CREATE TABLE IF NOT EXISTS alerts_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(20) NOT NULL,
    batch_ids UUID[] NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    channel VARCHAR(20) DEFAULT 'email',
    status VARCHAR(20) DEFAULT 'sent'
);

-- Vista para lotes con estado calculado
CREATE OR REPLACE VIEW batches_with_status AS
SELECT 
    *,
    CASE 
        WHEN expiration_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING'
        ELSE 'VALID'
    END AS status
FROM batches;

-- Índices para mejorar rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_batches_expiration ON batches(expiration_date);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);

-- Habilitar Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_log ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso público (MVP sin auth)
-- NOTA: En producción, agregar autenticación y limitar acceso
CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on products" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on products" ON products FOR DELETE USING (true);

CREATE POLICY "Allow public read access on batches" ON batches FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on batches" ON batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on batches" ON batches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on batches" ON batches FOR DELETE USING (true);

CREATE POLICY "Allow public read access on alerts_log" ON alerts_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on alerts_log" ON alerts_log FOR INSERT WITH CHECK (true);
