<script setup>
import { ref } from 'vue';
const emit = defineEmits(['guardado', 'cancelar', 'cargarMaestro']);
const props = defineProps(['cargando']);
const formulario = ref({
  nombre: 'Inventario Tienda',
  sucursal: '',
  cliente: 'Carre', // Valor por defecto
  encargado: '',
  cantidadAuditores: 4,
  iniciodeposito: '20:30',
  findeposito: '22:00',  
  iniciosalon:'',
  finsalon:'', nombrearchivo: ''
});
const enviarFormulario = () => {
  if (!formulario.value.nombre || !formulario.value.sucursal) return;
  emit('guardado', { ...formulario.value });
};
const cargarMaestroDirecto = () => {
  //if (!formulario.value.nombre || !formulario.value.sucursal) return;
  emit('cargarMaestro', { ...formulario.value });
};
</script>

<template>
  <div class="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border p-8">
    <div class="mb-6">
      <h3 class="text-xl font-bold text-slate-800">Inicializar Nuevo Inventario</h3>
      <p class="text-sm text-slate-500">Esto creará una nueva base de datos en el servidor y cerrará el inventario actual.</p>
    </div>

    <form @submit.prevent="enviarFormulario" class="space-y-5">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Sucursal (Nro)</label>
          <input v-model="formulario.sucursal" type="text" placeholder="Ej: 230" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Cliente</label>
          <select v-model="formulario.cliente" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="Cenco">Cenco</option>
            <option value="Carre">Carre</option>
            <option value="Vesuvio">Vesuvio</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Nombre descriptivo del Inventario</label>
        <input v-model="formulario.nombre" type="text" placeholder="Ej: Suc: 230 - Id: 947 - Cenco" 
          class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Encargado</label>
          <input v-model="formulario.encargado" type="text" placeholder="Ej: Juan Pérez" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Cantidad Auditores</label>
          <input v-model.number="formulario.cantidadAuditores" type="number" min="1" placeholder="Ej: 3" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Inicio Depósito</label>
          <input v-model="formulario.iniciodeposito" type="time" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Fin Depósito</label>
          <input v-model="formulario.findeposito" type="time" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Inicio Salón</label>
          <input v-model="formulario.iniciosalon" type="time" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Fin Salón</label>
          <input v-model="formulario.finsalon" type="time" 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
        </div>
      </div>

      <div class="flex gap-3 pt-4 flex-wrap">
        <button type="button" @click="$emit('cancelar')" 
          class="flex-1 min-w-[160px] bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all">
          Cancelar
        </button>

        <button type="submit" :disabled="cargando"
          class="flex-1 min-w-[160px] bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
          {{ cargando ? 'Creando Base...' : 'Ejecutar Inicialización' }}
        </button>

        <button type="button" @click="cargarMaestroDirecto" :disabled="cargando"
          class="flex-1 min-w-[160px] bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50">
          {{ cargando ? '...' : 'Cargar Maestro' }}
        </button>
      </div>
    </form>
  </div>
</template>