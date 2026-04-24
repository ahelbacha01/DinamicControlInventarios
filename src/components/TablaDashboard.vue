<template>
    <div class="p-1 bg-slate-50 border-b flex justify-between items-center">
      <h3 class="font-bold text-[12px] text-slate-700">Últimos Movimientos Colectados</h3>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-[12px]">
        <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
          <tr>
            <th class="text-[10px] px-6 py-2">Código</th>
            <th class="text-[10px] px-6 py-2">Descripción</th>
            <th class="text-[10px] px-6 py-2">Cant.</th>
            <th class="text-[10px] px-6 py-2">Ubicación</th>
            <th class="text-[10px] px-6 py-2">Terminal</th>
            <!-- Mostrar columna editar solo si permitirEdicion es true -->
            <th v-if="permitirEdicion" class="text-[10px] px-6 py-2 text-center">Editar</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in datos" :key="item.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-2 font-mono text-blue-600">{{ item.CODIGO_DE_BARRAS }}</td>
            
            <td class="px-6 py-2">
              <div class="text-[12px] font-medium text-slate-700">{{ item.DESCRIPCION }}</div>
              <div class="text-[9px] text-slate-400 italic">
                Marbete: {{ item.marbete }} | Depto: {{ item.DEPARTAMENTO }}
              </div>
            </td>
                        
            <td class="px-6 py-2 text-left">
              <div class="text-[12px] font-bold text-slate-900">
                Contado: {{ item.CANTIDAD }} · Esperado: <span class="font-semibold">{{ item.ESPERADO || 0 }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <span :class="[
                'px-2 py-1 rounded-md text-[10px] font-bold uppercase',
                item.Ubicacion === 'Deposito' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              ]">
                {{ item.Ubicacion }}
              </span>
            </td>
            
            <td class="px-6 py-4">
              <div class="text-slate-500">{{ item.TERMINAL }}</div>
            </td>
            
            <!-- BOTÓN DE EDITAR - Solo se muestra si permitirEdicion es true -->
            <td v-if="permitirEdicion" class="px-6 py-4 text-center">
              <button 
                @click="handleEditar(item)"
                class="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                title="Editar cantidad"
              >
                ✏️
              </button>
            </td>
          </tr>
          
          <tr v-if="datos.length === 0">
            <td :colspan="permitirEdicion ? 6 : 5" class="px-6 py-10 text-center text-slate-400">
              No hay datos recientes para mostrar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
</template>

<script setup>
const props = defineProps({
  datos: { type: Array, required: true },
  permitirEdicion: { type: Boolean, default: false } // ← NUEVA PROP
})

const emit = defineEmits(['editar'])

const handleEditar = (item) => {
  emit('editar', item)
}
</script>