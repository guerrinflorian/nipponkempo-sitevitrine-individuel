<template>
  <div class="club-page">
    <!-- carousel affiche si au moins 1 image -->
    <div class="carousel-container" v-if="clubImages.length > 0">
      <n-carousel v-bind="carouselProps" class="carousel">
        <n-carousel-item v-for="(image, idx) in clubImages" :key="idx">
          <img :src="image" class="carousel-image" />
        </n-carousel-item>
      </n-carousel>
    </div>

    <!-- recup info club sous carousel -->
    <div class="club-info" v-if="club">
      <h1 class="club-name">{{ club.name }}</h1>
      <p class="club-address">{{ club.address }}</p>
      <p class="club-description">{{ club.description || 'aucune description disponible' }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClubsStore } from '@/stores/clubsStore'
import { NCarousel, NCarouselItem } from 'naive-ui'

const route = useRoute()
const clubsStore = useClubsStore()

// recup club courant
const club = computed(() => clubsStore.clubs.find(c => c.id == route.params.id))

// props carousel selon nb images
const carouselProps = computed(() => {
  const count = clubImages.value.length
  return {
    autoplay: count > 1,
    loop: count > 1,
    showArrow: count > 1,
    showDots: count > 1,
    draggable: count > 1,
    slidesPerView: 1
  }
})

// recup images dynamiques depuis club
const clubImages = computed(() => {
  if (!club.value) return []
  const images = []
  for (let i = 1; i <= 3; i++) {
    const key = `image_${i}`
    if (club.value[key]) images.push(club.value[key])
  }
  return images
})

// init recup clubs si vide
onMounted(() => {
  if (clubsStore.clubs.length === 0) {
    clubsStore.fetchClubs()
  }
})
</script>

<style scoped>
.club-page {
  width: 100%;
  height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.carousel-container {
  width: 100%;
  height: 70%;
  position: relative;
}

.carousel {
  width: 100%;
  height: 100%;
  opacity: 0.3;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-info {
  width: 80%;
  max-width: 800px;
  text-align: center;
  padding: 20px;
}

.club-name {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
}

.club-address,
.club-description {
  font-size: 18px;
  color: #4a4a4a;
  margin-top: 8px;
}
</style>
