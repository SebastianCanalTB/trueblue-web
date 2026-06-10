import Aura from '@primevue/themes/aura'
// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },

  imports: {
    dirs: [
      'composables',
      'composables/*/index.{ts,js,mjs,mts}',
      'composables/**',
    ],
  },

  app: {
    head: {
      titleTemplate: '%s - Landing',
      title: 'True Blue',
      meta: [
        { charset: 'utf-8' },
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
        },
        {
          hid: 'description',
          name: 'description',
          content: 'True Blue Landing',
        },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
      script: [
        {
          innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-T8NSCHMD');`,
        },
        // {
        //   src: 'https://app.getfrontline.ai/frontline_assistant.js',
        //   'data-assistant-id': 'agent-e8e66233-e2dc-4886-a93a-6d9e4c3d9578',
        //   'data-domain': 'getfrontline.ai',
        //   defer: true,
        // },
        {
          innerHTML: `!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1202002621614958');
            fbq('track', 'PageView');`,
        },
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-HMMDWM2R1D',
          async: true,
        },
        {
          src: 'https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=V4Aa8s',
          async: true,
        },
        {
          innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HMMDWM2R1D');`,
        },
        {
          innerHTML: `
            (function () {
              window.dataLayer = window.dataLayer || [];
              function getOrCreateAnonymousId() {
                const key = "tb_anonymous_id";
                const existing = localStorage.getItem(key);
                if (existing) return existing;
                const newId = "anon_" + Math.random().toString(36).substring(2) + "_" + Date.now();
                localStorage.setItem(key, newId);
                return newId;
              }
              function saveUTMs() {
                const params = new URLSearchParams(window.location.search);
                const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
                keys.forEach(function(key){
                  const value = params.get(key);
                  if(value){ localStorage.setItem("tb_" + key, value); }
                });
                if(!localStorage.getItem("tb_landing_page")){
                  localStorage.setItem("tb_landing_page", window.location.href);
                }
                if(document.referrer && !localStorage.getItem("tb_initial_referrer")){
                  localStorage.setItem("tb_initial_referrer", document.referrer);
                }
                return getOrCreateAnonymousId();
              }
              function getStoredValue(key){
                return localStorage.getItem("tb_" + key) || "";
              }
              const anonymousId = saveUTMs();
              const pagePath = window.location.pathname + window.location.search;
              window.dataLayer.push({
                event: "tb_attribution_ready",
                anonymous_id: anonymousId,
                utm_source: getStoredValue("utm_source"),
                utm_medium: getStoredValue("utm_medium"),
                utm_campaign: getStoredValue("utm_campaign"),
                utm_content: getStoredValue("utm_content"),
                utm_term: getStoredValue("utm_term"),
                gclid: getStoredValue("gclid"),
                fbclid: getStoredValue("fbclid"),
                landing_page: localStorage.getItem("tb_landing_page") || "",
                initial_referrer: localStorage.getItem("tb_initial_referrer") || "",
                page_url: window.location.href,
                page_path: window.location.pathname,
                page_step: pagePath,
                page_title: document.title || ""
              });
            })();
          `,
        },
      ],
      noscript: [
        {
          innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T8NSCHMD"
          height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          tagPosition: 'bodyOpen',
        },
        {
          innerHTML: `<img height="1" width="1" style="display:none"
          src="https://www.facebook.com/tr?id=1202002621614958&ev=PageView&noscript=1"
          />`,
          tagPosition: 'bodyOpen',
        },
      ],
    },
    __dangerouslyDisableSanitizers: ['script', 'noscript'],
  },

  // config envs
  runtimeConfig: {
    public: {
      secret: process.env.SECRET_KEY,
      API_BASE_URL: process.env.API_URL,
      SHORT_NAME: process.env.SHORT_NAME,
      keymaps: process.env.GOOGLE_KEY,
      private_key: process.env.PRIVATE_KEY,
      public_key: process.env.PUBLIC_KEY,
      dlocal_env: process.env.DLOCAL_ENV,
      klaviyo_key: process.env.KLAVIJO_KEY,
    },
  },

  // css
  css: ['@/assets/scss/main.scss'],
  experimental: {
    asyncContext: true,
    payloadExtraction: true,
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      minify: 'esbuild',
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData:
            '@use "~/assets/scss/utilities/_viariables.scss" as *;',
        },
      },
    },
    resolve: {
      alias: {
        'fast-deep-equal': 'fast-deep-equal/es6', // Usa la versión ES6 si está disponible
      },
    },
  },

  // modules
  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@nuxt/image',
    'pinia-plugin-persistedstate/nuxt',
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
    '@nuxt/eslint',
    'vue3-carousel-nuxt',
  ],
  carousel: {
    prefix: 'vueCarousel',
  },
  // primevue
  primevue: {
    usePrimeVue: true,
    autoImport: true,
    options: {
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '',
        },
      },
      locale: {
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        dayNames: [
          'Domingo',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
        ],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        monthNames: [
          'Enero',
          'Febrero',
          'Marzo',
          'Abril',
          'Mayo',
          'Junio',
          'Julio',
          'Agosto',
          'Septiembre',
          'Octubre',
          'Noviembre',
          'Diciembre',
        ],
        monthNamesShort: [
          'Ene',
          'Feb',
          'Mar',
          'Abr',
          'May',
          'Jun',
          'Jul',
          'Ago',
          'Sep',
          'Oct',
          'Nov',
          'Dic',
        ],
        fileSizeTypes: [
          'Bytes',
          'KB',
          'MB',
          'GB',
          'TB',
          'PB',
          'EB',
          'ZB',
          'YB',
        ],
      },
    },
  },
  nitro: {
    compressPublicAssets: {
      gzip: true,
      brotli: true,
    },
  },

  features: {
    inlineStyles: false,
  },
  webpack: {
    extractCSS: true,
    optimization: {
      splitChunks: {
        cacheGroups: {
          // Dividir código JavaScript de librerías comunes
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 10, // Prioriza las dependencias de node_modules
            enforce: true,
          },
          // Dividir archivos de estilo (ya lo tienes configurado)
          styles: {
            name: 'styles',
            test: /\.(css|vue)$/,
            chunks: 'all',
            enforce: true,
          },
          // Dividir el código JavaScript relacionado con tu aplicación
          app: {
            name: 'app',
            chunks: 'all',
            minChunks: 2, // Evita la creación de fragmentos para módulos muy pequeños
            enforce: true,
          },
        },
      },
    },
  },
  sourcemap: true,
  // translator
  i18n: {
    locales: [
      {
        code: 'es',
        file: 'es.ts',
        name: 'Español',
      },
    ],
    lazy: true,
    langDir: 'lang/',
    defaultLocale: 'es',
  },

  compatibilityDate: '2024-10-01',
})
