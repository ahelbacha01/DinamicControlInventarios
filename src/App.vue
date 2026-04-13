<script setup>
import { onMounted, ref } from 'vue'
import { useInventario } from './composables/useInventario'
import TablaDashboard from './components/TablaDashboard.vue'
import FormularioNuevoInventario from './components/FormularioNuevoInventario.vue'
import FormularioArchivoMaestro from './components/FormularioArchivoMaestro.vue'
import Reportes from './components/Reportes.vue'

const { 
  cargarDepartamentos, 
  cargarResumen, 
  cargarDashboard, 
  cargarDatosReporte, 
  listaInventarios,
  cargarListaInventarios,
  inventarioSeleccionado,
  vistaActual, 
  cargarDatosDashboard,
  reporteActivoId,
  datosColectado,
  formatHora,
  resumenInventario,
  opcionesReporte,
  reporteSeleccionadoId,
  listaDepartamentos,
  filtros,
  busqueda,
  cabecerasVisibles,
  datosFiltradosConColumnasVisibles,
  formatearNumero,
  exportarExcel,
  exportarPDF,
  toggleMenuReportes,
  menuReportesAbierto,
  cargando,
  error,
  crearInventario 
} = useInventario()

const sidebarAbierto = ref(true)
const cargandoCreacion = ref(false)
const inventarioCreado = ref(null)
const ultimoArchivoMaestro = ref({ nombre: '', registros: 0 })
const ultimoArchivoSto = ref({ nombre: '', registros: 0 })

// --- MÉTODOS DE NAVEGACIÓN ---

const irANuevoInventario = () => {
  vistaActual.value = 'nuevo-inventario'
}

const irACargarSto = () => {
  vistaActual.value = 'cargar-sto'
}

const irACargarMaestro = () => {
  if (!inventarioSeleccionado.value) return
  inventarioCreado.value = null
  vistaActual.value = 'subir-archivo'
}

const irADashboard = async () => {
  vistaActual.value = 'dashboard'
  if (!inventarioSeleccionado.value) return
  await cargarDatosDashboard()
}

const actualizarInventarioSeleccionado = async () => {
  await cargarListaInventarios()

  if (listaInventarios.value.length === 0) {
    inventarioSeleccionado.value = null
    return
  }

  if (inventarioCreado.value) {
    const encontrado = listaInventarios.value.find(inv =>
      inv.in_d_dbname === inventarioCreado.value.base_datos ||
      inv.in_n_id === inventarioCreado.value.inventario_id
    )

    inventarioSeleccionado.value = encontrado || listaInventarios.value[listaInventarios.value.length - 1]
    return
  }

  inventarioSeleccionado.value = listaInventarios.value[listaInventarios.value.length - 1]
}

// --- MANEJADORES DE EVENTOS ---

const handleCambioInventario = async () => {
  if (inventarioSeleccionado.value) {
    await cargarDatosDashboard()
  }
}

const handleGuardarNuevoInventario = async (datos) => {
  cargandoCreacion.value = true
  try {
    const resultado = await crearInventario(datos)
    // Guardar datos del inventario recién creado para el componente de subida
    inventarioCreado.value = {
      base_datos: resultado.datos.base_datos,
      inventario_id: resultado.datos.inventario_id
    }
    vistaActual.value = 'subir-archivo'
  } catch (err) {
    console.error("Error al crear:", err)
  } finally {
    cargandoCreacion.value = false
  }
}

const seleccionarReporte = async (id) => {
  reporteActivoId.value = id
  reporteSeleccionadoId.value = id
  vistaActual.value = 'reportes'
  await cargarDatosReporte(id)
}

const handleArchivoProcesado = async (payload) => {
  if (payload?.tipoArchivo === 'sto') {
    ultimoArchivoSto.value = {
      nombre: payload.nombreArchivo || '',
      registros: payload.registrosProcesados || 0
    }
    await irADashboard()
    return
  }

  ultimoArchivoMaestro.value = {
    nombre: payload?.nombreArchivo || '',
    registros: payload?.registrosProcesados || 0
  }

  await actualizarInventarioSeleccionado()
  inventarioCreado.value = null
  await irADashboard()
}

const handleOmitirArchivo = async () => {
  await actualizarInventarioSeleccionado()
  inventarioCreado.value = null
  await irADashboard()
}

const handleFiltroReporte = ({ field, value }) => {
  filtros.value[field] = value
}

const handleBusquedaReporte = (nuevoTexto) => {
  busqueda.value = nuevoTexto
}

onMounted(async () => {
  await cargarDepartamentos()
  await cargarListaInventarios()
  if (listaInventarios.value.length > 0) {
    inventarioSeleccionado.value = listaInventarios.value[0]
    await irADashboard()
  } else {
    vistaActual.value = 'dashboard'
  }
})
</script>

<template>
  <div class="flex min-h-screen bg-slate-100 font-sans">
    <!-- SIDEBAR -->
    <aside :class="['bg-slate-900 text-slate-300 transition-all duration-300 flex flex-col', sidebarAbierto ? 'w-72' : 'w-20']">
      <div class="p-6 font-bold text-white text-xl tracking-wider border-b border-slate-800">
        <span v-if="sidebarAbierto">SISTEMA INV</span>
        <span v-else>SI</span>
      </div>

      <nav class="p-3 space-y-2 flex-1">
        <button @click="irADashboard" 
          :class="['w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all', vistaActual === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800']">
          <span class="text-lg">🏠</span>
          <span v-if="sidebarAbierto">Inicio / Dashboard</span>
        </button>

        <div class="pt-4 pb-2">
          <button @click="toggleMenuReportes" class="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-800">
            <div class="flex items-center gap-3">
              <span class="text-lg">📊</span>
              <span v-if="sidebarAbierto">Reportes</span>
            </div>
            <span v-if="sidebarAbierto" :class="['transition-transform text-[10px]', menuReportesAbierto ? 'rotate-180' : '']">▼</span>
          </button>
          
          <div v-if="menuReportesAbierto && sidebarAbierto" class="ml-9 border-l border-slate-700 pl-2 mt-1 space-y-1">
            <button v-for="opc in opcionesReporte" :key="opc.id" 
              @click="seleccionarReporte(opc.id)"
              :class="['w-full text-left px-3 py-2 text-xs rounded-lg transition-all', reporteSeleccionadoId === opc.id ? 'text-blue-400 font-bold bg-blue-500/10' : 'text-slate-500 hover:text-white']">
              {{ opc.icon }} {{ opc.nombre }}
            </button>
          </div>
        </div>
      </nav>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden">
      <!-- HEADER -->
      <header class="bg-white border-b h-16 min-h-[64px] flex items-center justify-between px-8 shadow-sm z-10">
        <div class="flex items-center gap-4">
          <button @click="sidebarAbierto = !sidebarAbierto" class="text-slate-400 hover:text-slate-600">☰</button>
          <h2 class="font-bold text-slate-800 uppercase tracking-tight">
            <template v-if="vistaActual === 'dashboard'">Dashboard de Inventario</template>
      
            <template v-else-if="vistaActual === 'nuevo-inventario'">Inicializar Proceso</template>
            <template v-else-if="vistaActual === 'subir-archivo'">Cargar Archivo Maestro</template>
            <template v-else-if="vistaActual === 'cargar-sto'">Cargar Archivo STO</template>
            <template v-else-if="vistaActual === 'reportes'">Reporte: {{ opcionesReporte.find(r => r.id === reporteSeleccionadoId)?.nombre }}</template>
          </h2>
        </div>

        <!-- SELECTOR INTEGRADO EN EL HEADER -->
        <div v-if="vistaActual === 'dashboard' || vistaActual === 'reportes'" class="relative max-w-xs shrink hidden sm:block">
          <select 
            id="inventario-select-header"
            v-model="inventarioSeleccionado" 
            @change="handleCambioInventario"
            class="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-600 py-1.5 pl-3 pr-8 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer font-bold text-[11px] uppercase tracking-wider"
          >
            <option :value="null" disabled>Seleccione Inventario...</option>
            <option v-for="inv in listaInventarios" :key="inv.in_n_id" :value="inv">
              {{ inv.inventario }} ({{ inv.base_datos }})
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg class="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
          </div>
        </div>

      </header>

      <!-- VIEWPORT -->
      <div class="flex-1 overflow-auto p-4 md:p-6">
        
        <!-- SECCIÓN: DASHBOARD -->
        <section v-if="vistaActual === 'dashboard'" class="space-y-6 max-w-7xl mx-auto">
          <!-- Tarjetas de Resumen Superior -->
          <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-blue-500">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Supervisor</p>
              <p class="text-xs font-bold text-slate-800 truncate">{{ resumenInventario?.supervisor || 'Sin asignar' }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-indigo-500">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Auditores</p>
              <p class="text-xs font-bold text-slate-800">{{ resumenInventario?.cantidad_auditores || 0 }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-emerald-500">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Deposito</p>
              <p class="text-[11px] font-bold text-slate-800">{{ formatHora(resumenInventario?.inicio_deposito) }} - {{ formatHora(resumenInventario?.fin_deposito) }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-pink-500">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Salón</p>
              <p class="text-[11px] font-bold text-slate-800">{{ formatHora(resumenInventario?.inicio_salon) }} - {{ formatHora(resumenInventario?.fin_salon) }}</p>
            </div>
            <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-slate-800">
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-1">Base de Datos</p>
              <p class="text-xs font-bold text-slate-800">{{ resumenInventario?.base_datos || '---' }}</p>
            </div>

          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">


            <button type="button" @click="irANuevoInventario" class="text-left bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Último Archivo Maestro</p>
                  <p class="text-xs font-semibold text-slate-800 truncate">{{ ultimoArchivoMaestro.nombre || 'Sin archivo Maestro cargado' }}</p>
                  <p class="text-[10px] text-slate-500 mt-0.5">Registros: {{ ultimoArchivoMaestro.registros }}</p>
                </div>
                <span class="text-[11px] font-bold text-blue-600 uppercase">Abrir</span>
              </div>
            </button>
            <button type="button" @click="irACargarSto" class="text-left bg-slate-50 p-3 rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-[9px] font-bold text-slate-400 uppercase mb-1">Último Archivo STO</p>
                  <p class="text-xs font-semibold text-slate-800 truncate">{{ ultimoArchivoSto.nombre || 'Sin archivo STO cargado' }}</p>
                  <p class="text-[10px] text-slate-500 mt-0.5">Registros: {{ ultimoArchivoSto.registros }}</p>
                </div>
                <span class="text-[11px] font-bold text-blue-600 uppercase">Abrir</span>
              </div>
            </button>
          </div>



          <!-- Tabla de Datos Colectados -->
          <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
             <TablaDashboard :datos="datosColectado" />
          </div>
        </section>

        <!-- SECCIÓN: NUEVO INVENTARIO -->
        <section v-if="vistaActual === 'nuevo-inventario'" class="max-w-4xl mx-auto">
          <FormularioNuevoInventario 
            :cargando="cargandoCreacion"
            @guardado="handleGuardarNuevoInventario" 
            @cargarMaestro="irACargarMaestro"
            @cancelar="irADashboard" 
          />
        </section>

        <!-- SECCIÓN: SUBIR ARCHIVO -->
        <section v-if="vistaActual === 'subir-archivo'" class="max-w-md mx-auto">
          <FormularioArchivoMaestro
            :cargando="false"
            :base-datos="inventarioCreado?.base_datos || inventarioSeleccionado?.in_d_dbname"
            :inventario-id="inventarioCreado?.inventario_id || inventarioSeleccionado?.in_n_id"
            tipo-archivo="maestro"
            @archivo-procesado="handleArchivoProcesado"
            @cancelar="handleOmitirArchivo"
          />
        </section>

        <!-- SECCIÓN: CARGAR STO -->
        <section v-if="vistaActual === 'cargar-sto'" class="max-w-md mx-auto">
          <FormularioArchivoMaestro
            :cargando="false"
            :base-datos="inventarioSeleccionado?.in_d_dbname"
            :inventario-id="inventarioSeleccionado?.in_n_id"
            tipo-archivo="sto"
            @archivo-procesado="handleArchivoProcesado"
            @cancelar="irADashboard"
          />
        </section>

        <!-- SECCIÓN: REPORTES -->
        <section v-if="vistaActual === 'reportes'" class="space-y-4">
          <Reportes
            :opciones-reporte="opcionesReporte"
            :reporte-seleccionado-id="reporteSeleccionadoId"
            :reporte-seleccionado-titulo="opcionesReporte.find(r => r.id === reporteSeleccionadoId)?.nombre || ''"
            :cabeceras-visibles="cabecerasVisibles"
            :datos-filtrados-con-columnas-visibles="datosFiltradosConColumnasVisibles"
            :lista-departamentos="listaDepartamentos"
            :filtros="filtros"
            :busqueda="busqueda"
            :cargando="cargando"
            :error="error"
            :formatear-numero="formatearNumero"
            @cambioFiltro="handleFiltroReporte"
            @cambioBusqueda="handleBusquedaReporte"
            @exportarExcel="exportarExcel"
            @exportarPDF="exportarPDF"
          />
        </section>

      </div>
    </main>
  </div>
</template>

<style>
/* Estilo para las barras de scroll */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>