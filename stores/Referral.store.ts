import { defineStore } from 'pinia'

interface Referral {
  id: number
  value: number
  type: string
  referralType: string
}

interface State {
  referral: Referral[]
}
const module = 'referral-code'
export const useReferralStore = defineStore('referral', {
  state: (): State => ({
    referral: [],
  }),
  actions: {
    async getReferalCodes() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-code-values',
      })
      if (response.status && response.code === 100) {
        this.referral = response.data
      }

      return response
    },
  },
  getters: {
    getInfoReferalCodes: (state): Referral[] => {
      return state.referral
    },
  },
})
