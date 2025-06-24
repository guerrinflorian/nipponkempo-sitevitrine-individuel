import { createRouter, createWebHistory } from 'vue-router';
import ClubsPage from '../views/ClubsPage.vue';
import ClubPage from '../views/ClubPage.vue';
import CalendrierTournoi from '../views/CalendrierTournoi.vue';
import PageNotFound from '../views/PageNotFound.vue';
import AccountPage from '../views/AccountPage.vue';
import ClubTournament from '../views/ClubTournament.vue';
import TournamentDetailPage from '@/views/TournamentDetailPage.vue';
import { useAuthStore } from '@/stores/authStore'; 
import ParticipantStats from '@/views/ParticipantStats.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'Clubs', component: ClubsPage },
    { path: '/club/:id', component: ClubPage },
    { path: '/club/:id/tournois', component: ClubTournament },
    { path: '/tournois/calendrier', component: CalendrierTournoi },
    { 
      path: '/club/:id/tournoi/:tournamentId', 
      component: TournamentDetailPage,
      name: 'TournamentDetail' // Ajoutez un nom pour faciliter les liens
    },
    {
      path: '/mon-compte/statistics',
      name: 'Statistics',
      component: ParticipantStats,
      meta: { requiresAuth: true }
    },
    { path: '/mon-compte', component: AccountPage, meta: { requiresAuth: true }}, // connexion requise poru acededr a la page la

    { path: '/:pathMatch(.*)*', component: PageNotFound } // gère toutes les autres URLs
  ],
});

// **protection des routes**
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // si la route nécessite une connex et que l'utilisateur n'est pas connecté, on redirige
    next('/');
  } else {
    next();
  }
});

export default router;
