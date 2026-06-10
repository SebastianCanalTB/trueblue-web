import { defineStore } from "pinia";
interface State {
}


export const useCalculatorStore = defineStore('calculator', {
  state: (): State => ({}),
  actions: {
    async getCalculations(data: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: 'calculator/calculate-grammage',
        data: data
      })
      return response
    },
  }
})