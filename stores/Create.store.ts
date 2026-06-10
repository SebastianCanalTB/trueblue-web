import { defineStore } from 'pinia'
import type {
  ListPlan,
  Pet,
  ListActivity,
  Frecuency,
  BodyCondition,
  ListDogs,
} from '~/interfaces/CreatePlans.interface'

import type { PetDetails } from '~/interfaces/PetDetail.interface.js'
const module = 'pets'

interface State {
  pets: Pet[]
  listPlans: ListPlan[]
  listActivities: ListActivity[]
  frecuencies: Frecuency[]
  bodyConditions: BodyCondition[]
  listDogs: ListDogs[]
  myPetDetail: PetDetails
  optionsPortions: any[]
}

export const useCreateStore = defineStore('create', {
  state: (): State => ({
    myPetDetail: {} as PetDetails,
    pets: [],
    listPlans: [],
    listActivities: [],
    frecuencies: [],
    bodyConditions: [],
    listDogs: [],
    optionsPortions: [],
  }),
  actions: {
    async getPets(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: module + '/get-list-races',
        data: _form,
      })
      if (response.status && response.code === 100) {
        this.pets = response.data
      }
      return response
    },

    async getOnePet(id: any) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-detail-pet/' + id,
      })
      if (response.status && response.code === 100) {
        this.myPetDetail = response.data
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
    async updatePet(_form: any, _id: any) {
      const response = await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: module + '/update-pet/' + _id,
        data: _form,
      })
      return response
    },
    async changePetStatus(id: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/change-status-pet/' + id,
      })

      return response
    },
    async deletePets(_id: any) {
      const response = await useApiServices({
        method: 'DELETE',
        typeHeader: 'auth',
        url: module + '/delete-pet/' + _id,
      })
      return response
    },
    async getMyPets() {
      this.listDogs = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-list-pets',
      })
      if (response.status && response.code === 100) {
        this.listDogs = response.data
      }
      return response
    },
    async getListBodyConditions() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/list-body-condition',
      })
      if (response.status && response.code === 100) {
        this.bodyConditions = response.data
      }
      return response
    },
    async getFrecuencies() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/list-frequency',
      })
      if (response.status && response.code === 100) {
        this.frecuencies = response.data
      }
      return response
    },
    async getPlans() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/list-products',
      })
      if (response.status && response.code === 100) {
        this.listPlans = response.data
      }
      return response
    },
    async getActivities() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-activities-pets',
      })
      if (response.status && response.code === 100) {
        this.listActivities = response.data
      }
      return response
    },
  },
  getters: {
    getlistMyPets: (state): ListDogs[] => {
      return state.listDogs
    },
    getMyPet: (state): PetDetails => {
      return state.myPetDetail
    },
    getListPets: (state): Pet[] => {
      return state.pets
    },
    getListActivities: (state): ListActivity[] => {
      return state.listActivities
    },
    getListPlans: (state): ListPlan[] => {
      return state.listPlans
    },
    getBodyConditions: (state): BodyCondition[] => {
      return state.bodyConditions
    },
    getListFrecuencies: (state): Frecuency[] => {
      return state.frecuencies
    },
    getPortionsOptions: (state): any[] => {
      const { t } = useI18n()
      state.optionsPortions = [
        {
          id: false,
          title: t('create.main.content.1.portions.notMixed.title'),
          description: t('create.main.content.1.portions.notMixed.desciprtion'),
          image: '/img/create/complete_plate.png',
        },
        {
          id: true,
          title: t('create.main.content.1.portions.mixed.title'),
          description: t('create.main.content.1.portions.mixed.desciprtion'),
          image: '/img/create/half_plate.png',
        },
      ]
      return state.optionsPortions
    },
  },
})
