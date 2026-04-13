<script setup>
defineProps({
  abierto: Boolean,
  registro: Object,
  cargando: Boolean,
  error: String,
  baseDatos: String
})

const emit = defineEmits(['cerrar', 'guardar'])

const handleGuardar = () => {
  if (!registro.value?.cantidad_nueva && registro.value?.cantidad_nueva !== 0) return
  
  const cantidad = parseFloat(registro.value.cantidad_nueva)
  if (isNaN(cantidad) || cantidad < 0) return
  
  emit('guardar', {
    id: registro.value.id,
    cantidad: cantidad
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="abierto" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click.self="$emit('cerrar')">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div class="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h3 class="text-white font-bold text-lg">✏️ Editar Cantidad</h3>
          <button @click="$emit('cerrar')" class="text-white/80 hover:text-white text-2xl">×</button>
        </div>

        <div class="p-6 space-y-4">
          <div class="bg-slate-50 rounded-xl p-4 space-y-2">
            <div class="flex justify-between">
              <span class="text-xs text-slate-500 uppercase font-bold">ID</span>
              <span class="text-sm font-mono text-slate-700">{{ registro?.id }}</span>
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

          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nueva Cantidad</label>
            <input
              v-model.number="registro.cantidad_nueva"
              type="number"
              step="0.01"
              min="0"
              class="w-full px-4 py-3 text-lg font-bold text-center text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none"
              @keyup.enter="handleGuardar"
            />
          </div>

          <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            ⚠️ {{ error }}
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 flex gap-3">
          <button @click="$emit('cerrar')" class="flex-1 px-4 py-2.5 text-slate-600 font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50" :disabled="cargando">
            Cancelar
          </button>
          <button @click="handleGuardar" class="flex-1 px-4 py-2.5 text-white font-semibold bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2" :disabled="cargando">
            <span v-if="cargando" class="animate-spin">⟳</span>
            <span>{{ cargando ? 'Guardando...' : 'Guardar' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>