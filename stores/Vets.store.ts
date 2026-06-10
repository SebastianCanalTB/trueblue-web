import { defineStore } from 'pinia'

interface UserVet {
  firstName: string
  lastName: string
  email: string
  countryCode: string
  phone: string
  worksite?: string
  pushToken: string
  version: string
  type: string
  termsAndConditions: boolean
  token: string
}

interface VetRegistryPayload {
  userVet: UserVet
}

interface ReferralUsagePayload {
  filter: string
  limit: number
  offset: number
}

interface UsedByUser {
  id: string
  firstName: string
  lastName: string
  email: string
  countryCode: string
  phone: string
  document: string
  termsAndConditions: boolean
  photoUrl: string
  typePerson: string
  type: string
  verificationCode: string
  status: string
  createdAt: string
  updatedAt: string
  alegraId: string
}

interface ReferralUsageItem {
  id: number
  usedAt: string
  commissionValue: number
  applied: boolean
  status: string
  createdAt: string
  updatedAt: string
  delete_at: string | null
  usedBy: UsedByUser
}

interface ReferralCodesResponse {
  referralUsage: ReferralUsageItem[]
  rows: number
}

interface State {
  vets: any[]
  referralCodes: ReferralUsageItem[]
}

const module = 'vet'
const HARDCODED_TOKEN = 'CV-e910e8ee-b1c6-4872-afc4-1ee77208450b'

export const useVetsStore = defineStore('vets', {
  state: (): State => ({
    vets: [],
    referralCodes: [],
  }),
  actions: {
    async registryVet(
      _form: Omit<UserVet, 'token' | 'pushToken' | 'version' | 'type'>,
    ) {
      const payload: VetRegistryPayload = {
        userVet: {
          ..._form,
          pushToken: '123123123',
          version: '1.0',
          type: 'lc',
          token: HARDCODED_TOKEN,
        },
      }

      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'access',
        url: `${module}/registry`,
        data: payload,
      })

      return response
    },
    async getReferralCodes(payload: ReferralUsagePayload) {
      this.referralCodes = []
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: `${module}/get-referral-codes`,
        data: payload,
      })

      if (response.status && response.code === 100) {
        this.referralCodes = response.data.referralUsageWithNumber
      }

      return response
    },
  },
  getters: {
    getInfoReferralCodes: (state): ReferralUsageItem[] => {
      return state.referralCodes
    },
  },
})
