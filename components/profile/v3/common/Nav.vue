<script setup lang="ts">
/**
 * Menú de Mi cuenta v3.
 * - Computador: pestañas arriba.
 * - Celular: barra inferior con íconos circulares y desplazamiento horizontal.
 * Eventos: click_nav {destino, ubicacion}, menu_inferior_ajustado, sesion_cerrado.
 */
const props = defineProps<{ showRecommendeds?: boolean }>()
const emit = defineEmits(['logout'])

const localePath = useLocalePath()
const route = useRoute()
const { track } = useTracking()
const systemStore = useSystemStore()
const { isMovil } = storeToRefs(systemStore)

const items = computed(() => {
  const list = [
    {
      key: 'inicio',
      label: 'Inicio',
      short: 'Inicio',
      to: '/profile/my-profile',
      icon: 'home',
    },
    {
      key: 'mi_plan',
      label: 'Mi plan',
      short: 'Mi plan',
      to: '/profile/my-plan',
      icon: 'plan',
    },
    {
      key: 'pagos',
      label: 'Pagos',
      short: 'Pagos',
      to: '/profile/my-payment-methods',
      icon: 'card',
    },
    {
      key: 'mis_mascotas',
      label: 'Mis mascotas',
      short: 'Mascotas',
      to: '/profile/my-pets',
      icon: 'paw',
    },
    {
      key: 'historial',
      label: 'Historial de pedidos',
      short: 'Pedidos',
      to: '/profile/my-deliveries',
      icon: 'receipt',
    },
    {
      key: 'asesoria_vet',
      label: 'Asesoría veterinaria',
      short: 'Asesoría',
      to: '/profile/vet-advice',
      icon: 'vet',
    },
    {
      key: 'referidos',
      label: 'Referidos',
      short: 'Referidos',
      to: '/profile/my-referals',
      icon: 'gift',
    },
  ]
  if (props.showRecommendeds) {
    list.push({
      key: 'recomendados',
      label: 'Mis recomendados',
      short: 'Recomend.',
      to: '/profile/my-recommendeds',
      icon: 'gift',
    })
  }
  return list
})

const isActive = (to: string) => {
  const path = route.path
  if (to === '/profile/my-plan')
    return (
      path.startsWith(localePath(to)) || path.includes('/profile/reactivate')
    )
  return path.startsWith(localePath(to))
}

const go = (item: any) => {
  track('click_nav', {
    destino: item.key,
    ubicacion: isMovil.value ? 'menu_inferior_celular' : 'menu_cuenta',
  })
  navigateTo(localePath(item.to))
}

let scrolled = false
const onScroll = () => {
  if (scrolled) return
  scrolled = true
  track('menu_inferior_ajustado')
}

const logout = () => {
  track('sesion_cerrado')
  emit('logout')
}
</script>

<template>
  <div class="ma-nav-wrap">
    <!-- Computador -->
    <nav class="ma-nav-top" aria-label="Mi cuenta">
      <div class="ma-nav-top-inner">
        <button
          v-for="item in items"
          :key="item.key"
          class="ma-nav-tab"
          :aria-current="isActive(item.to) ? 'page' : undefined"
          @click="go(item)"
        >
          {{ item.label }}
        </button>
      </div>
      <button class="ma-link is-muted ma-nav-logout" @click="logout">
        Cerrar sesión
      </button>
    </nav>

    <!-- Celular -->
    <nav
      class="ma-nav-bottom"
      aria-label="Mi cuenta"
      @scroll.passive="onScroll"
    >
      <button
        v-for="item in items"
        :key="item.key"
        class="ma-nav-circle"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        @click="go(item)"
      >
        <span class="ma-nav-ico" aria-hidden="true">
          <svg
            v-if="item.icon === 'home'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'plan'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
          <svg
            v-else-if="item.icon === 'card'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2.5" y="5" width="19" height="14" rx="2" />
            <path d="M2.5 10h19M6 15h4" />
          </svg>
          <svg
            v-else-if="item.icon === 'paw'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="7" cy="9" r="1.8" />
            <circle cx="11" cy="5.5" r="1.8" />
            <circle cx="15.5" cy="6" r="1.8" />
            <circle cx="18.5" cy="10" r="1.8" />
            <path
              d="M8 17c0-3 2-5.5 4.5-5.5S17 14 17 17c0 2-1.5 3-3 3-1 0-1.5-.5-2-.5s-1 .5-2 .5c-1.5 0-2-1-2-3z"
            />
          </svg>
          <svg
            v-else-if="item.icon === 'receipt'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
            <path d="M9 8h6M9 12h6" />
          </svg>
          <svg
            v-else-if="item.icon === 'vet'"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 3v6a4 4 0 0 0 8 0V3" />
            <path d="M10 13v2a5 5 0 0 0 10 0v-2" />
            <circle cx="20" cy="11" r="2" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="8" width="18" height="13" rx="1" />
            <path
              d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S10 8 12 8zM12 8c2-4 6-4 6-1.5S14 8 12 8z"
            />
          </svg>
        </span>
        <span class="ma-nav-short">{{ item.short }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.ma-nav-wrap {
  position: sticky;
  top: 58px;
  z-index: 40;
  background: #fff;
  border-bottom: 1px solid #dfe5ee;
  @media (max-width: 1024px) {
    position: static;
    border-bottom: none;
    background: transparent;
  }
}
.ma-nav-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
  @media (max-width: 1024px) {
    display: none;
  }
}
.ma-nav-top-inner {
  display: flex;
  gap: 28px;
  overflow-x: auto;
}
.ma-nav-tab {
  font-family: 'heading-pro-treble-bold';
  font-size: 15px;
  color: #575e6b;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 16px 0 12px;
  cursor: pointer;
  white-space: nowrap;
  &[aria-current='page'] {
    color: #003b71;
    border-bottom-color: #003b71;
  }
}
.ma-nav-bottom {
  display: none;
  @media (max-width: 1024px) {
    display: flex;
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 900;
    gap: 8px;
    padding: 10px 12px;
    background: #003b71;
    border-radius: 28px;
    overflow-x: auto;
    scrollbar-width: none;
    box-shadow: 0 6px 20px rgba(0, 27, 52, 0.25);
    &::-webkit-scrollbar {
      display: none;
    }
  }
}
.ma-nav-circle {
  flex: 0 0 auto;
  min-width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  .ma-nav-ico {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &[aria-current='page'] .ma-nav-ico {
    background: #96d9e9;
    color: #003b71;
  }
  .ma-nav-short {
    font-family: 'heading-pro-treble-bold';
  }
}
</style>
