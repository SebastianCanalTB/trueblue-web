<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const nuxtApp = useNuxtApp()
const { t } = useI18n()

const emit = defineEmits(['save-image'])
const props = defineProps({
  id: {
    type: String,
    required: false,
    default: 'inputForUploadImage',
  },
  defaultImage: {
    type: String,
    required: false,
    default: '',
  },
  design: {
    type: Object,
    required: false,
    default: () => ({
      width: 230,
      height: 140,
      radius: 0,
    }),
  },
  measures: {
    type: Object,
    required: false,
    default: () => ({
      validate: false,
      width: 0,
      height: 0,
    }),
  },
  size: {
    type: Object,
    required: false,
    default: () => ({
      validate: true,
      size: 1000000,
      message: '1 MB',
    }),
  },
  extension: {
    type: Object,
    required: false,
    default: () => ({
      validate: true,
      regex: /(.jpg|.jpeg)$/i,
      imageName: '.JPG, .JPEG',
      message:
        'La única extensión permitida para subir la imagen es .jpg o .jpeg',
      input: 'image/jpg',
    }),
  },
  title: {
    type: String,
    required: false,
    default: 'Editar foto',
  },
})

const image = ref('')
const refs = ref(null)
const showUpdateDialog = ref(false)
const selectedFile = ref(null)
const tempImage = ref('')
const zoomLevel = ref(50)
const previewStyle = ref({})

const panPosition = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const startDragPosition = ref({ x: 0, y: 0 })

const backgroundColor = computed(() =>
  image.value === ''
    ? 'background-color: transparent;'
    : 'background-color: transparent;',
)

onMounted(() => {
  image.value = props.defaultImage
})

// Métodos
const openImage = () => {
  refs.value.click()
}

const fileOnload = (e) => {
  const result = e.target.result
  const element = document.getElementById(`${props.id}-img`)
  element.setAttribute(
    'style',
    'background-image: url("' + result + '");' + backgroundColor.value,
  )
}

const onFilePicked = (e) => {
  const fileInput = e.target
  const files = fileInput.files

  // Verificar si se seleccionó un archivo
  if (!files || files.length === 0) {
    return // El usuario canceló la selección
  }

  const file = files[0]
  selectedFile.value = file
  const filePath = fileInput.value
  const allowedExtensions = props.extension.regex

  // Validar la extensión del archivo
  if (props.extension.validate && !allowedExtensions.exec(filePath)) {
    useShowAlert({
      type: 'error',
      message: t(props.extension.message),
    })
    return
  }

  // Validar el tamaño del archivo
  if (props.size.validate && file.size > props.size.size) {
    useShowAlert({
      type: 'error',
      message:
        'El tamaño de la imagen es mayor al permitido (' +
        props.size.message +
        '). Tamaño actual = ' +
        (file.size / props.size.size).toFixed(2) +
        'MB',
    })
    return
  }

  // Cargar la imagen para validación y mostrarla en el diálogo
  const img = new Image()
  img.onload = function () {
    // Solo validar medidas si es necesario
    if (
      props.measures.validate &&
      (this.width.toFixed(0) !== props.measures.width.toString() ||
        this.height.toFixed(0) !== props.measures.height.toString())
    ) {
      useShowAlert({
        message:
          'Las medidas deben ser: ' +
          props.measures.width +
          ' * ' +
          props.measures.height +
          '. Medidas de tu imagen: ' +
          this.width.toFixed(0) +
          ' * ' +
          this.height.toFixed(0),
      })
      return
    }

    // Leer y mostrar la imagen en el diálogo
    const reader = new FileReader()
    reader.onload = (event) => {
      tempImage.value = event.target?.result
      showUpdateDialog.value = true
      zoomLevel.value = 50 // Reiniciar el zoom al valor medio
      panPosition.value = { x: 0, y: 0 } // Reiniciar posición
      updatePreviewStyle()
    }
    reader.readAsDataURL(file)
  }
  img.src = URL.createObjectURL(file)
}

// Método mejorado para actualizar el estilo de la vista previa
const updatePreviewStyle = () => {
  // Calcula el escalado basado en el nivel de zoom (entre 0.5 y 2.0)
  const scale = 1 + (zoomLevel.value / 100) * 1.5

  // Limitar los valores de posición para mantener la imagen visible
  const maxOffset = scale > 1 ? (scale - 1) * 50 : 0 // % del contenedor

  // Restringir la posición de desplazamiento dentro de los límites
  panPosition.value.x = Math.max(
    -maxOffset,
    Math.min(maxOffset, panPosition.value.x),
  )
  panPosition.value.y = Math.max(
    -maxOffset,
    Math.min(maxOffset, panPosition.value.y),
  )

  previewStyle.value = {
    transform: `translate(calc(-50% + ${panPosition.value.x}px), calc(-50% + ${panPosition.value.y}px)) scale(${scale})`,
    transformOrigin: 'center',
    transition: isDragging.value ? 'none' : 'transform 0.2s ease-in-out',
    objectFit: 'cover',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
    userSelect: 'none', // Evitar selección de texto al arrastrar
  }
}

// Métodos para permitir arrastrar la imagen durante el zoom
const startDrag = (e) => {
  if (zoomLevel.value > 0) {
    // Solo permite arrastrar si hay zoom
    isDragging.value = true
    startDragPosition.value = {
      x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
      y: e.clientY || (e.touches && e.touches[0].clientY) || 0,
    }
    e.preventDefault() // Prevenir comportamiento por defecto
  }
}

const onDrag = (e) => {
  if (!isDragging.value) return

  const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0
  const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0

  const deltaX = currentX - startDragPosition.value.x
  const deltaY = currentY - startDragPosition.value.y

  // Actualizar posición con movimiento inverso para una experiencia intuitiva
  panPosition.value.x += deltaX
  panPosition.value.y += deltaY

  // Actualizar posición de inicio para el próximo movimiento
  startDragPosition.value = {
    x: currentX,
    y: currentY,
  }

  updatePreviewStyle()
  e.preventDefault() // Prevenir comportamiento por defecto
}

const endDrag = () => {
  isDragging.value = false
  updatePreviewStyle() // Aplicar transición suave al soltar
}

// Función mejorada para crear una imagen con el zoom aplicado
const createScaledImage = () => {
  return new Promise((resolve) => {
    // Crear un elemento canvas para dibujar la imagen escalada
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Configurar el tamaño del canvas al tamaño deseado (según design props)
    canvas.width = props.design.width
    canvas.height = props.design.height

    // Crear una imagen con la fuente temporal
    const img = new Image()
    img.onload = () => {
      // Calcular el factor de escala basado en el nivel de zoom (entre 0.5 y 2.0)
      const scale = 1 + (zoomLevel.value / 100) * 1.5

      // Detectar si la imagen es horizontal o vertical
      const isLandscape = img.width > img.height

      // Calcular las dimensiones para el recorte
      let sourceSize, sourceX, sourceY

      if (isLandscape) {
        // Para imágenes horizontales
        sourceSize = img.height
        sourceX = (img.width - sourceSize) / 2
        sourceY = 0
      } else {
        // Para imágenes verticales
        sourceSize = img.width
        sourceX = 0
        sourceY = (img.height - sourceSize) / 2
      }

      // Ajustar por el zoom y la posición de panorámica
      const scaledSourceSize = sourceSize / scale
      const panOffsetX =
        (panPosition.value.x / (props.design.width / 2)) *
        (scaledSourceSize / 4)
      const panOffsetY =
        (panPosition.value.y / (props.design.height / 2)) *
        (scaledSourceSize / 4)

      sourceX += (sourceSize - scaledSourceSize) / 2 - panOffsetX
      sourceY += (sourceSize - scaledSourceSize) / 2 - panOffsetY

      // Dibujar un fondo blanco primero si es necesario
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Siempre crear un recorte circular
      ctx.save()
      ctx.beginPath()

      // Usar un círculo perfecto (independientemente del valor de radius en props)
      const circleRadius = Math.min(canvas.width, canvas.height) / 2
      ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, Math.PI * 2)

      ctx.closePath()
      ctx.clip()

      // Dibujar la imagen en el canvas con el recorte apropiado
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        scaledSourceSize,
        scaledSourceSize,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      // Restaurar el contexto después del clip
      ctx.restore()

      // Convertir el canvas a un Blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Crear un nuevo File a partir del Blob
          const scaledFile = new File([blob], selectedFile.value.name, {
            type: selectedFile.value.type,
            lastModified: new Date().getTime(),
          })
          resolve(scaledFile)
        } else {
          // Si hay un error, devuelve el archivo original
          resolve(selectedFile.value)
        }
      }, selectedFile.value.type)
    }

    img.src = tempImage.value
  })
}

// Observa los cambios en el nivel de zoom
watch(zoomLevel, () => {
  // Si es zoom out completo, centrar la imagen
  if (zoomLevel.value === 0) {
    panPosition.value = { x: 0, y: 0 }
  }
  updatePreviewStyle()
})

const cancelEdit = (e) => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
  showUpdateDialog.value = false
  selectedFile.value = null
  tempImage.value = ''
}

const confirmEdit = async (e) => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  try {
    // Crear archivo escalado con las mejoras
    const scaledFile = await createScaledImage()

    // Generar una URL para la imagen procesada para actualizar la vista previa
    const processedImageUrl = URL.createObjectURL(scaledFile)

    // Aplicar la imagen editada
    image.value = processedImageUrl
    fileOnload({ target: { result: processedImageUrl } })

    // Enviar el archivo procesado al componente padre
    emit('save-image', scaledFile)

    showUpdateDialog.value = false
  } catch (error) {
    console.error('Error al procesar la imagen:', error)
    // En caso de error, usar el archivo original
    image.value = tempImage.value
    fileOnload({ target: { result: tempImage.value } })
    emit('save-image', selectedFile.value)
    showUpdateDialog.value = false
  }
}
</script>

<template>
  <div class="container-file-picker">
    <div
      class="mx-auto imageDiv"
      :style="`width: ${design.width}px; height: ${design.height}px; max-width: ${design.width}px; max-height: ${design.height}px; border-radius: 50%;`"
      @click="openImage"
    >
      <div
        :id="`${id}-img`"
        :style="'background-image: url(' + image + '); ' + backgroundColor"
      />
      <input
        :id="id"
        :ref="(el) => (refs = el)"
        type="file"
        style="display: none"
        :accept="extension.input"
        size="1"
        @change="onFilePicked"
      />
    </div>

    <GeneralDialog :show="showUpdateDialog" @close="cancelEdit">
      <div class="tw-p-5 tw-flex tw-flex-col tw-gap-4">
        <span
          class="tw-text-[rgb(0,59,113)] tw-text-[20px] tw-font-treble-bold"
        >
          {{ title }}
        </span>
        <div class="tw-flex tw-flex-col tw-items-center tw-gap-4">
          <!-- Contenedor mejorado para la vista previa con soporte de arrastre (siempre circular) -->
          <div
            class="preview-container tw-overflow-hidden tw-bg-gray-200 tw-w-[180px] tw-h-[180px] tw-relative tw-rounded-full"
          >
            <img
              v-if="tempImage"
              :src="tempImage"
              :style="previewStyle"
              alt="Preview"
              class="tw-img-preview"
              @mousedown="startDrag"
              @mousemove="onDrag"
              @mouseup="endDrag"
              @mouseleave="endDrag"
              @touchstart="startDrag"
              @touchmove="onDrag"
              @touchend="endDrag"
            />
          </div>

          <!-- Controles de zoom con íconos -->
          <div class="tw-flex tw-items-center tw-w-full tw-px-4 tw-gap-2">
            <i class="tw-text-gray-600 tw-text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </i>
            <input
              type="range"
              v-model="zoomLevel"
              min="0"
              max="100"
              class="tw-w-full tw-accent-blue-500"
            />
            <i class="tw-text-gray-600 tw-text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
              </svg>
            </i>
          </div>

          <!-- Botones -->
          <div class="tw-flex tw-justify-between tw-w-full tw-mt-2">
            <button
              type="button"
              @click.prevent="cancelEdit"
              class="tw-px-6 tw-py-2 tw-rounded-md tw-text-gray-700 tw-border tw-border-gray-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click.prevent="confirmEdit"
              class="tw-px-6 tw-py-2 tw-rounded-md tw-text-white tw-bg-[#003b71]"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    </GeneralDialog>
  </div>
</template>

<style scoped>
.imageDiv {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e5e7eb;
}

.imageDiv > div {
  width: 100%;
  height: 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

/* Estilos para el contenedor de vista previa */
.preview-container {
  position: relative;
  overflow: hidden;
}

.tw-img-preview {
  /* Los estilos están ahora en previewStyle aplicados directamente */
  display: block; /* Solo aseguramos que sea un elemento de bloque */
}

/* Estilos para el slider */
input[type='range'] {
  -webkit-appearance: none;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>
