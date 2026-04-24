<template>
  <div class="bg-white rounded-2xl shadow-sm border p-4">
    <div class="flex items-center justify-between gap-3 mb-4">
      <div>
        <p class="text-[10px] uppercase font-bold text-slate-400">Reporte</p>
        <h3 class="text-sm font-bold text-slate-800">Variación por Grupo</h3>
      </div>
      <p class="text-xs text-slate-500">Total: {{ formattedTotal }}</p>
    </div>

    <div v-if="chartData.length" class="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" class="w-full max-w-[260px] h-[260px]">
        <circle cx="100" cy="100" r="90" fill="#f8fafc" />
        <template v-for="(slice, index) in chartData" :key="index">
          <path
            :d="slice.path"
            :fill="slice.color"
            stroke="white"
            stroke-width="2"
          />
        </template>
        <circle cx="100" cy="100" r="50" fill="#ffffff" />
        <text x="100" y="106" text-anchor="middle" class="text-[13px] font-bold fill-slate-700">{{ formattedTotal }}</text>
      </svg>

      <div class="w-full grid grid-cols-2 gap-2">
        <div v-for="item in chartData" :key="item.label" class="flex items-center gap-2 text-[12px]">
          <span :style="{ backgroundColor: item.color }" class="block h-2.5 w-2.5 rounded-full"></span>
          <span class="truncate">{{ item.label }}</span>
          <span class="ml-auto font-semibold">{{ item.formattedValue || formatCurrency(item.value) }}</span>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-slate-500 py-8 text-sm">
      No hay datos de variación para mostrar.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  labelKey: { type: String, default: '' },
  valueKey: { type: String, default: '' },
  maxSlices: { type: Number, default: 6 }
})

const colors = [
  '#2563eb', '#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#a855f7', '#ef4444', '#14b8a6'
]

const pickLabelKey = (item) => {
  if (!item) return ''
  const keys = Object.keys(item)
  if (props.labelKey) return props.labelKey
  if (keys.includes('departamento')) return 'departamento'
  if (keys.includes('Descripcion')) return 'Descripcion'
  return keys.find(k => typeof item[k] === 'string') || keys[0] || ''
}

const pickValueKey = (item) => {
  if (!item) return ''
  const keys = Object.keys(item)
  if (props.valueKey) return props.valueKey
  if (keys.includes('VariacionMonto')) return 'VariacionMonto'
  if (keys.includes('MontoColecTotal')) return 'MontoColecTotal'
  return keys.find(k => !isNaN(parseNumeric(item[k])) && k !== pickLabelKey(item)) || keys[1] || keys[0] || ''
}

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value
  const normalized = String(value).trim().replace(/\./g, '').replace(/,/g, '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const labelKey = computed(() => pickLabelKey(props.data[0] || {}))
const valueKey = computed(() => pickValueKey(props.data[0] || {}))

const normalizedData = computed(() => {
  return props.data
    .map((item) => {
      const rawValue = item?.[valueKey.value]
      const value = parseNumeric(rawValue)
      const label = (item && item.departamento !== undefined && item.Descripcion !== undefined)
        ? `${item.departamento} - ${item.Descripcion}`
        : String(item?.[labelKey.value] ?? 'Sin etiqueta')
      return {
        label,
        value: Math.abs(value),
        rawValue: value,
        formattedValue: `${value < 0 ? '-' : value > 0 ? '+' : ''}${formatCurrency(Math.abs(value))}`
      }
    })
    .filter(item => item.value > 0)
})

const total = computed(() => normalizedData.value.reduce((sum, item) => sum + item.value, 0))
const formattedTotal = computed(() => formatNumber(total.value))

const chartData = computed(() => {
  const sorted = [...normalizedData.value].sort((a, b) => b.value - a.value)
  const top = sorted.slice(0, props.maxSlices)
  const others = sorted.slice(props.maxSlices)
  const result = [...top]
  if (others.length > 0) {
    const otherValue = others.reduce((sum, item) => sum + item.value, 0)
    result.push({ label: 'Otros', value: otherValue, rawValue: otherValue })
  }

  let startAngle = 0
  return result.map((item, index) => {
    const sliceAngle = total.value > 0 ? (item.value / total.value) * 360 : 0
    const endAngle = startAngle + sliceAngle
    const path = describeArc(100, 100, 90, startAngle, endAngle)
    const color = colors[index % colors.length]
    startAngle = endAngle
    return { ...item, path, color }
  })
})

function polarToCartesian(cx, cy, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: cx + (radius * Math.cos(angleInRadians)),
    y: cy + (radius * Math.sin(angleInRadians))
  }
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return [
    `M ${x} ${y}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z'
  ].join(' ')
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value)
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}
</script>
