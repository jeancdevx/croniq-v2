document.addEventListener('DOMContentLoaded', () => {
  // 1. Configuración de la Fecha (Solo Hoy)
  const fechaInput = document.getElementById('fecha')

  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getFormattedDateTime = () => {
    const now = new Date()
    const fecha = now.toLocaleDateString('es-PE')
    const hora = now.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${fecha} ${hora}`
  }

  const todayString = getTodayDate()
  fechaInput.min = todayString
  fechaInput.max = todayString
  fechaInput.value = todayString

  // Referencias al formulario y tabla
  const formPrestamo = document.getElementById('form-prestamo')
  const tablaBody = document.querySelector('#tabla-prestamos tbody')
  const nombreInput = document.getElementById('nombre')
  const apellidoInput = document.getElementById('apellido')

  // Array para almacenar préstamos
  let prestamos = []

  // Cargar préstamos guardados del localStorage
  const cargarPrestamosGuardados = () => {
    const prestamosGuardados = localStorage.getItem('prestamos')
    if (prestamosGuardados) {
      prestamos = JSON.parse(prestamosGuardados)
      prestamos.forEach(prestamo => agregarFilaATabla(prestamo))
    }
  }

  // Guardar préstamos en localStorage
  const guardarPrestamos = () => {
    localStorage.setItem('prestamos', JSON.stringify(prestamos))
  }

  // 2. Manejo del Formulario
  formPrestamo.addEventListener('submit', function (event) {
    event.preventDefault()

    // Capturar y validar los valores
    const nombre = nombreInput.value.trim()
    const apellido = apellidoInput.value.trim()
    const dni = document.getElementById('dni').value.trim()
    const monto = parseFloat(document.getElementById('monto').value)
    const tasaAnualPorcentaje = parseFloat(
      document.getElementById('tasaAnual').value
    )
    const plazo = parseInt(document.getElementById('plazo').value) // PLAZO = CANTIDAD DE CUOTAS (n)
    const esPepChecked = document.getElementById('esPep').checked

    if (dni.length !== 8 || isNaN(dni)) {
      alert('El DNI debe ser un número de 8 dígitos.')
      return
    }

    const nombreCompleto = `${nombre} ${apellido}`
    const estadoPep = esPepChecked ? 'Sí' : 'No'

    // Parámetros financieros
    const TAF_decimal = tasaAnualPorcentaje / 100 // Tasa Anual Fija en decimal
    const n = plazo // Número de períodos (cuotas)
    const P = monto // Principal

    // 3. CÁLCULO DE LA TASA MENSUAL (TEM)
    // TEM = (1 + TAF_decimal)^(1/12) - 1
    const i = Math.pow(1 + TAF_decimal, 1 / 12) - 1 // Tasa mensual efectiva (i)

    // 4. CÁLCULO DE CUOTA MENSUAL FIJA (Sistema Francés) y TOTALES
    let cuotaMensual = 0
    let totalPagar = 0

    if (i > 0 && n > 0 && P > 0) {
      // FÓRMULA DE CUOTA FIJA: C = P * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]
      const factor = Math.pow(1 + i, n)
      cuotaMensual = P * ((i * factor) / (factor - 1))

      totalPagar = cuotaMensual * n
    } else if (i === 0 && P > 0 && n > 0) {
      // Interés 0% (Cuota simple)
      cuotaMensual = P / n
      totalPagar = P
    } else {
      alert(
        'Asegúrese de que los datos financieros (monto, tasa y plazo) sean válidos.'
      )
      return
    }

    // 5. CÁLCULO DE LA TCEA (Tasa de Costo Efectiva Anual)
    // La TCEA se calcula usando la fórmula: TCEA = [(Total a Pagar / Monto Prestado)^(12/n) - 1]
    // Esta fórmula considera el costo total del préstamo anualizado
    let tcea = 0

    if (n > 0 && P > 0 && totalPagar > P) {
      // Fórmula simplificada de TCEA basada en el costo total
      tcea = Math.pow(totalPagar / P, 12 / n) - 1
    } else if (totalPagar === P) {
      // Si no hay interés, TCEA es 0
      tcea = 0
    }

    // 6. Crear el objeto de préstamo
    // Calcular mora mensual: 1% del monto del préstamo
    const moraMensual = P * 0.01

    const nuevoPrestamo = {
      fechaRegistro: getFormattedDateTime(),
      nombreCompleto: nombreCompleto,
      dni: dni,
      esPep: estadoPep,
      monto: monto.toFixed(2),
      plazo: n,
      cuotaMensual: cuotaMensual.toFixed(2),
      moraMensual: moraMensual.toFixed(2),
      totalPagar: totalPagar.toFixed(2),
      tcea: (tcea * 100).toFixed(2) + '%'
    }

    // 7. Agregar el préstamo al array y guardar
    prestamos.push(nuevoPrestamo)
    guardarPrestamos()

    // 8. Agregar el préstamo a la tabla
    agregarFilaATabla(nuevoPrestamo)

    // 9. Limpiar el formulario y reenfocar
    formPrestamo.reset()
    document.getElementById('dni').focus()
    fechaInput.value = todayString
  })

  /**
   * Función para agregar una nueva fila a la tabla.
   */
  function agregarFilaATabla(prestamo) {
    const fila = tablaBody.insertRow()

    fila.insertCell().textContent = prestamo.fechaRegistro
    fila.insertCell().textContent = prestamo.nombreCompleto
    fila.insertCell().textContent = prestamo.dni
    fila.insertCell().textContent = prestamo.esPep
    fila.insertCell().textContent = `S/. ${prestamo.monto}`
    fila.insertCell().textContent = prestamo.plazo
    fila.insertCell().textContent = `S/. ${prestamo.cuotaMensual}`
    fila.insertCell().textContent = `S/. ${prestamo.moraMensual}`
    fila.insertCell().textContent = `S/. ${prestamo.totalPagar}`
    fila.insertCell().textContent = prestamo.tcea
  }

  /**
   * Función para exportar préstamos a CSV
   */
  function exportarACSV() {
    if (prestamos.length === 0) {
      alert('No hay préstamos para exportar.')
      return
    }

    const headers = [
      'Fecha Registro',
      'Nombre',
      'DNI',
      'PEP',
      'Monto (S/.)',
      'Plazo (Meses)',
      'Cuota Fija (S/.)',
      'Mora Mensual (1%)',
      'Total a Pagar (S/.)',
      'TCEA'
    ]
    const rows = prestamos.map(p => [
      p.fechaRegistro,
      p.nombreCompleto,
      p.dni,
      p.esPep,
      p.monto,
      p.plazo,
      p.cuotaMensual,
      p.moraMensual,
      p.totalPagar,
      p.tcea
    ])

    let csvContent = headers.join(',') + '\n'
    rows.forEach(row => {
      csvContent += row.join(',') + '\n'
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `prestamos_${new Date().getTime()}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Función para limpiar el historial
   */
  function limpiarHistorial() {
    if (prestamos.length === 0) {
      alert('No hay préstamos para limpiar.')
      return
    }

    if (
      confirm(
        '¿Estás seguro de que deseas eliminar todos los préstamos registrados?'
      )
    ) {
      prestamos = []
      guardarPrestamos()
      tablaBody.innerHTML = ''
      alert('Historial limpiado exitosamente.')
    }
  }

  // Event listeners para los botones
  document
    .getElementById('btn-exportar')
    .addEventListener('click', exportarACSV)
  document
    .getElementById('btn-limpiar')
    .addEventListener('click', limpiarHistorial)

  // Cargar préstamos guardados al iniciar
  cargarPrestamosGuardados()
})
