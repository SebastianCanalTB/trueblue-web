import { defineStore } from 'pinia'
import type { Plan, ReasonsToInactive } from '~/interfaces/Plans.interface'
import type { planDelivery } from '~/interfaces/ActiveDeliveries.interface'
import type { MyPlanDetail } from '~/interfaces/myPlanDetail.interface'
interface State {
  plans: Plan
  myPlans: MyPlanDetail
  planDeliveries: planDelivery[]
  holyDates: Date[]
  reasonsToInactive: ReasonsToInactive[]
}

const module = 'plan'

export const usePlanStore = defineStore('plan', {
  state: (): State => ({
    plans: {} as Plan,
    myPlans: {} as MyPlanDetail,
    planDeliveries: [],
    holyDates: [],
    reasonsToInactive: [],
  }),
  actions: {
    async getReasonsToRefund() {
      this.reasonsToInactive = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: '/reason-to-inactive',
      })
      if (response.status && response.code === 100) {
        this.reasonsToInactive = response.data
      }
      return response
    },
    async updateMyNextDelivery(_id: any, _form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: `${module}/update-next-delivery/${_id}`,
        data: _form,
      })
      return response
    },
    async changeTotalOfPackages(_id: any, _form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: `${module}/${_id}/calculate-packages`,
        data: _form,
      })
      return response
    },
    async getListPlan() {
      this.plans = {} as Plan
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-list-plan',
      })
      if (response.status && response.code === 100) {
        this.plans = response.data
      }
      return response
    },
    async createPet(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/create-pet',
        data: _form,
      })
      return response
    },
    async updatePlan(_form: any, _id: any) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: module + '/update-plan/' + _id,
        data: _form,
      })
      return response
    },
    async getActivePets(_id: any) {
      this.planDeliveries = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-active-sub-plans/' + _id,
      })
      if (response.status && response.code === 100) {
        this.planDeliveries = response.data
      }
      return response
    },
    async getOnePlan(_id: any) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-detail-plan/' + _id,
      })
      if (response.status && response.code === 100) {
        this.myPlans = response.data
      }
      return response
    },
    async createPlan(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/create-plan',
        data: _form,
      })

      return response
    },
    async changePetStatus(_id: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/change-status-plan-pets/' + _id,
      })

      return response
    },
    async updatePet(_form: any, _id: any) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: module + '/update-pet/' + _id,
        data: _form,
      })

      return response
    },
    async changeStatus(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/change-status-plan',
        data: _form,
      })

      return response
    },
    async getNonDeliveryDates() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-dates',
      })

      if (response.status && response.code === 100) {
        const normalizedData = response.data.map((item) => ({
          ...item,
          dates: item.date,
        }))

        normalizedData.forEach((item) => delete item.date)

        this.holyDates = this.holyDates.concat(normalizedData)
      }

      return response
    },
    async getNonShippingDate() {
      this.holyDates = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-non-shipping-dates',
      })
      if (response.status && response.code === 100) {
        this.holyDates = response.data.holidays
      }
      return response
    },
  },
  getters: {
    getAllReasonsToInactive: (state): ReasonsToInactive[] => {
      return state.reasonsToInactive
    },
    getAllHolyDays: (state): Date[] => {
      return state.holyDates
    },
    getAllMyPlan: (state): Plan => {
      return state.plans
    },
    getAllMyPlanSelected: (state): MyPlanDetail => {
      return state.myPlans
    },
    getAllMyActivePets: (state): planDelivery[] => {
      return state.planDeliveries
    },
  },
})
