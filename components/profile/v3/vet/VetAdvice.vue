<script setup lang="ts">
/**
 * Asesoría veterinaria v3: asesoría agendada, contacto rápido, agendar
 * (mascota, motivo, horario) e historial de consultas con su resumen.
 * Todos los servicios de agenda e historial son PROPUESTA (ver MyAccount.store.ts).
 * Si la agenda no responde, se muestra solo el bloque de contacto (alcance V1).
 */
const route = useRoute()
const myAccountStore = useMyAccountStore()
const { track } = useTracking()
const { load, myPets } = useMyAccount()

const REASONS = [
  ['general', 'Asesoría general'],
  ['etapa', 'Cambio de etapa'],
  ['salud', 'Problema de salud'],
  ['peso', 'Peso'],
  ['receta', 'Elegir receta'],
  ['otro', 'Otro'],
]

const petId = ref<number | null>(null)
const reason = ref(String(route.query.motivo || 'general'))
const slotId = ref('')
const agendaOk = ref(true)
const historyFilter = ref<number | 'all'>('all')
const summaryOpen = ref(false)
const rescheduling = ref(route.query.reprogramar === '1')

const pets = computed(() => (myPets.value as any[]) || [])
const appointment = computed(() => myAccountStore.currentAppointment)
const slots = computed(() => myAccountStore.slotsList)
const consultations = computed(() =>
  myAccountStore.consultationList.filter(
    (c: any) =>
      historyFilter.value === 'all' || c.petId === historyFilter.value,
  ),
)
const detail = computed(() => myAccountStore.currentConsultation)

const slotsByDay = computed(() => {
  const out: Record<string, any[]> = {}
  ;(slots.value || []).forEach((s: any) => {
    ;(out[s.date] = out[s.date] || []).push(s)
  })
  return out
})

onMounted(async () => {
  await load()
  const wanted = Number(route.query.pet || 0)
  petId.value =
    pets.value.find((p) => p.id === wanted)?.id || pets.value[0]?.id || null
  if (route.query.pet) historyFilter.value = Number(route.query.pet)
  const [s] = await Promise.all([
    myAccountStore.fetchVetSlots(),
    myAccountStore.fetchVetAppointment(),
    myAccountStore.fetchConsultations(),
  ])
  agendaOk.value = s.status && s.code === 100
})

const pickPet = (p: any, i: number) => {
  petId.value = p.id
  track('formulario_campo_seleccionado', {
    formulario: 'asesoria_vet',
    campo: 'mascota',
    mascota_posicion: i + 1,
  })
}
const pickReason = (k: string) => {
  reason.value = k
  track('formulario_campo_seleccionado', {
    formulario: 'asesoria_vet',
    campo: 'motivo',
    opcion: k,
  })
}
const pickSlot = (s: any) => {
  slotId.value = s.id
  track('formulario_campo_seleccionado', {
    formulario: 'asesoria_vet',
    campo: 'horario',
  })
}

const reasonLabel = (k: string) => REASONS.find((r) => r[0] === k)?.[1] || k

const schedule = async () => {
  if (!petId.value || !slotId.value) return
  useLoading(true)
  const isUpdate = rescheduling.value && !!appointment.value
  const res = await myAccountStore.saveVetAppointment({
    appointmentId: isUpdate ? appointment.value!.id : undefined,
    petId: petId.value,
    reason: reason.value,
    slotId: slotId.value,
    origin: String(route.query.motivo ? 'redireccion' : 'asesoria_vet'),
  })
  useLoading(false)
  if (res.status && res.code === 100) {
    track(isUpdate ? 'asesoria_actualizado' : 'asesoria_creado', {
      motivo_asesoria: reason.value,
      origen: String(route.query.origen || 'asesoria_vet'),
      mascota_posicion: pets.value.findIndex((p) => p.id === petId.value) + 1,
    })
    useShowAlert({
      type: 'success',
      message: 'Listo. Agendamos tu asesoría veterinaria.',
    })
    rescheduling.value = false
    slotId.value = ''
    await Promise.all([
      myAccountStore.fetchVetAppointment(),
      myAccountStore.fetchVetSlots(),
    ])
  } else useShowAlert({ type: 'error', message: res.message })
}

const reschedule = () => {
  track('asesoria_reprogramar_inicio', { origen: 'asesoria_vet' })
  rescheduling.value = true
  if (typeof document !== 'undefined')
    document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' })
}
const cancelAppointment = async () => {
  if (!appointment.value) return
  useLoading(true)
  const res = await myAccountStore.cancelVetAppointment(appointment.value.id)
  useLoading(false)
  if (res.status && res.code === 100) {
    track('asesoria_cancelado', { motivo_asesoria: appointment.value.reason })
    useShowAlert({ type: 'success', message: 'Cancelamos tu asesoría.' })
    await myAccountStore.fetchVetAppointment()
  } else useShowAlert({ type: 'error', message: res.message })
}

const filter = (v: number | 'all') => {
  historyFilter.value = v
  track('formulario_campo_seleccionado', {
    formulario: 'historial_consultas',
    campo: 'mascota',
  })
}
const openSummary = async (c: any) => {
  track('consulta_resumen_visto', {
    mascota_posicion: pets.value.findIndex((p) => p.id === c.petId) + 1,
  })
  useLoading(true)
  await myAccountStore.fetchConsultationDetail(c.id)
  useLoading(false)
  summaryOpen.value = true
}
const downloadPdf = () => {
  track('consulta_descarga_completado')
  // PROPUESTA: el detalle trae pdfUrl generado por Kubo.
  if (detail.value?.pdfUrl) window.open(detail.value.pdfUrl, '_blank')
  else window.print()
}
</script>

<template>
  <div class="ma-page">
    <h1>Asesoría veterinaria</h1>

    <section v-if="appointment" class="ma-box" style="border-color: #003b71">
      <div class="ma-row">
        <div>
          <h3>Tu asesoría agendada</h3>
          <span class="ma-small">
            Para {{ appointment.petName }} ·
            {{ formatLongDay(appointment.date) }}, {{ appointment.time }} (20
            min) · con {{ appointment.vetName }} por videollamada · Motivo:
            {{ reasonLabel(appointment.reason) }}
          </span>
        </div>
        <div class="ma-row">
          <button class="ma-btn is-outline" @click="reschedule">
            Reprogramar
          </button>
          <button
            class="ma-link"
            style="color: #b42318"
            @click="cancelAppointment"
          >
            Cancelar asesoría
          </button>
        </div>
      </div>
    </section>

    <span class="ma-sub"
      >Agenda una asesoría de 20 minutos, sin costo, con nuestro equipo
      veterinario por videollamada o WhatsApp.</span
    >

    <ProfileV3CommonContactBox
      origen="asesoria_vet"
      text="¿Tienes una pregunta rápida? Te atendemos de lunes a sábado, de 8:00 a. m. a 7:00 p. m."
    />

    <section
      v-if="agendaOk && (!appointment || rescheduling)"
      id="agenda"
      class="ma-box"
    >
      <template v-if="pets.length > 1">
        <h3>¿Para cuál de tus mascotas?</h3>
        <div class="ma-row" style="justify-content: flex-start">
          <button
            v-for="(p, i) in pets"
            :key="p.id"
            class="ma-pill"
            :class="{ 'is-on': petId === p.id }"
            @click="pickPet(p, i)"
          >
            {{ p.name }}
          </button>
        </div>
      </template>
      <h3>¿Sobre qué quieres hablar?</h3>
      <div class="ma-row" style="justify-content: flex-start">
        <button
          v-for="r in REASONS"
          :key="r[0]"
          class="ma-pill"
          :class="{ 'is-on': reason === r[0] }"
          @click="pickReason(r[0])"
        >
          {{ r[1] }}
        </button>
      </div>
      <h3>Elige un horario</h3>
      <div class="ma-slots">
        <div v-for="(list, day) in slotsByDay" :key="day" class="ma-slot-day">
          <span class="ma-small">{{ formatLongDay(day) }}</span>
          <button
            v-for="s in list"
            :key="s.id"
            class="ma-pill"
            :class="{ 'is-on': slotId === s.id }"
            @click="pickSlot(s)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
      <span v-if="!slots.length" class="ma-small"
        >No hay horarios disponibles en este momento. Llámanos y te
        agendamos.</span
      >
      <div class="ma-row" style="justify-content: flex-start">
        <button class="ma-btn" :disabled="!slotId || !petId" @click="schedule">
          {{ rescheduling ? 'Reprogramar' : 'Agendar' }}
        </button>
        <span v-if="!slotId" class="ma-small">Elige un horario</span>
      </div>
    </section>

    <section id="historial" class="ma-box">
      <h2>Historial de consultas</h2>
      <div
        v-if="pets.length > 1"
        class="ma-row"
        style="justify-content: flex-start"
      >
        <button
          class="ma-pill"
          :class="{ 'is-on': historyFilter === 'all' }"
          @click="filter('all')"
        >
          Todas
        </button>
        <button
          v-for="p in pets"
          :key="p.id"
          class="ma-pill"
          :class="{ 'is-on': historyFilter === p.id }"
          @click="filter(p.id)"
        >
          {{ p.name }}
        </button>
      </div>
      <div style="overflow-x: auto">
        <table v-if="consultations.length" class="ma-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Mascota</th>
              <th>Motivo</th>
              <th>Veterinaria</th>
              <th>Resumen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in consultations" :key="c.id">
              <td>{{ formatDay(c.date) }}</td>
              <td>
                <b>{{ c.petName }}</b>
              </td>
              <td>{{ c.reason }}</td>
              <td>{{ c.vetName }}</td>
              <td>
                <button class="ma-link" @click="openSummary(c)">
                  Ver resumen
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <span v-if="!consultations.length" class="ma-sub"
        >Aún no tienes consultas registradas.</span
      >
    </section>

    <!-- Resumen de la consulta (formato definido por True Blue; Kubo automatiza los datos) -->
    <ProfileV3CommonModal
      :show="summaryOpen"
      title="Resumen de la consulta"
      @close="summaryOpen = false"
    >
      <template v-if="detail">
        <div
          class="ma-box"
          style="background: #003b71; color: #fff; border: none"
        >
          <b style="font-size: 20px">{{ detail.petName }}</b>
          <span>{{ detail.petAge }} · {{ detail.petBreed }}</span>
          <span
            >Consulta del {{ formatDay(detail.date) }} · Atendió:
            {{ detail.vetName }} · Asesoría nutricional (virtual)</span
          >
        </div>
        <div class="ma-grid-2">
          <div class="ma-box is-soft">
            <span class="ma-small">Peso actual</span
            ><b>{{ detail.weight }} kg</b>
          </div>
          <div class="ma-box is-soft">
            <span class="ma-small">Condición corporal</span
            ><b>{{ detail.bodyCondition }} de 9</b>
          </div>
          <div class="ma-box is-soft">
            <span class="ma-small">Sabor que está consumiendo</span
            ><b>{{ detail.flavor }}</b>
          </div>
        </div>
        <div class="ma-box">
          <span class="ma-label">Patologías preexistentes</span
          ><span>{{ detail.pathologies || 'Ninguna reportada' }}</span>
        </div>
        <div class="ma-box">
          <span class="ma-label">Motivo de consulta</span
          ><span>{{ detail.reasonDetail }}</span>
        </div>
        <div class="ma-box">
          <span class="ma-label">Resumen del cuadro presentado</span>
          <span v-if="!(detail.clinicalSigns || []).length"
            >No se reportaron signos clínicos.</span
          >
          <ul v-else style="margin: 0">
            <li v-for="s in detail.clinicalSigns" :key="s">{{ s }}</li>
          </ul>
        </div>
        <div class="ma-box">
          <span class="ma-label">Resumen de observaciones</span>
          <span v-if="!(detail.observations || []).length"
            >Sin observaciones.</span
          >
          <ul v-else style="margin: 0">
            <li v-for="o in detail.observations" :key="o">{{ o }}</li>
          </ul>
        </div>
        <div class="ma-box is-soft">
          <span class="ma-label">Recomendaciones</span
          ><span>{{ detail.recommendations }}</span>
        </div>
      </template>
      <template #footer>
        <button class="ma-btn" @click="downloadPdf">Descargar PDF</button>
      </template>
    </ProfileV3CommonModal>
  </div>
</template>

<style scoped lang="scss">
.ma-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.ma-slot-day {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ma-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th {
    text-align: left;
    font-family: 'heading-pro-treble-bold';
    font-size: 12px;
    text-transform: uppercase;
    color: #575e6b;
    padding: 10px 12px;
    border-bottom: 1px solid #dfe5ee;
  }
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #dfe5ee;
  }
}
</style>
