# Casino Roulette 🎰

Este proyecto es una aplicación web de ruleta de casino desarrollada con una arquitectura de microservicios y tecnologías modernas. Permite a los usuarios registrarse, iniciar sesión, apostar en la ruleta y ver resultados en tiempo real.

---

## Tecnologías principales

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Microservicios:**
  - Auth Microservice (autenticación y gestión de usuarios)
  - Management Microservice (lógica del juego y apuestas)
- **Comunicación:** gRPC y WebSockets
- **Base de datos:** PostgreSQL
- **Cache y sesiones:** Redis
- **Infraestructura:** Docker Compose
- **Documentación:** MkDocs

---

## Estructura del repositorio

<!-- Puedes agregar aquí un esquema de carpetas si lo deseas -->

---

## Características

- Registro y login de usuarios con autenticación JWT.
- Apuestas en tiempo real en la ruleta, con balance virtual.
- Actualización de resultados y balances vía WebSockets.
- Persistencia de datos en PostgreSQL.
- Gestión de sesiones y cache con Redis.
- Arquitectura desacoplada y escalable con Docker Compose.
- Documentación técnica accesible vía MkDocs.

---

## Instalación y ejecución rápida (Desarrollo)

1. **Clona el repositorio:**

   ```bash
   git clone <url-del-repositorio>
   cd roulette
   ```

2. **Configura los archivos `.env`:**
   Copia y edita los archivos `.env.example` en cada microservicio y el backend, por ejemplo:

   ```bash
   cp ./auth/.env.example ./auth/.env
   cp ./management/.env.example ./management/.env
   # ...otros servicios
   ```

3. **Construye y levanta los servicios con Docker Compose:**

   ```bash
   docker-compose up --build
   ```

4. **Accede a la aplicación:**
   - Frontend: [http://localhost:3210](http://localhost:3210)
   - Backend API: [http://localhost:3000](http://localhost:3000)

---

## Despliegue en Producción

El proyecto está preparado para ejecutarse detrás de un servidor Apache con un túnel de Cloudflared, accesible desde el dominio:

- **Dominio:** [https://roulette.decoupled.dev](https://roulette.decoupled.dev)

### Rutas de acceso en producción

- **Frontend:** [https://roulette.decoupled.dev/](https://roulette.decoupled.dev/)
- **Backend API:** [https://roulette.decoupled.dev/api](https://roulette.decoupled.dev/api)
- **WebSockets:** [https://roulette.decoupled.dev/socket.io](https://roulette.decoupled.dev/socket.io)
- **Documentación:** [https://roulette.decoupled.dev/docs](https://roulette.decoupled.dev/docs)

Todos los servicios están expuestos a través del puerto 80 (HTTP) y 443 (HTTPS) mediante Apache, que enruta las peticiones a los microservicios correspondientes según el path.

#### Notas de configuración

- El servidor Apache debe estar configurado como proxy inverso para enrutar correctamente `/api`, `/socket.io` y `/docs` a los servicios internos.
- Cloudflared se encarga de exponer el dominio de forma segura y sin necesidad de abrir puertos públicos.

---

## Uso

1. Regístrate y obtén un saldo virtual inicial{;)}.
2. Realiza apuestas en la ruleta y observa los resultados en tiempo real.
3. Consulta tu balance y el historial de apuestas.
4. ¡Compite con otros jugadores conectados!

---

## Comandos útiles

- **Ver logs de un servicio:**
  ```bash
  docker-compose logs <servicio>
  ```
- **Detener todos los servicios:**
  ```bash
  docker-compose down
  ```
- **Ver estado de los contenedores:**
  ```bash
  docker-compose ps
  ```

---

## Personalización y despliegue

- **Variables de entorno:**  
  Ajusta los archivos `.env` para cambiar credenciales, puertos o configuraciones de cada microservicio.

- **Puertos:**  
  Puedes modificar los puertos expuestos en `docker-compose.yml` para evitar conflictos o restringir acceso solo a localhost.

---

## Documentación

La documentación técnica está disponible en la carpeta `/docs` y puede ser servida con MkDocs:

```bash
mkdocs serve
```

O usando Docker Compose:

```bash
docker-compose up docs
```

- **En producción:** Accede a la documentación en [https://roulette.decoupled.dev/docs](https://roulette.decoupled.dev/docs)
