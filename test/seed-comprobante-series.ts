/**
 * Script para insertar series iniciales de comprobantes
 * Ejecutar una sola vez después de crear las tablas
 *
 * Uso: npx tsx test/seed-comprobante-series.ts
 */

import dotenv from 'dotenv'

import { getDb } from '../db'
import { comprobanteNumeracion } from '../db/schema'

dotenv.config()

async function main() {
  console.log('🌱 Insertando series iniciales de comprobantes...\n')

  const db = getDb()
  if (!db) {
    throw new Error('No database connection')
  }

  try {
    // Insertar series iniciales
    await db.insert(comprobanteNumeracion).values([
      {
        tipoComprobante: 'BOLETA',
        serie: 'B001',
        ultimoNumero: 0,
        puntoEmision: 'PRINCIPAL',
        activo: true
      },
      {
        tipoComprobante: 'FACTURA',
        serie: 'F001',
        ultimoNumero: 0,
        puntoEmision: 'PRINCIPAL',
        activo: true
      }
    ])

    console.log('✅ Series insertadas:')
    console.log('   - BOLETA: B001')
    console.log('   - FACTURA: F001')
    console.log('\n✅ ¡Listo! Ya puedes generar comprobantes.')
  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message)
    }
    process.exit(1)
  }
}

main()
