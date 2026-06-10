import { defineStore } from 'pinia'

export interface Address {
  id: number
  address: string
  complement: string
  latitude: string
  longitude: string
  predetermined: boolean
}

const module = 'address'
interface State {
  addresses: Address[]
  address: Address
}
export const useAddressStore = defineStore('adress', {
  state: (): State => ({
    addresses: [],
    address: {} as Address,
  }),
  actions: {
    async getListAddress() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-address',
      })
      if (response.status && response.code === 100) {
        this.addresses = response.data
      }
      return response
    },
    async createAddress(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/create-address',
        data: _form,
      })

      return response
    },
    async editAddress(_form: any, id: number) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: module + '/update-address/' + id,
        data: _form,
      })

      return response
    },
    async getAddressById(id: number) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-detail-address/' + id,
      })
      if (response.status && response.code === 100) {
        this.address = response.data
      }
      return response
    },
    async updateAddressStatus(id: number) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/mark-address-default/' + id,
      })

      return response
    },
    async deleteAddressById(id: number) {
      const response = await useApiServices({
        method: 'DELETE',
        typeHeader: 'auth',
        url: module + '/delete-address/' + id,
      })
      return response
    },
  },
  getters: {
    getAllMyAddresses: (state): Address[] => {
      return state.addresses
    },
    getOneAddress: (state) => {
      return state.address
    },
  },
})
