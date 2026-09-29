# 🌐 MAPA INTERACTIVO DE RED & CONTROL CENTRAL DE INFRAESTRUCTURA
## Documento de Traspaso Técnico y Memoria de Desarrollo (HANDOVER)

> **Repositorio Oficial:** [https://github.com/PabloGRuiz/MapaDeRed.git](https://github.com/PabloGRuiz/MapaDeRed.git)  
> **Fecha de Creación:** Septiembre 2026  
> **Propósito:** Transferir el 100% del contexto técnico, decisiones de arquitectura y estado del proyecto para continuar el desarrollo directamente en el servidor o en una nueva sesión.

---

### 1. Instrucción Rápida para el Asistente de IA en el Servidor
Si estás abriendo un nuevo chat de IA en el servidor, copia y pega el siguiente mensaje:
```text
Hola! Por favor lee el archivo HANDOVER.md ubicado en la raíz del proyecto para tomar el contexto completo del sistema, la arquitectura de persistencia, las decisiones de producto y las funcionalidades pendientes. Vamos a continuar el desarrollo desde allí.
```

---

### 2. Resumen Ejecutivo del Proyecto
El sistema es una plataforma web desarrollada en **Next.js 15 (App Router)** diseñada para el **monitoreo visual, auditoría y control de infraestructura física de telecomunicaciones a nivel nacional**.

El foco central del sistema está en:
1. **Mapa Geográfico Interactivo**: Visualización de puestos, nodos y enlaces troncales en un mapa vectorial oscuro (MapLibre GL), optimizado para no perder precisión en vistas panorámicas nacionales ni en vistas locales de ciudad.
2. **Esquemas de Red Reales (L2/L3)**: Visor integrado para diagramas creados por técnicos en **Draw.io (`.drawio`, `.xml`)**, **Microsoft Visio (`.vsdx`)**, o planos en imagen vectorial/raster (**SVG, PNG, JPG**).
3. **Gestión de Materiales e Inventario (Excel)**: Carga y descarga de planillas de hardware presente en salas de rack (routers, switches, UPS, patch panels, bandejas de fibra) con soporte nativo para archivos `.xlsx` y `.csv`.
4. **Auditoría Centralizada**: Roles de usuario (**Servidor Central / Admin** vs **Puesto Regional / Operador**) para auditar, aprobar o solicitar mejoras en las instalaciones.

---

### 3. Arquitectura Técnica y Stack

- **Framework Web:** Next.js 15 (App Router), React 19, TypeScript.
- **Motor de Mapas:** MapLibre GL con capas CartoDB Dark Matter (funciona sin claves de API comerciales y con alto rendimiento).
- **Procesamiento de Planillas:** Biblioteca `xlsx` (SheetJS) para lectura, normalización semántica y exportación en cliente y servidor.
- **Iconografía y Estilos:** `lucide-react`, Vanilla CSS / CSS Modules con diseño dark mode premium, efecto glassmorphism y aceleración por GPU.
- **Persistencia Física en Servidor Local:**
  - `data/network_nodes.json`: Archivo JSON físico donde se persisten todos los puestos, sus coordenadas, esquemas y materiales.
  - `data/network_links.json`: Archivo JSON físico donde se persisten las conexiones de fibra y radioenlaces entre nodos.
  - `public/uploads/diagrams/`: Carpeta física en el servidor donde se almacenan los archivos de esquemas subidos por los técnicos (`.vsdx`, `.drawio`, `.png`, etc.).
  - **Endpoints API:**
    - `POST / GET /api/nodes`: Lectura y escritura sincronizada de puestos.
    - `POST / GET /api/links`: Lectura y escritura de enlaces.
    - `POST /api/upload`: Recepción física de diagramas con generación de nombres únicos (`Date.now() + originalName`).
    - `GET /api/files/[filename]`: Entrega segura de archivos estáticos desde el almacenamiento físico.

---

### 4. Decisiones de Producto y Cambios Clave Realizados

A lo largo de las sesiones de trabajo se tomaron las siguientes decisiones de ingeniería y diseño:

1. **Reorientación del Formulario de Puestos (Eliminación de Telemetría):**
   - Se eliminaron los campos irrelevantes para este propósito (ancho de banda, SLA, latencia en ms, tipo de instalación repetitivo).
   - Se mantuvo la información geográfica e identificatoria: **Nombre del Puesto**, **Ciudad/Localidad**, **Provincia**, **Coordenadas** y **Observaciones de Infraestructura**.
2. **Condición para el Visor de Esquemas:**
   - El display interactivo del diagrama solo se activa si existe un archivo real cargado.
   - Si no hay archivo, muestra un panel de "Esquema Pendiente" con alerta y botón de carga directa.
3. **Escala y Posicionamiento de Marcadores en el Mapa:**
   - Se resolvió el problema del zoom out: los marcadores de nodos ahora recalculan su tamaño y halos proporcionalmente según el nivel de zoom (`calcMarkerSize` / CSS transforms), manteniendo siempre el anclaje milimétrico exacto sobre las coordenadas de la ciudad.
4. **Módulo de Planillas Excel de Materiales:**
   - **Exportación:** Genera un archivo `.xlsx` real con anchos de columna precalculados y metadatos de auditoría.
   - **Plantilla Oficial:** Botón de descarga de `Plantilla_Oficial_Relevamiento_Materiales.xlsx` con ejemplos reales (Cisco, Furukawa, APC) y hoja de instrucciones para técnicos de campo.
   - **Importación Inteligente:** Sube archivos `.xlsx`, `.xls` o `.csv`, reconoce columnas con sinónimos (Nombre, Equipo, Marca, S/N, Rack, etc.), auto-clasifica categorías si no vienen explícitas, y ofrece un modal con preview para elegir entre *Reemplazar inventario* o *Sumar ítems*.
   - **Asistente de Creación:** El paso 3 del wizard permite arrastrar la planilla Excel al crear un nuevo puesto.

---

### 5. Estructura de Directorios Clave

```text
MapaDeRed/
├── data/
│   ├── network_nodes.json        # Base de datos física de nodos y puestos
│   └── network_links.json        # Base de datos física de enlaces troncales
├── public/
│   ├── lib/maplibre/             # Scripts locales auxiliares
│   └── uploads/diagrams/         # Archivos físicos de diagramas y planos subidos
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── nodes/route.ts    # API para persistir puestos
│   │   │   ├── links/route.ts    # API para persistir enlaces
│   │   │   ├── upload/route.ts   # API para subir archivos de esquemas
│   │   │   └── files/[filename]/ # API para servir archivos guardados
│   │   ├── globals.css           # Estilos globales y tokens
│   │   ├── layout.tsx
│   │   └── page.tsx              # Vista principal
│   ├── components/
│   │   ├── Audit/
│   │   │   ├── VisioDiagramViewer.tsx   # Visor de esquemas (Draw.io, Visio, Imágenes)
│   │   │   ├── InventoryExcelTable.tsx  # Tabla y modales de import/export Excel
│   │   │   ├── CentralAuditDashboardModal.tsx # Dashboard general de auditoría
│   │   │   └── ImprovementsList.tsx     # Propuestas de mejoras técnicas
│   │   ├── Map/
│   │   │   └── InteractiveMap.tsx       # Componente central MapLibre con escalado
│   │   ├── UI/
│   │   │   ├── NodeDetailModal.tsx      # Modal de ficha técnica del puesto
│   │   │   ├── Header.tsx / Sidebar.tsx # Navegación y métricas
│   │   │   └── RoleSelector.tsx         # Cambio de rol (Admin vs Regional)
│   │   └── Wizard/
│   │       ├── CreateSiteWizardModal.tsx # Asistente de alta de puesto (3 pasos)
│   │       └── CreateLinkModal.tsx       # Asistente para enlazar puestos
│   ├── context/
│   │   └── NetworkCentralContext.tsx    # Estado central, roles y llamadas a API
│   ├── types/
│   │   └── network.ts                   # Interfaces TypeScript del dominio
│   └── utils/
│       ├── excelInventoryHelpers.ts     # Lógica de import/export y plantillas Excel
│       ├── diagramFileHelpers.ts        # Procesador de diagramas subidos
│       ├── drawioParser.ts              # Extractor de esquemas Draw.io
│       └── visioParser.ts               # Extractor y soporte de Visio
└── HANDOVER.md                          # Este documento
```

---

### 6. Hoja de Ruta Pendiente (Próximas Tareas)

1. **Generación de Códigos QR para Racks (Prioridad Alta):**
   - Habilitar en `page.tsx` la lectura de parámetros URL (`?node=[id]`) para abrir el puesto automáticamente al escanear.
   - Agregar en `NodeDetailModal.tsx` o `VisioDiagramViewer.tsx` el botón **"Generar QR de Rack"**.
   - Permitir previsualizar el QR en pantalla, descargar el PNG/SVG para rotuladoras, o imprimir una **Ficha Técnica A4** para plastificar en la puerta del gabinete.
2. **Puesta en Producción en el Servidor:**
   - Configurar proceso persistente con **PM2** o contenedor **Docker**.
   - Asegurar permisos de escritura (`chmod -R 775 data public/uploads`).
   - Configurar Nginx / Reverse Proxy con HTTPS hacia el puerto del servicio (por defecto 3000).

---

### 7. Comandos Útiles para el Servidor

```bash
# 1. Clonar el repositorio
git clone https://github.com/PabloGRuiz/MapaDeRed.git
cd MapaDeRed

# 2. Instalar dependencias
npm install

# 3. Validar TypeScript sin errores
npx tsc --noEmit

# 4. Levantar en desarrollo
npm run dev

# 5. Compilar y correr para producción
npm run build
npm run start

# 6. Levantar como demonio con PM2 (recomendado en servidor)
npm install -g pm2
pm2 start npm --name "mapa-red" -- start
pm2 save
pm2 startup
```
