export interface OrderDetail {
  id: number
  subtotal: number
  shipping: number
  discount: number
  iva: number
  total: number
  frequency: string
  statusPayment: string
  statusOrder: string
  createdAt: Date
  updatedAt: Date
  brand: string
  lastFour: string
  cardName: string
  address: string
  complement: string
  city: string
  name: string
  phone: string
  email: string
  identification: string
  nextPayment: Date
  nextDelivery: Date
  asset: boolean
  attemptApproved: boolean
  numberOfAttempts: number
  orderDetail: OrderDetailElement[]
  user: User
}

export interface OrderDetailElement {
  id: number
  idealPortion: string
  pet: string
  price: number
  createdAt: Date
  updatedAt: Date
  detailProducts: DetailProduct[]
}

export interface DetailProduct {
  id: number
  name: string
  numberOfPackages: number
  createdAt: Date
  updatedAt: Date
}

export interface User {
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
  createdAt: Date
  updatedAt: Date
  card: Card[]
}

export interface Card {
  id: number
  cardId: string
  brand: string
  lastFour: string
  cardName: string
  accountName: null
  predetermined: boolean
  typePaymentMethod: string
  createdAt: Date
  updatedAt: Date
  delete_at: null
}
