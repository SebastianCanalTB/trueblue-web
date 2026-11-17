<script setup lang="ts">
/**
 * Referidos v3. Servicios existentes: account/get-profile (referralCode.code),
 * account/generate-referral-code, account/get-referral-codes, referral-code/get-code-values.
 */
const accountStore = useAccountStore()
const referralStore = useReferralStore()
const { getProfileInformation: profile, getInfoReferralList: referrals } =
  storeToRefs(accountStore)
const { getInfoReferalCodes: values } = storeToRefs(referralStore)
const { track } = useTracking()

const code = ref('')

onMounted(async () => {
  useLoading(true)
  await Promise.all([
    accountStore.getProfile(),
    referralStore.getReferalCodes(),
    accountStore.getReferralList({ filter: '', limit: 20, offset: 0 }),
  ])
  code.value = useSearchItemJson('referralCode.code', profile.value)
  if (!code.value) {
    await accountStore.generateReferralCodeInfo()
    await accountStore.getProfile()
    code.value = useSearchItemJson('referralCode.code', profile.value)
  }
  useLoading(false)
})

const discount = computed(() => {
  const v: any = (values.value as any[])?.[0]
  return v
    ? String(v.type).includes('%') || v.value < 100
      ? `${v.value}%`
      : useFormatPrice(v.value)
    : '15%'
})

const copy = async () => {
  try {
    await navigator.clipboard.writeText(code.value)
    track('referido_codigo_copiado')
    useShowAlert({ type: 'success', message: 'Copiamos tu código.' })
  } catch {
    useShowAlert({
      type: 'error',
      message: 'No pudimos copiar el código. Cópialo a mano.',
    })
  }
}
</script>

<template>
  <div class="ma-page">
    <h1>Referidos</h1>
    <section class="ma-box is-soft">
      <h2>Recibe {{ discount }} de descuento por cada amigo que invites</h2>
      <div class="ma-row">
        <b class="ma-code">{{ code || '—' }}</b>
        <button class="ma-btn" :disabled="!code" @click="copy">
          Copiar código
        </button>
      </div>
    </section>
    <section class="ma-box">
      <h3>Tus referidos</h3>
      <ul v-if="referrals.length" style="margin: 0; padding-left: 18px">
        <li v-for="r in referrals" :key="r.id">
          {{ r.usedBy?.firstName }} · {{ formatDay(r.usedAt) }}
        </li>
      </ul>
      <span v-else class="ma-sub">Aún no tienes referidos.</span>
    </section>
  </div>
</template>

<style scoped lang="scss">
.ma-code {
  font-family: 'heading-pro-treble-bold';
  font-size: 24px;
  letter-spacing: 0.08em;
  color: #003b71;
}
</style>
