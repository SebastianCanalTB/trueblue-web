export interface ListPlan {
  id: number
  name: string
  image: string
  ingredientsDescription: string
  nutritionalInformation: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Pet {
  id: number
  name: string
  status: string
}
export interface BodyCondition {
  id: number
  bodyCondition: string
  description: string
  image: string
}

export interface ListActivity {
  id: number
  title: string
  description: string
  image: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface Frecuency {
  id: number
  name: string
  days: number
  status: string
  createdAt: Date
  updatedAt: Date
}
export interface ListDogs {
  id: number
  name: string
  sex: string
  age: number
  month: number
  currentWeight: number
  photo: null
  sterilization: boolean
  status: string
  createdAt: Date
  updatedAt: Date
  deleted_at: null
  race: Race
}

export interface Race {
  id: number
  name: string
  status: string
  createdAt: Date
  updatedAt: Date
}
