<template>
    <div class="calendar-container">
        <div class="legend">
            <div v-for="status in tournamentStatusStore.statuses" :key="status.id" class="legend-item">
                <span class="status-dot-legend" :style="{ backgroundColor: status.color }"></span>
                <span>{{ status.name }}</span>
            </div>
        </div>

        <n-calendar v-model:value="selectedDate" class="calendar" :locale="locale" #="{ year, month, date }"
            @update:value="handleDateSelection">
            <!-- affiche evenements si existants -->
            <template v-if="tournaments[`${year}-${month}-${date}`]">
                <div class="tournament-container">
                    <div v-for="(tournament, index) in tournaments[`${year}-${month}-${date}`]" :key="tournament.id"
                        :class="['event', `event-${index % 5}`]"
                        :title="'Cliquer pour voir tournoi dans interface club'"
                        @click="openTournamentDetails(tournament)">

                        <!-- pastille couleur status -->
                        <span class="status-dot" :style="{ backgroundColor: tournament.statusColor }"
                            :title="tournament.statusName"></span>

                        <div class="tournament-name">{{ tournament.name }}</div>
                        <div class="club-name">{{ tournament.club }}</div>
                    </div>
                </div>
            </template>
        </n-calendar>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { NCalendar, useMessage, dateFrFR } from 'naive-ui'
import { useClubsStore } from '../stores/clubsStore'
import { useTournamentStatusStore } from '../stores/tournamentStatusStore'
import { useRouter } from 'vue-router'

const clubsStore = useClubsStore()
const tournamentStatusStore = useTournamentStatusStore()
const message = useMessage()
const locale = dateFrFR
const selectedDate = ref(Date.now())
const router = useRouter()

// recup clubs et statuses au montage
onMounted(async () => {
    if (clubsStore.clubs.length === 0) {
        await clubsStore.fetchClubs()
    }
    if (tournamentStatusStore.statuses.length === 0) {
        await tournamentStatusStore.fetchTournamentStatuses()
    }
})

// transforme donnees tournois pour calendrier
const tournaments = computed(() => {
    const events = {}

    clubsStore.clubs.forEach(club => {
        if (!club.tournament || !Array.isArray(club.tournament)) return // recup seulement si tableau

        club.tournament.forEach(tournament => {
            if (!tournament.start_date) return // ignore si pas de date

            const dateObj = new Date(tournament.start_date)
            const year = dateObj.getFullYear()
            const month = dateObj.getMonth() + 1 // correction mois index 0
            const day = dateObj.getDate()
            const key = `${year}-${month}-${day}`

            if (!events[key]) {
                events[key] = []
            }

            events[key].push({
                id: tournament.id,
                name: tournament.name,
                club: club.name,
                statusName: tournament.tournament_status?.name || 'Inconnu',
                statusColor: tournament.tournament_status?.color || '#000000'
            })
        })
    })

    return events
})

// gerer selection date pour afficher message
const handleDateSelection = (timestamp, { year, month, date }) => {
    const key = `${year}-${month}-${date}`
    if (tournaments.value[key]) {
        const clubNameList = tournaments.value[key].map(t => t.club).join(', ')
        message.success(`ouverture tournois club : ${clubNameList}`)
    }
}

// ouvrir details tournoi
const openTournamentDetails = (tournament) => {
    // recup club associe
    const clubObj = clubsStore.clubs.find(c => c.tournament.some(t => t.id === tournament.id))
    if (clubObj) {
        router.push(`/club/${clubObj.id}/tournois`)
    } else {
        console.warn('club non trouve pour ce tournoi', tournament)
    }
}
</script>

<style scoped>
/* conteneur principal */
.calendar-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 720px !important;
    padding: 20px;
    background-color: white;
}

.legend {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: 20px;
    font-size: 14px;
    font-weight: bold;
}

.status-dot-legend {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
}

.status-dot {
    position: absolute;
    top: 5px;
    left: 5px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
}

/* calendrier */
.calendar {
    flex-grow: 1;
    border-radius: 12px;
    background-color: white;
}

/* container evenements */
.tournament-container {
    max-height: 100px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.event {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    text-align: center;
}

.event:hover {
    box-shadow: inset 0px -3px 0px black;
}

/* style texte evenement */
.tournament-name {
    font-size: 11px;
}

.club-name {
    font-size: 10px;
    color: #666;
}

.event-0 {
    background-color: #ffecb3
}

.event-1 {
    background-color: #b3e0ff
}

.event-2 {
    background-color: #b3ffb3
}

.event-3 {
    background-color: #ffb3b3
}

.event-4 {
    background-color: #e0b3ff
}
</style>
