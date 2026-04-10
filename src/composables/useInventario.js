import { ref, computed } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function useInventario() {
  // --- 1. ESTADOS CORE ---
  const datosInventario = ref([])
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
    { id: 'inventario_general', nombre: 'Inventario General', icon: '📊' },
    { id: 'departamentos', nombre: 'Por Departamentos', icon: '🏢' },
    // Agrega más opciones según necesites
  ])
  const reporteSeleccionadoId = ref('')

  // --- 3. FUNCIONES DE CARGA (API) ---
  // Agregamos el parámetro 'db' a la función
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
    cargando.value = true
    error.value = null
    datosInventario.value = []
    try {
      const res = await axios.get(`http://localhost:8000/api/reporte/${reporteId}`)
      datosInventario.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      error.value = "Error al cargar reporte: " + err.message
    } finally {
      cargando.value = false
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
      cargarDashboard(db)
    ]);

    console.log("✅ Inventario vigente actualizado en DB y Dashboard recargado.");
  } catch (err) {
    console.error("❌ Error en el cambio de inventario:", err);
  }
};

  // --- 5. UTILIDADES ---
  const formatearNumero = (valor, columna) => {
    if (valor === null || valor === undefined || valor === '') return { valor: '', clase: '' }
    const esIdentificador = ['EAN', 'ean', 'codigo', 'barra', 'marbete'].some(n => columna.toLowerCase().includes(n))
    if (esIdentificador) return { valor: valor, clase: 'text-left' }

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

  const exportarPDF = (tituloReporte) => {
    if (datosFiltrados.value.length === 0) return
    try {
      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' })
      doc.setFontSize(16)
      doc.text("Dinamic Systems - Control de Inventarios", 15, 15)
      doc.setFontSize(10)
      doc.text(`Reporte: ${tituloReporte}`, 15, 22)
      doc.text(`Fecha: ${new Date().toLocaleString()}`, 230, 22)

      const columnas = cabecerasVisibles.value
      const filas = datosFiltrados.value.map(item => columnas.map(col => item[col] || ''))

      autoTable(doc, {
        startY: 28,
        head: [columnas],
        body: filas,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [30, 41, 59] }
      })
      doc.save(`${tituloReporte}_${Date.now()}.pdf`)
    } catch (err) {
      console.error("Error al generar PDF:", err)
    }
  }

  // --- 6. RETURN ---
  return {
    datosInventario, datosColectado, resumenInventario, cargando, error,
    busqueda, filtros, listaDepartamentos, cabecerasVisibles,crearInventario, 
    datosFiltrados, datosFiltradosConColumnasVisibles, cargarListaInventarios,listaInventarios,inventarioSeleccionado,
    cargarDashboard, cargarResumen, cargarDepartamentos, cargarDatosReporte, cargarDatosDashboard,
    formatearNumero, exportarExcel, exportarPDF, vistaActual, reporteActivoId, formatHora,
    menuReportesAbierto, opcionesReporte, reporteSeleccionadoId, toggleMenuReportes
  }
}