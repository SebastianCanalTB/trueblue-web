export interface MyPlanDetail {
  id: number
  status: string
  createdAt: Date
  updatedAt: Date
  frequency: Frequency
  userPlanDescription: UserPlanDescription[]
}

export interface Frequency {
  id: number
  name: string
  days: number
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPlanDescription {
  id: number
  idealPortion: string
  status: string
  createdAt: Date
  updatedAt: Date
  pets: Pets
}

export interface Pets {
  id: number
  name: string
  sex: string
  age: number
  month: number
  currentWeight: number
  photo: null
  sterilization: boolean
  createdAt: Date
  updatedAt: Date
  descriptionProducts: DescriptionProduct[]
}

export interface DescriptionProduct {
  id: number
  createdAt: Date
  updatedAt: Date
  products: Products
}

export interface Products {
  id: number
  name: string
  image: string
  ingredientsDescription: string
  nutritionalInformation: string
  price: number
  status: string
  createdAt: Date
  updatedAt: Date
}
