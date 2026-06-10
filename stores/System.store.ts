import { defineStore } from 'pinia'

interface State {
  widthScreen: number
}
export const useSystemStore = defineStore('system', {
  state: () => ({
    isMenuOpen: false,
    widthScreen: 0,
  }),

  getters: {
    isMovil: (state): boolean => {
      return state.widthScreen <= 1024
    },
  },

  actions: {
    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
    },

    setMenuOpen(value: boolean) {
      this.isMenuOpen = value
    },
  },
})
