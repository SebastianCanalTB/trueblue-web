import { defineStore } from 'pinia'

export const useAllProductsStore = defineStore('allProducts', {
  state: () => ({
    allFormData: [],
  }),
  actions: {
    setAllFormData(form: any) {
      this.allFormData.push(form)
    },
    deleteSelectedAllFromData(index: any) {
      this.allFormData.splice(index, 1)
    },
    editSelectedAllFromData(index: any) {
      const currentElement = this.allFormData[index]
      const elementToMove = currentElement
      this.allFormData.splice(index, 1)
      this.allFormData.push(elementToMove)
    },
    deleteAllFromData() {
      this.allFormData = []
    },
  },
  getters: {
    getAllFormsData: (state) => {
      return state.allFormData
    },
  },
  persist: [
    {
      pick: ['allFormData'],
      storage: piniaPluginPersistedstate.cookies(),
    },
  ],
})
