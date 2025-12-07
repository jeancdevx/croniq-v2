# Sistema de registro de préstamos y pagos

Aplicación web para digitalizar la gestión de préstamos de un negocio. El
objetivo es eliminar errores manuales al identificar clientes y registrar cada
operación, además de generar un cronograma de pagos claro para el negocio y para
el cliente.

## Problema planteado

Un negocio de préstamos llevaba el control de forma manual, lo que generaba
fallos al identificar clientes y al registrar la información de cada préstamo.
Se requiere:

- Registrar préstamos con datos completos: cliente, fecha, monto, interés y
  plazo.
- Generar un cronograma de pagos para el cliente y para el negocio.
- Registrar pagos y aplicar mora del 1% mensual sobre la deuda.
- Emitir comprobantes de pago al cliente.
- Permitir el cuadre de caja para validar ingresos y pagos.

## Enfoque propuesto

- **Identificación confiable de clientes:** flujo de autenticación y validación
  de identidad en rutas dedicadas (`app/(auth)/(routes)/`).
- **Registro de préstamos y pagos:** formularios guiados con validaciones,
  almacenamiento transaccional y trazabilidad de cada operación.
- **Cronograma de pagos automático:** cálculo de cuotas, fechas y mora mensual
  del 1% para mantener actualizado el estado de deuda.
- **Comprobantes y notificaciones:** generación de recibos descargables o
  enviables por correo/SMS tras cada pago.
- **Cuadre de caja:** reportes diarios/mensuales para comparar pagos registrados
  vs. ingresos proyectados.
- **Arquitectura modular:** páginas en `app/` optimizadas para SSR/ISR y lógica
  de features en `modules/` para reutilizar componentes UI, acciones de servidor
  y hooks.

## Estructura base

- **Páginas (Next.js 16 con cache components):** `app/` usa route groups para
  separar contextos (por ejemplo, `app/(auth)/(routes)/sign-in/page.tsx`).
- **Módulos de features:** lógica de cliente y servidor organizada por dominio:
  `modules/<feature>/ui`, `modules/<feature>/server`,
  `modules/<feature>/queries`, `modules/<feature>/hooks`.

## Estado del proyecto

El repositorio arranca con la configuración de Next.js 16, React 19.2, Tailwind
CSS v4 y shadcn/ui. Los detalles de colaboración y del stack técnico completo se
documentan en los archivos `CONTRIBUTING.md` y `TECH_STACK.md`.
