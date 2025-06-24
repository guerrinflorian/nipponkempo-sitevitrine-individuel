<template>
    <n-layout class="dashboard" style="min-height: 100vh">

        <n-layout-content content-style="padding: 24px; background: #f8f9fa">
            <!-- chargement des stats -->
            <n-spin size="large" v-if="loading" style="height: 300px" />

            <template v-else>
                <!-- resume des performances -->
                <n-card title="Résumé performances" hoverable :bordered="false">
                    <n-grid cols="1 s:2 m:4" :x-gap="12" :y-gap="12" responsive="screen">
                        <n-gi>
                            <n-statistic label="Matchs joués" :value="stats.general.totalMatches">
                                <template #suffix>
                                    <n-tag type="info" :bordered="false" size="small">Total</n-tag>
                                </template>
                            </n-statistic>
                        </n-gi>
                        <n-gi>
                            <n-statistic label="Victoires" :value="stats.general.totalWon">
                                <template #suffix>
                                    <n-tag type="success" :bordered="false" size="small">
                                        {{ stats.general.totalWon }} / {{ stats.general.totalMatches }}
                                    </n-tag>
                                </template>
                            </n-statistic>
                        </n-gi>
                        <n-gi>
                            <n-statistic label="Défaites" :value="stats.general.totalLost">
                                <template #suffix>
                                    <n-tag type="error" :bordered="false" size="small">
                                        {{ stats.general.totalLost }} / {{ stats.general.totalMatches }}
                                    </n-tag>
                                </template>
                            </n-statistic>
                        </n-gi>
                        <n-gi>
                            <n-statistic label="Catégories gagnées" :value="stats.general.categoriesWon">
                                <template #suffix>
                                    <n-text>/ {{ stats.general.categoriesPlayed }}</n-text>
                                </template>
                            </n-statistic>
                        </n-gi>
                    </n-grid>
                </n-card>

                <!-- ratio ippons keikokus -->
                <n-card title="Ratio ippons keikokus" hoverable style="margin-top: 24px">
                    <n-space vertical size="large" style="padding: 16px 0">
                        <!-- barre ippons -->
                        <div class="ratio-bar">
                            <n-progress type="line" :percentage="ipponsPct" :height="24" :border-radius="4"
                                status="info" processing style="flex: 1" />
                            <n-space justify="end" align="center" size="large"
                                style="min-width: 200px; margin-left: 16px">
                                <n-text marques="marques">Marqués: {{ stats.general.ipponsScored }}</n-text>
                                <n-text concedes="concedes">Concedés: {{ stats.general.ipponsConceded }}</n-text>
                                <n-text>— {{ ipponsPct }} %</n-text>
                            </n-space>
                        </div>
                        <!-- barre keikokus -->
                        <div class="ratio-bar">
                            <n-progress type="line" :percentage="keikokuPct" :height="24" :border-radius="4"
                                status="warning" style="flex: 1" />
                            <n-space justify="end" align="center" size="large"
                                style="min-width: 200px; margin-left: 16px">
                                <n-text marques="marques">Marqués: {{ stats.general.keikokusScored }}</n-text>
                                <n-text concedes="concedes">Concedés: {{ stats.general.keikokusConceded }}</n-text>
                                <n-text>— {{ keikokuPct }} %</n-text>
                            </n-space>
                        </div>
                    </n-space>
                </n-card>

                <!-- historique des matchs -->
                <n-card title="Historique des matchs" hoverable style="margin-top: 24px">
                    <n-data-table :columns="matchColumns" :data="stats.matches" :pagination="pagination" :striped="true"
                        :bordered="false" :single-line="false" size="small" />
                </n-card>
            </template>
        </n-layout-content>
    </n-layout>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import axiosInstance from '@/utils/axiosIntance'
import { NLayout, NLayoutContent, NSpace, NCard, NGrid, NGi, NStatistic, NTag, NSpin, NProgress, NDataTable } from 'naive-ui'

// etat chargement
const loading = ref(true)
// donnees stats
const stats = ref({ general: { categoriesPlayed: 0, categoriesWon: 0, totalMatches: 0, totalWon: 0, totalLost: 0, winRate: 0, ipponsScored: 0, ipponsConceded: 0, keikokusScored: 0, keikokusConceded: 0 }, matches: [] })

// calc pourcentages
const ipponsPct = computed(() => {
    const g = stats.value.general
    const total = g.ipponsScored + g.ipponsConceded
    return total > 0 ? Math.round((g.ipponsScored / total) * 100) : 0
})
const keikokuPct = computed(() => {
    const g = stats.value.general
    const total = g.keikokusScored + g.keikokusConceded
    return total > 0 ? Math.round((g.keikokusScored / total) * 100) : 0
})

// pagination
const pagination = ref({ pageSize: 5 })

// colonnes tableau
const matchColumns = [
    { title: 'Combattants', key: 'participants', width: 260, render: row => `${row.participant1.firstName} ${row.participant1.lastName} vs ${row.participant2.firstName} ${row.participant2.lastName}` },
    { title: 'Competition', key: 'tournamentName', width: 200, ellipsis: { tooltip: true } },
    { title: 'Categorie', key: 'categoryName', width: 150 },
    { title: 'Type', key: 'matchType', width: 100 },
    { title: 'Resultat', key: 'won', width: 120, render: row => h(NTag, { type: row.won ? 'success' : 'error', bordered: false, size: 'small' }, () => row.won ? 'victoire' : 'defaite') },
    { title: 'Ippons m/c/r%', key: 'ippons', width: 180, render: row => { const m = row.ipponsScored; const c = row.ipponsConceded; const p = m + c > 0 ? Math.round((m / (m + c)) * 100) : 0; return `m:${m} c:${c} ${p}%` } },
    { title: 'Keikokus m/c/r%', key: 'keikokus', width: 180, render: row => { const m = row.keikokusScored; const c = row.keikokusConceded; const p = m + c > 0 ? Math.round((m / (m + c)) * 100) : 0; return `m:${m} c:${c} ${p}%` } }
]

// recup stats au montage
const authStore = useAuthStore()
const participantId = computed(() => authStore.participant?.id)
onMounted(async () => {
    if (!participantId.value) return
    try {
        loading.value = true
        const { data } = await axiosInstance.get(`/participants/${participantId.value}/statistics`)
        if (data.status === 'success') {
            stats.value.general = data.data.generalStatistics
            stats.value.matches = data.data.matches
        }
    } catch (err) {
        console.error('erreur chargement stats', err)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.dashboard {
    --header-height: 64px
}

/* styles carte */
.n-card {
    border-radius: 8px;
    transition: transform .3s, box-shadow .3s
}

.n-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
}

/* espacement ratio */
.ratio-bar {
    display: flex;
    align-items: center
}
</style>
