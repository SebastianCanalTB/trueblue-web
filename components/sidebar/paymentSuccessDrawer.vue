<script setup lang="ts">
const emit = defineEmits(['closeModal', 'update:visible'])

const props = defineProps({
  orderId: {
    type: Number,
    required: true,
  },
})
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const homeBenefitsCard = ref([
  {
    url: '/icons/ic_home_heart.svg',
    title: t('home.sectionBenefits.cards.first.title'),
    content: t('home.sectionBenefits.cards.first.content'),
  },
  {
    url: '/icons/ic_stomach.svg',
    title: t('home.sectionBenefits.cards.second.title'),
    content: t('home.sectionBenefits.cards.second.content'),
  },
  {
    url: '/icons/ic_water.svg',
    title: t('home.sectionBenefits.cards.third.title'),
    content: t('home.sectionBenefits.cards.third.content'),
  },
  {
    url: '/icons/ic_lightning.svg',
    title: t('home.sectionBenefits.cards.fourth.title'),
    content: t('home.sectionBenefits.cards.fourth.content'),
  },
  {
    url: '/icons/ic_defense.svg',
    title: t('home.sectionBenefits.cards.fifth.title'),
    content: t('home.sectionBenefits.cards.fifth.content'),
  },
])
const closeDrawer = () => {
  drawerVisible.value = false
}
const slites = ref([
  {
    text: t('carousel.1'),
  },
  {
    text: t('carousel.2'),
  },
  {
    text: t('carousel.3'),
  },
  {
    text: t('carousel.4'),
  },
])
</script>

<template>
  <div>
    <Drawer
      :visible="true"
      :dismissable="false"
      position="full"
      :showCloseIcon="false"
      class="general-drawer payment-success"
    >
      <template #header>
        <div class="tw-w-full">
          <GeneralCarusel
            style="top: 0px; z-index: 30; left: 0"
            :position="'fixed'"
            :slideHeight="32"
            :slideWidth="1000"
            :background="'#EDEDF1'"
            :slides="slites"
            :animationSpeed="25"
          />
          <img
            src="/icons/LOGO-TRUE-BLUE-HEADER.svg"
            alt="true_blue_logo"
            width="129px"
            height="22px"
            class="tw-mt-10 max-lg:tw-mx-auto"
          />
        </div>
      </template>
      <div class="tw-flex tw-w-full">
        <div class="messages-container">
          <div class="succes-message">
            <div class="tw-flex tw-gap-1 tw-jutify-center">
              <img
                src="/icons/registry/ic_complete_check.svg"
                alt="ic_check"
                width="20px"
                height="20px"
              />
              <div>
                <p class="title-success">
                  {{ t('create.main.drawer.header.success') }}
                </p>

                <div class="tw-flex tw-gap-1">
                  <p class="tw-text-[12px]">
                    {{ t('create.main.drawer.header.order') }}
                  </p>
                  <p class="tw-text-[12px] tw-underline">{{ orderId }}</p>
                </div>
              </div>
            </div>
            <Button
              :label="t('button.seeOrderDetail')"
              class="app-general-button app-btn-success lg:tw-ml-auto max-lg:tw-mx-auto lg:tw-my-auto"
              style="height: 27px"
              @click="
                router.push(
                  localePath({
                    name: 'profile-my-deliveries-id',
                    params: { id: orderId },
                  }),
                )
              "
            />
          </div>
          <h3 class="payment-title">
            {{ t('create.main.drawer.titleOne') }}
            <strong> {{ t('create.main.drawer.titleTwo') }} </strong>
          </h3>
          <p>
            {{ t('create.main.drawer.description') }}
          </p>
          <div class="tw-w-full tw-flex tw-justify-center tw-mt-9">
            <img
              class="lg:tw-hidden"
              src="/icons/checkout/dog_payment.png"
              alt="dog_checkout"
              width="231px"
              height="231px"
            />
          </div>
          <div
            class="tw-flex tw-gap-2 tw-mt-10 lg:tw-flex-wrap max-lg:tw-flex-col tw-w-full"
          >
            <div
              v-for="(text, i) in homeBenefitsCard"
              :key="i"
              class="card-benefits-payment"
            >
              <div class="tw-w-[80%]">
                <p class="title">{{ text.title }}</p>
                <p class="text">
                  {{ text.content }}
                </p>
              </div>
              <img
                :src="text.url"
                :alt="text.title"
                width="62px"
                height="53px"
              />
            </div>
          </div>
        </div>
        <div
          class="max-lg:tw-hidden tw-w-[30%] tw-flex tw-items-center tw-justify-center"
        >
          <img
            src="/icons/checkout/dog_payment.png"
            alt="dog_checkout"
            width="385px"
            height="385px"
          />
        </div>
      </div>
      <div class="footer-section">
        <div class="footer-payment-success">
          <div v-for="index in 5" :key="index" class="items">
            <img src="/icons/registry/ic_complete_check.svg" alt="ic_check" />
            <p>
              {{ $t(`create.main.content.texts.benefits.${index}`) }}
            </p>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>
