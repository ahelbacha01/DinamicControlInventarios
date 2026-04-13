import { ref } from 'vue'

const API_URL = 'http://localhost:8000/api'

export function useColectado() {
  const cargando = ref(false)
  const error = ref(null)
  const registroEditando = ref(null)
  const modalAbierto = ref(false)

  const abrirModalEdicion = (registro) => {
    registroEditando.value = { 
      ...registro,
      cantidad_nueva: registro.CANTIDAD || 0
    }
    modalAbierto.value = true
    error.value = null
  }

  const cerrarModal = () => {
    modalAbierto.value = false
    registroEditando.value = null
    error.value = null
  }

  const guardarCantidad = async (baseDatos, idRegistro, nuevaCantidad) => {
    cargando.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/colectado/${baseDatos}/${idRegistro}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cantidad: parseFloat(nuevaCantidad),
          terminal_modi: 'SistemaWeb'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Error ${response.status}`)
      }

      const resultado = await response.json()
      cerrarModal()
      return resultado
      
    } catch (err) {
      error.value = err.message
      console.error('Error guardando cantidad:', err)
      throw err
    } finally {
      cargando.value = false
    }
  }

  return {
    cargando,
    error,
    registroEditando,
    modalAbierto,
    abrirModalEdicion,
    cerrarModal,
    guardarCantidad
  }
}