<script setup>
import { ref } from 'vue'

const emit = defineEmits(['archivo-procesado', 'cancelar'])
// Asegúrate de que props.baseDatos y props.inventarioId reciban los valores correctos (ej: 'inv_950' y '950')
const props = defineProps(['cargando', 'baseDatos', 'inventarioId'])

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
    // El nombre 'file' debe coincidir exactamente con el nombre del parámetro en FastAPI: (file: UploadFile = File(...))
    formData.append('file', archivoSeleccionado.value)

    // CORRECCIÓN DE URL: Asegúrate de incluir el host y puerto si el backend no está en el mismo servidor de archivos estáticos
    // También añadimos el header 'accept' para seguir el estándar del curl
    const url = `http://localhost:8000/api/inventarios/procesar-archivo-maestro/${props.baseDatos}/${props.inventarioId}`
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'accept': 'application/json'
        // IMPORTANTE: NO añadir Content-Type aquí, el navegador lo hará automáticamente con el boundary correcto
      }
    })

    const resultado = await response.json()

    if (!response.ok) {
      // Intentamos captar el mensaje de error que devuelve FastAPI (detail)
      throw new Error(resultado.detail || 'Error al procesar el archivo')
    }

    alert(resultado.message || 'Archivo procesado correctamente')
    emit('archivo-procesado')
  } catch (error) {
    console.error('Error en la subida:', error)
    alert('Error: ' + error.message)
  } finally {
    cargandoSubida.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border p-8">
    <div class="mb-6">
      <h3 class="text-xl font-bold text-slate-800">Cargar Archivo Maestro</h3>
      <p class="text-sm text-slate-500">
        Sube el archivo maestro (.out) para inicializar los productos del inventario {{ inventarioId }} en la base {{ baseDatos }}
      </p>
    </div>

    <div class="space-y-5">
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">
          Archivo Maestro (.out)
        </label>
        <input
          type="file"
          accept=".out"
          @change="seleccionarArchivo"
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        >
        <p class="text-xs text-slate-400 mt-1">
          Selecciona el archivo .out que contiene la lista de productos
        </p>
      </div>

      <div class="flex gap-3 pt-4">
        <button
          type="button"
          @click="$emit('cancelar')"
          class="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
        >
          Omitir por ahora
        </button>
        <button
          type="button"
          @click="procesarArchivo"
          :disabled="!archivoSeleccionado || cargandoSubida"
          class="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all disabled:opacity-50"
        >
          {{ cargandoSubida ? 'Procesando...' : 'Procesar Archivo' }}
        </button>
      </div>
    </div>
  </div>
</template>



