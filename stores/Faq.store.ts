import { defineStore } from 'pinia'
interface FAQ {
  id: number
  name: string
  status: string
  createdAt: Date
  updatedAt: Date
  question: Question[]
}

interface Question {
  id: number
  question: string
  answer: string
  status: string
  createdAt: Date
  updatedAt: Date
}
const module = 'faq'
interface State {
  questions: FAQ[]
}
export const useFaqStore = defineStore('faq', {
  state: (): State => ({
    questions: [],
  }),
  actions: {
    async getAllQuestions() {
      this.questions = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'access',
        url: module + '/get-all-faq',
      })
      if (response.status && response.code === 100) {
        this.questions = response.data
      }
      return response
    },
  },
  getters: {
    getAllMyQuestions: (state): FAQ[] => {
      return state.questions.filter(
        (section) => section.question && section.question.length > 0,
      )
    },
  },
})
