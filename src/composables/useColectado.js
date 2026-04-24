import { ref } from 'vue'

const API_URL = 'http://localhost:8000/api'

export function useColectado() {
  const cargando = ref(false)
  const error = ref(null)
  const registroEditando = ref(null)
  const modalAbierto = ref(false)
  const modoModal = ref('editar') // 'editar' o 'nuevo'

  // Abrir modal en modo edición
  const abrirModalEdicion = (registro) => {
    registroEditando.value = { 
      ...registro,
      cantidad_nueva: registro.CANTIDAD || 0
    }
    modoModal.value = 'editar'
    modalAbierto.value = true
    error.value = null
  }

  // Abrir modal en modo nuevo
  const abrirModalNuevo = () => {
    registroEditando.value = {
      id: null, // Indica que es nuevo
      CODIGO_DE_BARRAS: '',
      DESCRIPCION: 'Nuevo Artículo',
      CANTIDAD: 0,
      cantidad_nueva: 1,
      Ubicacion: 'Salón',
      SECTOR: '1',
      SECCION: '1',
      TERMINAL: 'SistemaWeb'
    }
    modoModal.value = 'nuevo'
    modalAbierto.value = true
    error.value = null
  }

  const cerrarModal = () => {
    modalAbierto.value = false
    registroEditando.value = null
    error.value = null
  }

  // Guardar edición (PUT)
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

  // Guardar nuevo (POST)
  const guardarNuevo = async (baseDatos, datos) => {
    cargando.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_URL}/colectado/${baseDatos}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barra: datos.barra,
          cantidad: parseFloat(datos.cantidad),
          sector: datos.sector || '1',
          seccion: datos.seccion || '1',
          terminal_alta: 'SistemaWeb'
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
      console.error('Error agregando nuevo:', err)
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
    modoModal,
    abrirModalEdicion,
    abrirModalNuevo,
    cerrarModal,
    guardarCantidad,
    guardarNuevo
  }
}