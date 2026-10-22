# PromptVault

Aplicacion web colaborativa para guardar, organizar, versionar y compartir prompts de inteligencia artificial. Proyecto del laboratorio de Tecnologias en Internet.

## Funcionalidades

- Registro, inicio y cierre de sesion; contrasenas con bcrypt y JWT en cookie `HttpOnly`.
- Prompts publicos y privados, filtrado por categoria y busqueda.
- Creacion, edicion, eliminacion y consulta de prompts; el contenido anterior se conserva al editar.
- Votos de la comunidad: un usuario puede votar o retirar su voto; el autor no puede votar por su propio prompt.
- Interfaz React adaptable con Tailwind CSS.

## Requisitos

- Node.js 20 o superior y npm.
- MongoDB local o una instancia de MongoDB Atlas accesible.

## Instalacion y ejecucion

1. En la raiz del proyecto instala todas las dependencias:

   ```powershell
   npm install
   ```

2. Copia `server/.env.example` a `server/.env`. En PowerShell:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

3. Edita `server/.env`:
   - `MONGO_URI`: URI de MongoDB local (`mongodb://127.0.0.1:27017/promptvault`) o la URI de tu cluster Atlas.
   - `JWT_SECRET`: reemplazalo por una cadena aleatoria privada de al menos 32 caracteres.
   - `CLIENT_ORIGIN`: conserva `http://localhost:5173` para desarrollo local.
   - No compartas ni publiques el archivo `.env`.

4. Inicia MongoDB si trabajas localmente. En Atlas, permite la conexion desde tu red y usa el usuario y URI de base de datos correspondientes.

5. Desde la raiz inicia el frontend y el backend:

   ```powershell
   npm run dev
   ```

6. Abre `http://localhost:5173`. La API se ejecuta en `http://localhost:4000`; puedes comprobar su estado en `http://localhost:4000/api/health`.

Para generar la version de produccion del cliente: `npm run build`.

## Flujo de demostracion

1. Registra una cuenta desde **Crear cuenta**.
2. Publica un prompt de prueba con titulo, contenido, categoria y visibilidad publica.
3. Edita el prompt; modifica el contenido y confirma que aumenta su numero de version.
4. Crea un segundo prompt con visibilidad privada y comprueba que aparece en **Mis prompts** al iniciar sesion.
5. Abre una ventana privada del navegador o cierra sesion: los prompts privados no deben aparecer.
6. Registra una segunda cuenta y emite un voto sobre el prompt publico. Verifica que cambia el contador y que el voto se puede retirar.
7. Comprueba que el autor no puede votarse a si mismo.

## Rutas principales de la API

| Metodo | Ruta | Acceso | Funcion |
|---|---|---|---|
| GET | `/api/health` | Publico | Verifica que el servidor esta activo |
| POST | `/api/auth/register` | Publico | Registra una cuenta |
| POST | `/api/auth/login` | Publico | Inicia sesion |
| POST | `/api/auth/logout` | Publico | Cierra sesion |
| GET | `/api/auth/me` | Sesion | Consulta la cuenta activa |
| GET | `/api/prompts` | Publico/sesion | Lista prompts publicos y, en sesion, los propios |
| POST | `/api/prompts` | Sesion | Crea un prompt |
| PUT | `/api/prompts/:id` | Propietario | Edita un prompt y conserva la version anterior |
| DELETE | `/api/prompts/:id` | Propietario | Elimina un prompt propio |
| POST | `/api/prompts/:id/vote` | Sesion | Alterna el voto en un prompt publico |

## Capturas para el informe

El informe `Informe_Laboratorio_PromptVault.docx` ya incluye cuatro capturas reales del cliente: portada, formulario de inicio de sesion, registro y seccion de funcionamiento. En la captura principal la biblioteca esta vacia porque la API y MongoDB no estaban conectados; la tarjeta ilustrativa de la portada no representa un registro persistido.

Completa las capturas 05-08 del informe despues de conectar MongoDB y realizar la demostracion con dos cuentas: aislamiento de prompts privados, historial de versiones, votos y persistencia en Compass/Atlas. Guarda las imagenes en `evidencias/`. No incluyas contrasenas, cadenas de conexion, tokens ni datos personales.
