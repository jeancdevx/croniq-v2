import path from 'path'

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer'

import type { cliente, comprobante, comprobanteDetalle } from '@/db/schema'

import { formatCurrency, formatDateTime } from './format-helpers'
import { numberToWords } from './number-to-words'

// Rutas absolutas de imágenes
const LOGO_PATH = path.join(process.cwd(), 'public', 'banco-kernel.png')

// Estilos profesionales estilo SUNAT
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  headerLeft: {
    flex: 1
  },
  logo: {
    width: 100,
    height: 60,
    objectFit: 'contain',
    marginBottom: 10
  },
  empresaInfo: {
    fontSize: 8,
    lineHeight: 1.4
  },
  empresaNombre: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4
  },
  // Recuadro del comprobante (4cm x 8cm según SUNAT)
  comprobanteBox: {
    width: 226, // ~8cm
    height: 113, // ~4cm
    border: '2px solid #000',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ruc: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4
  },
  tipoComprobante: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  numeroComprobante: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold'
  },
  // Cliente
  clienteSection: {
    marginTop: 20,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4
  },
  clienteRow: {
    flexDirection: 'row',
    marginBottom: 3
  },
  clienteLabel: {
    width: 120,
    fontFamily: 'Helvetica-Bold'
  },
  clienteValue: {
    flex: 1
  },
  // Tabla de detalles
  table: {
    marginTop: 15,
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
    padding: 8,
    fontSize: 9
  },
  tableRowAlt: {
    backgroundColor: '#f9f9f9'
  },
  col1: { width: '10%' }, // N°
  col2: { width: '55%' }, // Descripción
  col3: { width: '35%', textAlign: 'right' }, // Importe
  // Totales
  totalesSection: {
    marginTop: 10,
    alignItems: 'flex-end'
  },
  totalRow: {
    flexDirection: 'row',
    width: 200,
    justifyContent: 'space-between',
    padding: 5
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold'
  },
  totalFinal: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#333',
    color: '#fff',
    padding: 8,
    marginTop: 5
  },
  // Monto en letras
  montoEnLetras: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    border: '1px solid #ddd'
  },
  montoEnLetrasText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#333'
  },
  // QR y footer
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  qrContainer: {
    alignItems: 'center'
  },
  qrCode: {
    width: 100,
    height: 100
  },
  footerInfo: {
    flex: 1,
    paddingLeft: 20,
    fontSize: 7,
    lineHeight: 1.5
  },
  leyenda: {
    marginTop: 10,
    fontSize: 8,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold'
  },
  hash: {
    marginTop: 5,
    fontSize: 6,
    textAlign: 'center',
    color: '#666'
  }
})

interface BoletaPDFProps {
  comprobante: typeof comprobante.$inferSelect
  detalles: Array<typeof comprobanteDetalle.$inferSelect>
  cliente: typeof cliente.$inferSelect
  qrImage: string // QR code como data URL (base64)
}

export function BoletaPDF({
  comprobante,
  detalles,
  cliente,
  qrImage
}: BoletaPDFProps) {
  const empresaRuc = process.env.EMPRESA_RUC || ''
  const empresaRazonSocial = process.env.EMPRESA_RAZON_SOCIAL || ''
  const empresaDireccion = process.env.EMPRESA_DIRECCION_FISCAL || ''
  const empresaTelefono = process.env.EMPRESA_TELEFONO || ''
  const empresaEmail = process.env.EMPRESA_EMAIL || ''

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {/* Izquierda: Logo y datos de empresa */}
          <View style={styles.headerLeft}>
            <Image src={LOGO_PATH} style={styles.logo} />
            <Text style={styles.empresaNombre}>{empresaRazonSocial}</Text>
            <View style={styles.empresaInfo}>
              <Text>RUC: {empresaRuc}</Text>
              <Text>{empresaDireccion}</Text>
              <Text>Tel: {empresaTelefono}</Text>
              <Text>Email: {empresaEmail}</Text>
            </View>
          </View>

          {/* Derecha: Recuadro del comprobante */}
          <View style={styles.comprobanteBox}>
            <Text style={styles.ruc}>RUC {empresaRuc}</Text>
            <Text style={styles.tipoComprobante}>
              {comprobante.tipoComprobante === 'BOLETA'
                ? 'BOLETA DE VENTA ELECTRÓNICA'
                : 'FACTURA ELECTRÓNICA'}
            </Text>
            <Text style={styles.numeroComprobante}>
              {comprobante.numeroCompleto}
            </Text>
          </View>
        </View>

        {/* Datos del cliente */}
        <View style={styles.clienteSection}>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>Cliente:</Text>
            <Text style={styles.clienteValue}>
              {cliente.nombres} {cliente.apellidos}
            </Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>DNI:</Text>
            <Text style={styles.clienteValue}>{cliente.dni}</Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>Dirección:</Text>
            <Text style={styles.clienteValue}>{cliente.direccion || '-'}</Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>Fecha de Emisión:</Text>
            <Text style={styles.clienteValue}>
              {formatDateTime(comprobante.fechaEmision)}
            </Text>
          </View>
          <View style={styles.clienteRow}>
            <Text style={styles.clienteLabel}>Forma de Pago:</Text>
            <Text style={styles.clienteValue}>CONTADO - Pago Online</Text>
          </View>
        </View>

        {/* Tabla de detalles */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>N°</Text>
            <Text style={styles.col2}>DESCRIPCIÓN</Text>
            <Text style={styles.col3}>IMPORTE</Text>
          </View>

          {/* Rows */}
          {detalles.map((detalle, index) => (
            <View
              key={detalle.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {}
              ]}
            >
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{detalle.descripcion}</Text>
              <Text style={styles.col3}>
                {formatCurrency(Number(detalle.montoPagado))}
              </Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalesSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(Number(comprobante.montoTotal))}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IGV (0%):</Text>
            <Text>S/ 0.00</Text>
          </View>
          <View style={[styles.totalRow, styles.totalFinal]}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalLabel}>
              {formatCurrency(Number(comprobante.montoTotal))}
            </Text>
          </View>
        </View>

        {/* Monto en letras */}
        <View style={styles.montoEnLetras}>
          <Text style={styles.montoEnLetrasText}>
            SON: {numberToWords(Number(comprobante.montoTotal), 'PEN')}
          </Text>
        </View>

        {/* Footer: QR + Info */}
        <View style={styles.footer}>
          <View style={styles.qrContainer}>
            <Image src={qrImage} style={styles.qrCode} />
          </View>

          <View style={styles.footerInfo}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>
              INFORMACIÓN IMPORTANTE:
            </Text>
            <Text>
              • Los servicios financieros están inafectos del IGV según Ley del
              IGV
            </Text>
            <Text>• Este comprobante es válido como sustento de pago</Text>
            <Text>• Consulte su comprobante en: {empresaEmail}</Text>
          </View>
        </View>

        {/* Leyenda */}
        <Text style={styles.leyenda}>
          Representación impresa de la{' '}
          {comprobante.tipoComprobante === 'BOLETA'
            ? 'Boleta de Venta Electrónica'
            : 'Factura Electrónica'}
        </Text>

        {/* Hash */}
        <Text style={styles.hash}>Hash: {comprobante.hash}</Text>
      </Page>
    </Document>
  )
}
