export interface PetDetails {
  id: number
  name: string
  sex: string
  age: number
  month: number
  currentWeight: number
  sterilization: boolean
  race: Race
  petsActivity: PetsActivity
  bodyCondition: BodyCondition
  planDescription: PlanDescription
  total: number
  nextDelivery: Date
}

export interface BodyCondition {
  id: number
  bodyCondition: string
}

export interface PetsActivity {
  id: number
  title: string
}

export interface PlanDescription {
  id: number
  idealPortion: string
  descriptionProducts: DescriptionProduct[]
}

export interface DescriptionProduct {
  id: number
  products: Race
}

export interface Race {
  id: number
  name: string
}
