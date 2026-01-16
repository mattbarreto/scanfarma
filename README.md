# 💊 ScanFarma

> Sistema de control de vencimientos e inteligencia de rotación para farmacias.

[![Deploy Status](https://api.netlify.com/api/v1/badges/scanfarma/deploy-status)](https://scanfarma.netlify.app)

![ScanFarma Preview](public/og-image.png)

## 🎯 Problema que resuelve

Las farmacias pierden dinero por productos vencidos. ScanFarma:
- **Escanea** códigos de barras y fechas de vencimiento
- **Alerta** automáticamente sobre productos próximos a vencer
- **Integra** ventas para evitar alertas fantasma (FIFO automático)
- **Analiza** patrones de pérdida y sugiere acciones preventivas

## ✨ Características

- 📱 **PWA** - Funciona como app nativa en móviles
- 📷 **Escaneo de código de barras** - BarcodeDetector API
- 📅 **OCR de fechas** - Tesseract.js
- 📊 **Dashboard de inteligencia** - Métricas y sugerencias
- 🔔 **Notificaciones** - Alertas por email (próximamente)
- 🌙 **Dark mode** - UI premium

## 🛠️ Tech Stack

| Área | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (Design System) |
| Backend | Supabase (PostgreSQL + Auth) |
| Deploy | Netlify |
| Barcode | BarcodeDetector API |
| OCR | Tesseract.js |

## 📁 Estructura

```
scanFarma/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Pantallas de la app
│   ├── lib/            # Servicios y utilidades
│   └── index.css       # Design System
├── public/             # Assets estáticos
└── supabase/           # Migraciones SQL (no incluidas)
```

## 🚀 Demo

**[Ver demo en vivo →](https://scanfarma.netlify.app)**

## 📸 Screenshots

| Escaneo | Alertas | Inteligencia |
|---------|---------|--------------|
| Escanea productos con la cámara | Ve qué productos vencen pronto | Métricas y sugerencias automáticas |

## 💼 Uso Comercial

ScanFarma está disponible como **servicio SaaS** para farmacias.

Para información sobre licencias comerciales o implementación:

- 🌐 **Web:** [matiasbarreto.com](https://matiasbarreto.com)
- 📧 **Email:** matiasbarreto@gmail.com

## 👤 Autor

**Matías Barreto**

- Website: [matiasbarreto.com](https://matiasbarreto.com)
- GitHub: [@mattbarreto](https://github.com/mattbarreto)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ en Argentina 🇦🇷
</p>
