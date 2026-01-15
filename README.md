# 💊 ScanFarma

> Sistema de control de vencimientos para farmacias

[![Netlify Status](https://api.netlify.com/api/v1/badges/BADGE_ID/deploy-status)](https://app.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 📋 Descripción

ScanFarma automatiza el control de medicamentos vencidos o próximos a vencer, eliminando revisiones manuales exhaustivas y reduciendo errores humanos.

### Características principales

- 📷 **Escaneo de código de barras** - Identificación rápida de productos
- 📅 **OCR de fechas** - Captura automática de fechas de vencimiento
- 🔔 **Alertas automáticas** - Notificaciones de productos por vencer
- 📱 **Mobile-first** - Optimizado para uso en dispositivos móviles
- ⚡ **Tiempo objetivo** - < 10 segundos por producto

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta en [Supabase](https://supabase.com) (gratis)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/YOUR_USERNAME/scanfarma.git
cd scanfarma

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

### Variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Nunca commitear credenciales**. El archivo `.env.local` está en `.gitignore`.

---

## 🗄️ Base de datos

### Configuración de Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor**
3. Ejecutar el script en `supabase/migrations/001_initial_schema.sql`

### Esquema

```
products          # Productos registrados
├── id            # UUID
├── barcode       # Código de barras único
├── name          # Nombre del producto
└── brand         # Marca (opcional)

batches           # Lotes con fecha de vencimiento
├── id            # UUID
├── product_id    # FK → products
├── lot_number    # Número de lote
├── expiration_date # Fecha de vencimiento
├── quantity      # Cantidad
└── location      # Ubicación (opcional)
```

---

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Supabase      │
│   (React/Vite)  │     │   (PostgreSQL)  │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│   Browser APIs  │
│   • BarcodeDetector
│   • MediaDevices
│   • Tesseract.js
└─────────────────┘
```

### Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL) |
| OCR | Tesseract.js |
| Barcode | BarcodeDetector API |
| Hosting | Netlify |

---

## 📁 Estructura del proyecto

```
scanfarma/
├── src/
│   ├── components/     # Componentes reutilizables
│   │   ├── BarcodeScanner.jsx
│   │   └── DateOCR.jsx
│   ├── pages/          # Páginas de la aplicación
│   │   ├── LoadProduct.jsx
│   │   ├── Alerts.jsx
│   │   └── Inventory.jsx
│   ├── lib/            # Utilidades y configuración
│   │   └── supabase.js
│   ├── App.jsx         # Router principal
│   ├── main.jsx        # Entry point
│   └── index.css       # Estilos globales
├── supabase/
│   └── migrations/     # Scripts SQL
├── public/             # Assets estáticos
├── .env.example        # Template de variables
├── netlify.toml        # Configuración de deploy
└── package.json
```

---

## 🔧 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build |
| `npm run lint` | Linter (ESLint) |

---

## 🌐 Deploy

### Netlify (recomendado)

1. Conectar repositorio en [app.netlify.com](https://app.netlify.com)
2. Configurar variables de entorno en **Site settings > Environment variables**
3. Deploy automático en cada push a `main`

### Manual

```bash
npm run build
# Subir contenido de /dist a cualquier hosting estático
```

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 📞 Soporte

¿Problemas o sugerencias? Abrí un [issue](https://github.com/YOUR_USERNAME/scanfarma/issues).
