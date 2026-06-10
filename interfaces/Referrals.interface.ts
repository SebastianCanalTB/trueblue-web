export interface Referral {
  id: number
  usedAt: Date
  value: number
  valueType: string
  status: string
  createdAt: Date
  updatedAt: Date
  delete_at: null
  usedBy: UsedBy
}

export interface UsedBy {
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
}
