import { defineStore } from 'pinia'
import type { User } from '~/interfaces/User.interface'
import type { ListPlan } from '~/interfaces/CreatePlans.interface'
import type { Referral } from '~/interfaces/Referrals.interface'
import type { OrderDetailId } from '~/interfaces/orderDetail.interface'
interface DocumentType {
  id: number
  name: string
  alias: string
  createdAt: Date
  updatedAt: Date
}
export interface City {
  id: number
  name: string
}
export interface Municipalities extends City {
  shippingCost: number
  alegraId: null | string
}

interface DatesOptions {
  date: String
}

interface Cupons {
  id: number
  description: string
  type: string
  valueType: number
  applicableOrderNumber: number
  discountType: string
  startDate: Date
  endDate: Date
  status: string
}
interface Parameterization {
  id: number
  allowedLimit: number
  limitToBeCollected: number
  discount: number
  iva: number
  status: string
  createdAt: Date
  updatedAt: Date
  isMixedFood: boolean
}
interface State {
  documentTypes: DocumentType[]
  parameterization: Parameterization
  cities: City[]
  user: User
  listPlans: ListPlan[]
  dateOptions: DatesOptions[]
  cupon: Cupons
  referral: Referral[]
  orderData: OrderDetailId
  municipalities: Municipalities[]
  preSelectedProduct: number
}

const module = 'account'

export const useAccountStore = defineStore('account', {
  state: (): State => ({
    documentTypes: [],
    parameterization: {} as Parameterization,
    cities: [],
    user: {} as User,
    listPlans: [],
    dateOptions: [],
    cupon: {} as Cupons,
    referral: [],
    orderData: {} as OrderDetailId,
    municipalities: [],
    preSelectedProduct: 3,
  }),
  actions: {
    async getReferralList(_form: object) {
      this.referral = []
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/get-referral-codes',
        data: _form,
      })
      if (response.status && response.code === 100) {
        this.referral = response.data.referralUsage
      }
      return response
    },
    async getTransferStatus(_id: any) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/transfer-status/' + _id,
      })
      if (response.status && response.code === 100) {
        this.orderData = response.data.order
      }
      return response
    },
    async getReferralOrDiscountInfo(_form: object) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/get-info-discounts',
        data: _form,
      })

      return response
    },
    async getReferralCodeInfo(_form: object) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/get-referral-code',
        data: _form,
      })

      return response
    },
    async generateReferralCodeInfo() {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/generate-referral-code',
      })
      return response
    },
    async getParametization() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-parameterization',
      })
      if (response.status && response.code === 100) {
        this.parameterization = response.data
      }
      return response
    },
    async redeemCouponCode(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/redeem-coupon',
        data: _form,
      })
      return response
    },
    async sendCouponCode(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/get-coupon',
        data: _form,
      })
      return response
    },
    async sendCodeProfileUpdate(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/send-code-profile',
        data: _form,
      })
      return response
    },
    async getFoodRelatedToPet(_form: any) {
      this.listPlans = []
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/get-food-related-products',
        data: _form,
      })
      if (response.status && response.code === 100) {
        this.listPlans = response.data
      }
      return response
    },
    async getPurchaseValues(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/calculate-purchase-value',
        data: _form,
      })
      return response
    },
    async getDeliveryDates() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-dates',
      })
      if (response.status && response.code === 100) {
        this.dateOptions = response.data
      }
      return response
    },
    async getValuesByFrequency(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/values-by-frequency',
        data: _form,
      })
      return response
    },
    async getCalculation(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/get-quantity-food',
        data: _form,
      })
      return response
    },
    async firstCupon() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-first-discount',
      })
      if (response.status && response.code === 100) {
        this.cupon = response.data
      }
      return response
    },
    async validatePhoneNumber(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/user-validation',
        data: _form,
      })
      return response
    },
    async validatePhoneNumberForUpdate(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/profile-code-validation',
        data: _form,
      })
      if (response?.status && response?.code === 100) {
        setLoginUser(response.data)
      }
      return response
    },
    async editProfileInformation(_form: any) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: module + '/update-profile',
        data: _form,
        contentType: 0,
      })
      return response
    },
    async editVetProfileInformation(_form: any) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: 'vet/update-profile',
        data: _form,
        contentType: 0,
      })
      return response
    },
    async getDocumentsRegister() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-document-type-register',
      })
      if (response.status && response.code === 100) {
        this.documentTypes = response.data
      }
      return response
    },
    async sendVerificationCode(_data: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/validate-code',
        data: _data,
      })

      return response
    },
    async getDocumentsAccount() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-document-type-account',
      })
      if (response.status && response.code === 100) {
        this.documentTypes = response.data
      }
      return response
    },
    async getProfile() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-profile',
      })
      if (response.status && response.code === 100) {
        this.user = response.data
      }
      return response
    },

    async createUserValidationPet(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: '/user-validation-pets/create',
        data: _form,
      })
      return response
    },
    async verifyPhoneNumber(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/verify-validation',
        data: _form,
      })
      return response
    },
    async saveEmail(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: 'general/save-email',
        data: _form,
      })
      return response
    },
    async getMunicipalities(_id: number) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-city-group/' + _id + '/cities',
      })
      if (response.status && response.code === 100) {
        this.municipalities = response.data
      }
      return response
    },
    async getCitiesRegister() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-city-group',
      })
      if (response.status && response.code === 100) {
        this.cities = response.data
      }
      return response
    },
    async getCitiesAccount(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/get-cities-account',
        data: _form,
      })
      if (response.status && response.code === 100) {
        this.cities = response.data
      }
      return response
    },
    async registry(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/registry',
        data: _form,
        timeout: 12000,
      })

      return response
    },
  },
  getters: {
    getListMunicipalities: (state): Municipalities[] => {
      return state.municipalities
    },
    getInfoOrder: (state): OrderDetailId => {
      return state.orderData
    },
    getInfoReferralList: (state): Referral[] => {
      return state.referral
    },
    getInfoCupon: (state): Cupons => {
      return state.cupon
    },
    getLisParametrization: (state): Parameterization => {
      return state.parameterization
    },
    getListDocumentTypes: (state): DocumentType[] => {
      return state.documentTypes
    },
    getListCities: (state): City[] => {
      return state.cities
    },
    getLoginUser: (state) => {
      return state.user
    },
    getProfileInformation: (state): User[] => {
      return state.user
    },
    getListPlans: (state): ListPlan[] => {
      return state.listPlans
    },
    getAllDateOptions: (state): DatesOptions[] => {
      return state.dateOptions
    },
  },
  persist: {
    pick: ['parameterization', 'cupon', 'user'],
  },
})
