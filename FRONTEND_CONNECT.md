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

## Búsqueda

La API expone endpoints de búsqueda individuales por entidad. El frontend puede llamarlos por separado o agruparlos en un buscador global.

### Endpoints de búsqueda

| Entidad | Endpoint | Parámetros | Respuesta |
|---------|----------|-------------|-----------|
| Usuarios | `GET /users/search` | `q`, `limit` (default 20), `offset` (default 0) | `{ users: [...] }` |
| Clubes | `GET /clubs/search` | `q`, `limit`, `offset` | `{ clubs: [...] }` |
| Rutas | `GET /routes/search` | `q`, `city`, `difficulty` (easy/moderate/hard/extreme), `limit`, `offset` | `{ data: [...] }` |
| Desafíos | `GET /challenges/search` | `q`, `limit`, `offset` | `{ challenges: [...] }` |

**Ejemplo — buscador global**: el frontend puede llamar los 4 endpoints en paralelo con el mismo `q` y unificar resultados:

```javascript
const [usersRes, clubsRes, routesRes, challengesRes] = await Promise.all([
  api.get('/users/search', { params: { q: 'termino', limit: 5 } }),
  api.get('/clubs/search', { params: { q: 'termino', limit: 5 } }),
  api.get('/routes/search', { params: { q: 'termino', limit: 5 } }),
  api.get('/challenges/search', { params: { q: 'termino', limit: 5 } }),
]);

const results = {
  users: usersRes.data.users,
  clubs: clubsRes.data.clubs,
  routes: routesRes.data.data,
  challenges: challengesRes.data.challenges,
};
```

### Búsqueda de rutas con filtros

```javascript
// Buscar rutas por nombre/descripción, ciudad y dificultad
const res = await api.get('/routes/search', {
  params: { q: 'montaña', city: 'Bogotá', difficulty: 'hard' }
});
```

---

## Feed de actividades

El feed unifica actividades globales y de seguidos en un solo endpoint con el parámetro `?type=`.

### `GET /activities/feed?type=global&limit=20`
Actividades públicas de todos los usuarios. No requiere autenticación.

### `GET /activities/feed?type=following&limit=20`
Actividades de los usuarios que sigo. **Requiere autenticación** (header `Authorization: Bearer <token>`).

**Respuesta:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "title": "Morning run",
      "activity_type": "running",
      "distance_m": 5000,
      "duration_seconds": 1500,
      "start_time": "2026-06-03T06:00:00Z",
      "author": { "id": "uuid", "name": "Ana García", "username": "anarunner", "profile_picture_url": "..." },
      "likes_count": 5,
      "comments_count": 2,
      "is_liked": false
    }
  ]
}
```

**Ejemplo de uso:**
```javascript
// Feed global (no necesita token)
const globalFeed = await api.get('/activities/feed', { params: { type: 'global', limit: 20 } });

// Feed de seguidos (necesita token)
const followingFeed = await api.get('/activities/feed', { params: { type: 'following', limit: 20 } });
```

---

## Training Wizard (Premium)

Asistente interactivo para generar planes de entrenamiento personalizados mediante un cuestionario de 14 preguntas.

Todos los endpoints requieren `Authorization: Bearer <token>` y suscripción premium activa con feature `training_plans`.

### Flujo de uso

1. **Iniciar wizard** → `POST /training-wizard/start` → recibe `sessionId`
2. **Enviar respuestas** → `POST /training-wizard/answer` por cada pregunta
3. **Consultar progreso** → `GET /training-wizard/current` para saber qué pregunta sigue
4. **Finalizar wizard** → `POST /training-wizard/finish` cuando todas las respuestas están completas
5. **Generar plan** → `POST /training-wizard/generate-plan` → recibe el plan de entrenamiento generado

### `POST /training-wizard/start`

Inicia una nueva sesión del wizard. Cierra cualquier sesión previa pendiente.

**Respuesta:**
```json
{
  "sessionId": "uuid",
  "currentQuestion": {
    "id": "goal_distance",
    "order": 1,
    "question": "¿Cuál es tu objetivo?",
    "description": "Seleccioná la distancia que querés correr",
    "type": "single_choice",
    "options": [
      { "value": "5K", "label": "5K", "description": "Carrera de 5 kilómetros" },
      { "value": "10K", "label": "10K", "description": "Carrera de 10 kilómetros" },
      { "value": "21K", "label": "21K (Media Maratón)", "description": "Carrera de 21 kilómetros" },
      { "value": "42K", "label": "42K (Maratón)", "description": "Carrera de 42 kilómetros" },
      { "value": "5K_to_10K", "label": "Pasar de 5K a 10K", "description": "Progresar de 5K a 10 kilómetros" },
      { "value": "10K_to_21K", "label": "Pasar de 10K a 21K", "description": "Progresar de 10K a Media Maratón" },
      { "value": "general", "label": "Mejorar mi condición física", "description": "Correr regularmente sin un objetivo de distancia específico" }
    ],
    "required": true
  },
  "totalQuestions": 14,
  "answeredCount": 0
}
```

### `POST /training-wizard/answer`
Body: `{ sessionId, questionId, value }`

Envía la respuesta a una pregunta. `value` puede ser un string (single_choice), número (number_input), array (multi_choice) o booleano (boolean).

**Respuesta:**
```json
{
  "success": true,
  "nextQuestion": { ... },
  "answeredCount": 1,
  "totalQuestions": 14
}
```

### `GET /training-wizard/current?sessionId=uuid`
Obtiene la pregunta actual y las respuestas ya enviadas.

**Respuesta:**
```json
{
  "sessionId": "uuid",
  "status": "in_progress",
  "currentQuestion": { ... },
  "answeredCount": 3,
  "totalQuestions": 14,
  "answers": { "goal_distance": "10K", "experience_level": "beginner", "days_per_week": "3" }
}
```

### `POST /training-wizard/finish`
Body: `{ sessionId }`

Marca la sesión como completada. Solo funciona si todas las preguntas fueron respondidas.

**Respuesta:**
```json
{ "success": true, "sessionId": "uuid", "message": "Wizard completado. Ya podés generar tu plan." }
```

### `POST /training-wizard/generate-plan`
Body: `{ sessionId }`

Genera el plan de entrenamiento completo a partir de las respuestas. Incluye semanas objetivo, sesiones diarias, tipos de entrenamiento, ritmos sugeridos y progresión semanal.

**Respuesta:**
```json
{
  "plan": {
    "goal": "10K",
    "level": "beginner",
    "totalWeeks": 10,
    "weeklyGoal": "25 km",
    "targetDate": "2026-08-28",
    "startDate": "2026-06-19",
    "weeks": [
      {
        "week": 1,
        "focus": "Base aeróbica",
        "totalDistance": 15,
        "sessions": [
          {
            "day": "Lunes",
            "type": "easy",
            "description": "Rodaje suave",
            "distanceKm": 5,
            "durationMinutes": 30,
            "pace": { "min": "5:55", "max": "6:35", "description": "Ritmo conversacional, podés hablar mientras corres" },
            "notes": "Mantené un ritmo tranquilo. El objetivo es completar el tiempo, no la velocidad.",
            "tips": ["Empezá con 5 min de caminata", "Hidratate antes de salir"]
          },
          { "day": "Miércoles", "type": "tempo", ... },
          { "day": "Viernes", "type": "easy", ... },
          { "day": "Sábado", "type": "long_run", ... }
        ]
      }
    ],
    "explanations": {
      "goal": "Elegiste correr 10K. Para alguien que recién empieza, necesitás construir base aeróbica antes de trabajar velocidad.",
      "progression": "Las semanas 1-4 construyen volumen base. Semanas 5-7 introducen trabajo de ritmo. Semanas 8-9 añaden series. Semana 10 es de descarga antes de la carrera."
    }
  }
}
```

### Preguntas del wizard (orden completo)

| # | ID | Pregunta | Tipo | Opciones / Rango |
|---|----|----------|------|------------------|
| 1 | `goal_distance` | ¿Cuál es tu objetivo? | single_choice | 5K, 10K, 21K, 42K, 5K_to_10K, 10K_to_21K, general |
| 2 | `experience_level` | ¿Cuál es tu nivel de experiencia? | single_choice | beginner, intermediate, advanced |
| 3 | `days_per_week` | ¿Cuántos días por semana podés correr? | single_choice | 2, 3, 4, 5, 6 |
| 4 | `available_days` | ¿Qué días de la semana preferís entrenar? | multi_choice | Lunes a Domingo |
| 5 | `weekly_volume` | ¿Cuántos kilómetros semanales corrés actualmente? | number_input | 0-150 |
| 6 | `longest_run` | ¿Cuál es la distancia más larga que corriste en el último mes? | number_input | 0-100 |
| 7 | `intensity_preference` | ¿Qué tipo de entrenamiento preferís? | single_choice | easy_only, mixed, intensity_focused |
| 8 | `running_goal` | ¿Cuál es tu principal motivación? | single_choice | race, improve_times, general_fitness, weight_loss, stress_relief, social |
| 9 | `target_date` | ¿Tenés una fecha objetivo o carrera en mente? | single_choice | yes, no |
| 9b | `target_date_value` | ¿Cuál es la fecha? | date_input | YYYY-MM-DD (solo si target_date=yes) |
| 10 | `previous_injuries` | ¿Tenés alguna lesión o condición física actual? | boolean | sí/no |
| 11 | `injury_details` | Describí la lesión o condición | text_input | (solo si previous_injuries=true) |
| 12 | `run_location` | ¿Dónde solés correr normalmente? | single_choice | street, trail, track, treadmill, mixed |
| 13 | `equipment` | ¿Usás algún equipo o accesorio? | multi_choice | gps_watch, heart_rate_monitor, none |
| 14 | `pace_target` | ¿Tenés un ritmo objetivo en mente? | single_choice | minutes_per_km, finish_without_time, not_sure |

---

## Resumen rápido (checklist)
- [ ] Configurar `API_BASE_URL` en env de frontend.
- [ ] Añadir la URL del frontend a `CORS_ORIGIN` en el backend `.env` si es necesario.
- [ ] Implementar almacenamiento seguro de `refreshToken` (ideal: httpOnly cookie; por ahora se guarda en client según implementación).
- [ ] Añadir interceptores para reintentar con `refresh` al recibir 401 por token expirado.
- [ ] Probar `GET /health` y `POST /api/v1/auth/login`.
- [ ] Para el buscador: llamar los 4 endpoints de búsqueda en paralelo.
- [ ] Para el feed: usar `GET /activities/feed?type=global|following`.
- [ ] Para Training Wizard: seguir el flujo start → answer (×14) → finish → generate-plan, con tokens premium.

---

Si quieres, puedo:

- Añadir un ejemplo concreto para React (CRA) o Vite + React.
- Implementar un interceptor Axios que maneje refresh automáticamente.
- Añadir instrucciones para usar `httpOnly` cookies en vez de `localStorage`.
