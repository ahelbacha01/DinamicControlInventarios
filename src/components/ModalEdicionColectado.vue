<script setup>
import { computed } from 'vue'

const props = defineProps({
  abierto: Boolean,
  registro: Object,
  cargando: Boolean,
  error: String,
  baseDatos: String,
  modo: {
    type: String,
    default: 'editar' // 'editar' o 'nuevo'
  }
})

const emit = defineEmits(['cerrar', 'guardar'])

const esNuevo = computed(() => props.modo === 'nuevo')

const titulo = computed(() => esNuevo.value ? '➕ Agregar Artículo' : '✏️ Editar Cantidad')
const colorHeader = computed(() => esNuevo.value ? 'bg-green-600' : 'bg-blue-600')
const colorBoton = computed(() => esNuevo.value ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700')
const textoBoton = computed(() => esNuevo.value ? 'Agregar' : 'Guardar')

const handleGuardar = () => {
  if (!props.registro) return
  
  // Validar código de barras si es nuevo
  if (esNuevo.value && (!props.registro.CODIGO_DE_BARRAS || props.registro.CODIGO_DE_BARRAS.trim() === '')) {
    return
  }
  
  const cantidad = parseFloat(props.registro.cantidad_nueva)
  if (isNaN(cantidad) || cantidad < 0) return
  
  if (esNuevo.value) {
    // Modo nuevo: enviar todos los datos
    emit('guardar', {
      modo: 'nuevo',
      barra: props.registro.CODIGO_DE_BARRAS?.trim(),
      cantidad: cantidad,
      sector: props.registro.SECTOR || '1',
      seccion: props.registro.SECCION || '1'
    })
  } else {
    // Modo editar: enviar solo id y cantidad
    emit('guardar', {
      modo: 'editar',
      id: props.registro.id || props.registro.ID,
      cantidad: cantidad
    })
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="abierto" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('cerrar')">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <!-- Header dinámico según modo -->
        <div :class="[colorHeader, 'px-6 py-4 flex items-center justify-between']">
          <h3 class="text-white font-bold text-lg">{{ titulo }}</h3>
          <button @click="$emit('cerrar')" class="text-white/80 hover:text-white text-2xl">×</button>
        </div>

        <div class="p-6 space-y-4">
          
          <!-- MODO NUEVO: Campo Código de Barras (editable) -->
          <div v-if="esNuevo">
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Código de Barras *</label>
            <input
              v-model="registro.CODIGO_DE_BARRAS"
              type="text"
              placeholder="Ingrese código de barras"
              class="w-full px-4 py-3 text-lg font-bold text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none"
            />
          </div>

          <!-- MODO EDITAR: Info de solo lectura -->
          <div v-else class="bg-slate-50 rounded-xl p-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-xs text-slate-500 uppercase font-bold">ID</span>
              <span class="text-sm font-mono text-slate-700">{{ registro?.id || registro?.ID }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs text-slate-500 uppercase font-bold">Código de Barras</span>
              <span class="text-sm font-mono text-slate-700">{{ registro?.CODIGO_DE_BARRAS }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-xs text-slate-500 uppercase font-bold">Descripción</span>
              <span class="text-sm text-slate-700 text-right max-w-[200px] truncate">{{ registro?.DESCRIPCION }}</span>
            </div>
            <div class="flex justify-between border-t border-slate-200 pt-2">
              <span class="text-xs text-slate-500 uppercase font-bold">Cantidad Actual</span>
              <span class="text-lg font-bold text-blue-600">{{ registro?.CANTIDAD }}</span>
            </div>
          </div>

          <!-- Cantidad (común para ambos modos) -->
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">
              {{ esNuevo ? 'Cantidad Inicial' : 'Nueva Cantidad' }}
            </label>
            <input
              v-model.number="registro.cantidad_nueva"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-3 text-lg font-bold text-center text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none"
              :class="esNuevo ? 'focus:border-green-500' : 'focus:border-blue-500'"
              @keyup.enter="handleGuardar"
            />
          </div>

          <!-- MODO NUEVO: Campos adicionales -->
          <div v-if="esNuevo" class="grid grid-cols-2 gap-3">

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Sector</label>
              <input
                v-model="registro.SECTOR"
                type="text"
                maxlength="3"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Sección</label>
              <input
                v-model="registro.SECCION"
                type="text"
                maxlength="3"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            ⚠️ {{ error }}
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 flex gap-3">
          <button @click="$emit('cerrar')" class="flex-1 px-4 py-2.5 text-slate-600 font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50" :disabled="cargando">
            Cancelar
          </button>
          <button 
            @click="handleGuardar" 
            :class="[colorBoton, 'flex-1 px-4 py-2.5 text-white font-semibold rounded-xl flex items-center justify-center gap-2']" 
            :disabled="cargando || (esNuevo && !registro?.CODIGO_DE_BARRAS)"
          >
            <span v-if="cargando" class="animate-spin">⟳</span>
            <span>{{ cargando ? 'Guardando...' : textoBoton }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>