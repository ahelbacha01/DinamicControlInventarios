<script setup>
import { computed } from 'vue'

const props = defineProps({
  opcionesReporte: { type: Array, default: () => [] },
  reporteSeleccionadoId: { type: String, default: '' },
  reporteSeleccionadoTitulo: { type: String, default: '' },
  cabecerasVisibles: { type: Array, default: () => [] },
  datosFiltradosConColumnasVisibles: { type: Array, default: () => [] },
  listaDepartamentos: { type: Array, default: () => [] },
  filtros: { type: Object, default: () => ({ departamento: '' }) },
  busqueda: { type: String, default: '' },
  cargando: { type: Boolean, default: false },
  error: { type: String, default: null },
  formatearNumero: { type: Function, default: (valor) => ({ valor, clase: '' }) }
})

const emit = defineEmits(['seleccionarReporte', 'cambioFiltro', 'cambioBusqueda', 'exportarExcel', 'exportarPDF'])

const reporteNombre = computed(() => {
  return props.opcionesReporte.find(r => r.id === props.reporteSeleccionadoId)?.nombre || 'Reporte'
})

const handleFiltroDepartamento = (event) => {
  emit('cambioFiltro', { field: 'departamento', value: event.target.value })
}

const handleBusqueda = (event) => {
  emit('cambioBusqueda', event.target.value)
}

const handleExportExcel = () => emit('exportarExcel', props.reporteSeleccionadoId, props.reporteSeleccionadoTitulo)
const handleExportPDF = () => emit('exportarPDF', props.reporteSeleccionadoId, props.reporteSeleccionadoTitulo)
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-4 items-end">
      <div class="flex-1 space-y-1">
        <label class="text-[10px] font-bold text-slate-400 uppercase px-1">Filtrar por Departamento</label>
        <select :value="filtros.departamento" @change="handleFiltroDepartamento" class="w-full text-sm border-slate-200 rounded-xl focus:ring-blue-500">
          <option value="">Todos los Departamentos</option>
          <option v-for="d in listaDepartamentos" :key="d.codigo" :value="d.codigo">{{ d.descripcion }}</option>
        </select>
      </div>
      <div class="flex-[2] space-y-1">
        <label class="text-[10px] font-bold text-slate-400 uppercase px-1">Búsqueda rápida</label>
        <input :value="busqueda" @input="handleBusqueda" type="text" placeholder="Código, descripción o barra..." class="w-full text-sm border-slate-200 rounded-xl focus:ring-blue-500">
      </div>
      <div class="flex gap-2">
        <button @click="handleExportExcel" class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Excel</button>
        <button @click="handleExportPDF" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">PDF</button>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border p-5">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div>
          <p class="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Reporte seleccionado</p>
          <h3 class="text-lg font-bold text-slate-800">{{ reporteNombre }}</h3>
        </div>
      </div>

      <div v-if="error" class="p-4 mb-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
        {{ error }}
      </div>
      <div v-else-if="cargando" class="p-4 text-slate-600">Cargando reporte...</div>
      <div v-else-if="datosFiltradosConColumnasVisibles.length === 0" class="p-8 text-center text-slate-500">No hay datos disponibles para este reporte.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-[12px] text-left">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th v-for="col in cabecerasVisibles" :key="col" class="px-4 py-4 font-bold text-slate-500 uppercase tracking-wider">{{ col }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="(fila, i) in datosFiltradosConColumnasVisibles" :key="i" class="hover:bg-blue-50/30 transition-colors">
              <td v-for="col in cabecerasVisibles" :key="col" :class="formatearNumero(fila[col], col).clase" class="px-4 py-3 whitespace-nowrap">
                {{ formatearNumero(fila[col], col).valor }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
