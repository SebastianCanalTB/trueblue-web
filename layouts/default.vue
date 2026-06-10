<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

/*stores */
const accountStore = useAccountStore()
const store = useOnboardingStore()
const systemStore = useSystemStore()
const bannerStore = useBannerStore()
const popupStore = usePopupStore()
const { getProfileInformation: profile, getInfoCupon: cupon } =
  storeToRefs(accountStore)
const { getPopups: dataPopups } = storeToRefs(popupStore)
const { getLoginUser: userData } = storeToRefs(store)
const { t } = useI18n()
const { canSeePlanButton } = storeToRefs(store)
const localePath = useLocalePath()
const router = useRouter()
const route = useRoute()
const menuMobile = ref(false)
const showUnsavedDialog = ref(false)
const pendingNavigation = ref(null)
const showPopup = ref(false)
const currentPopup = ref(null)
const popupQueue = ref([])
const { isMovil, isMenuOpen } = storeToRefs(systemStore)
const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(
    z.object({
      email: z
        .string({ message: t('rule.validation.require') })
        .email({ message: t('rule.validation.email') })
        .min(1, { message: t('rule.validation.require') }),
    }),
  ),
})

const { value: email } = useField<string | null>('email')

const onSubmit = handleSubmit(async () => {
  useLoading(true)
  const sendData = ref({
    email: email.value,
  })
  const result = await accountStore.saveEmail(sendData.value)

  if (result.status && result.code === 100) {
    useShowAlert({
      type: 'success',
      message: result.message,
    })
  } else {
    useShowAlert({
      type: 'error',
      message: result.message,
    })
  }

  useLoading(false)
})
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
const handleNavigation = (path, query = {}) => {
  if (isMenuOpen.value === true) {
    pendingNavigation.value = { path, query }
    showUnsavedDialog.value = true
  } else {
    router.push({
      path,
      query,
    })
  }
}
const dowloadTerms = () => {
  const url = '/docs/Términos_y_Condiciones_Generales_de_TRUEBLUE.pdf'
  window.open(url, '_blank')
}
const continueWithoutSaving = () => {
  if (pendingNavigation.value) {
    router.push({
      path: pendingNavigation.value.path,
      query: pendingNavigation.value.query,
    })
    systemStore.setMenuOpen(false)
    pendingNavigation.value = null
    showUnsavedDialog.value = false
  }
}
const cancelNavigation = () => {
  pendingNavigation.value = null
  showUnsavedDialog.value = false
}
const openMenu = () => {
  menuMobile.value = true
}
const hiddemMenu = () => {
  menuMobile.value = false
}
const getData = async () => {
  await Promise.all([
    bannerStore.getBanners(),
    accountStore.getParametization(),
    accountStore.firstCupon(),
  ])
  if (userData.value?.user?.id) {
    await accountStore.getProfile()
  }
}
const getPopups = async () => {
  await popupStore.getAllPopups()
}

const showNextPopup = () => {
  if (popupQueue.value.length > 0) {
    currentPopup.value = popupQueue.value.shift()
    showPopup.value = true
  }
}

const handlePopupClose = () => {
  if (currentPopup.value) {
    popupStore.markPopupAsShown(currentPopup.value.id)
  }
  showPopup.value = false
  currentPopup.value = null

  setTimeout(() => {
    showNextPopup()
  }, 500)
}

const checkAndShowPopups = () => {
  const routeName = route?.name?.split('_')[0].toString() || ''
  const isLoggedIn = !!userData.value?.user?.id

  const popupsToShow = popupStore.getPopupsToShow(routeName, isLoggedIn)

  if (popupsToShow.length > 0) {
    popupQueue.value = [...popupsToShow]
    showNextPopup()
  }
}

onMounted(() => {
  nextTick(async () => {
    getData()
    await getPopups()
    checkAndShowPopups()
  })
})
watch(userData, async (newVal) => {
  if (newVal?.user?.id) {
    await accountStore.getProfile()
  } else {
    systemStore.setMenuOpen(false)
  }
})
watch(isMenuOpen, (newVal) => {
  if (newVal === true && pendingNavigation.value) {
    showUnsavedDialog.value = true
  }
})

watch(
  () => popupStore.popups,
  () => {
    checkAndShowPopups()
  },
)

watch(
  () => route.name,
  () => {
    checkAndShowPopups()
  },
)
</script>

<template>
  <div class="app-view">
    <header>
      <div
        v-if="!route.path.includes('login') && !userData?.id"
        class="cupon-container"
      >
        <img
          src="/icons/ic_percantage_black.svg"
          alt="discount"
          height="16px"
          width="16px"
        />
        <span v-if="!isMovil">
          {{
            $t('home.discount', {
              discount: useSearchItemJson('valueType', cupon),
            })
          }}
        </span>
        <span
          class="cursor-pointer"
          @click="handleNavigation(localePath({ name: 'registry' }))"
        >
          {{
            isMovil
              ? $t('home.discountMovil', {
                  discount: useSearchItemJson('valueType', cupon),
                })
              : $t('home.redeem').toUpperCase()
          }}
        </span>
      </div>
      <nav class="shadow-2 z-5">
        <div class="tw-cursor-pointer">
          <img
            @click="handleNavigation(localePath({ name: 'index' }))"
            src="/icons/LOGO-TRUE-BLUE-HEADER.svg"
            alt="true_logo"
            width="146px"
            height="25px"
          />
        </div>

        <div class="nav-buttons">
          <nuxt-link
            :class="{
              active: route.path.includes('about-us'),
            }"
            class="cursor-pointer"
            @click.prevent="handleNavigation(localePath({ name: 'about-us' }))"
          >
            {{ $t('home.who') }}
          </nuxt-link>
          <nuxt-link
            :class="{
              active: route.path.includes('recipes'),
            }"
            class="cursor-pointer"
            @click.prevent="handleNavigation(localePath({ name: 'recipes' }))"
          >
            {{ $t('home.recipes') }}
          </nuxt-link>
          <nuxt-link
            :class="{
              active: route.path.includes('fresh'),
            }"
            class="cursor-pointer"
            @click.prevent="handleNavigation(localePath({ name: 'fresh' }))"
          >
            {{ $t('home.tips') }}
          </nuxt-link>
          <nuxt-link
            :class="{
              active: route.path.includes('FAQ'),
            }"
            class="cursor-pointer"
            @click.prevent="handleNavigation(localePath({ name: 'FAQ' }))"
          >
            {{ $t('home.faq') }}
          </nuxt-link>
          <nuxt-link
            :class="{
              active: route.path.includes('vets'),
            }"
            class="cursor-pointer"
            @click.prevent="handleNavigation(localePath({ name: 'vets' }))"
          >
            {{ $t('home.vets') }}
          </nuxt-link>

          <div class="flex gap-4">
            <Button
              v-if="!userData"
              class="app-general-button btn-solo-login"
              @click="handleNavigation(localePath({ name: 'login' }))"
            >
              {{ $t('home.login') }}
            </Button>
            <Button
              v-if="userData && !profile.photoUrl"
              class="app-general-button btn-solo-login !tw-rounded-full !tw-w-[40px] !tw-h-[40px]"
              @click="
                handleNavigation(localePath({ name: 'profile-my-profile' }))
              "
            >
              <i class="pi pi-user"></i>
            </Button>

            <Avatar
              v-if="userData && profile.photoUrl"
              :image="profile.photoUrl"
              shape="circle"
              class="tw-cursor-pointer !tw-w-[37px] !tw-h-[37px]"
              @click="
                handleNavigation(localePath({ name: 'profile-my-profile' }))
              "
            />
            <Button
              v-if="!userData"
              class="app-general-button btn-solo-create"
              @click="
                router.push(
                  localePath({
                    name: 'registry',
                    query: { step: 'pet', substep: 'meet' },
                  }),
                )
              "
            >
              {{ $t('home.create') }}
            </Button>
            <Button
              v-if="userData && canSeePlanButton"
              class="app-general-button btn-solo-create"
              @click="handleNavigation(localePath({ name: 'profile-my-profile' }))"
            >
              {{ $t('home.plan') }}
            </Button>
          </div>
        </div>
        <div v-if="isMovil">
          <button class="menu-hamburger" type="button" @click="openMenu">
            <img src="/icons/ic_burgerMenu.svg" alt="menu burger" />
          </button>
          <sidebarMenuMobileDrawer
            v-model:visible="menuMobile"
            :showUpdateDialog="menuMobile"
            @closeModal="hiddemMenu"
          />
        </div>
      </nav>
    </header>
    <main>
      <slot />
      <!-- <div class="chat" @click="useOpenWhatsApp">
        <GeneralChat />
      </div> -->
    </main>
    <footer
      v-if="!(Number(route.query.id) >= 0 || Number(route.params.id) >= 0)"
    >
      <div class="logo-container-footer">
        <img
          src="/icons/LOGO-TRUE-BLUE-FOOTER.svg"
          class="flex justify-content-center w-13rem"
        />
      </div>
      <div class="footer-content">
        <div class="lg:col-6 max-xl:tw-w-11/12 max-xl:tw-mx-auto">
          <span class="footer-text title">{{
            $t('home.footer.more.text')
          }}</span>
          <span class="general-input solo-email">
            <IconField iconPosition="right">
              <InputText
                v-model="email"
                name="email"
                class="!tw-h-[42px]"
                maxlength="120"
                :class="{ invalid: errors['email'] }"
                :placeholder="$t('home.footer.more.placeholder')"
              />
              <InputIcon>
                <Button
                  class="app-general-button btn-solo-login subscribe"
                  @click="onSubmit"
                >
                  {{ $t('home.footer.subscribe') }}
                </Button>
              </InputIcon>
            </IconField>
            <GeneralError :error="errors['email']" />
          </span>
        </div>

        <div class="footer-grid">
          <span class="footer-text subtitles">{{ $t('home.footer.map') }}</span>
          <span class="footer-text subtitles">{{
            $t('home.footer.call')
          }}</span>
          <nuxt-link
            :to="localePath({ name: 'index' })"
            @click="scrollToTop"
            class="footer-texts-redirections"
            >{{ $t('home.footer.home') }}</nuxt-link
          >
          <a
            href="mailto:help@trueblue.pet"
            class="footer-texts-redirections"
            >{{ $t('home.footer.email', { at: '@' }) }}</a
          >
          <nuxt-link
            :to="localePath({ name: 'about-us' })"
            @click="scrollToTop"
            class="footer-texts-redirections"
            >{{ $t('home.footer.benefits') }}</nuxt-link
          >
          <a href="tel:3235997035" class="footer-texts-redirections">{{
            $t('home.footer.number')
          }}</a>
          <nuxt-link
            :to="localePath({ name: 'fresh' })"
            @click="scrollToTop"
            class="footer-texts-redirections"
            >{{ $t('home.footer.tips') }}</nuxt-link
          >
          <div class="tw-flex lg:tw-gap-8 max-lg:tw-gap-4">
            <nuxt-link
              to="https://www.facebook.com/share/1ABJu2fhXy/?mibextid=wwXIfr"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/icons/ic_facebook.svg"
                alt="facebook"
                class="cursor-pointer"
                height="32px"
                width="32px"
              />
            </nuxt-link>
            <nuxt-link
              to="https://www.instagram.com/trueblue.pet?igsh=MWQ2cm9pd2IxamZhdQ=="
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/icons/ic_insta.svg"
                alt="instagram"
                class="cursor-pointer"
                height="32px"
                width="32px"
              />
            </nuxt-link>
            <nuxt-link
              to="https://www.linkedin.com/company/true-blue-pets/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/icons/ic_linkedin.svg"
                alt="instagram"
                class="cursor-pointer"
                height="32px"
                width="32px"
              />
            </nuxt-link>
            <nuxt-link
              to="https://www.tiktok.com/@trueblue.pet?is_from_webapp=1&sender_device=pc"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/icons/ic_tiktok.svg"
                alt="instagram"
                class="cursor-pointer"
                height="32px"
                width="32px"
              />
            </nuxt-link>
          </div>
        </div>
      </div>
      <div class="tags">
        <div
          class="flex max-lg:tw-flex-col lg:tw-gap-8 max-lg:tw-gap-1 max-lg:tw-ml-3 tw-underline"
        >
          <!-- <small class="politics">{{ $t('home.footer.privacy') }}</small>
        <small class="politics">{{ $t('home.footer.politics') }}</small> -->
          <small class="politics" @click="dowloadTerms">{{
            $t('home.footer.terms')
          }}</small>
        </div>
        <small
          class="max-lg:tw-flex max-lg:tw-flex-col-reverse max-lg:tw-mr-3"
          >{{ $t('home.footer.copy') }}</small
        >
      </div>
    </footer>
    <GeneralDialogUnSavedProgess
      v-model:show="showUnsavedDialog"
      @continueWithoutSaving="continueWithoutSaving"
      @cancel="cancelNavigation"
    />
    <GeneralDialogPopupMessage
      v-model:visible="showPopup"
      :popup="currentPopup"
      @update:visible="handlePopupClose"
    />
  </div>
</template>
