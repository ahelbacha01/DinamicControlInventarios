<script setup>
import { ref } from 'vue'

const emit = defineEmits(['archivo-procesado', 'cancelar'])
// Añadimos un nuevo prop: tipoArchivo, que puede ser 'maestro' o 'sto'
const props = defineProps(['cargando', 'baseDatos', 'inventarioId', 'tipoArchivo'])

const archivoSeleccionado = ref(null)
const cargandoSubida = ref(false)

const seleccionarArchivo = (event) => {
  archivoSeleccionado.value = event.target.files[0]
}

const procesarArchivo = async () => {
  if (!archivoSeleccionado.value) {
    alert('Por favor selecciona un archivo .out')
    return
  }

  cargandoSubida.value = true
  try {
    const formData = new FormData()
    formData.append('file', archivoSeleccionado.value)

    // Construimos la URL dinámicamente según el tipo de archivo
    const endpoint = props.tipoArchivo === 'sto'
      ? 'procesar-archivo-sto'
      : 'procesar-archivo-maestro'

    const url = `http://localhost:8000/api/inventarios/${endpoint}/${props.baseDatos}/${props.inventarioId}`
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'accept': 'application/json'
      }
    })

    const resultado = await response.json()

    if (!response.ok) {
      throw new Error(resultado.detail || 'Error al procesar el archivo')
    }

    alert(resultado.message || 'Archivo procesado correctamente')
    emit('archivo-procesado', {
      tipoArchivo: props.tipoArchivo || 'maestro',
      nombreArchivo: archivoSeleccionado.value?.name || '',
      registrosProcesados: resultado.registrosProcesados || 0,
      comparacion: resultado.comparacion || null,
      message: resultado.message || ''
    })
  } catch (error) {
    console.error('Error en la subida:', error)
    alert('Error: ' + error.message)
  } finally {
    cargandoSubida.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border p-6">
    <div class="mb-4">
      <h3 class="text-lg font-bold text-slate-800">
        <!-- Cambiamos el título según el tipo de archivo -->
        Cargar Archivo {{ props.tipoArchivo === 'sto' ? 'STO' : 'Maestro' }}
      </h3>
      <p class="text-sm text-slate-500">
        Sube el archivo {{ props.tipoArchivo }} (.out) para inicializar los productos del inventario {{ inventarioId }} en la base {{ baseDatos }}
      </p>
    </div>

    <div class="space-y-4">
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase mb-1">
          Archivo {{ props.tipoArchivo }} (.out)
        </label>
        <input
          type="file"
          accept=".out"
          @change="seleccionarArchivo"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        >
        <p class="text-xs text-slate-400 mt-1">
          Selecciona el archivo .out que contiene la lista de productos
        </p>
      </div>

      <div class="flex gap-2 pt-3">
        <button
          type="button"
          @click="$emit('cancelar')"
          class="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-all"
        >
          Omitir por ahora
        </button>
        <button
          type="button"
          @click="procesarArchivo"
          :disabled="!archivoSeleccionado || cargandoSubida"
          class="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50"
        >
          {{ cargandoSubida ? 'Procesando...' : 'Procesar Archivo' }}
        </button>
      </div>
    </div>
  </div>
</template>
