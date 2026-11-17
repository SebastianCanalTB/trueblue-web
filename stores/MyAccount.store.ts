import { defineStore } from 'pinia'

/**
 * Store de Mi cuenta v3.
 *
 * Aquí solo están los servicios NUEVOS que necesita el rediseño. Todo lo que ya
 * existe se sigue usando desde su store (plan, order, card, address, create,
 * account, calculator).
 *
 * Los endpoints marcados con "PROPUESTA" no existen hoy en el backend: el nombre
 * y el payload son una propuesta para que Kubo los confirme o los cambie aquí.
 * Mientras no existan, el front muestra un mensaje de error controlado o un
 * camino alterno (llamar / WhatsApp), nunca se rompe la página.
 */

export interface VetSlot {
  id: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  label: string // "9:00 a. m."
}

export interface VetAppointment {
  id: number
  petId: number
  petName: string
  reason: string
  date: string
  time: string
  vetName: string
  channel: string
}

export interface VetConsultation {
  id: number
  date: string
  petId: number
  petName: string
  reason: string
  vetName: string
}

interface State {
  vetSlots: VetSlot[]
  vetAppointment: VetAppointment | null
  consultations: VetConsultation[]
  consultationDetail: any
  adultNoticeSeen: number[]
}

export const useMyAccountStore = defineStore('myAccount', {
  state: (): State => ({
    vetSlots: [],
    vetAppointment: null,
    consultations: [],
    consultationDetail: null,
    adultNoticeSeen: [],
  }),
  actions: {
    // ---------------- Plan ----------------

    /**
     * PROPUESTA: cambiar la dirección de los pedidos siguientes del plan.
     * Hoy la dirección del plan solo cambia dentro de update-plan (checkout.addressId).
     * Si Kubo prefiere eso, este método se puede reemplazar por usePlanUpdate().
     */
    async updatePlanAddress(
      planId: number,
      form: {
        addressId?: number
        address: string
        complement: string
        cityId: number
        neighborhood?: string
        deliveryNotes?: string
      },
    ) {
      return await useApiServices({
        method: 'PATCH',
        typeHeader: 'auth',
        url: `plan/${planId}/change-address`,
        data: form,
      })
    },

    /** PROPUESTA: cambiar solo la frecuencia (1 = cada 4 semanas, 2 = cada 2 semanas). */
    async updatePlanFrequency(planId: number, frequencyId: number) {
      return await useApiServices({
        method: 'PATCH',
        typeHeader: 'auth',
        url: `plan/${planId}/change-frequency`,
        data: { frequencyId },
      })
    },

    /**
     * Cancelar el plan. Usa el servicio existente plan/change-status y le agrega
     * campos nuevos que el backend debe guardar (PROPUESTA):
     * - destinationBrand: marca a la que se va (solo no le gustó, costoso y salud)
     * - petId: mascota que partió (fallecimiento con 2 o más mascotas)
     * - healthIssue: tipo de problema de salud
     */
    async cancelPlan(form: {
      reasonToInactiveId: number
      description: string
      destinationBrand?: string
      petId?: number
      healthIssue?: string
    }) {
      return await useApiServices({
        method: 'POST',
        typeHeader: 'auth',
        url: 'plan/change-status-plan',
        data: form,
      })
    },

    // ---------------- Mascotas ----------------

    /**
     * PROPUESTA: salud de la mascota (también se usa en el formulario de compra).
     * allergyFlavors: 'beef' | 'chicken' | 'salmon'. Si se elige un sabor al que es
     * alérgica, el front muestra un aviso pero no lo bloquea.
     */
    async updatePetHealth(
      petId: number,
      form: {
        medicalConditions: string[]
        allergyFlavors: string[]
        otherCondition: string
        healthComments: string
      },
    ) {
      return await useApiServices({
        method: 'PUT',
        typeHeader: 'auth',
        url: `pets/update-health/${petId}`,
        data: form,
      })
    },

    // ---------------- Asesoría veterinaria ----------------

    /** PROPUESTA: horarios disponibles de las veterinarias. */
    async fetchVetSlots() {
      this.vetSlots = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: 'vet-appointment/available-slots',
      })
      if (response.status && response.code === 100) {
        this.vetSlots = response.data
      }
      return response
    },

    /** PROPUESTA: asesoría agendada del cliente (o null). */
    async fetchVetAppointment() {
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: 'vet-appointment/current',
      })
      this.vetAppointment =
        response.status && response.code === 100 ? response.data : null
      return response
    },

    /** PROPUESTA: agendar o reprogramar. */
    async saveVetAppointment(form: {
      appointmentId?: number
      petId: number
      reason: string
      slotId: string
      origin: string
    }) {
      return await useApiServices({
        method: form.appointmentId ? 'PUT' : 'POST',
        typeHeader: 'auth',
        url: form.appointmentId
          ? `vet-appointment/update/${form.appointmentId}`
          : 'vet-appointment/create',
        data: form,
      })
    },

    /** PROPUESTA */
    async cancelVetAppointment(id: number) {
      return await useApiServices({
        method: 'PATCH',
        typeHeader: 'auth',
        url: `vet-appointment/cancel/${id}`,
      })
    },

    /** PROPUESTA: historial de consultas (lo arma Kubo desde los formularios de las veterinarias). */
    async fetchConsultations() {
      this.consultations = []
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: 'vet-appointment/history',
      })
      if (response.status && response.code === 100) {
        this.consultations = response.data
      }
      return response
    },

    /** PROPUESTA */
    async fetchConsultationDetail(id: number) {
      this.consultationDetail = null
      const response = await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: `vet-appointment/history/${id}`,
      })
      if (response.status && response.code === 100) {
        this.consultationDetail = response.data
      }
      return response
    },

    // ---------------- Pedidos ----------------

    /** PROPUESTA: URL de la factura (Alegra) de un pedido entregado. */
    async getInvoiceUrl(orderId: number) {
      return await useApiServices({
        method: 'GET',
        typeHeader: 'auth',
        url: `order/get-invoice/${orderId}`,
      })
    },

    // ---------------- Avisos ----------------

    /** El aviso de paso a adulto se muestra hasta que el cliente toca "Entendido". */
    markAdultNoticeSeen(petId: number) {
      if (!this.adultNoticeSeen.includes(petId))
        this.adultNoticeSeen.push(petId)
    },
  },
  getters: {
    slotsList: (state) => state.vetSlots,
    currentAppointment: (state) => state.vetAppointment,
    consultationList: (state) => state.consultations,
    currentConsultation: (state) => state.consultationDetail,
  },
  persist: {
    pick: ['adultNoticeSeen'],
  },
})
