import { defineStore } from 'pinia'
import type { OrderDetail } from '~/interfaces/Payment.interface'
const module = 'order'
interface State {
  paymentData: OrderDetail
}
export const usePaymentStore = defineStore('payment', {
  state: (): State => ({
    paymentData: {} as OrderDetail,
  }),
  actions: {
    async generatePayment(_form: object) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/generate-payment',
        data: _form,
      })
      return response
    },
    async getFailedOrderData(_id: any) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-order-reject/' + _id,
      })
      if (response.status && response.code === 100) {
        this.paymentData = response.data
      }
      return response
    },
  },
  getters: {
    getDataFromFailedOrder: (state) => {
      return state.paymentData
    },
  },
})
