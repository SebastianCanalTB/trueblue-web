<script setup lang="ts">
import type { TableHeaders } from '~/interfaces/Table.interface'

const emit = defineEmits(['update:model-value'])
const createStore = useCreateStore()
const { getlistMyPets: myPets } = storeToRefs(createStore)
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const uiState = reactive({
  loading: false,
  paginaActual: 1,
  totalPaginas: 1,
  showDeletePetDialog: false,
  showMenu: false,
  menuPosition: { x: 0, y: 0 },
  petseleccionada: null,
})

const viewState = reactive({
  editMode: false,
  detailMode: false,
  petId: 0,
})
const localePath = useLocalePath()
const petName = computed(() => {
  return (
    myPets.value.find((pet) => pet.id === Number(route.query.detail))?.name ||
    ''
  )
})

const currentView = computed(() => {
  if (Number(route.query.id) >= 0 && !route.query.detail) return 'create'
  if (Number(route.query.detail) > 0 && !route.query.id) return 'detail'
  if (myPets.value.length === 0 && !route.query.id) return 'empty'
  return 'list'
})

const listRoutes = computed(() => [
  {
    text: t('profile.myPets.title'),
    action: () => navigateTo('list'),
  },
  {
    text:
      Number(route.query.id) === 0
        ? t('profile.myPets.create')
        : t('profile.myPets.edit'),
    url: route.fullPath,
  },
])

const listRoutesDetail = computed(() => [
  {
    text: t('profile.myPets.title'),
    action: () => navigateTo('list'),
  },
  {
    text: petName.value,
    url: route.fullPath,
  },
])

const headers = computed<TableHeaders[]>(() => [
  {
    header: '',
    field: 'menu',
    fieldClass: 'tw-relative',
    type: 'custom-menu',
  },
  {
    header: t('profile.myPets.name'),
    field: 'name',
    headerClass: '',
    type: 'custom-link',
  },
  {
    header: t('profile.myPets.race'),
    field: 'race.name',
    headerClass: '',
  },
  {
    header: t('profile.myPets.genre'),
    field: 'sex',
    headerClass: '',
  },
  {
    header: t('profile.myPets.age'),
    type: 'age',
    yearField: 'age',
    monthField: 'month',
    headerClass: '',
  },
  {
    header: t('profile.myPets.actualWeigt'),
    field: 'currentWeight',
    type: 'weight',
    headerClass: '!tw-flex tw-justify-center',
  },
])

const navigateTo = (viewType, id = 0) => {
  viewState.editMode = false
  viewState.detailMode = false
  viewState.petId = id

  let queryParams = { page: 'my-pets' }

  switch (viewType) {
    case 'create':
      useLoading(true)
      viewState.editMode = true
      queryParams.id = 0
      emit('update:model-value', true)
      break
    case 'create-plan':
      useLoading(true)
      router.push(localePath({ name: 'faq' }))
      useLoading(false)

      break
    case 'edit':
      viewState.editMode = true
      queryParams.id = id
      emit('update:model-value', true)
      break
    case 'detail':
      viewState.detailMode = true
      viewState.petId = id
      queryParams.detail = id
      emit('update:model-value', true)
      break
    case 'list':
      getDogs()
      break

    default:
      emit('update:model-value', false)
      break
  }

  uiState.loading = false

  router.push({
    path: route.path,
    query: queryParams,
  })
}

const getDogs = async () => {
  useLoading(true)
  uiState.loading = true
  await createStore.getMyPets()
  uiState.loading = false
  useLoading(false)
}

const changeEstadopet = async (pet) => {
  uiState.loading = true
  const response = await createStore.changePetStatus(pet.id)

  if (response.status && response.code === 100) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    await createStore.getMyPets()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }

  uiState.loading = false
}

const DeletePetSelected = async () => {
  useLoading(true)
  if (!uiState.petseleccionada) return

  uiState.loading = true
  const response = await createStore.deletePets(uiState.petseleccionada.id)

  if (response.status && response.code) {
    useShowAlert({
      type: 'success',
      message: response.message,
    })
    uiState.showDeletePetDialog = false
    await createStore.getMyPets()
  } else {
    useShowAlert({
      type: 'error',
      message: response.message,
    })
  }

  uiState.showMenu = false
  uiState.loading = false
  useLoading(false)
}

const mostrarMenu = (event, pet) => {
  uiState.petseleccionada = pet
  const x = Math.min(event.clientX, window.innerWidth - 150)
  const y = Math.min(event.clientY, window.innerHeight - 100)

  uiState.menuPosition = { x, y }
  uiState.showMenu = true
  event.stopPropagation()
}

const editPetSeleccionada = () => {
  if (uiState.petseleccionada) {
    navigateTo('edit', uiState.petseleccionada.id)
  }
  uiState.showMenu = false
}

const cerrarMenu = () => {
  uiState.showMenu = false
}

onMounted(() => {
  nextTick(async () => {
    getDogs()
    document.addEventListener('click', cerrarMenu)
  })
})

onUnmounted(() => {
  document.removeEventListener('click', cerrarMenu)
})
</script>
<template>
  <div class="tw-w-full tw-h-full">
    <div
      v-if="currentView === 'empty'"
      class="tw-flex tw-flex-col tw-items-center tw-gap-5 tw-mt-[2rem] lg:tw-pr-4"
    >
      <h1 class="title primary1 !tw-text-[32px] tw-w-full tw-mb-20">
        {{ $t('profile.myPets.title') }}
      </h1>
      <img
        src="/icons/profile/ic_my_plan.svg"
        alt="dog-icon"
        width="128px"
        height="127px"
      />
      <p class="tw-text-[12px] tw-text-[#8BA0C9] tw-w-[336px] tw-text-center">
        {{ $t('profile.myPlan.empty') }}
      </p>
      <Button
        @click="
          router.push(
            localePath({ name: 'profile', query: { page: 'my-plan', id: 0 } }),
          )
        "
        class="app-general-button btn-solo-login"
      >
        {{ $t('button.createPlan') }}
      </Button>
    </div>
    <div v-if="currentView === 'list'" class="lg:tw-pr-4">
      <h1 class="title primary1 !tw-text-[32px] tw-mt-[5rem]">
        {{ $t('profile.myPets.title') }}
      </h1>

      <div
        class="tw-flex tw-items-center tw-mb-4 tw-w-full tw-justify-end tw-max-w-[850px]"
      >
        <button
          class="tw-flex tw-items-center tw-gap-2 tw-text-primary tw-font-barlow-regular"
          @click="() => navigateTo('create')"
        >
          <i class="pi pi-plus"></i> {{ $t('profile.myPets.add') }}
        </button>
      </div>

      <div class="tw-hidden lg:tw-block tw-max-w-[850px]">
        <GeneralTable
          :headers="headers"
          :fields="myPets"
          :empty="$t('table.empty.message')"
          :loading="uiState.loading"
          :limit="10"
          :pages="uiState.totalPaginas"
          :current-page="uiState.paginaActual"
          @edit-item="(id) => navigateTo('edit', id)"
          @reload="getDogs"
          @view-details="(id) => navigateTo('detail', id)"
          @toggle-status="changeEstadopet"
          @show-menu="mostrarMenu"
        />
      </div>

      <div class="tw-block lg:tw-hidden">
        <div v-if="uiState.loading" class="tw-flex tw-justify-center tw-py-10">
          <i class="pi pi-spin pi-spinner tw-text-2xl tw-text-primary"></i>
        </div>
        <div
          v-else-if="myPets.length === 0"
          class="tw-text-center tw-py-8 tw-text-gray-500"
        >
          {{ $t('table.empty') }}
        </div>
        <div v-else class="pets-cards">
          <div v-for="pet in myPets" :key="pet.id" class="pet-card">
            <div class="pet-header">
              <div>
                <h2
                  class="pet-name"
                  @click="() => navigateTo('detail', pet.id)"
                >
                  {{ pet.name }}
                </h2>
              </div>
              <div class="tw-flex tw-items-center tw-gap-4">
                <div class="tw-relative">
                  <i
                    class="pi pi-ellipsis-h tw-text-gray-600 tw-cursor-pointer"
                    @click.stop="mostrarMenu($event, pet)"
                  ></i>
                </div>
              </div>
            </div>

            <div class="pet-details">
              <div class="pet-detail-group">
                <div class="pet-detail">
                  <span class="label-texts">{{
                    $t('profile.myPets.genre')
                  }}</span>
                  <p class="detail-value">{{ pet.sex }}</p>
                </div>
                <div class="pet-detail">
                  <span class="label-texts">{{
                    $t('profile.myPets.race')
                  }}</span>
                  <p class="detail-value">{{ pet.race.name }}</p>
                </div>
              </div>

              <div class="pet-detail-group">
                <div class="pet-detail">
                  <span class="label-texts">{{
                    $t('profile.myPets.actualHeight')
                  }}</span>
                  <p class="detail-value">{{ pet.currentWeight }} Kg</p>
                </div>
                <div class="pet-detail">
                  <span class="label-texts">{{
                    $t('profile.myPets.age')
                  }}</span>
                  <p class="pet-age">
                    {{ useFormatAge(pet.age, pet.month) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="uiState.showMenu"
        class="tw-fixed tw-bg-white tw-shadow-md tw-rounded tw-py-2 tw-z-10 tw-w-32"
        :style="{
          top: uiState.menuPosition.y + 'px',
          left: uiState.menuPosition.x + 'px',
        }"
      >
        <div
          class="tw-px-4 tw-py-2 tw-cursor-pointer hover:tw-bg-gray-100"
          @click="editPetSeleccionada"
        >
          <p>
            {{ $t('button.edit') }}
          </p>
        </div>
        <!-- <div
          v-if="myPets.length > 1"
          class="tw-px-4 tw-py-2 tw-cursor-pointer hover:tw-bg-gray-100"
          @click="uiState.showDeletePetDialog = true"
        >
          <p class="tw-text-red-500">
            {{ $t('button.delete') }}
          </p>
        </div> -->
      </div>
    </div>
    <div
      v-if="currentView === 'create'"
      class="tw-h-full tw-w-screen tw-overflow-y-hidden"
    >
      <div class="lg:tw-pl-10 lg:tw-pt-5">
        <GeneralBreadCrumb :routes="listRoutes" />
      </div>
      <ProfileMyPetsCreate
        :petId="viewState.petId"
        @go-back="() => navigateTo('list')"
      />
    </div>
    <div v-if="currentView === 'detail'" class="tw-h-full lg:tw-w-screen">
      <div class="lg:tw-px-20">
        <GeneralBreadCrumb :routes="listRoutesDetail" />
      </div>
      <ProfileMyPetsPetDetail
        :petId="viewState.petId"
        @enable-edit="(id) => navigateTo('edit', id)"
        @go-back="() => navigateTo('list')"
      />
    </div>

    <GeneralDialog
      :show="uiState.showDeletePetDialog"
      @close="uiState.showDeletePetDialog = false"
    >
      <div class="tw-p-5">
        <span class="tw-text-[#003B71] tw-text-[20px] tw-font-treble-bold">
          {{ $t('profile.myPets.petDialog.title') }}
        </span>
        <div class="tw-mt-2">
          <p class="tw-text-[#575E6B]">
            {{
              myPets.length > 1
                ? $t('profile.myPets.petDialog.text')
                : $t('profile.myPets.petDialog.sureText')
            }}
          </p>

          <div class="tw-flex tw-mt-5 tw-w-full tw-justify-end tw-gap-2">
            <Button
              class="app-general-button app-btn-transparent"
              :label="$t('button.cancel')"
              @click="uiState.showDeletePetDialog = false"
            />
            <Button
              class="app-general-button btn-solo-create !tw-w-[250px]"
              :label="$t('profile.myPets.petDialog.confirm')"
              autofocus
              @click="DeletePetSelected"
            />
          </div>
        </div>
      </div>
    </GeneralDialog>
  </div>
</template>
<style lang="scss" scoped>
.pets-cards {
  @apply tw-space-y-4;

  .pet-card {
    @apply tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-5;

    .pet-header {
      @apply tw-flex tw-justify-between tw-items-start tw-mb-4;

      .pet-name {
        @apply tw-text-primary tw-font-treble-bold tw-text-[18px] tw-cursor-pointer;
      }

      .pet-age {
        @apply tw-text-gray-500 tw-text-sm;
      }
    }

    .pet-details {
      @apply tw-space-y-4 tw-rounded-2xl;

      .pet-detail-group {
        @apply tw-grid tw-grid-cols-2 tw-gap-4;

        .pet-detail {
          @apply tw-flex tw-flex-col;

          .detail-label {
            @apply tw-text-gray-600 tw-text-sm tw-mb-1;
          }

          .detail-value {
            @apply tw-font-medium;
          }
        }
      }
    }
  }
}
</style>
