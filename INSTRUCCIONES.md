# ArchPortal — Cambios aplicados

Este paquete contiene todos los archivos modificados/nuevos del review.

## 📁 Estructura

```
app/
  page.js                     ← REEMPLAZAR (ahora es Server Component)
  layout.js                   ← MERGEAR (agrega metadata + Plausible Script)
  globals.css                 ← REEMPLAZAR (incluye todas las adiciones)
  sitemap.js                  ← NUEVO
  api/
    auth/
      login/route.js          ← REEMPLAZAR (fix bcrypt + rate limit + error masking)
      register/route.js       ← REEMPLAZAR (rollback atómico)
    stripe/
      checkout/route.js       ← REEMPLAZAR (fix CRÍTICO password en metadata)
      success/route.js        ← REEMPLAZAR / CREAR (lee pending_registrations)
components/
  landing/
    HomeClient.js             ← NUEVO (contenido del page.js anterior + mejoras)
    Nav.js                    ← REEMPLAZAR (acentos)
    LoginModal.js             ← REEMPLAZAR (distingue errores red/auth)
    RegisterModal.js          ← REEMPLAZAR (fix fail-open + i18n + min 10 chars)
lib/
  plans.js                    ← NUEVO (single source of truth)
public/
  robots.txt                  ← NUEVO
supabase/
  migration_pending_registrations.sql  ← NUEVO (correr en Supabase SQL Editor)
```

## 🚀 Pasos para aplicar

### 1. Instalar dependencia nueva

```bash
npm install bcryptjs
```

### 2. Reemplazar archivos

Copia cada archivo de este paquete a la ubicación correspondiente en tu proyecto.
Para `app/layout.js`: si ya tienes uno, MERGEA `metadata`, `viewport` y los `<Script>`
en lugar de reemplazar el archivo completo.

### 3. Crear/reemplazar archivos nuevos

Asegúrate de crear el directorio `lib/` y `supabase/` si no existen.

### 4. Correr migración en Supabase

Abre **Supabase Dashboard → SQL Editor → New query**.
Pega el contenido de `supabase/migration_pending_registrations.sql` y ejecuta.

Esto crea la tabla `pending_registrations` que reemplaza el anti-patrón de
guardar contraseñas en Stripe metadata.

### 5. Variables de entorno

Verifica que tienes en `.env.local` (y en Vercel):

```
STRIPE_SECRET_KEY=...
STRIPE_PRICE_BASICO=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_DESPACHO=price_...
NEXT_PUBLIC_APP_URL=https://archportal.net
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
RESEND_API_KEY=...        # opcional pero recomendado
MASTER_EMAIL=...
MASTER_PASS=...
```

### 6. Crear assets faltantes en /public

- `public/og-image.jpg` — 1200×630 px, para previews de WhatsApp/redes
- `public/luis.jpg` — foto profesional tuya para la sección "Por qué existe"
- `public/favicon.ico`, `public/apple-icon.png` — íconos de marca

Puedes generar el og-image rápido en Canva o Figma. La foto profesional puede
ser un placeholder gris mientras tomas una buena.

### 7. Plausible Analytics

Registra `archportal.net` en https://plausible.io (o el dominio que prefieras).
Si no quieres Plausible, comenta el `<Script>` correspondiente en `layout.js`.

### 8. Reiniciar dev server y probar

```bash
# Ctrl+C en la terminal donde corre el dev server
npm run dev
```

Prueba el flujo completo:
1. Landing carga sin errores
2. Cambiar idioma ES/EN
3. Click en "Empezar prueba gratis" → registro → Stripe
4. Pago de prueba (modo test) → vuelve a landing con banner
5. Cancelar pago → vuelve con banner naranja
6. Login con cuenta existente

### 9. Deploy

```bash
git add .
git commit -m "feat(landing): SEO + security fixes + plan diff + personal section"
git push origin main
```

## ⚠️ Cosas que dejé pendientes

1. **Cambio de email de contacto** (lo dejaste para el final).
   El landing y modales siguen mostrando `lcarq01@gmail.com`.

2. **Hash de `client_pass` en projects**.
   El `login/route.js` actualizado YA soporta tanto `client_pass_hash` (bcrypt)
   como el legacy plaintext. Para migrar:
   - Agrega columna: `ALTER TABLE projects ADD COLUMN client_pass_hash text;`
   - En tu `Admin.js`, cuando el arquitecto configure el password del cliente,
     hashealo con bcrypt antes de guardar.
   - Para clientes existentes, mejor mandar email de "establece tu password"
     que migrar plaintexts.

3. **Foto profesional** en sección "Por qué existe" — necesitas tomarte una.
   Mientras tanto el placeholder gris funciona.

4. **OG image** — necesita un diseño 1200×630 con tu logo + tagline.

5. **Onboarding de arquitecto** post-pago — el flujo actual hace que el usuario
   reciba un email para establecer su contraseña. Considera agregar un wizard
   "configura tu primer proyecto" después del primer login.

## 📊 Lo que ganaste con este push

**Seguridad:**
- ✅ Passwords ya NO viajan en plaintext por Stripe metadata
- ✅ Rate limit en checkout (antes solo en login/register)
- ✅ Validación correcta de cupones (antes fallaban silenciosamente)
- ✅ Error messages no leakean detalles internos
- ✅ Registro atómico con rollback de Supabase Auth si falla

**SEO:**
- ✅ Server-side rendering del landing
- ✅ Metadata, Open Graph, Twitter cards
- ✅ JSON-LD structured data
- ✅ Sitemap + robots.txt
- ✅ Alt text descriptivo en imágenes
- ✅ next/image para LCP mejorado
- ✅ iframe lazy-loaded

**Conversión:**
- ✅ CTA hero correcto ("Empezar prueba" en vez de "Entrar")
- ✅ Stats fake reemplazadas por pills informativos reales
- ✅ Sección "Por qué existe" con tu historia personal
- ✅ Planes diferenciados (Pro tiene features que Básico no)
- ✅ Mensaje de garantía visible en pricing
- ✅ Banner de pago cancelado (antes el usuario quedaba huérfano)
- ✅ Footer typo `.mx` → `.net`

**UX:**
- ✅ Acentos correctos en Nav (¿Qué es?, Cómo funciona, Área de cliente)
- ✅ Modal de registro pide confirmación antes de cerrar con datos llenos
- ✅ Errores de red distinguidos de errores de credenciales
- ✅ Password mínimo 10 caracteres (era 8)
- ✅ Translations consistentes en EN
- ✅ Focus visible para navegación de teclado
- ✅ `prefers-reduced-motion` para el ticker

**Código:**
- ✅ Single source of truth para planes (lib/plans.js)
- ✅ Lang toggle extraído a CSS classes
- ✅ Footer links accesibles (button con role correcto)
- ✅ EmailJS SDK cargado vía Next.js Script (no más polling de 5s)
