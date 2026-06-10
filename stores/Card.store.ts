import { defineStore } from 'pinia'
interface Card {
  id: number
  brand: string
  lastFour: string
  cardName: string
  expiration: Date
  predetermined: boolean
}
interface State {
  cards: Card[]
}

const module = 'card'
export const useCardStore = defineStore('card', {
  state: (): State => ({
    cards: [],
  }),
  actions: {
    async getCards() {
      this.cards = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/get-list-cards',
      })
      if (response.status && response.code === 100) {
        this.cards = response.data
      }
      return response
    },
    async createCard(_form: any) {
      const response = await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: module + '/create-card',
        data: _form,
      })
      return response
    },
    async deleteCard(_id: number) {
      const response = await useApiServices({
        method: 'DELETE',
        typeHeader: 'auth',
        url: module + '/delete-card/' + _id,
      })

      return response
    },
    async markCard(_id: number) {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: module + '/mark-card-default/' + _id,
      })
      return response
    },
  },
  getters: {
    getAllMyCards: (state): Card[] => {
      return state.cards
    },
  },
})
