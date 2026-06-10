import { defineStore } from 'pinia'

interface State {
  authToken: string
  accessToken: string
  user: User | unknown
}

export const useOnboardingStore = defineStore('onboarding', {
  state: (): State => ({ user: undefined, authToken: '', accessToken: '' }),
  actions: {
    async sendCode(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        url: '/account/send-code',
        typeHeader: 'access',
        data: _form,
      })
      return response
    },
    async login(form: object) {
      const response = await useApiServices({
        method: 'POST',
        url: '/account/login',
        data: form,
      })
      if (response?.status && response?.code === 100) {
        setLoginUser(response.data)
      }
      return response
    },
    async logout() {
      const result = await useApiServices({
        method: 'POST',
        url: '/account/logout',
        typeHeader: 'auth',
      })

      setLoginUser({ user: undefined, authToken: undefined })

      return result
    },
  },
  getters: {
    getLoginUser: (state) => {
      return state.user
    },
    canSeePlanButton: (state) => {
      return state.user?.type === 'both' || state.user?.type === 'user'
    },
  },
  persist: true,
})
