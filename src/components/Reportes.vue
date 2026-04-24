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
  formatearNumero: { type: Function, default: (valor) => ({ valor, clase: '' }) },
  columnasNoSumar: { type: Array, default: () => ['Export','obs', 'Sucursal','Codigo Barra', 'Codigo Maestro', 'Departamento','departamento','Ean', 'Marbete','Codigo Interno'] }
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

const handleExportExcel = () => emit('exportarExcel', props.reporteSeleccionadoId, props.reporteSeleccionadoTitulo, totalesColumnas.value)
const handleExportPDF = () => emit('exportarPDF', props.reporteSeleccionadoId, props.reporteSeleccionadoTitulo, totalesColumnas.value)

const totalesColumnas = computed(() => {
  const totales = {}
  if (props.datosFiltradosConColumnasVisibles.length === 0) return totales

  props.cabecerasVisibles.forEach(col => {
    totales[col] = null
  })

  props.datosFiltradosConColumnasVisibles.forEach(fila => {
    props.cabecerasVisibles.forEach(col => {
      if (props.columnasNoSumar.includes(col)) return

      const value = fila[col]
      if (value === null || value === undefined || String(value).trim() === '') return

      const numericValue = typeof value === 'number'
        ? value
        : parseFloat(String(value).replace(/\./g, '').replace(/,/g, '.').replace(/[^0-9.-]/g, ''))

      if (!Number.isNaN(numericValue)) {
        if (totales[col] === null) totales[col] = 0
        totales[col] += numericValue
      }
    })
  })

  return totales
})

const tieneTotales = computed(() => {
  return Object.values(totalesColumnas.value).some(valor => typeof valor === 'number')
})
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
          <tfoot v-if="tieneTotales" class="bg-slate-50 border-t">
            <tr class="font-semibold">
              <td v-for="(col, index) in cabecerasVisibles" :key="col" :class="(typeof totalesColumnas[col] === 'number' ? formatearNumero(totalesColumnas[col], col).clase : 'text-left') + ' px-4 py-3 whitespace-nowrap'">
                <span v-if="typeof totalesColumnas[col] === 'number'">
                  {{ formatearNumero(totalesColumnas[col], col).valor }}
                </span>
                <span v-else-if="index === 0">Totales</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
