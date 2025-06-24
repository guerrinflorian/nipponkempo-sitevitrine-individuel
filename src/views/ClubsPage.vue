<template>
  <div class="page-container">
    <div class="content-container">
      <!-- barre recherche recup clubs -->
      <div class="search-container">
        <n-input v-model:value="search" placeholder="Rechercher un club" clearable size="large" class="search-bar" />
      </div>

      <!-- liste clubs -->
      <div class="club-list">
        <n-spin v-if="clubsStore.loading" size="large" />

        <n-grid v-if="filteredClubs.length > 0" cols="1 s:2 m:3 l:4" responsive="screen" :x-gap="16" :y-gap="20"
          class="grid-container">
          <n-gi v-for="club in filteredClubs" :key="club.id">
            <div class="club-card" @mouseenter="hover = club.id" @mouseleave="hover = null"
              @click="goToClubPage(club.id)" :class="{ hovered: hover === club.id }">
              <!-- icon club -->
              <div class="club-icon">
                🏠
              </div>

              <!-- info club -->
              <div class="club-info">
                <n-text strong class="club-name">{{ club.name }}</n-text>
                <n-text class="club-address">{{ club.address }}</n-text>
                <n-text class="club-description">{{ club.description }}</n-text>
              </div>
            </div>
          </n-gi>
        </n-grid>

        <!-- message aucun resultat -->
        <div v-else class="no-results">
          <n-text>Aucun club trouvé</n-text>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NGrid, NGi, NText, NInput, NSpin } from 'naive-ui'
import { useClubsStore } from '@/stores/clubsStore'
import { useRouter } from 'vue-router'

const clubsStore = useClubsStore()
const router = useRouter()

const search = ref('')
const hover = ref(null)

// recup clubs au montage
onMounted(() => {
  if (clubsStore.clubs.length === 0) {
    clubsStore.fetchClubs()
  }
})

// filtre clubs selon search
const filteredClubs = computed(() => {
  return search.value
    ? clubsStore.clubs.filter(club => {
      const lowerSearch = search.value.toLowerCase()
      return (
        club.name.toLowerCase().includes(lowerSearch) ||
        club.address.toLowerCase().includes(lowerSearch) ||
        (club.description && club.description.toLowerCase().includes(lowerSearch))
      )
    })
    : clubsStore.clubs
})

// navigation vers page club
const goToClubPage = id => {
  router.push(`/club/${id}`)
}
</script>

<style scoped>
.page-container {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
}

.content-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1200px;
}

.search-container {
  width: 100%;
  max-width: 600px;
  margin-bottom: 20px;
  align-self: center;
}

.search-bar {
  width: 100%;
}

.club-list {
  width: 100%;
}

.club-card {
  position: relative;
  background: white;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  min-height: 140px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.club-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('../assets/images/background.jpg') no-repeat center center;
  background-size: cover;
  opacity: 0.05;
  z-index: 0;
}

.club-card.hovered {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border-color: #18a0fb;
}

.club-icon {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 50%;
  font-size: 28px;
  padding: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.club-info {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.club-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.club-address {
  font-size: 14px;
  color: #777;
}

.club-description {
  font-size: 13px;
  color: #555;
  text-align: center;
  font-style: italic;
}

.no-results {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

@media screen and (max-width: 1024px) {
  .club-card {
    padding: 15px;
  }
}

@media screen and (max-width: 768px) {
  .search-container {
    max-width: 90%;
  }

  .club-card {
    padding: 15px;
  }

  .club-name {
    font-size: 16px;
  }

  .club-address,
  .club-description {
    font-size: 13px;
  }
}

@media screen and (max-width: 480px) {
  .club-card {
    padding: 12px;
  }

  .club-name {
    font-size: 14px;
  }

  .club-address,
  .club-description {
    font-size: 12px;
  }
}
</style>
