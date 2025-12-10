import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'

import { getDb } from '../db'
import { cajaSesion, movimientoCaja } from '../db/schema'

dotenv.config()

// ============================================
// CONFIGURACIÓN
// ============================================
const CAPITAL_INICIAL = 50000.0 // ← Cambiar según capital real
const FECHA_INICIO = '2025-01-01' // ← Fecha de inicio de operaciones

async function main() {
  console.log('🚀 Iniciando registro de capital inicial...\n')

  const db = getDb()
  if (!db) {
    console.error('❌ No hay conexión a la base de datos')
    process.exit(1)
  }

  try {
    // 1. Verificar si ya existe sesión #0 (capital inicial)
    const [existente] = await db
      .select()
      .from(cajaSesion)
      .where(eq(cajaSesion.numeroSesion, 0))
      .limit(1)

    if (existente) {
      console.error('❌ El capital inicial ya ha sido registrado')
      console.log(
        `   Sesión #0 existente con saldo: S/ ${existente.saldoInicial}`
      )
      console.log(`   Fecha: ${existente.fecha.toLocaleDateString()}`)
      process.exit(1)
    }

    // 2. Validar capital
    if (CAPITAL_INICIAL <= 0) {
      console.error('❌ El capital inicial debe ser mayor a 0')
      process.exit(1)
    }

    // 3. Crear sesión inicial (cerrada)
    console.log('📝 Creando sesión inicial...')
    const [sesion] = await db
      .insert(cajaSesion)
      .values({
        numeroSesion: 0,
        fecha: new Date(FECHA_INICIO),
        fechaApertura: new Date(FECHA_INICIO + ' 00:00:00'),
        saldoInicial: '0',
        fechaCierre: new Date(FECHA_INICIO + ' 00:01:00'),
        saldoFinalTeorico: CAPITAL_INICIAL.toString(),
        saldoFinalReal: CAPITAL_INICIAL.toString(),
        diferencia: '0',
        estado: 'CERRADA',
        observaciones: 'Capital inicial de la empresa'
      })
      .returning()

    console.log(`✅ Sesión #0 creada`)

    // 4. Crear movimiento de capital inicial
    console.log('📝 Registrando movimiento de capital...')
    await db.insert(movimientoCaja).values({
      cajaSesionId: sesion.id,
      tipo: 'INGRESO',
      categoria: 'CAPITAL_INICIAL',
      monto: CAPITAL_INICIAL.toString(),
      descripcion: 'Capital inicial para inicio de operaciones',
      fechaMovimiento: new Date(FECHA_INICIO + ' 00:00:00')
    })

    console.log(`✅ Movimiento registrado\n`)

    // 5. Resumen
    console.log('═══════════════════════════════════════')
    console.log('✅ CAPITAL INICIAL REGISTRADO')
    console.log('═══════════════════════════════════════')
    console.log(`💰 Monto:  S/ ${CAPITAL_INICIAL.toFixed(2)}`)
    console.log(`📅 Fecha:  ${FECHA_INICIO}`)
    console.log(`🎯 Estado: La próxima sesión iniciará con este saldo`)
    console.log('═══════════════════════════════════════\n')
  } catch (error) {
    console.error('❌ Error al registrar capital inicial:', error)
    process.exit(1)
  }
}

main()
