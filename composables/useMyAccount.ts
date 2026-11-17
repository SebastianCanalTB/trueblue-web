import { DateTime } from 'luxon'
import { storeToRefs } from 'pinia'

/**
 * Datos y reglas compartidas por todas las pantallas de Mi cuenta v3.
 *
 * Reglas de negocio (requerimiento Kubo, oct–nov 2026):
 * - Cobro siempre 4 días antes de la entrega (el backend corre domingos/festivos).
 * - El pedido en curso se puede editar mientras esté en preparación; desde
 *   "En alistamiento" queda bloqueado.
 * - No se pueden elegir domingos ni festivos; se puede elegir desde mañana.
 * - Fechas en formato "22 de septiembre" (sin año).
 */

export type OrderUiState =
  | 'preparacion'
  | 'alistamiento'
  | 'en_camino'
  | 'pago_fallido'
  | 'pago_pendiente'

export type PaymentFailure = 'saldo_insuficiente' | 'tarjeta_vencida'

export interface PlanProductRow {
  productId: number
  name: string
  image?: string
  numberOfPackages: number
  unitPrice: number
}

export interface PlanPetRow {
  petId: number
  name: string
  status: string
  grammage: number
  price: number
  products: PlanProductRow[]
}

const FINISHED_ORDER = ['delivered', 'cancelled', 'returned', 'refunded']
const EDITABLE_ORDER = ['created', 'pending_payment', 'in_preparation']
const CHARGE_DAYS_BEFORE = 4

export const FLAVOR_ICONS: Record<string, string> = {
  beef: '/icons/profile/ic_meat.svg',
  chicken: '/icons/profile/ic_chicken.svg',
  salmon: '/icons/profile/ic_fish.svg',
}

export const flavorKey = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('salmon')) return 'salmon'
  if (n.includes('chicken')) return 'chicken'
  if (n.includes('snack')) return 'snacks'
  return 'beef'
}

// ---------------- Fechas ----------------

const toDate = (value: any): DateTime | null => {
  if (!value) return null
  const str = String(value)
  const dt = str.length === 10 ? DateTime.fromISO(str) : DateTime.fromISO(str)
  return dt.isValid ? dt.setLocale('es') : null
}

/** "19 de noviembre" */
export const formatDay = (value: any) => {
  const dt = toDate(value)
  return dt ? dt.toFormat("d 'de' MMMM") : '-'
}

/** "jueves 19 de noviembre" */
export const formatLongDay = (value: any) => {
  const dt = toDate(value)
  return dt ? dt.toFormat("cccc d 'de' MMMM") : '-'
}

/** YYYY-MM-DD */
export const toIsoDay = (value: any) => {
  const dt = value instanceof Date ? DateTime.fromJSDate(value) : toDate(value)
  return dt ? dt.toFormat('yyyy-MM-dd') : ''
}

/** Fecha de cobro estimada para una entrega (4 días antes). */
export const chargeDateOf = (delivery: any) => {
  const dt = toDate(delivery)
  return dt ? dt.minus({ days: CHARGE_DAYS_BEFORE }).toFormat('yyyy-MM-dd') : ''
}

export const daysBetween = (from: any, to: any) => {
  const a = toDate(from)
  const b = toDate(to)
  if (!a || !b) return 0
  return Math.round(b.startOf('day').diff(a.startOf('day'), 'days').days)
}

/** "2 años y 3 meses" (sin i18n para poder usarlo dentro de computed). */
export const ageText = (years: any, months: any) => {
  const y = Number(years || 0)
  const m = Number(months || 0)
  const parts = []
  if (y > 0) parts.push(`${y} ${y === 1 ? 'año' : 'años'}`)
  if (m > 0) parts.push(`${m} ${m === 1 ? 'mes' : 'meses'}`)
  return parts.join(' y ') || '0 meses'
}

export const joinNames = (names: string[]) => {
  if (names.length <= 1) return names[0] || ''
  return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1]
}

export const useMyAccount = () => {
  const planStore = usePlanStore()
  const orderStore = useOrderStore()
  const accountStore = useAccountStore()
  const createStore = useCreateStore()

  const {
    getAllMyPlan: plan,
    getAllMyPlanSelected: planDetail,
    getAllHolyDays: holidays,
  } = storeToRefs(planStore)
  const { getAllMyOrders: orders } = storeToRefs(orderStore)
  const { getProfileInformation: profile } = storeToRefs(accountStore)
  const { getlistMyPets: myPets } = storeToRefs(createStore)

  const loaded = useState<boolean>('my-account-loaded', () => false)

  // ---------------- Carga ----------------

  const loadOrders = async () => {
    await orderStore.getOrders({
      filter: '',
      statusOrder: '',
      limit: 5,
      offset: 0,
      someStates: true,
    })
  }

  const load = async (opts: { force?: boolean; detail?: boolean } = {}) => {
    if (loaded.value && !opts.force && !opts.detail) return
    useLoading(true)
    await Promise.all([
      accountStore.getProfile(),
      planStore.getListPlan(),
      planStore.getNonShippingDate(),
      loadOrders(),
      createStore.getMyPets(),
    ])
    if (opts.detail && planId.value) await planStore.getOnePlan(planId.value)
    loaded.value = true
    useLoading(false)
  }

  const refresh = () => load({ force: true })

  // ---------------- Plan ----------------

  const planId = computed<number>(() => Number((plan.value as any)?.id || 0))
  const isCancelled = computed(
    () =>
      !!(plan.value as any)?.status && (plan.value as any).status !== 'active',
  )

  /** 1 = cada 4 semanas, 2 = cada 2 semanas (mismo criterio que myPets/create). */
  const frequencyId = computed(() => {
    const f = String((plan.value as any)?.frequency || '')
    return f.includes('2') ? 2 : 1
  })
  const frequencyDays = computed(() => (frequencyId.value === 2 ? 14 : 28))
  const frequencyLabel = computed(() =>
    frequencyId.value === 2 ? 'cada 2 semanas' : 'cada 4 semanas',
  )

  const planPets = computed<any[]>(() => (plan.value as any)?.pets || [])
  const petNames = computed(() =>
    joinNames(planPets.value.map((p: any) => p.name)),
  )

  /** Filas por mascota armadas desde get-detail-plan (incluye ids de producto). */
  const planRows = computed<PlanPetRow[]>(() => {
    const list = ((planDetail.value as any)?.userPlanDescription || []) as any[]
    return list.map((row: any) => {
      const listPet = planPets.value.find((p: any) => p.name === row.pets?.name)
      const recommended = row.pets?.recommendedFood || []
      const selected = row.pets?.descriptionProducts || []
      const source = recommended.length
        ? recommended
        : selected.map((s: any) => s.products)
      return {
        petId: row.pets?.id,
        name: row.pets?.name,
        status: row.status,
        grammage: parseInt(String(row.idealPortion || '0'), 10) || 0,
        price: Number(row.price || 0),
        products: source.map((prod: any) => {
          const sel = selected.find((s: any) => s.products?.id === prod.id)
          const listProd = listPet?.products?.find(
            (p: any) => p.name === prod.name,
          )
          return {
            productId: prod.id,
            name: prod.name,
            image: prod.imageProduct || prod.image,
            numberOfPackages: Number(sel?.numberOfPackages || 0),
            unitPrice: Number(listProd?.price || prod.price || 0),
          }
        }),
      }
    })
  })

  // ---------------- Pedidos ----------------

  const currentOrders = computed<any[]>(() =>
    ((orders.value as any[]) || [])
      .filter((o) => !FINISHED_ORDER.includes(o.statusOrder))
      .sort((a, b) => String(a.delivery).localeCompare(String(b.delivery))),
  )

  const orderState = (order: any): OrderUiState => {
    if (order?.statusPayment === 'rejected') return 'pago_fallido'
    if (order?.statusPayment === 'pending' || !order?.statusPayment)
      return order?.statusOrder === 'in_preparation'
        ? 'preparacion'
        : 'pago_pendiente'
    if (order?.statusOrder === 'on_the_way') return 'en_camino'
    if (order?.statusOrder === 'delivered_to_the_carrier') return 'alistamiento'
    return 'preparacion'
  }

  const isOrderEditable = (order: any) =>
    EDITABLE_ORDER.includes(order?.statusOrder) &&
    !['alistamiento', 'en_camino'].includes(orderState(order))

  /**
   * Motivo del rechazo. CAMPO NUEVO que debe enviar el backend en get-all-order:
   * paymentFailureReason: 'insufficient_funds' | 'expired_card'.
   * Si no viene, se asume saldo insuficiente (botón "Reintentar pago").
   */
  const paymentFailure = (order: any): PaymentFailure =>
    order?.paymentFailureReason === 'expired_card'
      ? 'tarjeta_vencida'
      : 'saldo_insuficiente'

  // ---------------- Calendario ----------------

  const holidaySet = computed(
    () =>
      new Set(
        ((holidays.value as any[]) || []).map(
          (h: any) => h.dates || h.date || h,
        ),
      ),
  )

  const isBusinessDay = (date: Date) => {
    if (date.getDay() === 0) return false
    return !holidaySet.value.has(toIsoDay(date))
  }

  const tomorrowBusinessDay = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    while (!isBusinessDay(d)) d.setDate(d.getDate() + 1)
    return d
  }

  /** Si la nueva fecha se cobra hoy o antes (ventana de cobro). */
  const chargesToday = (deliveryIso: string) =>
    daysBetween(DateTime.now().toISODate(), chargeDateOf(deliveryIso)) <= 0

  // ---------------- Texto ----------------

  const packagesText = (products: any[] = []) => {
    const real = products.filter((p) => flavorKey(p.name) !== 'snacks')
    const total = real.reduce((s, p) => s + Number(p.numberOfPackages || 0), 0)
    const detail = real
      .filter((p) => Number(p.numberOfPackages) > 0)
      .map((p) => `${p.numberOfPackages} ${p.name}`)
      .join(', ')
    return {
      total,
      label: `${total} ${total === 1 ? 'paquete' : 'paquetes'}`,
      detail: detail ? `(${detail})` : '',
    }
  }

  const addressText = (a: any) => {
    if (!a) return '-'
    return [a.address, a.complement, a.city].filter(Boolean).join(', ')
  }

  // ---------------- Actualizar plan (servicio existente update-plan) ----------------

  /**
   * Arma el payload de plan/update-plan igual que usePlanFlow.finishProcess.
   * Se usa para cantidad/sabores, frecuencia, fecha y dirección del plan.
   */
  const buildPlanUpdatePayload = (changes: {
    frequencyId?: number
    deliveryDate?: string
    addressId?: number
    rows?: PlanPetRow[]
    removePetId?: number
    snacks?: number
    /** Datos de la mascota editados en Mis mascotas (mismo formato que usePlanFlow). */
    petData?: Record<number, Record<string, any>>
  }) => {
    const rows = changes.rows || planRows.value
    return {
      deliveryDate:
        changes.deliveryDate || toIsoDay((plan.value as any)?.nextDelivery),
      flag: 'general',
      userPlan: { frequency: changes.frequencyId || frequencyId.value },
      pets: rows.map((r) => ({
        petId: r.petId,
        status:
          changes.removePetId && r.petId === changes.removePetId
            ? 'inactive'
            : r.status === 'inactive'
              ? 'inactive'
              : 'active',
        grammage: r.grammage,
        detailProducts: r.products
          .filter((p) => p.numberOfPackages > 0)
          .map((p) => ({
            id: p.productId,
            numberOfPackages: p.numberOfPackages,
          })),
        ...(changes.petData?.[r.petId] || {}),
      })),
      // PROPUESTA: snacks por plan (no por mascota). Kubo confirma el nombre del campo.
      ...(changes.snacks !== undefined ? { snacks: changes.snacks } : {}),
      checkout: checkoutData(changes.addressId),
      code: '',
    }
  }

  /** Datos de checkout del cliente (igual que myPlan/edit/checkout.vue). */
  const checkoutData = (addressId?: number) => {
    const prof: any = profile.value || {}
    return {
      addressId: addressId || prof?.addresses?.[0]?.id,
      cardId: prof?.card?.[0]?.id,
      name: prof.firstName,
      surname: prof.lastName,
      email: prof.email,
      phone: prof.phone,
      document: prof.document,
      countryCode: prof.countryCode,
      documentType: prof?.documentType?.id,
    }
  }

  const rowsTotal = (rows: PlanPetRow[]) =>
    rows.reduce(
      (sum, r) =>
        sum +
        r.products.reduce(
          (s, p) => s + p.numberOfPackages * (p.unitPrice || 0),
          0,
        ),
      0,
    )

  return {
    // estado
    plan,
    planDetail,
    orders,
    profile,
    myPets,
    loaded,
    // carga
    load,
    refresh,
    loadOrders,
    // plan
    planId,
    isCancelled,
    frequencyId,
    frequencyDays,
    frequencyLabel,
    planPets,
    petNames,
    planRows,
    // pedidos
    currentOrders,
    orderState,
    isOrderEditable,
    paymentFailure,
    // calendario
    isBusinessDay,
    tomorrowBusinessDay,
    chargesToday,
    // texto
    packagesText,
    addressText,
    // updates
    buildPlanUpdatePayload,
    checkoutData,
    rowsTotal,
  }
}
