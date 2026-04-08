<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'


const reporteSeleccionado = ref('variacion') // El ID del reporte activo

const opcionesReporte = [
  { id: 'variacion', nombre: 'Variaciones Grupo', icon: '📊' },
  { id: 'detallado', nombre: 'Recuento Detallado', icon: '📋' },
  { id: 'diferencias', nombre: 'Diferencias Stock', icon: '⚖️' },
  { id: 'no_leidos', nombre: 'No Leídos / Faltantes', icon: '🚫' }
]

// Función que se dispara al cambiar de reporte
const cambiarReporte = (nuevoId) => {
  reporteSeleccionado.value = nuevoId
  cargarDatos()
}


// --- CABECERAS AUTOMÁTICAS ---
const cabeceras = computed(() => {
  return datosInventario.value.length > 0 ? Object.keys(datosInventario.value[0]) : []
})

const datosFiltrados = computed(() => {
  if (!busqueda.value) return datosInventario.value
  const term = busqueda.value.toLowerCase()
  return datosInventario.value.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(term))
  )
})

const sidebarAbierto = ref(true)

const toggleSidebar = () => { sidebarAbierto.value = !sidebarAbierto.value }
onMounted(cargarDatos)



// Estados
const datosInventario = ref([])
const cargando = ref(true)
const error = ref(null)
const busqueda = ref('') 

// Función para obtener datos del Backend (FastAPI + SQL Server)
const cargarDatos = async () => {
  cargando.value = true
  error.value = null
  try {
    // IMPORTANTE: Concatenamos el ID del reporte a la URL
    const response = await axios.get(`http://localhost:8000/api/reporte/${reporteSeleccionado.value}`)
    datosInventario.value = response.data
  } catch (err) {
    console.error("Error:", err)
    error.value = "Error al conectar con SQL Server."
  } finally {
    cargando.value = false
  }
}

// Ejecutar al cargar la pantalla
onMounted(cargarDatos)
</script>


<template>
  <section class="p-6 flex-1 overflow-auto">
    
    <div v-if="cargando" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
      <p class="text-slate-500 font-medium animate-pulse">Consultando SQL Server 2008 R2...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3">
       <span>⚠️</span> {{ error }}
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th v-for="col in cabeceras" :key="col" class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(fila, i) in datosFiltrados" :key="i" class="hover:bg-blue-50/30 transition-colors group">
              <td v-for="col in cabeceras" :key="col" class="px-4 py-3 text-[11px] text-slate-700">
                <span :class="{'font-mono font-bold text-blue-700': typeof fila[col] === 'number'}">
                  {{ typeof fila[col] === 'number' ? fila[col].toLocaleString() : fila[col] }}
                </span>
              </td>
            </tr>
            <tr v-if="datosFiltrados.length === 0">
              <td :colspan="cabeceras.length" class="py-20 text-center text-slate-400 italic">
                No se encontraron registros en este reporte.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </section>
</template>


<style>
/* Estilo para suavizar las transiciones de Tailwind */
.transition-all {
  transition-duration: 300ms;
}
</style>


