# Conexión del Frontend con PaceUp Backend

Este documento recoge todo lo que necesita saber el frontend para conectarse correctamente al backend de PaceUp.

## URLs y variables de entorno
- `API_BASE_URL`: URL base del backend. Por defecto: `http://localhost:3000` (ver `.env`).
- `API_VERSION`: versión de la API (por defecto `v1`).
- `SOCKET_URL`: normalmente la misma que `API_BASE_URL` (Socket.IO usa el mismo host/puerto).

Ejemplos de variables para proyectos comunes:
- Create React App: `REACT_APP_API_BASE_URL=http://localhost:3000`
- Vite: `VITE_API_BASE_URL=http://localhost:3000`

## Endpoints relevantes
Todos los endpoints están montados en `/api/{API_VERSION}`. Con la configuración por defecto la base será `http://localhost:3000/api/v1`.

- Salud: `GET /health` (200 OK)
- Auth:
  - `POST /api/v1/auth/register` → cuerpo: `{ email, password, name }` → devuelve `{ user, accessToken, refreshToken }`
  - `POST /api/v1/auth/login` → cuerpo: `{ email, password }` → devuelve `{ user, accessToken, refreshToken }`
  - `POST /api/v1/auth/refresh` → cuerpo: `{ refreshToken }` → devuelve `{ accessToken }`
  - `POST /api/v1/auth/logout` → requiere autenticación (stateless)

## Autenticación (JWT)
- El backend emite `accessToken` y `refreshToken` en el login/registro.
- Para peticiones protegidas enviar header: `Authorization: Bearer <accessToken>`.
- Si recibes `401 Token expired`, usar `POST /api/v1/auth/refresh` con el `refreshToken` para obtener un nuevo `accessToken`.
- Logout: borrar tokens en cliente; el backend es stateless por ahora.

## CORS
- El backend usa la variable `CORS_ORIGIN` (por defecto incluye `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`). Asegúrate de que la URL del frontend esté incluida en esa lista.

## Socket.IO
- Socket.IO se inicializa sobre el mismo servidor HTTP. Conectar desde el frontend usando la URL del backend.

Ejemplo con `socket.io-client`:

```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000', {
  path: '/',
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('conectado', socket.id);
});
```

Si necesitas enviar el token al conectar, puedes hacerlo en `auth` o en query params (nota: backend actual no valida token en sockets por defecto):

```javascript
const socket = io(API_BASE, {
  auth: { token: accessToken },
});
```

## Ejemplo de cliente (Axios)

```javascript
import axios from 'axios';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Interceptor para añadir token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

Login example:

```javascript
const response = await api.post('/auth/login', { email, password });
const { accessToken, refreshToken, user } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
```

## Actividades manuales y Garmin

### Crear una actividad manual
```javascript
const activity = {
  title: 'Morning run',
  description: 'Salida suave',
  activity_type: 'running',
  distance_m: 5000,
  duration_seconds: 1500,
  start_time: '2026-06-03T06:00:00Z',
  end_time: '2026-06-03T06:25:00Z',
  gps_data: [
    { latitude: 40.7128, longitude: -74.0060, timestamp: '2026-06-03T06:00:00Z' },
    { latitude: 40.7138, longitude: -74.0050, timestamp: '2026-06-03T06:10:00Z' },
    { latitude: 40.7148, longitude: -74.0040, timestamp: '2026-06-03T06:20:00Z' }
  ]
};

await api.post('/activities', activity);
```

### Importar actividades desde Garmin/reloj
```javascript
const payload = {
  activities: [
    {
      title: 'Garmin run',
      description: 'Sync desde reloj Garmin',
      activity_type: 'running',
      distance_m: 8000,
      duration_seconds: 2400,
      start_time: '2026-06-03T07:00:00Z',
      end_time: '2026-06-03T07:40:00Z',
      gps_data: [
        { latitude: 40.7128, longitude: -74.0060, timestamp: '2026-06-03T07:00:00Z' },
        { latitude: 40.7228, longitude: -74.0065, timestamp: '2026-06-03T07:20:00Z' },
        { latitude: 40.7328, longitude: -74.0070, timestamp: '2026-06-03T07:40:00Z' }
      ]
    }
  ]
};

await api.post('/activities/import', payload);
```

### Endpoints relevantes
- `POST /activities` → crear actividad manual.
- `POST /activities/import` → importar actividades desde Garmin/reloj.
- `POST /activities/sync` → alias para importar actividades.
- `GET /activities` → listar actividades públicas.
- `GET /activities/:id` → ver detalles de una actividad.
- `PUT /activities/:id` → actualizar actividad (requiere auth).
- `DELETE /activities/:id` → eliminar actividad (requiere auth).

Refresh token flow:

```javascript
const r = await api.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') });
localStorage.setItem('accessToken', r.data.accessToken);
```

## Manejo de errores comunes
- 401: revisar token expirado o formato del header. Implementar reintento con `refresh` antes de redirigir al login.
- 403: permisos insuficientes (roles en payload JWT).
- 429: límites por rate limiter (backend usa límites por IP y por rutas de auth).

## Integraciones y otros servicios
- Mapbox: el backend requiere `MAPBOX_TOKEN` para servicios de GPS; el frontend puede usar su propio token de Mapbox si muestra mapas.
- Cloudinary: subir imágenes puede requerir que el backend entregue firmas; consulta los endpoints de upload si están implementados.

## Resumen rápido (checklist)
- [ ] Configurar `API_BASE_URL` en env de frontend.
- [ ] Añadir la URL del frontend a `CORS_ORIGIN` en el backend `.env` si es necesario.
- [ ] Implementar almacenamiento seguro de `refreshToken` (ideal: httpOnly cookie; por ahora se guarda en client según implementación).
- [ ] Añadir interceptores para reintentar con `refresh` al recibir 401 por token expirado.
- [ ] Probar `GET /health` y `POST /api/v1/auth/login`.

---

Si quieres, puedo:

- Añadir un ejemplo concreto para React (CRA) o Vite + React.
- Implementar un interceptor Axios que maneje refresh automáticamente.
- Añadir instrucciones para usar `httpOnly` cookies en vez de `localStorage`.
