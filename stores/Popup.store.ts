import { defineStore } from 'pinia'

interface Popup {
  id: number
  frontPage: boolean
  image: string
  title: string
  message: string
  frequency: string
  module: string
  hasAnAccount: boolean
  label: string
  link: string
  status: string
  createdAt: Date
  updatedAt: Date
}

interface PopupHistory {
  popupId: number
  lastShown: string
  showCount: number
}

interface State {
  popups: Popup[]
  popupHistory: PopupHistory[]
  lastCleanup: string | null
}

const module = 'popup'

// Mapeo de nombres de módulos del servicio a rutas de la aplicación
const MODULE_ROUTE_MAP: Record<string, string[]> = {
  Home: ['index', ''],
  'Quienes somos': ['about-us'],
  '¿Por qué fresco?': ['fresh'],
  FAQ: ['FAQ'],
  'Mi cuenta': ['profile'],
}

export const usePopupStore = defineStore(module, {
  state: (): State => ({
    popups: [],
    popupHistory: [],
    lastCleanup: null,
  }),
  actions: {
    cleanupOldHistory() {
      const now = new Date()
      if (!this.lastCleanup) {
        this.lastCleanup = now.toISOString()
        return
      }

      const lastCleanupDate = new Date(this.lastCleanup)
      const monthsDiff =
        (now.getFullYear() - lastCleanupDate.getFullYear()) * 12 +
        (now.getMonth() - lastCleanupDate.getMonth())

      if (monthsDiff >= 2) {
        this.popupHistory = []
        this.lastCleanup = now.toISOString()
      }
    },

    async getAllPopups() {
      this.cleanupOldHistory()

      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-all-pop-up-message',
      })
      if (response.status && response.code === 100) {
        this.popups = response.data
      }
      return response
    },

    shouldShowPopup(popup: Popup): boolean {
      const history = this.popupHistory.find((h) => h.popupId === popup.id)
      const now = new Date()

      if (!history) {
        return true
      }

      const lastShown = new Date(history.lastShown)

      switch (popup.frequency) {
        case 'Primera visita':
          return false

        case 'Cada que se cargue la ventana':
          return true

        case 'Diaria':
          const daysDiff = Math.floor(
            (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24),
          )
          return daysDiff >= 1

        case 'Semanal':
          const weeksDiff = Math.floor(
            (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24 * 7),
          )
          return weeksDiff >= 1

        case 'Mensual':
          const monthsDiff =
            (now.getFullYear() - lastShown.getFullYear()) * 12 +
            (now.getMonth() - lastShown.getMonth())
          return monthsDiff >= 1

        default:
          return true
      }
    },

    markPopupAsShown(popupId: number) {
      const existingIndex = this.popupHistory.findIndex(
        (h) => h.popupId === popupId,
      )

      if (existingIndex >= 0) {
        this.popupHistory[existingIndex] = {
          popupId,
          lastShown: new Date().toISOString(),
          showCount: this.popupHistory[existingIndex].showCount + 1,
        }
      } else {
        this.popupHistory.push({
          popupId,
          lastShown: new Date().toISOString(),
          showCount: 1,
        })
      }
    },

    getPopupsToShow(currentRoute: string, isLoggedIn: boolean): Popup[] {
      return this.popups.filter((popup) => {
        if (popup.status !== 'active') {
          return false
        }
        let isForCurrentPage = false

        if (popup.module && MODULE_ROUTE_MAP[popup.module]) {
          const moduleRoutes = MODULE_ROUTE_MAP[popup.module]
          isForCurrentPage = moduleRoutes.includes(currentRoute)
        }

        if (!isForCurrentPage) {
          return false
        }

        const shouldShow = this.shouldShowPopup(popup)
        return shouldShow
      })
    },
  },
  getters: {
    getPopups: (state): Popup[] => {
      return state.popups
    },
  },
  persist: [
    {
      pick: ['popupHistory', 'lastCleanup'],
      storage: piniaPluginPersistedstate.localStorage(),
    },
  ],
})
