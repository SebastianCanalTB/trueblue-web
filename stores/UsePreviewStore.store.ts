// En un archivo como usePreviewStore.ts del proyecto "la"
import { defineStore } from 'pinia'

interface PreviewState {
  previewMode: boolean
  previewImagenes: string[]
  previewVideos: string[]
  imagenesOriginales: string[]
  videosOriginales: string[]
}

export const usePreviewStore = defineStore('preview', {
  state: (): PreviewState => ({
    previewMode: false,
    previewImagenes: [],
    previewVideos: [],
    imagenesOriginales: [
      /* rutas originales */
    ],
    videosOriginales: [
      /* rutas originales */
    ],
  }),

  getters: {
    imagenes: (state) =>
      state.previewMode ? state.previewImagenes : state.imagenesOriginales,
    videos: (state) =>
      state.previewMode ? state.previewVideos : state.videosOriginales,
  },

  actions: {
    setPreviewImagen(ruta: string) {
      this.previewMode = true
      this.previewImagenes = [ruta] // O agregar a un array existente
    },

    setPreviewVideo(ruta: string) {
      this.previewMode = true
      this.previewVideos = [ruta] // O agregar a un array existente
    },

    desactivarPreview() {
      this.previewMode = false
    },
  },
})
