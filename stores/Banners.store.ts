import { defineStore } from 'pinia'
interface Banner {
  id: number
  module: string
  image: string
  redirection: boolean
  link: string
  status: string
  createdAt: Date
  updatedAt: Date
}

interface State {
  banner: Banner[]
}
const module = 'banner'
export const useBannerStore = defineStore('banner', {
  state: (): State => ({
    banner: [],
  }),
  actions: {
    async getBanners() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-all-banners',
      })
      if (response.status && response.code === 100) {
        this.banner = response.data
      }
      return response
    },
  },
  getters: {
    getBannerInfo: (state): Banner[] => {
      return state.banner
    },
  },
  persist: true,
})
