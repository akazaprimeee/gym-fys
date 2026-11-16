# Gimnasio Fuerza y Salud - Aplicación Móvil Oficial (Piura)

Aplicación móvil web (PWA Ready / Responsive) diseñada para **Gimnasio Fuerza y Salud**, con identidad corporativa oficial, control de acceso por carnet digital con segundero anti-fraude, código QR dinámico y panel de control para recepción.

---

## 🌟 Características Principales

### 1. Identidad de Marca y Enlaces Oficiales
- **Logo Oficial**: Integrado en el encabezado, login, carnet holográfico y centro del código QR.
- **Ubicación Google Maps**: [Sede Gimnasio Fuerza y Salud en Google Maps](https://maps.app.goo.gl/7U4esPttLkjqku6f7) con botón directo de navegación GPS "Cómo llegar".
- **Redes Sociales Oficiales**:
  - [Instagram @gimnasiofys](https://www.instagram.com/gimnasiofys/)
  - [TikTok @gymfuerzaysaludpiura](https://www.tiktok.com/@gymfuerzaysaludpiura?lang=es)

---

### 2. Sistema de Autenticación
- Inicio de sesión con **DNI (8 dígitos)** y **Contraseña**.
- Botón para ocultar/mostrar contraseña.
- **Botones de Acceso Rápido (Demo)** para probar al instante:
  - **Carlos Mendoza** (Socio Activo - Membresía Trimestral VIP)
  - **Valeria Ramos** (Socia con Membresía por vencer en 2 días)
  - **Roberto Farfán** (Socio con Membresía Vencida)
  - **Juan Pérez** (Recepcionista / Administrador)

---

### 3. Vista de Cliente (Portal del Socio)
- **Tarjeta de Perfil**: Foto, Nombres completos, N° de DNI, Código de socio (`FS-0842`) y badge de categoría.
- **Estado de Membresía**:
  - Semáforo de vigencia: `ACTIVA` (Verde), `POR VENCER` (Ámbar) o `VENCIDA` (Rojo).
  - Fecha exacta de caducidad y barra de progreso de días restantes.
  - Opción para solicitar renovación subiendo número de operación bancaria.
- **Selector Segmentado**:
  1. **Carnet Digital**:
     - Credencial con diseño holográfico premium de gimnasio.
     - Chip de seguridad, foto del titular, DNI, tipo de plan y datos de vigencia.
     - **Segundero en Tiempo Real Anti-Fraude**: Reloj digital `HH:MM:SS` en vivo y barra de pulso de microsegundos que garantiza presencialidad e impide el uso de capturas de pantalla estáticas.
  2. **Código QR Dinámico**:
     - Generación de código QR cifrado con token y timestamp.
     - Auto-renovación automática cada 20 segundos con cuenta regresiva.
     - Botón para forzar actualización inmediata.

---

### 4. Vista de Admin (Panel del Recepcionista)
- **Métricas en tiempo real**: Contador de ingresos de hoy, solicitudes por validar y total de socios activos.
- **Validador Integrado de Ingreso (QR Scanner)**:
  - Soporte de cámara web/móvil para escanear el QR físico o pantalla del socio.
  - Simulador de escaneo rápido con 1 click (prueba de socio activo, aviso de pago o socio caducado).
  - Búsqueda manual inmediata por DNI.
  - Feedback visual y auditivo (Web Audio API): Chime de bienvenida verde para socios activos, alerta amarilla para cuotas por vencer, buzzer rojo para socios caducados.
  - Bitácora de ingresos del día con hora y estatus.
- **Panel de Validación de Documentos y Pagos**:
  - Cola de revisiones de comprobantes (Transferencias BCP, Yape, constancias médicas).
  - Visualizador modal con zoom de comprobantes.
  - Botón **"Aprobar"**: activa automáticamente la membresía del socio, actualiza su vigencia a 30 días y notifica al sistema.
  - Botón **"Rechazar"**: desestima la solicitud.

---

### 5. Botón para Alternar entre Vistas
- Accesible en todo momento mediante:
  - Botón superior: `Alternar: Vista Admin` / `Alternar: Vista Socio`.
  - Botón flotante en el header: `A Recepción` / `A Mi Carnet`.
  - Barra de navegación inferior táctil.

---

## 🚀 Cómo Ejecutar la Aplicación

1. La aplicación es puramente web y no requiere compilación previa.
2. Puedes abrir directamente el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Safari, Firefox).
3. O si prefieres un servidor local:
   ```bash
   # Con Python
   python -m http.server 8080

   # Con Node.js (npx)
   npx serve .
   ```
4. Ingresa a `http://localhost:8080` desde tu PC o celular conectado a la misma red WiFi.
