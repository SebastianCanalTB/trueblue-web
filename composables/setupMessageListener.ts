// En un archivo como setupMessageListener.ts
import { usePreviewStore } from './stores/previewStore'

interface MensajeRecibido {
  tipo: string
  ruta: string
}

export function setupMessageListener(origenPermitido: string) {
  const previewStore = usePreviewStore()

  window.addEventListener('message', (event: MessageEvent) => {
    // Verificar origen por seguridad
    if (event.origin === origenPermitido) {
      const { tipo, ruta } = event.data as MensajeRecibido

      if (tipo === 'cambiarImagen') {
        previewStore.setPreviewImagen(ruta)
      } else if (tipo === 'cambiarVideo') {
        previewStore.setPreviewVideo(ruta)
      }
    }
  })
}

// Llamar a esta función en el main.ts o en el componente App.vue
