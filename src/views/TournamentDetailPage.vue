<template>
    <div class="page-container">
        <div class="tournament-layout">

            <!-- section info tournoi -->
            <div class="tournament-info">
                <n-card class="info-card">
                    <div class="info-header">
                        <n-button text class="back-button" @click="goBack">Retour</n-button>
                    </div>
                    <h1 class="tournament-title">{{ tournament?.name }}</h1>
                    <n-tag round size="large"
                        :color="{ color: tournament?.tournament_status?.color || '#ccc', textColor: '#fff' }">
                        {{ tournament?.tournament_status?.name || 'statut inconnu' }}
                    </n-tag>
                    <n-text class="club-name">
                        Organisé par : <strong>{{ clubName }}</strong>
                    </n-text>
                    <n-divider />
                    <n-space vertical size="small">
                        <n-text strong>Début :</n-text>
                        <n-text>{{ formatDate(tournament?.start_date) }}</n-text>
                    </n-space>
                </n-card>
            </div>

            <!-- section categories -->
            <div class="categories-container">
                <h2 class="categories-title">categories</h2>
                <div class="categories-grid">
                    <n-card v-for="category in tournament?.category" :key="category.id" class="category-card">
                        <div class="category-header">
                            <n-text strong class="category-name">{{ category.name }}</n-text>
                            <n-tag v-if="category.category_type?.name" type="info">
                                {{ category.category_type.name }}
                            </n-tag>
                            <n-tag v-if="category.tournament_status" round size="small"
                                :color="{ color: category.tournament_status.color, textColor: '#fff' }">
                                {{ category.tournament_status.name }}
                            </n-tag>
                        </div>

                        <n-space vertical class="category-details" size="small" :gap="8">
                            <!-- poids et gagnant côte a côte -->
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <n-text>Poids : {{ formatWeight(category.min_weight, category.max_weight) }}</n-text>
                                <n-text v-if="category.winner">
                                    Gagnant : {{ category.winner.first_name }} {{ category.winner.last_name }}
                                </n-text>
                            </div>

                            <!-- grade genre age -->
                            <n-text>Grade : {{ formatGrade(category.grade_minimum, category.grade_maximum) }}</n-text>
                            <n-text>Genre : {{ category.gender?.name || 'mixte' }}</n-text>
                            <n-text v-for="ca in category.category_ages" :key="ca.category_age.id">
                                Age : {{ ca.category_age.min_age }} - {{ ca.category_age.max_age }} ans
                            </n-text>
                        </n-space>

                        <!-- actions inscription -->
                        <template v-if="!authStore.isAuthenticated || !authStore.participant">
                            <n-button type="default" block disabled>
                                Connectez vous pour vous inscrire
                            </n-button>
                        </template>

                        <template v-else-if="[3, 4, 5].includes(category.tournament_status?.id)">
                            <n-button v-if="registrationStatus[category.id]?.registered" type="info" block disabled>
                                Inscrit : {{ registrationStatus[category.id].status.name }}
                            </n-button>
                        </template>

                        <template v-else>
                            <n-button v-if="registrationStatus[category.id]?.registered" type="info" block disabled>
                                Inscrit : {{ registrationStatus[category.id].status.name }}
                            </n-button>
                            <n-button v-else-if="canRegister(category)" type="primary" block
                                @click="registerCategory(category.id)">
                                S'inscrire a cette categorie
                            </n-button>
                            <div v-else>
                                <n-button type="default" block disabled>
                                    Conditions non remplies
                                </n-button>
                                <n-space vertical size="small" style="margin-top:8px">
                                    <n-text type="error" small v-for="reason in getRegistrationReasons(category)"
                                        :key="reason">
                                        • {{ reason }}
                                    </n-text>
                                </n-space>
                            </div>
                        </template>
                    </n-card>
                </div>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NTag, NText, NButton, NDivider, NSpace } from 'naive-ui'
import { useClubsStore } from '@/stores/clubsStore'
import { useAuthStore } from '@/stores/authStore'
import axiosInstance from '@/utils/axiosIntance.js'

const authStore = useAuthStore()
const clubsStore = useClubsStore()
const route = useRoute()
const router = useRouter()

const tournament = ref(null)
const club = ref(null)

// etat inscription par categorie
const registrationStatus = reactive({})

onMounted(async () => {
    // recup tournoi et club
    if (!tournament.value) {
        if (clubsStore.clubs.length === 0) await clubsStore.fetchClubs()
        for (const c of clubsStore.clubs) {
            const t = c.tournament.find(t => t.id === +route.params.tournamentId)
            if (t) {
                tournament.value = t
                club.value = c
                break
            }
        }
    }
    // recup statut inscription si connecte
    if (authStore.isAuthenticated && authStore.participant) {
        for (const category of tournament.value.category) {
            await fetchRegistrationStatus(category.id)
        }
    }
})

// recup statut inscription categorie
const fetchRegistrationStatus = async (categoryId) => {
    try {
        const { data } = await axiosInstance.get(`/categories/${categoryId}/registration-status`)
        registrationStatus[categoryId] = data
    } catch (e) {
        console.error('erreur recupérationn statut inscription', e)
    }
}

// age participant
const participantAge = computed(() => {
    const b = authStore.participant?.birth_date
    if (!b) return 0
    const diff = Date.now() - new Date(b).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
})

// raisons bloque inscription
function getRegistrationReasons(category) {
    const reasons = []
    const p = authStore.participant
    if (!authStore.user.email_verified) reasons.push('Email non verifié')
    if (!p) reasons.push('Profil participant manquant')
    if (category.tournament_status?.id !== 1) reasons.push('Inscriptions fermees')
    if (category.gender?.name && p.gender.name !== category.gender.name)
        reasons.push(`Doit etre de genre ${category.gender.name}`)
    if (category.min_weight && p.weight < category.min_weight)
        reasons.push(`Poids minimum ${category.min_weight} kg`)
    if (category.max_weight && p.weight > category.max_weight)
        reasons.push(`Poids maximum ${category.max_weight} kg`)
    const gm = category.grade_minimum?.id
    const gM = category.grade_maximum?.id
    if (gm && p.id_grade < gm) reasons.push(`Grade minimum ${category.grade_minimum.name}`)
    if (gM && p.id_grade > gM) reasons.push(`Grade maximum ${category.grade_maximum.name}`)
    if (category.category_ages?.length) {
        const ok = category.category_ages.some(ca => {
            const { min_age, max_age } = ca.category_age
            return participantAge.value >= min_age && participantAge.value <= max_age
        })
        if (!ok) {
            const ranges = category.category_ages
                .map(ca => `${ca.category_age.min_age}-${ca.category_age.max_age}`)
                .join(' ou ')
            reasons.push(`Age doit être dans ${ranges} ans`)
        }
    }
    return reasons
}

// verif conditions inscription
const canRegister = category => getRegistrationReasons(category).length === 0

// action inscription
async function registerCategory(categoryId) {
    try {
        await axiosInstance.post(`/categories/${categoryId}/register`)
        await fetchRegistrationStatus(categoryId)
    } catch (e) {
        console.error('erreur inscription categorie', e)
    }
}

// utilitaires ui
const clubName = computed(() => club.value?.name || 'inconnu')
const goBack = () => {
    const clubId = tournament.value?.id_club
    router.push(clubId ? `/club/${clubId}/tournois` : '/')
}
const formatDate = date => new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
const formatWeight = (min, max) => min && max ? `${min} - ${max} kg` : min ? `+${min} kg` : max ? `-${max} kg` : 'non specifie'
const formatGrade = (min, max) => min?.name && max?.name ? `${min.name} - ${max.name}` : min?.name || max?.name || 'non specifie'
</script>

<style scoped>
.page-container {
    width: 100%;
    max-width: 1100px;
    margin: auto;
    padding: 20px;
}

.tournament-layout {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.tournament-info {
    flex: 1;
}

.info-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-header {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 10px;
}

.back-button {
    background: transparent;
    color: #333;
    font-weight: bold;
    transition: color .3s;
}

.back-button:hover {
    color: #007bff;
}

.tournament-title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.club-name {
    font-size: 16px;
    margin-top: 5px;
    opacity: .8;
}

.categories-container {
    flex: 2;
    display: flex;
    flex-direction: column;
}

.categories-title {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #444;
}

.categories-grid {
    display: grid;
    grid-template-columns: 1fr;
    row-gap: 15px;
}


.category-card {
    background: white;
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: transform .2s, box-shadow .2s;
}

.category-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.category-name {
    font-size: 18px;
    font-weight: bold;
}

@media screen and (min-width:768px) {
    .tournament-layout {
        flex-direction: row;
    }
}
</style>
