# Centro de Alumnos · CPH CJA

Página en React (Vite) con portal administrador conectado a Supabase.

- Página pública: `/`
- Portal admin: `/#/admin`

## 1. Instalar

```bash
npm install
```

## 2. Crear el proyecto en Supabase (configuración inicial)

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta el contenido de `supabase/schema.sql`.
3. En **Project Settings → API**, copia el Project URL y la clave anon public.
4. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el entorno de despliegue.

## 3. Crear el primer administrador

Crea tu cuenta inicial en **Authentication → Users** y agrega su ID a `public.admins` mediante SQL. Después de eso, todos los administradores podrán agregar o quitar administradores desde el panel.

## 4. Probar y publicar

```bash
npm install
npm run dev
npm run build
```

Publica la carpeta `dist` en tu hosting habitual.

## 5. Administración diaria (desde la página)

Los administradores pueden hacer todo lo habitual desde **Portal admin**:
- Editar noticias, eventos, proyectos, directiva, textos, colores e imágenes.
- Leer y gestionar los mensajes enviados por los usuarios.
- Agregar y quitar administradores.
- Elegir sus propias preferencias de notificaciones.

Todos los administradores tienen los mismos permisos. No necesitan entrar a Supabase ni al hosting para estas tareas.

## 6. Notificaciones por correo

Las notificaciones de nuevos mensajes del buzón se envían automáticamente a todos los administradores. Cada persona puede configurar en **Portal admin → Mis notificaciones** si quiere:
- Recibir todos los tipos.
- Recibir solo algunos tipos (Sugerencia, Reclamo, Propuesta o Consulta).
- Silenciar todos los correos.

Las preferencias son individuales y no afectan a los demás. Los administradores nuevos reciben todos los tipos por defecto.

La configuración técnica inicial requiere Resend y una Edge Function:
```bash
npx supabase secrets set RESEND_API_KEY=... FROM_EMAIL=... WEBHOOK_SECRET=...
npx supabase functions deploy notify-suggestion --no-verify-jwt
```
Después, crea en **Database → Webhooks** un webhook para la tabla `suggestions`, evento `INSERT`, que invoque `notify-suggestion` y envíe el header `x-webhook-secret` con el mismo valor de `WEBHOOK_SECRET`. Esta configuración la hace una sola vez quien mantiene técnicamente el sitio; los administradores normales no deben tocarla.

Con el remitente de prueba de Resend (`onboarding@resend.dev`) solo se puede enviar al correo de la cuenta de Resend. Para enviar a todos los administradores, verifica un dominio que controles y configura `FROM_EMAIL` con ese remitente.

## Dónde editar cosas

| Qué | Dónde |
|---|---|
| Textos, colores, logo, directiva, noticias, eventos, proyectos | Portal admin |
| Nombre del centro, menú, datos del colegio | `src/data.js` |
| Estilo de la página pública | `src/App.css` |
