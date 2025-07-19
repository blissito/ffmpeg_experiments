# Video Frame Overlay Application

Una aplicación web para agregar overlays de frames personalizados a videos usando FFmpeg.

## 🎯 Estado del Proyecto

### ✅ Completado

- **Configuración inicial del proyecto** (monorepo con frontend, backend y shared)
- **Modelos de datos y validación** (User, Job, VideoMetadata con Zod)
- **Servicios de base de datos** (MongoDB con conexión y operaciones CRUD)
- **Servicio de almacenamiento** (AWS S3 para archivos de video y frames)
- **Servicio de procesamiento FFmpeg** (generación de comandos y validación)
- **Procesador de trabajos Agenda.js** (manejo de cola de trabajos con seguimiento de progreso)

### 🔄 Próximos Pasos

#### **Tarea 5: Crear endpoints de API REST**

**5.1 Implementar endpoints de creación y estado de trabajos**

- Crear endpoint POST `/api/jobs` para crear nuevos trabajos de procesamiento
- Implementar endpoint GET `/api/jobs/:id/status` para consultar estado
- Agregar endpoint GET `/api/jobs/:id/result` para obtener resultado
- Validación de parámetros y manejo de errores
- _Requirements: 4.1, 4.3, 5.1_

**5.2 Implementar endpoints de gestión de archivos**

- Crear endpoint POST `/api/upload/video` para subir videos
- Implementar endpoint POST `/api/upload/frame` para subir frames
- Agregar endpoint GET `/api/jobs/:id/download` para descargar resultado
- Validación de tipos de archivo y tamaños
- _Requirements: 2.1, 2.2, 5.2_

#### **Tarea 6: Construir interfaz de usuario**

**6.1 Crear componentes de subida de archivos**

- Componente para seleccionar y subir video
- Componente para seleccionar y subir frame/imagen
- Vista previa de archivos seleccionados
- Validación del lado cliente
- _Requirements: 1.1, 1.2_

**6.2 Implementar interfaz de configuración de parámetros**

- Controles para tiempo de inicio y duración del overlay
- Vista previa del video con timeline
- Validación de parámetros en tiempo real
- _Requirements: 1.3, 1.4_

## 🛠 Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Backend**: Bun + Hono + TypeScript
- **Base de datos**: MongoDB
- **Almacenamiento**: AWS S3
- **Procesamiento**: FFmpeg + fluent-ffmpeg
- **Cola de trabajos**: Agenda.js
- **Validación**: Zod

## 🚀 Instalación y Desarrollo

```bash
# Instalar dependencias
bun install

# Desarrollo del backend
cd backend && bun run dev

# Desarrollo del frontend
cd frontend && npm run dev
```

## 📋 Requisitos del Sistema

- Node.js 18+
- Bun runtime
- FFmpeg instalado en el sistema
- MongoDB
- AWS S3 (para almacenamiento)

## 🎬 Funcionalidades Principales

1. **Subida de archivos**: Videos y frames/imágenes
2. **Configuración de overlay**: Tiempo de inicio y duración
3. **Procesamiento en cola**: Jobs asíncronos con seguimiento
4. **Descarga de resultados**: Videos procesados con overlay aplicado
5. **Historial de trabajos**: Seguimiento de trabajos por usuario

---

**Última actualización**: Implementación del servicio FFmpeg y procesador de trabajos Agenda.js completada.
