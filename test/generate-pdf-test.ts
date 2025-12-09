/**
 * ARCHIVO TEMPORAL PARA TESTING
 * Este archivo es solo para generar y previsualizar el PDF
 * ELIMINAR después de validar el formato
 */
import { renderToFile } from '@react-pdf/renderer'
import * as dotenv from 'dotenv'

import { BCPSchedulePDF } from '@/modules/loans/lib/pdf-bcp-format'
import { getLoanWithDetails } from '@/modules/loans/server/get-loan-with-details'

dotenv.config({ path: '.env' })

async function generateTestPDF() {
  try {
    console.log('🔄 Generando PDF de prueba...')

    // IMPORTANTE: Reemplazar con un ID de préstamo real de tu base de datos
    const TEST_LOAN_ID = '94e5ab47-dc5f-4d99-a12b-52357df7899e'

    if (TEST_LOAN_ID === 'REEMPLAZAR-CON-ID-REAL') {
      console.error('❌ ERROR: Debes configurar un ID de préstamo real')
      console.log('📝 Pasos:')
      console.log('1. Ir a la base de datos')
      console.log('2. Obtener el ID de un préstamo ACTIVO')
      console.log('3. Reemplazar TEST_LOAN_ID en este archivo')
      return
    }

    // 1. Obtener préstamo de prueba
    console.log(`📊 Obteniendo préstamo ${TEST_LOAN_ID}...`)
    const loan = await getLoanWithDetails(TEST_LOAN_ID)

    console.log('Loan', loan)
    if (!loan) {
      console.error('❌ Préstamo no encontrado')
      console.log('Verifica que el ID sea correcto y que el préstamo exista')
      return
    }

    console.log(
      `✅ Préstamo encontrado: ${loan.cliente?.nombres || 'Sin nombre'}`
    )
    console.log(`📋 Cuotas: ${loan.cuotas?.length || 0}`)

    // 2. Generar PDF
    console.log('📄 Generando PDF...')
    const pdfDocument = BCPSchedulePDF({ loan })

    // 3. Guardar en raíz del proyecto
    const outputPath = './cronograma_test.pdf'
    await renderToFile(pdfDocument, outputPath)

    console.log('✅ PDF generado exitosamente!')
    console.log(`📁 Ubicación: ${outputPath}`)
    console.log('')
    console.log('🔍 Para ver el PDF:')
    console.log('  macOS:  open cronograma_test.pdf')
    console.log('  Linux:  xdg-open cronograma_test.pdf')
    console.log('  Windows: start cronograma_test.pdf')
    console.log('')
    console.log(
      '⚠️  RECUERDA: Eliminar este archivo después de validar el formato'
    )
  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    if (error instanceof Error) {
      console.error('Detalles:', error.message)
      console.error('Stack:', error.stack)
    }
  }
}

// Ejecutar
generateTestPDF()
