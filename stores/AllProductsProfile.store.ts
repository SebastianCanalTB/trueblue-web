import { defineStore } from 'pinia'

export const useAllProductsProfileStore = defineStore('allProductsProfile', {
  state: () => ({
    allFormData: {
      frequency: 0,
      general: []
    },
  }),
  actions: {
    setFrequency(frequency: number) {
      this.allFormData.frequency = frequency
    },
    setAllFormData(form: any) {
      this.allFormData.general.unshift(form)
    },
    setAllFormDataCheckout(form: any) {
      this.allFormData = form
    },
    deleteSelectedAllFromData(index: any) {
      this.allFormData.general.splice(index, 1)
    },
    editSelectedAllFromData(index: any) {
      const currentElement = this.allFormData.general[index]
      const elementToMove = currentElement
      this.allFormData.general.splice(index, 1)
      this.allFormData.general.unshift(elementToMove)
    },
    deleteAllFromData() {
      this.allFormData = {frequency: 0, general: []}
    },
  },
  getters: {
    getAllFormsData: (state) => {
      return state.allFormData.general
    },
    getFrequency: (state) => {
      return state.allFormData.frequency
    },
  },
  persist: [
    {
      pick: ['allFormData'],
      storage: piniaPluginPersistedstate.localStorage(),
    },
  ],
})
