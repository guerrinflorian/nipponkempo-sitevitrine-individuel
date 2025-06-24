<template>
    <div class="club-tournaments">
        <h1 class="page-title">🏅 Tournois du club</h1>

        <!-- barre de recherche et filtres -->
        <div class="filters">
            <n-input v-model:value="searchQuery" placeholder="🔎 Rechercher un tournoi ou une catégorie..." clearable
                class="search-bar" size="large" />

            <n-select v-model:value="selectedStatus" :options="statusOptions" placeholder="📌 Statut" clearable
                class="status-filter" size="small" />
        </div>

        <!-- contenu principal -->
        <div class="content">
            <!-- chg des données -->
            <n-spin v-if="!club" size="large" description="Chargement des tournois..." />

            <!-- liste des tournois filtrés -->
            <div v-else>
                <div v-if="filteredTournaments.length > 0" class="tournaments-list">
                    <TournamentCardComponent v-for="tournament in filteredTournaments" :key="tournament.id"
                        :tournament="tournament" :club-id="route.params.id" :user="authStore.user"
                        :participant="authStore.participant" />
                </div>

                <!-- message si aucun tournoi trouvé -->
                <n-alert v-else type="warning" class="no-tournaments">
                    Aucun tournoi ou catégorie trouvée. Essayez un autre filtre ou une autre recherche.
                </n-alert>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClubsStore } from '@/stores/clubsStore'
import { useAuthStore } from '@/stores/authStore'
import TournamentCardComponent from '@/components/TournamentCardComponent.vue'
import { NInput, NSelect, NAlert, NSpin } from 'naive-ui'

const clubsStore = useClubsStore()
const authStore = useAuthStore()
const route = useRoute()
const club = ref(null)
const searchQuery = ref('')
const selectedStatus = ref(null)

// charge les tournois du club sélectionné
onMounted(async () => {
    try {
        await clubsStore.fetchClubs()

        club.value = clubsStore.clubs.find(c => c.id === parseInt(route.params.id)) || null
    } catch (error) {
        console.error("Erreur lors du chargement des clubs :", error)
    }
})

// options de filtrage par statut
const statusOptions = computed(() => {
    if (!club.value || !club.value.tournament) return []

    const uniqueStatuses = new Set()
    club.value.tournament.forEach(t => {
        if (t.tournament_status?.name) {
            uniqueStatuses.add(t.tournament_status.name)
        }
    })

    return [...uniqueStatuses].map(status => ({
        label: status,
        value: status
    }))
})

// filtre les tournois et leurs catégories
const filteredTournaments = computed(() => {
    if (!club.value || !club.value.tournament) return []

    return club.value.tournament
        .filter(tournament => {
            const matchesSearch = searchQuery.value
                ? ((tournament.name && tournament.name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
                    (tournament.tournament_status?.name && tournament.tournament_status.name.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
                    (tournament.category && tournament.category.some(cat => cat.name.toLowerCase().includes(searchQuery.value.toLowerCase()))))
                : true

            const matchesStatus = selectedStatus.value
                ? tournament.tournament_status?.name === selectedStatus.value
                : true

            return matchesSearch && matchesStatus
        })
        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)) // 📌 Tri du plus récent au plus ancien
})

</script>

<style scoped>
/* page principale */
.club-tournaments {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    background: linear-gradient(to bottom, #f9f9f9, #ffffff);
}

/* titre */
.page-title {
    font-size: 26px;
    font-weight: bold;
    margin-bottom: 20px;
    color: #333;
}

/* conteneur des filtres */
.filters {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 900px;
    justify-content: center;
}

/* barre de recherche */
.search-bar {
    flex: 1;
    height: 40px;
}

/* filtre par statut */
.status-filter {
    width: 140px;
}

/* contenu principal (ne bouge pas) */
.content {
    width: 100%;
    max-width: 900px;
}

/* liste des tournois */
.tournaments-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    width: 100%;
}

/* message d'absence de tournoi */
.no-tournaments {
    margin-top: 20px;
    width: 100%;
    text-align: center;
}
</style>