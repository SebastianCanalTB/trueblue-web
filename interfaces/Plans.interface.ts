export interface Plan {
  id: number
  status: string
  frequency: string
  total: number
  nextPayment: Date
  nextDelivery: Date
  address: Address
  card: Card
  pets: Pet[]
}

export interface Address {
  address: string
  complement: string
  city: string
}

export interface Card {
  brand: string
  lastFour: string
  cardName: string
}

export interface Pet {
  name: string
  idealPortion: string
  products: Product[]
}

export interface Product {
  numberOfPackages: number
  name: string
  price: number
}
export interface ReasonsToInactive {
  id: number
  name: string
  status: string
  createdAt: Date
}
