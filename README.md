# 💊 ScanFarma

> Sistema de control de vencimientos e inteligencia de rotación para farmacias.

**[🌐 Ver Demo en Vivo](https://scanfarma.netlify.app)**

![ScanFarma Preview](public/og-image.png)

## 🎯 Problema que resuelve

Las farmacias pierden dinero por productos vencidos. ScanFarma:
- **Escanea** códigos de barras y fechas de vencimiento
- **Alerta** automáticamente sobre productos próximos a vencer
- **Integra** ventas para evitar alertas fantasma (FIFO automático)
- **Analiza** patrones de pérdida y sugiere acciones preventivas

## ✨ Características

- 🧠 **Memoria Predictiva (v2.2)** - Aprende el vocabulario de tu farmacia
- ⚡ **Autocompletado Inteligente** - Carga de productos en < 5 segundos
- 📱 **PWA Installable** - Funciona offline y como app nativa
- 📷 **Escaneo de código de barras** - BarcodeDetector API
- 📅 **OCR de fechas** - Tesseract.js optimizado
- 📊 **Dashboard de inteligencia** - Gráficos y score de salud
- 🔔 **Notificaciones** - Alertas diarias via Email (Resend + Cron)
- 🌙 **Dark mode & Glassmorphism** - UI premium

## 🛠️ Tech Stack

| Área | Tecnología |
|------|------------|
| Frontend | React 18 + Vite |
| Styling | Vanilla CSS (Premium Glassmorphism) |
| Backend | Supabase (DB + Auth + Edge Functions) |
| Deploy | Netlify |
| Intelligence | Custom Scoring Engine v1.0 |

## 📁 Estructura

```
scanFarma/
├── src/
│   ├── components/     # Autocomplete, Scanner, Charts
│   ├── pages/          # LoadProduct (Smart), Analytics
│   ├── lib/            # memoryService, notificationService
│   └── index.css       # Design System
├── public/             # Assets & Manifest
└── supabase/           # Migraciones & Functions
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

Este software es **Source Available**. El código es visible con fines educativos y de portfolio, pero el uso comercial requiere licencia. Ver [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ en Argentina 🇦🇷
</p>
