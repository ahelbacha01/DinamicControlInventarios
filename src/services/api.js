/**
 * Configuración centralizada para las peticiones al servidor.
 * Cambia el puerto si tu backend corre en uno distinto al 8000.
 */
const BASE_URL = 'http://localhost:8000/api';

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  // No seteamos Content-Type si es FormData, el navegador lo hará automáticamente con el boundary
  const headers = {
    'Accept': 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
};


