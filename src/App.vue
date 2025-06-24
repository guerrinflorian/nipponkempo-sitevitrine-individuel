<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-layout style="min-height: 100vh; display: flex; flex-direction: column;">
        <!-- barre entete -->
        <n-layout-header class="header">
          <div class="header-left">
            <!-- bouton accueil -->
            <n-button v-if="isClubPage" @click="router.push('/')" class="home-button">
              <n-icon v-if="isMobile" size="22">
                <HomeIcon />
              </n-icon>
              <template v-else>Accueil</template>
            </n-button>

            <!-- menu burger mobile -->
            <n-dropdown v-if="isMobile" trigger="click" :options="mobileMenuOptions" @select="navigateToTab">
              <n-button class="menu-button">Menu</n-button>
            </n-dropdown>

            <!-- tabs classiques pc -->
            <n-tabs v-if="!isMobile && isClubPage" type="bar" v-model:value="activeTab" class="custom-tabs"
              @update:value="navigateToTab">
              <n-tab-pane name="info" tab="Informations du club" />
              <n-tab-pane name="tournoi" tab="Tournois" />
            </n-tabs>
          </div>

          <!-- onglets globaux pc -->
          <n-tabs v-if="!isMobile && !isClubPage" type="bar" v-model:value="activeTab" class="custom-tabs"
            @update:value="navigateToTab">
            <n-tab-pane name="clubs" tab="Liste des clubs" />
            <n-tab-pane name="calendar" tab="Calendrier des tournois" />
          </n-tabs>

          <!-- connexion mon compte -->
          <div class="header-right">
            <n-button v-if="!authStore.isAuthenticated" @click="showAuthModal = true" class="auth-button">
              <span class="mobile-auth">Connexion/Inscription</span>
            </n-button>

            <n-dropdown v-else trigger="hover" :options="accountOptions" @select="handleAccountAction">
              <n-button v-if="!isMobile" class="auth-button">
                {{ authStore.user?.name || 'Mon compte' }}
              </n-button>
              <n-button v-else class="auth-button">
                <n-icon size="22">
                  <UserIcon />
                </n-icon>
              </n-button>
            </n-dropdown>
          </div>

          <!-- modal authentification -->
          <n-modal v-model:show="showAuthModal">
            <AuthComponent @close="showAuthModal = false" />
          </n-modal>
        </n-layout-header>

        <!-- contenu principal -->
        <n-layout-content class="content">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useClubsStore } from '@/stores/clubsStore'
import {
  NConfigProvider,
  NMessageProvider,
  NLayout,
  NLayoutHeader,
  NDropdown,
  NButton,
  NModal,
  NTabs,
  NTabPane,
  NLayoutContent,
  NIcon
} from 'naive-ui'
import { Home as HomeIcon, User as UserIcon } from '@vicons/fa'
import AuthComponent from './components/AuthComponent.vue'

// stores router
const authStore = useAuthStore()
const clubsStore = useClubsStore()
const route = useRoute()
const router = useRouter()

// references reactives
const showAuthModal = ref(false)
const activeTab = ref('clubs')
const theme = ref(null)
const isMobile = ref(window.innerWidth < 768)

// detecter mode mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', checkMobile)
  clubsStore.fetchClubs()
  if (authStore.isAuthenticated && authStore.user) {
    authStore.subscribeToUserUpdates()
  }
})

watch(route, () => {
  if (route.path.match(/^\/club\/\d+$/)) {
    activeTab.value = 'info'
  } else if (route.path.match(/^\/club\/\d+\/tournois$/)) {
    activeTab.value = 'tournoi'
  } else if (route.path === '/') {
    activeTab.value = 'clubs'
  } else if (route.path === '/tournois/calendrier') {
    activeTab.value = 'calendar'
  } else {
    activeTab.value = ''
  }
}, { immediate: true })

// verifie page club tournoi
const isClubPage = computed(() => /^\/(club|tournoi)\/\d+/.test(route.path))

// options menu mobile
const mobileMenuOptions = computed(() => {
  if (isClubPage.value) {
    return [
      { label: 'informations du club', key: 'info' },
      { label: 'tournois', key: 'tournoi' }
    ]
  } else {
    return [
      { label: 'liste des clubs', key: 'clubs' },
      { label: 'calendrier des tournois', key: 'calendar' }
    ]
  }
})

// navigation onglets
const navigateToTab = (tab) => {
  const clubId = route.params.id

  if (tab === 'clubs') {
    router.push('/')
  } else if (tab === 'calendar') {
    router.push('/tournois/calendrier')
  } else if (tab === 'info' && clubId) {
    router.push(`/club/${clubId}`)
  } else if (tab === 'tournoi' && clubId) {
    router.push(`/club/${clubId}/tournois`)
  } else {
    // fallback si l ID n'est pas trouvé
    router.push('/')
  }
}

// gerer compte utilisateur
const accountOptions = [
  { label: 'Informations du compte', key: 'account' },
  { label: 'Déconnexion', key: 'logout' }
]

const handleAccountAction = (key) => {
  if (key === 'logout') {
    authStore.logout()
  } else if (key === 'account') {
    router.push('/mon-compte')
  }
}
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #0c2432;
  padding: 15px;
  color: white;
  height: 60px;
}

/* zone gauche */
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* zone droite */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* bouton accueil */
.home-button {
  background-color: transparent;
  border: none;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  height: 40px;
}

.home-button:hover {
  text-decoration: underline;
}

/* onglets personnalises */
.custom-tabs {
  display: flex;
  align-items: center;
  height: 40px;
}

.custom-tabs :deep(.n-tabs-tab) {
  color: white !important;
}

/* bouton menu mobile */
.menu-button {
  background-color: #18a0fb;
  color: white;
  font-weight: bold;
}

/* bouton connexion */
.auth-button {
  color: white;
}

/* responsive */
@media screen and (max-width: 768px) {
  .custom-tabs {
    display: none;
  }

  .auth-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    font-size: 14px;
  }

  .mobile-auth {
    display: block;
    line-height: 1.2;
  }
}
</style>
