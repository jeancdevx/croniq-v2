# Stack tecnológico propuesto

## Frontend

- **Next.js 16 (App Router, cache components):** combinación de SSR, ISR y
  componentes cliente para formularios interactivos.
- **React 19.2:** compatibilidad con Server Components y hooks modernos.
- **Tailwind CSS v4 + shadcn/ui:** diseño consistente, componentes accesibles y
  personalizables.
- **TanStack Query (React Query):** manejo de caché de datos y estados de
  sincronización para préstamos y pagos.
- **Zustand o Context Server/Client segmentado:** estado ligero para UI y
  filtros en cliente.
- **Zod + react-hook-form:** validación fuerte de formularios de préstamos y
  pagos.

## Backend y datos

- **Base de datos:** PostgreSQL para consistencia y soporte de transacciones.
- **ORM:** Prisma con migraciones y tipos generados para usar en Server Actions
  y API Routes.
- **Autenticación:** NextAuth.js (Auth.js) con adaptador Prisma y soporte
  OAuth/credenciales según el negocio.
- **Cache/ISR:** cache de fetch nativa de Next.js y revalidación selectiva para
  reportes y cronogramas.
- **Colas de tareas:** BullMQ/Upstash QStash para envíos asíncronos de
  comprobantes y recordatorios de pago.

## Notificaciones y comprobantes

- **Email:** Resend o SendGrid para enviar comprobantes y cronogramas al
  cliente.
- **SMS/WhatsApp (opcional):** Twilio para alertas de vencimiento y
  confirmaciones de pago.
- **Documentos:** generación de comprobantes en PDF con `@react-pdf/renderer` o
  `pdfkit`; almacenamiento temporal en S3/Cloudflare R2.

## Observabilidad y seguridad

- **Logs y monitoreo:** Logtail/Datadog o OpenTelemetry con un exporter
  soportado por Vercel/host elegido.
- **Feature flags y configuración:** ConfigCat/LaunchDarkly o toggles en base de
  datos para habilitar nuevas funciones.
- **Rate limiting:** Middleware con `@upstash/ratelimit` o similar para proteger
  endpoints sensibles.

## Calidad y automatización

- **Linting/format:** ESLint + Prettier.
- **Tests:** Vitest/Testing Library para unidad e integración de componentes;
  Playwright para flujos críticos.
- **Commits y CI:** commitlint + husky para Conventional Commits; pipeline que
  ejecute lint, type-check y tests antes de mergear.

## Despliegue

- **Hosting:** Vercel para frontend/SSR. Workers serverless o un container en
  Railway/Fly.io si se requiere control de red para colas.
- **Base de datos gestionada:** Neon, Supabase o RDS PostgreSQL según el
  entorno.
