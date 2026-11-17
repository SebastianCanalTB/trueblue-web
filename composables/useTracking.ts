/**
 * Medición de Mi cuenta (v3).
 *
 * Contrato: hoja "Mapa_Eventos_MiCuenta_v3_TrueBlue" (Google Sheets).
 * - Cada evento se envía a GTM (window.dataLayer) y, si está cargado, a Amplitude.
 * - zona y pantalla se agregan solos (no se pasan a mano en cada track()).
 * - Los eventos _completado / _actualizado / _creado se disparan SOLO después de
 *   la respuesta OK del backend (ver useApiServices: code === 100).
 * - Los campos de formulario solo registran la activación, nunca el valor (PII).
 */

type TrackParams = Record<string, string | number | boolean | null | undefined>

// Ruta (name de Nuxt) -> valor del parámetro "pantalla"
const SCREEN_BY_ROUTE: Record<string, string> = {
  'profile-my-profile': 'inicio',
  'profile-my-plan': 'mi_plan',
  'profile-my-plan-adjust': 'ajustar_plan',
  'profile-my-plan-dates': 'cambiar_fecha',
  'profile-my-plan-address': 'cambiar_direccion',
  'profile-my-plan-quantity': 'ajustar_cantidad',
  'profile-reactivate': 'reactivar',
  'profile-my-pets': 'mis_mascotas',
  'profile-my-payment-methods': 'metodos_pago',
  'profile-my-deliveries': 'historial',
  'profile-vet-advice': 'asesoria_vet',
  'profile-my-referals': 'referidos',
}

const ZONE = 'zona_interna'

// Evita mandar el mismo "campo interactuado" varias veces en la misma vista
const touchedFields = new Set<string>()

export const useTracking = () => {
  const route = useRoute()

  const currentScreen = () => {
    const name = String(route?.name || '').split('___')[0]
    return SCREEN_BY_ROUTE[name] || name || 'desconocida'
  }

  const track = (event: string, params: TrackParams = {}) => {
    if (typeof window === 'undefined') return
    const payload: TrackParams = {
      zona: ZONE,
      pantalla: currentScreen(),
      ...params,
    }
    // Quita valores vacíos para no ensuciar los reportes
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === null || payload[k] === '')
        delete payload[k]
    })

    try {
      const w = window as any
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push({ event, ...payload })
      if (w.amplitude && typeof w.amplitude.track === 'function') {
        w.amplitude.track(event, payload)
      }
    } catch (error) {
      console.warn('[tracking]', error)
    }
  }

  /** Activación de un campo (una sola vez por formulario + campo). */
  const trackField = (
    formulario: string,
    campo: string,
    extra: TrackParams = {},
  ) => {
    const key = `${currentScreen()}|${formulario}|${campo}`
    if (touchedFields.has(key)) return
    touchedFields.add(key)
    track('formulario_campo_interactuado', { formulario, campo, ...extra })
  }

  /** Compra (GA4 purchase / Amplitude). Solo con cobro aprobado. */
  const trackPurchase = (
    tipoCompra: 'primera' | 'reactivacion' | 'adelanto' | 'cambio_fecha',
    valor: number,
    extra: TrackParams = {},
  ) => {
    track('purchase', {
      tipo_compra: tipoCompra,
      value: valor,
      currency: 'COP',
      ...extra,
    })
  }

  const resetFields = () => touchedFields.clear()

  return { track, trackField, trackPurchase, resetFields, currentScreen }
}
