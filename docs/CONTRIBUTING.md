# Cómo colaborar

## Clonar y preparar el proyecto

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone git@github.com:jeancdevx/croniq-v2.git
   cd croniq-v2
   ```
2. Instala dependencias (pnpm recomendado):
   ```bash
   pnpm install
   ```
3. Crea tu archivo de variables de entorno a partir del `.env.example` (si
   aplica) y ejecuta el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

## Flujo de trabajo (GitFlow + Conventional Commits)

- Rama principal: `production`. Rama de integración: `develop`.
- Crea siempre ramas nuevas desde `develop` usando el prefijo adecuado:
  - `feat/<nombre>` para funcionalidades nuevas.
  - `fix/<nombre>` para correcciones.
  - `chore/<nombre>` para tareas de soporte (configs, tooling, etc.).
- Commits atómicos y descriptivos siguiendo
  [Conventional Commits](https://www.conventionalcommits.org/):
  - Ejemplos: `feat: agrega cronograma PDF`, `fix: corrige cálculo de mora`,
    `chore: configura lint en CI`.
- Abre un Pull Request hacia `develop` con:
  - **Título**: `feat: título de la PR` (o `fix:`, `chore:` según corresponda).
  - **Descripción**: resumen formal de los cambios y qué aporta la PR.
  - Incluye pasos de prueba o validación cuando aplique.

## Estructura de carpetas

Aprovechamos Next.js 16 con cache components y separación de SSR/CSR mediante
módulos de feature:

```
app/
  (auth)/(routes)/sign-in/page.tsx   # Routing y layouts (SSR/route groups)
modules/
  auth/
    ui/components/sign-in-form.tsx   # Componentes cliente aislados por feature
    server/sign-in.action.tsx        # Acciones/server utilities
  payments/
    ui/components/payment-form.tsx
    hooks/some-hook.hook.ts
    queries/some-query.ts
```

Principios:

- El directorio `app/` contiene las rutas y layouts; evita marcar páginas
  completas como `"use client"` si solo una parte requiere CSR.
- La lógica de cliente, hooks, queries y componentes específicos viven en
  `modules/<feature>/...` para mantener cohesión.
- Reutiliza componentes de UI en `components/` solo si son realmente compartidos
  entre múltiples features.

## Estilo y calidad

- Mantén la tipificación estricta en TypeScript y sigue el linting configurado.
- Prefiere pruebas unitarias/integra­ción donde sea viable; documenta cómo
  validar manualmente si no hay tests.
- Actualiza documentación relevante cuando cambies contratos o flujos (por
  ejemplo, README o notas en `modules/<feature>`).
