<script setup lang="ts"></script>
<template>
  <div class="pricing-container">
    <h3 class="title primary1 tw-text-center lg:tw-pt-10">
      {{ $t('recipes.menus.title.menus') }} <span class="highlight">{{ $t('recipes.menus.title.made') }}</span> {{
        $t('recipes.menus.title.price') }} <span class="highlight"> {{ $t('recipes.menus.title.yours') }}</span>
    </h3>

    <div class="pricing-cards-container">
      <div v-for="index in 4" :key="index" class="pricing-card">
        <div class="dog-image-container">
          <img :src="`/img/recipes/ic_pet_${index}.webp`" :alt="`dog_${index}`" class="dog-image" />
        </div>

        <div class="card-content">
          <h3 class="black-texts">{{ $t(`recipes.menus.dogs.${index}.title`) }}</h3>

          <div class="pricing-section">
            <p class="original-price">{{ $t(`recipes.menus.dogs.${index}.from`) }} <span class="tw-line-through"> {{ $t(`recipes.menus.dogs.${index}.to`) }}  </span></p>
            <p class="black-texts">{{ $t(`recipes.menus.dogs.${index}.price`) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pricing-container {
  .highlight {
    color: #3498db;
  }

  .pricing-cards-container {
    @apply tw-flex tw-justify-evenly tw-px-20 tw-gap-6 tw-overflow-x-auto tw-px-10 max-lg:tw-py-5  lg:tw-pb-10;

    .pricing-card {
      @apply lg:tw-min-w-[296px] tw-rounded-2xl tw-transition-transform tw-px-6 tw-py-8;
      position: relative;
      background: transparent;
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      &::before {
        content: '';
        position: absolute;
        border-radius: 20px;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60%;
        background: #F5F6FA;
        z-index: -1;
      }
    }
    .black-texts{
      @apply tw-text-[#1A1A29] tw-font-treble-bold tw-text-[24px];
    }
    .pricing-card:hover {
      transform: translateY(-5px);
      transition: transform 0.3s ease-in-out;
      &::before{
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
      transition: transform 0.3s ease-in-out;
      }
    }

    .dog-image-container {
      margin-bottom: 1.5rem;
    }

    .dog-image {
      object-fit: cover;
    }

    .card-content {
      color: #2c3e50;


      .category-title {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0;
        color: #2c3e50;
      }
  
      .weight-range {
        font-size: 1.1rem;
        color: #7f8c8d;
        margin: 0.5rem 0 1.5rem 0;
        font-weight: 500;
      }
  
      .pricing-section {
        padding-top: 1rem;
      }
  
      .original-price {
        @apply tw-text-[#575E6B] tw-font-treble-book tw-text-[18px] tw-mb-4;
      }
  
      .current-price {
        font-size: 1.8rem;
        font-weight: bold;
        color: #2c3e50;
        margin: 0;
      }
    }

  }


}
</style>