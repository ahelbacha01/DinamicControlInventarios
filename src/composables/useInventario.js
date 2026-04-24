import { ref, computed } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import logoDinamic from '../../logodinamicbase64.txt?raw'

export function useInventario() {
  // --- 1. ESTADOS CORE ---
  const datosInventario = ref([])
  const datosPie = ref([])
  const datosColectado = ref([])
  const resumenInventario = ref({})
  const listaDepartamentos = ref([])
  const cargando = ref(false)
  const error = ref(null)
  const listaInventarios = ref([])
  const inventarioSeleccionado = ref(null)
  
  // --- 2. ESTADOS DE FILTRO Y UI ---
  const busqueda = ref('')
  const filtros = ref({
    departamento: '',
    montoMin: null,
    montoMax: null
  })
  const columnasOcultas = ref(['id', 'ID', 'ID_device', 'tipoReporte', 'grupo', 'sucursalid'])
  
  const reporteActivoId = ref('')
  const vistaActual = ref('dashboard')

  // --- UI States ---
  const menuReportesAbierto = ref(false)
  const opcionesReporte = ref([
    { id: 'variacion', nombre: 'Variación Detallada', icon: '📈' },
    { id: 'detallado', nombre: 'Variación por Grupo', icon: '🧾' },
    { id: 'depositosalon', nombre: 'Depósito y Salón', icon: '🏬' },
    { id: 'solodeposito', nombre: 'Solo Depósito', icon: '🏭' },
    { id: 'solosalon', nombre: 'Solo Salón', icon: '🏪' },
    { id: 'noimplantado', nombre: 'No Implantados', icon: '🚫' },
    { id: 'inactivas', nombre: 'Referencias Inactivas', icon: '⛔' },
    { id: 'sinprecio', nombre: 'Sin Precio', icon: '💲' },
    { id: 'generaid', nombre: 'Generar ID', icon: '*' }
  ])
  const reporteSeleccionadoId = ref('')


  const cargarDashboard = async (db) => {
    if (!db) return; // Evita llamadas si db es undefined
    cargando.value = true
    try {
      // Concatenamos el nombre de la base de datos en la URL
      const res = await axios.get(`http://localhost:8000/api/dashboard/colectado/${db}`)
      datosColectado.value = res.data
    } catch (err) {
      error.value = "Error en dashboard: " + err.message
    } finally {
      cargando.value = false
    }
}

  const cargarResumen = async (db) => {
    if (!db) return;
    try {
      // Concatenamos el nombre de la base de datos en la URL
      const res = await axios.get(`http://localhost:8000/api/dashboard/resumen/${db}`)
      if (res.data && res.data.length > 0) {
        resumenInventario.value = res.data[0]
        console.log("Resumen cargado:", resumenInventario.value)
      }
    } catch (err) {
      console.error("Error en cargarResumen:", err)
    }
  }

  const cargarDatosReporte = async (reporteId) => {
    const db = inventarioSeleccionado.value?.in_d_dbname
    if (!db) return
    cargando.value = true
    error.value = null
    datosInventario.value = []
    try {
      const res = await axios.get(`http://localhost:8000/api/reporte/${reporteId}?db=${db}`)
      datosInventario.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      error.value = "Error al cargar reporte: " + err.message
    } finally {
      cargando.value = false
    }
  }

  const cargarPieReporteDetallado = async (db) => {
    if (!db) return
    try {
      const res = await axios.get(`http://localhost:8000/api/reporte/detallado?db=${db}`)
      datosPie.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      console.error("Error al cargar datos de torta:", err)
      datosPie.value = []
    }
  }

  const cargarDepartamentos = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/departamentosCencosud')
      listaDepartamentos.value = Array.isArray(res.data) ? res.data : []
    } catch (err) { console.error(err) }
  }



  const crearInventario = async (datos) => {
  try {
    const payload = {
      nombre_inventario: datos.nombre,
      sucursal: String(datos.sucursal || ''),
      cliente: String(datos.cliente || ''),
      encargado: String(datos.encargado || ''),
      cantidad_auditores: Number(datos.cantidadAuditores) || 0,
      inicio_deposito: String(datos.iniciodeposito || ''),
      fin_deposito: String(datos.findeposito || ''),
      inicio_salon: String(datos.iniciosalon || ''),
      fin_salon: String(datos.finsalon || '')
    };

    const res = await axios.post('http://localhost:8000/api/inventarios/crear', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
  } catch (err) {
    if (err.response) {
      console.error('Create inventory response error:', err.response.data);
    }
    throw err;
  }
};
  // --- 4. COMPUTADAS ---
  const cabecerasVisibles = computed(() => {
    if (datosInventario.value.length === 0) return []
    return Object.keys(datosInventario.value[0])
      .filter(col => !columnasOcultas.value.includes(col))
  })

  const datosFiltrados = computed(() => {
    if (datosInventario.value.length === 0) return []
    return datosInventario.value.filter(item => {
      const matchesBusqueda = !busqueda.value || 
        Object.values(item).some(val => String(val).toLowerCase().includes(busqueda.value.toLowerCase()))
      
      const codDepto = item.departamento || item.CodDepto || ''
      const matchesDepto = !filtros.value.departamento || String(codDepto) === String(filtros.value.departamento)
      
      const valorNumerico = parseFloat(item.campo8 || item.Importe || 0)
      const matchesMin = !filtros.value.montoMin || valorNumerico >= filtros.value.montoMin
      const matchesMax = !filtros.value.montoMax || valorNumerico <= filtros.value.montoMax

      return matchesBusqueda && matchesDepto && matchesMin && matchesMax
    })
  })

  const datosFiltradosConColumnasVisibles = computed(() => {
    if (datosFiltrados.value.length === 0) return []
    return datosFiltrados.value.map(fila => {
      const nuevaFila = {}
      cabecerasVisibles.value.forEach(col => {
        nuevaFila[col] = fila[col]
      })
      return nuevaFila
    })
  })

  const toggleMenuReportes = () => {
    menuReportesAbierto.value = !menuReportesAbierto.value
  }
const cargarListaInventarios = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/dashboard/listainventarios')
      console.log("Datos recibidos:", res.data) // Revisa la consola del navegador
      listaInventarios.value = res.data
    } catch (err) {
      console.error("Error API:", err)
    }
  }


// Dentro de useInventario.js
const cargarDatosDashboard = async () => {
  if (!inventarioSeleccionado.value) return;

  try {
    // Enviamos los nombres de campos que coincidan con el .get() de Python
    await axios.post('http://localhost:8000/api/inventarios/seleccionar', {
      base_actual: inventarioSeleccionado.value.in_d_dbname,
      cliente: inventarioSeleccionado.value.cliente,
      inventarioid: inventarioSeleccionado.value.in_n_id,
      sucursalid: inventarioSeleccionado.value.in_n_sucursal
    });

    // Una vez actualizada la vigencia, cargamos el dashboard
    const db = inventarioSeleccionado.value.in_d_dbname;
    await Promise.all([
      cargarResumen(db),
      cargarDashboard(db),
      cargarPieReporteDetallado(db)
    ]);

    console.log("✅ Inventario vigente actualizado en DB y Dashboard recargado.");
  } catch (err) {
    console.error("❌ Error en el cambio de inventario:", err);
  }
};

const esCampoTexto = (columna) => {
  if (!columna) return false;
  const nombre = String(columna).toLowerCase();
  const tokensTexto = [
    'ean', 'codigo', 'barra', 'marbete', 'id', 'id_device', 'tiporeporte', 'grupo', 'sucursalid',
    'inv_id', 'archivo', 'nombre', 'base_datos', 'cliente', 'inventario', 'fecha_alta', 'supervisor', 'operador', 'sucursal'
  ];
  return tokensTexto.some(token => nombre.includes(token));
};

const formatearNumero = (valor, columna) => {
    if (valor === null || valor === undefined || valor === '') return { valor: '', clase: '' }
    if (esCampoTexto(columna)) return { valor: String(valor), clase: 'text-left' }

    const numero = parseFloat(valor)
    if (isNaN(numero)) return { valor: valor, clase: 'text-left' }

    return {
      valor: numero.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      clase: `text-right font-mono ${numero < 0 ? 'text-red-600' : numero > 0 ? 'text-green-600' : ''}`
    }
  }

  const exportarExcel = (nombreReporte) => {
    const worksheet = XLSX.utils.json_to_sheet(datosFiltrados.value)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")
    XLSX.writeFile(workbook, `${nombreReporte}_${Date.now()}.xlsx`)
  }


    const formatHora = (fecha) => {
      if (!fecha) return "";
      return new Date(fecha).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

  const exportarPDF = (nombreReporte, tituloReporte, totalesColumnas = {}) => {
    if (datosFiltrados.value.length === 0) return
    try {
      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' })
      if (logoDinamic) {
        const base64Image = logoDinamic.trim().startsWith('data:')
          ? logoDinamic.trim()
          : `data:image/jpeg;base64,${logoDinamic.trim()}`
        doc.addImage(base64Image, 'JPEG', 12, 10, 25, 18)
      }
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 15
      const title = `Control de Inventarios - ${tituloReporte}`
      doc.setFontSize(16)
      doc.text(title, pageWidth / 2, 18, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`${new Date().toLocaleString()}`, pageWidth - margin, 18, { align: 'right' })

      const columnas = cabecerasVisibles.value
      const filas = datosFiltrados.value.map(item => columnas.map(col => item[col] || ''))

      const totalRow = columnas.map((col, index) => {
        if (typeof totalesColumnas[col] === 'number') {
          return formatearNumero(totalesColumnas[col], col).valor
        }
        return index === 0 ? 'Totales' : ''
      })

      const body = filas.slice()
      if (totalRow.some(cell => cell !== '' && cell !== 'Totales')) {
        body.push(totalRow)
      }

      autoTable(doc, {
        startY: 28,
        head: [columnas],
        body,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [30, 41, 59] }
      })
      doc.save(`${nombreReporte}_${Date.now()}.pdf`)
    } catch (err) {
      console.error("Error al generar PDF:", err)
    }
  }


  const exportarTodosLosReportes = async (baseDatos) => {
  cargando.value = true
  error.value = null
  try {
    const res = await axios.post(`http://localhost:8000/api/inventarios/exportar-todos-reportes/${baseDatos}`)
    
    const data = res.data
    const mensaje = `✅ Exportación completada\n\n` +
      `📁 Carpeta: ${data.carpeta}\n` +
      `📊 Reportes exportados: ${data.exportados_ok}/${data.total_reportes}\n` +
      `🏪 Tienda: ${data.tienda}\n\n` +
      (data.errores > 0 ? `⚠️ Errores: ${data.errores}` : '')
    
    alert(mensaje)
    return data
  } catch (err) {
    error.value = err.response?.data?.detail || err.message
    alert('❌ Error: ' + error.value)
    throw err
  } finally {
    cargando.value = false
  }
}

  // --- 6. RETURN ---
  return {
    datosInventario, datosPie, datosColectado, resumenInventario, cargando, error,
    busqueda, filtros, listaDepartamentos, cabecerasVisibles,crearInventario, 
    datosFiltrados, datosFiltradosConColumnasVisibles, cargarListaInventarios,listaInventarios,inventarioSeleccionado,
    cargarDashboard, cargarResumen, cargarDepartamentos, cargarDatosReporte, cargarDatosDashboard, cargarPieReporteDetallado,
    formatearNumero, exportarExcel, exportarPDF, vistaActual, reporteActivoId, formatHora,
    menuReportesAbierto, opcionesReporte, reporteSeleccionadoId, toggleMenuReportes,exportarTodosLosReportes
  }
}