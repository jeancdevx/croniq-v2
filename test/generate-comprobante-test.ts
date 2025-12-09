/**
 * Script de prueba para generar comprobante de pago
 * Este archivo genera un PDF localmente para validar el formato
 *
 * Uso:
 * 1. Configurar PAGO_FLOW_ID con un ID real de la BD
 * 2. Ejecutar: npx tsx test/generate-comprobante-test.ts
 * 3. El PDF se guardará en la raíz del proyecto
 */

import fs from 'fs'
import path from 'path'

import { renderToBuffer } from '@react-pdf/renderer'
import dotenv from 'dotenv'
import { eq } from 'drizzle-orm'

import { getDb } from '../db'
import { comprobante, comprobanteDetalle } from '../db/schema'
import { generateQRImage } from '../modules/comprobantes/lib/generate-qr-image'
import { BoletaPDF } from '../modules/comprobantes/lib/pdf-boleta'
import { generateComprobante } from '../modules/comprobantes/server/generate-comprobante'
import { getPagoFlowDetails } from '../modules/comprobantes/server/get-pago-flow-details'

// Cargar variables de entorno
dotenv.config()

// ============================================
// CONFIGURACIÓN
// ============================================
const PAGO_FLOW_ID = '8055e55e-40b2-4ef7-ad88-5c5e87038453' // ← Cambiar por un ID real de pago_flow

async function main() {
  console.log('🚀 Iniciando generación de comprobante de prueba...\n')

  try {
    // 1. Validar variables de entorno
    if (!process.env.EMPRESA_RUC) {
      throw new Error('EMPRESA_RUC no configurado en .env')
    }

    console.log('✅ Variables de entorno configuradas')
    console.log(`   RUC: ${process.env.EMPRESA_RUC}`)
    console.log(`   Razón Social: ${process.env.EMPRESA_RAZON_SOCIAL}\n`)

    // 2. Generar comprobante en BD
    console.log('📝 Generando comprobante en base de datos...')
    const result = await generateComprobante(PAGO_FLOW_ID)

    if (!result.success) {
      throw new Error(result.error || 'Error al generar comprobante')
    }

    console.log(
      `✅ Comprobante generado: ${result.comprobante?.numeroCompleto}\n`
    )

    // 3. Obtener datos completos para el PDF
    console.log('📊 Obteniendo datos para PDF...')
    const details = await getPagoFlowDetails(PAGO_FLOW_ID)

    const db = getDb()
    if (!db) throw new Error('No database connection')

    // Obtener detalles del comprobante
    const detalles = await db
      .select()
      .from(comprobanteDetalle)
      .where(eq(comprobanteDetalle.comprobanteId, result.comprobante!.id))
      .orderBy(comprobanteDetalle.orden)

    console.log(`✅ ${detalles.length} cuotas en el comprobante\n`)

    // 4. Generar QR image
    console.log('🔲 Generando código QR...')
    const qrImage = await generateQRImage(result.comprobante!.qrData)
    console.log('✅ QR generado\n')

    // 5. Generar PDF
    console.log('📄 Generando PDF...')
    const pdfDocument = BoletaPDF({
      comprobante: result.comprobante!,
      detalles,
      cliente: details.cliente,
      qrImage
    })

    const buffer = await renderToBuffer(pdfDocument)
    console.log(`✅ PDF generado (${buffer.length} bytes)\n`)

    // 6. Guardar PDF en raíz del proyecto
    const fileName = `comprobante_${result.comprobante?.numeroCompleto?.replace('/', '-')}.pdf`
    const filePath = path.join(process.cwd(), fileName)

    fs.writeFileSync(filePath, buffer)
    console.log(`💾 PDF guardado en: ${filePath}\n`)

    // 6. Mostrar resumen
    console.log('📋 RESUMEN DEL COMPROBANTE:')
    console.log('─'.repeat(50))
    console.log(`Tipo: ${result.comprobante?.tipoComprobante}`)
    console.log(`Número: ${result.comprobante?.numeroCompleto}`)
    console.log(
      `Cliente: ${details.cliente.nombres} ${details.cliente.apellidos}`
    )
    console.log(`DNI: ${details.cliente.dni}`)
    console.log(`Monto Total: S/ ${result.comprobante?.montoTotal}`)
    console.log(`Fecha: ${result.comprobante?.fechaEmision}`)
    console.log(`Hash: ${result.comprobante?.hash}`)
    console.log('─'.repeat(50))
    console.log('\nDETALLE DE CUOTAS:')
    detalles.forEach((det, i) => {
      console.log(`  ${i + 1}. ${det.descripcion} - S/ ${det.montoPagado}`)
    })
    console.log('─'.repeat(50))

    console.log('\n✅ ¡Comprobante generado exitosamente!')
    console.log(`\n📂 Abre el archivo: ${fileName}`)
  } catch (error) {
    console.error('\n❌ Error:', error)
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message)
      console.error('   Stack:', error.stack)
    }
    process.exit(1)
  }
}

main()
