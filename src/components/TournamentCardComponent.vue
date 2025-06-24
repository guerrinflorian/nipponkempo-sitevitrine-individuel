<template>
  <n-card class="tournament-card" :bordered="false" @click="goToTournamentDetail">
    <template #header>
      <div class="header">
        <n-tag :bordered="false" round size="small" :color="{
          color: tournament.tournament_status.color,
          textColor: '#fff'
        }">
          {{ tournament.tournament_status.name }}
        </n-tag>
        <div class="title-container">
          <span class="tournament-name">🏆 {{ tournament.name }}</span>
          <n-text v-if="tournament.category?.[0]?.category_type?.name" depth="3" class="tournament-type">
            ({{ tournament.category[0].category_type.name }})
          </n-text>
        </div>
      </div>
    </template>

    <n-space vertical>
      <n-text type="primary">📅 Début : {{ formatDate(tournament.start_date) }}</n-text>

      <n-table striped size="small" class="compact-table">
        <thead>
          <tr>
            <th>🏷️ Nom</th>
            <th>⚖️ Poids</th>
            <th>🥋 Grade</th>
            <th>👤 Genre</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in tournament.category" :key="category.id">
            <td>{{ category.name }}</td>
            <td>{{ formatWeight(category.min_weight, category.max_weight) }}</td>
            <td>{{ formatGrade(category.grade_minimum, category.grade_maximum) }}</td>
            <td>{{ category.gender?.name || 'Mixte' }}</td>
          </tr>
        </tbody>
      </n-table>
    </n-space>

    <template #footer>
      <n-space justify="end">
        <n-button text @click.stop="openCommentsModal">
          <n-badge :value="tournament.comment_count" :max="99">
            <n-icon size="24">
              <ChatbubbleOutline />
            </n-icon>
          </n-badge>
        </n-button>
      </n-space>
    </template>

  </n-card>

  <TournamentCommentsModal v-model:show="showCommentsModal" :tournament="tournament" :user="user"
    :participant="participant" @update-comment-count="updateCommentCount" />

</template>

<script setup>
import { NCard, NTag, NTable, NSpace, NText, NButton, NBadge, NIcon } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import TournamentCommentsModal from './TournamentCommentsModal.vue'
import { ChatbubbleOutline } from '@vicons/ionicons5'

const props = defineProps({
  tournament: Object,
  clubId: Number,
  user: Object,
  participant: Object
})

const router = useRouter()
const route = useRoute()

const showCommentsModal = ref(false)

const openCommentsModal = () => {
  showCommentsModal.value = true
}

const updateCommentCount = (count) => {
  props.tournament.comment_count = count
}

const goToTournamentDetail = () => {
  router.push(`/club/${props.clubId}/tournoi/${props.tournament.id}`)
}

// formate la date en français
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

// gere l  affichage des poids selon les règles demandées
const formatWeight = (min, max) => {
  if (min && max) return `${min} - ${max} kg`
  if (min) return `+${min} kg`
  if (max) return `-${max} kg`
  return "Non spécifié"
}

// gere laffichage des grades selon les règles demandées
const formatGrade = (min, max) => {
  if (min?.name && max?.name) return `${min.name} - ${max.name}`
  if (min?.name) return min.name
  if (max?.name) return max.name
  return "Non spécifié"
}
</script>

<style scoped>
.tournament-card {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tournament-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}


.header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-container {
  display: flex;
  flex-direction: column;
}

.tournament-name {
  font-size: 18px;
  font-weight: bold;
}

.tournament-type {
  font-size: 12px;
  color: #888;
}

.compact-table :deep(td),
.compact-table :deep(th) {
  padding: 4px 8px;
  font-size: 13px;
}

.compact-table {
  margin-top: 8px;
}
</style>
