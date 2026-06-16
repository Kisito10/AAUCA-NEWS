# Aplicación Angular - Sistema de Gestión

## Estructura del Proyecto

```
angular-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login/           # Componente de inicio de sesión
│   │   │   ├── register/        # Componente de registro
│   │   │   ├── admin/           # Panel de administración (CRUD)
│   │   │   ├── residente/       # Panel del residente (solo lectura)
│   │   │   └── noticias/        # Vista pública de noticias
│   │   ├── guards/
│   │   │   ├── auth.guard.ts    # Protege rutas autenticadas
│   │   │   ├── admin.guard.ts   # Solo permite admins
│   │   │   └── residente.guard.ts # Solo permite residentes
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts # Añade token a peticiones
│   │   ├── models/
│   │   │   ├── user.model.ts    # Interfaces de usuario
│   │   │   └── noticia.model.ts # Interface de noticia
│   │   ├── services/
│   │   │   ├── auth.service.ts  # Autenticación y sesión
│   │   │   ├── user.service.ts  # CRUD usuarios
│   │   │   └── noticia.service.ts # CRUD noticias
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── environments/
│   │   └── environment.ts       # URLs de tu backend
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── angular.json
├── package.json
└── tsconfig.json
```

## Instalación

1. **Copia todos los archivos** a tu proyecto Angular existente o crea uno nuevo:
   ```bash
   ng new mi-aplicacion --standalone --routing --style=css
   ```

2. **Instala las dependencias:**
   ```bash
   cd mi-aplicacion
   npm install
   ```

3. **Configura las URLs de tu backend** en `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUserUrl: 'http://localhost:9090/api/user',
     apiNoticiaUrl: 'http://localhost:9092/api/noticia'
   };
   ```

4. **Ejecuta la aplicación:**
   ```bash
   ng serve
   ```

5. **Abre en el navegador:** `http://localhost:4200`

## Rutas de la Aplicación

| Ruta | Componente | Acceso |
|------|------------|--------|
| `/noticias` | NoticiasComponent | Público |
| `/login` | LoginComponent | Público |
| `/register` | RegisterComponent | Público |
| `/admin` | AdminComponent | Solo ADMIN |
| `/residente` | ResidenteComponent | Solo RESIDENTE |

## Endpoints del Backend Requeridos

### Usuarios (http://localhost:9090/api/user)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/login` | Login (email, password) → { token, user } |
| POST | `/register` | Registro (nombre, email, password, rol) |
| GET | `/` | Lista todos los usuarios |
| GET | `/:id` | Obtiene usuario por ID |
| POST | `/` | Crea usuario |
| PUT | `/:id` | Actualiza usuario |
| DELETE | `/:id` | Elimina usuario |

### Noticias (http://localhost:9092/api/noticia)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Lista todas las noticias |
| GET | `/:id` | Obtiene noticia por ID |
| POST | `/` | Crea noticia |
| PUT | `/:id` | Actualiza noticia |
| DELETE | `/:id` | Elimina noticia |

## Formato de Datos Esperados

### Usuario
```json
{
  "id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "123456",
  "rol": "ADMIN" // o "RESIDENTE"
}
```

### Noticia
```json
{
  "id": 1,
  "titulo": "Título de la noticia",
  "descripcion": "Contenido completo...",
  "fechaPublicacion": "2024-01-15",
  "imagen": "https://url-de-imagen.com/imagen.jpg"
}
```

### Respuesta de Login
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "nombre": "Juan",
    "email": "juan@ejemplo.com",
    "rol": "ADMIN"
  }
}
```

## Funcionalidades

### Admin
- Ver, crear, editar y eliminar usuarios
- Ver, crear, editar y eliminar noticias
- Gestión completa del sistema

### Residente
- Ver directorio de usuarios (solo lectura)
- Ver noticias publicadas
- Sin permisos de edición

### Autenticación
- Login con email y contraseña
- Registro con selección de rol
- Token JWT en localStorage
- Interceptor que añade token automáticamente
- Guards que protegen rutas por rol

## Personalización

Si tu backend usa diferentes nombres de campos, ajusta los modelos en:
- `src/app/models/user.model.ts`
- `src/app/models/noticia.model.ts`

Si tus endpoints tienen diferente estructura, ajusta los servicios en:
- `src/app/services/auth.service.ts`
- `src/app/services/user.service.ts`
- `src/app/services/noticia.service.ts`

## CORS

Asegúrate de que tu backend permita peticiones desde `http://localhost:4200`. Ejemplo para Spring Boot:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:4200")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```
