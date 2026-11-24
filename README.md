# Centro de Alumnos · CPH CJA

Página en React (Vite) con portal administrador conectado a Supabase.

- Página pública: `/`
- Portal admin: `/#/admin`

## 1. Instalar

```bash
npm install
```

## 2. Crear el proyecto en Supabase

1. Entra a https://supabase.com, crea una cuenta y un proyecto nuevo (plan gratuito).
2. Abre **SQL Editor**, pega todo el contenido de `supabase/schema.sql` y presiona **Run**.
   Esto crea las tablas, las reglas de seguridad y el almacenamiento de imágenes.
3. Abre **Project Settings → API** y copia el *Project URL* y la clave *anon public*.
4. Copia `.env.example` como `.env` y pega esos dos valores.

## 3. Crear el primer administrador

1. En Supabase: **Authentication → Users → Add user → Create new user**. Crea tu cuenta inicial.
2. En **SQL Editor** ejecuta (cambia el correo por el de tu cuenta):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'tu-correo@ejemplo.cl'
on conflict (user_id) do nothing;
```

Solo las cuentas de `public.admins` pueden entrar al portal. Una vez desplegada la función `manage-admins`, podrás invitar y quitar administradores desde **Portal admin → Administradores**. Todos los administradores actuales pueden gestionar los demás; no se elimina la cuenta Auth al quitar permisos.

Recomendado: en **Authentication → Sign In / Providers**, desactiva "Allow new users to sign up". La Edge Function puede invitar cuentas nuevas aunque el registro público esté desactivado.

## 4. Probar

```bash
npm run dev
```

Entra a `http://localhost:5173/#/admin` e inicia sesión.

## 5. Publicar

```bash
npm run build
```

Sube la carpeta `dist` a Netlify, Vercel o Cloudflare Pages (o conecta el repositorio e indica las
variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en su panel). La página usa rutas con `#`,
así que no necesita configuración extra.

## 6. Administrar usuarios desde el panel

La gestión usa la tabla `public.admins` que ya forma parte de `schema.sql`.

1. Vuelve a ejecutar `supabase/schema.sql` en SQL Editor para crear también `notification_recipients` y sus políticas RLS. El script copia a `admins` los usuarios de `admin_users` si esa tabla se creó siguiendo una versión anterior de estas instrucciones.
2. En **Authentication → URL Configuration → Redirect URLs**, agrega la dirección de tu web con comodín, por ejemplo `http://localhost:5173/**` y `https://TU-DOMINIO/**`.
3. Configura y despliega la Edge Function:

```bash
npx supabase login
npx supabase link --project-ref TU-REF
npx supabase secrets set APP_URL="https://TU-DOMINIO/#/admin/establecer-clave"
npx supabase functions deploy manage-admins
```

Para desarrollo local, usa `APP_URL="http://localhost:5173/#/admin/establecer-clave"` y agrega `http://localhost:5173/**` a Redirect URLs. La función valida el JWT y comprueba que quien la llama ya esté en `public.admins`. La clave de servidor se mantiene en Supabase, nunca en el frontend.

Desde **Portal admin → Administradores** puedes agregar un correo, ver la lista y quitar permisos. Si el correo ya tiene una cuenta Auth, se le asignan permisos; si no, se envía una invitación y la persona configura su contraseña al abrir el enlace.

## 7. Aviso por correo cuando llega una sugerencia (opcional)

Requiere la CLI de Supabase y una cuenta de Resend en https://resend.com.

```bash
npx supabase secrets set RESEND_API_KEY=... \
  FROM_EMAIL=onboarding@resend.dev WEBHOOK_SECRET=un-texto-largo-secreto
npx supabase functions deploy notify-suggestion --no-verify-jwt
```

Luego, en Supabase: **Database → Webhooks → Create a new hook**
- Tabla: `suggestions`, evento: `Insert`
- Tipo: *Supabase Edge Functions* → `notify-suggestion`
- HTTP Headers: agrega `x-webhook-secret` con el mismo valor de `WEBHOOK_SECRET`.

Los destinatarios se administran desde **Portal admin → Destinatarios de notificaciones**. La función consulta los correos activos de `notification_recipients` y envía un mensaje individual a cada uno. Con el remitente de prueba de Resend (`onboarding@resend.dev`) solo se puede enviar al correo con el que creaste tu cuenta de Resend; para otros destinatarios debes verificar un dominio que controles.

## Dónde editar cosas

| Qué | Dónde |
|---|---|
| Textos, colores, logo, directiva, noticias, eventos, proyectos | Portal admin |
| Nombre del centro, menú, datos del colegio | `src/data.js` |
| Estilo de la página pública | `src/App.css` |
| Campos del portal | `src/admin/sections.js` |

Si no configuras Supabase, la página pública funciona igual con los textos de ejemplo de `src/data.js`.
#
