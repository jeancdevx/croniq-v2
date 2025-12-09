import path from 'path'

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View
} from '@react-pdf/renderer'

import type { PrestamoConCuotas } from '@/db/types'

// Rutas absolutas de imágenes
const LOGO_PATH = path.join(process.cwd(), 'assets', 'contapro-logo.png')
const SIGNATURE_PATH = path.join(process.cwd(), 'assets', 'signature.png')

// Estilos profesionales estilo BCP
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica'
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#000000'
  },
  logo: {
    width: 120,
    height: 30
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  headerSubtitle: {
    fontSize: 8,
    textAlign: 'right',
    marginTop: 2
  },
  // Info Section
  infoSection: {
    marginBottom: 15
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 8
  },
  infoColumn: {
    flex: 1
  },
  infoLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000'
  },
  // Table
  table: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#000000'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 4
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cccccc',
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  tableTotalsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1.5,
    borderTopColor: '#000000',
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 'bold'
  },
  // Columnas (ajustadas para alineación correcta)
  colDate: {
    width: '20%',
    fontSize: 8
  },
  colAmount: {
    width: '20%',
    fontSize: 8,
    textAlign: 'right'
  },
  colAmountBold: {
    width: '20%',
    fontSize: 8,
    textAlign: 'right',
    fontWeight: 'bold'
  },
  colLabel: {
    width: '20%',
    fontSize: 8,
    fontWeight: 'bold'
  },
  // Footer
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#cccccc'
  },
  footerText: {
    fontSize: 7,
    color: '#666666',
    marginBottom: 4,
    textAlign: 'justify',
    lineHeight: 1.4
  },
  signature: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  signatureBlock: {
    width: '45%',
    paddingTop: 5,
    textAlign: 'center',
    alignItems: 'center'
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000000',
    width: '100%',
    marginTop: 10
  },
  signatureLabel: {
    fontSize: 8,
    fontWeight: 'bold'
  },
  signatureName: {
    fontSize: 7,
    color: '#666666'
  },
  signatureImage: {
    width: 80,
    height: 40,
    marginBottom: 5
  }
})

interface BCPSchedulePDFProps {
  loan: PrestamoConCuotas
}

export function BCPSchedulePDF({ loan }: BCPSchedulePDFProps) {
  // Funciones de formato
  const formatCurrency = (amount: string | number, currency: string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency || 'PEN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    // Parsear fecha como UTC para evitar problemas de zona horaria
    // La fecha viene como '2025-12-08' y debe mostrarse como '08/12/2025'
    const [year, month, day] = dateString.split('-')
    return `${day}/${month}/${year}`
  }

  const formatDateTime = (dateString: string | Date) => {
    // Formato: DD/MM/YYYY HH:mm (24 horas)
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatPercent = (
    value: string | number,
    isDecimal: boolean = false
  ) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    // Si isDecimal es true, el valor ya está en formato decimal (0.18 = 0.18%)
    // Si es false, el valor es fracción (0.22 = 22%)
    const percentage = isDecimal ? num : num * 100
    return `${percentage.toFixed(2)}%`
  }

  // Calcular totales
  const totalCapital =
    loan.cuotas?.reduce((sum, c) => sum + parseFloat(c.capital), 0) || 0
  const totalInteres =
    loan.cuotas?.reduce((sum, c) => sum + parseFloat(c.interes), 0) || 0
  const totalSeguro =
    loan.cuotas?.reduce((sum, c) => sum + parseFloat(c.seguroDesgravamen), 0) ||
    0
  const totalGeneral =
    loan.cuotas?.reduce((sum, c) => sum + parseFloat(c.totalConSeguro), 0) || 0

  return (
    <Document>
      <Page size='A4' style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src={LOGO_PATH} style={styles.logo} />
          <View>
            <Text style={styles.headerTitle}>Cronograma de Pagos</Text>
            <Text style={styles.headerSubtitle}>
              Page 1 of {Math.ceil((loan.cuotas?.length || 0) / 30) || 1}
            </Text>
          </View>
        </View>

        {/* Información General - Primera Fila */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Solicitud No.</Text>
              <Text style={[styles.infoValue, { fontSize: 7 }]}>{loan.id}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Importe desembolsado S/</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(loan.montoDesembolsado, loan.monedaPrestamo)}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Cuotas por pagar</Text>
              <Text style={styles.infoValue}>{loan.numeroCuotas}</Text>
            </View>
          </View>

          {/* Segunda Fila */}
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Nombre cliente</Text>
              <Text style={styles.infoValue}>
                {loan.cliente
                  ? `${loan.cliente.apellidos}, ${loan.cliente.nombres} `
                  : '-'}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Cantidad total a pagar S/</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(loan.totalAPagar, loan.monedaPago)}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>
                Tasa compensatoria efectiva anual fija
              </Text>
              <Text style={styles.infoValue}>{formatPercent(loan.tea)}</Text>
            </View>
          </View>

          {/* Tercera Fila */}
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Producto</Text>
              <Text style={styles.infoValue}>CREDITO EFECTIVO</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>
                Monto total interés compensatorio S/
              </Text>
              <Text style={styles.infoValue}>
                {formatCurrency(totalInteres, loan.monedaPrestamo)}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Tasa Efectivo Anual</Text>
              <Text style={styles.infoValue}>{formatPercent(loan.tcea)}</Text>
            </View>
          </View>

          {/* Cuarta Fila */}
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>
                Fecha de Emisión del Cronograma
              </Text>
              <Text style={styles.infoValue}>
                {formatDateTime(loan.createdAt)}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Fecha Desembolso</Text>
              <Text style={styles.infoValue}>
                {formatDate(loan.fechaDesembolso)}
              </Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Periodicidad</Text>
              <Text style={styles.infoValue}>{loan.frecuencia}</Text>
            </View>
          </View>

          {/* Quinta Fila */}
          <View style={styles.infoGrid}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Tasa Seguro Bien/SPF</Text>
              <Text style={styles.infoValue}>
                {formatPercent(loan.tasaSeguroDesgravamen, true)}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabla de Cronograma */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Próximo{'\n'}Vencimiento</Text>
            <Text style={styles.colAmount}>Amortización</Text>
            <Text style={styles.colAmount}>Interés</Text>
            <Text style={styles.colAmount}>Seguro{'\n'}Desgravamen</Text>
            <Text style={styles.colAmount}>Cuota</Text>
          </View>

          {/* Rows - Mostrar solo primeras 30 cuotas en primera página */}
          {loan.cuotas?.slice(0, 30).map(cuota => (
            <View style={styles.tableRow} key={cuota.id}>
              <Text style={styles.colDate}>
                {formatDate(cuota.fechaVencimiento)}
              </Text>
              <Text style={styles.colAmount}>
                {parseFloat(cuota.capital).toFixed(2)}
              </Text>
              <Text style={styles.colAmount}>
                {parseFloat(cuota.interes).toFixed(2)}
              </Text>
              <Text style={styles.colAmount}>
                {parseFloat(cuota.seguroDesgravamen).toFixed(2)}
              </Text>
              <Text style={styles.colAmount}>
                {parseFloat(cuota.totalConSeguro).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Totals Row */}
          <View style={styles.tableTotalsRow}>
            <Text style={styles.colLabel}>TOTALES</Text>
            <Text style={styles.colAmountBold}>{totalCapital.toFixed(2)}</Text>
            <Text style={styles.colAmountBold}>{totalInteres.toFixed(2)}</Text>
            <Text style={styles.colAmountBold}>{totalSeguro.toFixed(2)}</Text>
            <Text style={styles.colAmountBold}>{totalGeneral.toFixed(2)}</Text>
          </View>
        </View>

        {/* Footer con Notas */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Este cronograma se elabora bajo el supuesto cumplimiento del pago de
            las cuotas en las fechas indicadas. Cualquier alteración en los
            pagos o en las condiciones del crédito, deja sin efecto este
            documento.
          </Text>
          <Text style={styles.footerText}>
            El presente cronograma ha sido calculado en base a 5 decimales y
            redondeado a 2; por tanto la sumatoria de los montos indicados en el
            detalle pueden presentar diferencias respecto a los totales
            mostrados.
          </Text>
          <Text style={styles.footerText}>
            Tasa SPF: se calcula sobre el monto desembolsado.
          </Text>
          <Text style={styles.footerText}>
            Tasa de interés compensatoria efectiva anual (TEA) expresada en un
            año de 360 días.
          </Text>
        </View>

        {/* Firma */}
        <View style={styles.signature}>
          <View style={styles.signatureBlock}>
            <Image src={SIGNATURE_PATH} style={styles.signatureImage} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Croniq</Text>
            <Text style={styles.signatureName}>Sistema de Gestión</Text>
          </View>
        </View>
      </Page>

      {/* Páginas adicionales si hay más de 30 cuotas */}
      {(loan.cuotas?.length || 0) > 30 && (
        <Page size='A4' style={styles.page}>
          <View style={styles.header}>
            <Image src={LOGO_PATH} style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>Cronograma de Pagos</Text>
              <Text style={styles.headerSubtitle}>
                Page 2 of {Math.ceil((loan.cuotas?.length || 0) / 30)}
              </Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDate}>Próximo{'\n'}Vencimiento</Text>
              <Text style={styles.colAmount}>Amortización</Text>
              <Text style={styles.colAmount}>Interés</Text>
              <Text style={styles.colAmount}>Seguro{'\n'}Desgravamen</Text>
              <Text style={styles.colAmount}>Cuota</Text>
            </View>

            {loan.cuotas?.slice(30).map(cuota => (
              <View style={styles.tableRow} key={cuota.id}>
                <Text style={styles.colDate}>
                  {formatDate(cuota.fechaVencimiento)}
                </Text>
                <Text style={styles.colAmount}>
                  {parseFloat(cuota.capital).toFixed(2)}
                </Text>
                <Text style={styles.colAmount}>
                  {parseFloat(cuota.interes).toFixed(2)}
                </Text>
                <Text style={styles.colAmount}>
                  {parseFloat(cuota.seguroDesgravamen).toFixed(2)}
                </Text>
                <Text style={styles.colAmount}>
                  {parseFloat(cuota.totalConSeguro).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.tableTotalsRow}>
              <Text style={styles.colLabel}>TOTALES</Text>
              <Text style={styles.colAmountBold}>
                {totalCapital.toFixed(2)}
              </Text>
              <Text style={styles.colAmountBold}>
                {totalInteres.toFixed(2)}
              </Text>
              <Text style={styles.colAmountBold}>{totalSeguro.toFixed(2)}</Text>
              <Text style={styles.colAmountBold}>
                {totalGeneral.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Este cronograma se elabora bajo el supuesto cumplimiento del pago
              de las cuotas en las fechas indicadas.
            </Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
