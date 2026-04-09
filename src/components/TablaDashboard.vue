<template>
  <div class="bg-white rounded-2xl shadow-sm border overflow-hidden mt-6">
    <div class="p-4 bg-slate-50  border-b flex justify-between items-center">
      <h3 class="font-bold text-slate-700">Últimos Movimientos Colectados</h3>
      <span class="text-[10px] bg-blue-600 text-yellow-300 px-2 py-1 rounded-full font-bold">RECIENTES</span>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-[12px]">
        <thead class="bg-slate-50 text-slate-500 uppercase font-semibold border-b">
          <tr>
            <th class="px-6 py-3">Código</th>
            <th class="px-6 py-3">Descripción</th>
            <th class="px-6 py-3 text-right">Cant.</th>
            <th class="px-6 py-3">Ubicación</th>
            <th class="px-6 py-3">Terminal</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="item in datos" :key="item.id" class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 font-mono text-blue-600">{{ item.CODIGO_DE_BARRAS }}</td>
            
            <td class="px-6 py-4">
              <div class="font-medium text-slate-700">{{ item.DESCRIPCION }}</div>
              <div class="text-[10px] text-slate-400 italic">
                Marbete: {{ item.marbete }} | Depto: {{ item.DEPARTAMENTO }}
              </div>
            </td>
                        
            <td class="px-6 py-4 text-right">
                <div class="font-bold text-slate-900 text-sm">
                    Contado : {{ item.CANTIDAD }}
                </div>
                <div class="font-bold text-slate-900 text-sm">
                    Esperado: <span class="font-medium">{{ item.ESPERADO || 0 }}</span>
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
              <div class="text-[9px] text-slate-400">{{ item.FECHA_DE_DESCARGA }}</div>
            </td>
          </tr>
          
          <tr v-if="datos.length === 0">
            <td colspan="5" class="px-6 py-10 text-center text-slate-400">
              No hay datos recientes para mostrar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  datos: { type: Array, required: true }
})
</script>