export interface OrderDetailId {
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
  delivery: Date
  asset: boolean
  attemptApproved: boolean
  numberOfAttempts: number
  quickServiceId: null
  alegraInvoiceId: null
  alegraFullNumber: null
  cityId: number
  user: User
  tracking: Tracking[]
  orderDetail: OrderDetail[]
  cities: Cities
}

export interface Cities {
  id: number
  name: string
  cityGroup: CityGroup
}

export interface CityGroup {
  id: number
  name: string
}

export interface OrderDetail {
  id: number
  idealPortion: string
  pet: string
  price: number
  createdAt: Date
  updatedAt: Date
  deleted_at: null
  detailProducts: DocumentType[]
  petDetail: PetDetail
}

export interface DocumentType {
  id: number
  name: string
  numberOfPackages?: number
  createdAt: Date
  updatedAt: Date
  alias?: string
}

export interface PetDetail {
  id: number
  name: string
  sex: string
  age: number
  month: number
  currentWeight: number
  photo: null
  sterilization: boolean
  isMixedFood: boolean
  status: string
  createdAt: Date
  updatedAt: Date
  deleted_at: null
  recommendedProducts: RecommendedProduct[]
}

export interface RecommendedProduct {
  id: number
  name: string
  imageProduct: string
  description: string
  recommended: boolean
  nutritionalInformation: NutritionalInformation
  attributes: Attribute[]
}

export interface Attribute {
  id: number
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export interface NutritionalInformation {
  id: number
  imageNutritional: string
  ingredients: string
}

export interface Tracking {
  id: number
  statusOrder: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  photoUrl: string
  typePerson: string
  documentType: DocumentType
}
