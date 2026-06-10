import { defineStore } from 'pinia'
import type { OrderDetailId } from '~/interfaces/orderDetail.interface'
const module = 'order'
interface Orders {
  id: number
  total: number
  statusPayment: string
  statusOrder: string
  nextPayment: Date
  nextDelivery: Date
}
interface OrderStatus {
  id: string
  name: string
}
interface State {
  orders: Orders[]
  status: OrderStatus[]
  orderDetail: OrderDetailId
  orderConfiguration: any[]
}
export const useOrderStore = defineStore('order', {
  state: (): State => ({
    orders: [],
    status: [],
    orderDetail: {} as OrderDetailId,
    orderConfiguration: [],
  }),
  actions: {
    async cancelOrder(_id: number) {
      const response = await useApiServices({
        method: 'PATCH',
        typeHeader: 'auth',
        url: module + '/cancel-order/' + _id,
      })
      return response
    },
    async createOrder(_form: object) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/create-order',
        data: _form,
        timeout: 20000,
      })
      return response
    },
    async getOrderConfiguration(_id: any) {
      this.orderConfiguration = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: `${module}/get-detail-order-configuration/${_id}`,
      })
      if (response.status && response.code === 100) {
        this.orderConfiguration = response.data
      }
      return response
    },
    async updateAddress(_form: object) {
      const response = await useApiServices({
        method: 'PATCH',
        typeHeader: 'auth',
        url: `${module}/change-address`,
        data: _form,
      })
      return response
    },
    async updateUserDetails(_form: object, _id: any) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: `${module}/update-user-detail/${_id}`,
        data: _form,
      })
      return response
    },
    async editOrder(_form: object) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: `${module}/update-order`,
        data: _form,
      })
      return response
    },
    async changeOrderDate(_id: any, _form: object) {
      const response = await useApiServices({
        method: 'PATCH',
        typeHeader: 'auth',
        url: module + '/change-delivery-date/' + _id,
        data: _form,
      })

      return response
    },
    async getOrders(_data: any) {
      this.orders = []
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/get-all-order',
        data: _data,
      })
      if (response.status && response.code === 100) {
        this.orders = response.data.items
      }
      return response
    },
    async getOneOrder(id: any) {
      this.orderDetail = {} as OrderDetailId
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-order-detail/' + id,
      })
      if (response.status && response.code === 100) {
        this.orderDetail = response.data.userOrderDetail
      }
      return response
    },
    async getStatus() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-order-status',
      })
      if (response.status && response.code === 100) {
        this.status = response.data
      }
      return response
    },
  },

  getters: {
    getAllMyOrders: (state): Orders[] => {
      return state.orders
    },
    getOrdersStatus: (state): OrderStatus[] => {
      return state.status
    },
    getOrderDetail: (state): OrderDetailId => {
      return state.orderDetail
    },
    getOrderConfigurationData: (state): any[] => {
      return state.orderConfiguration
    },
  },
})
