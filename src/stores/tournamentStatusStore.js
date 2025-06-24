import { defineStore } from 'pinia';
import axiosInstance from '../utils/axiosIntance';

export const useTournamentStatusStore = defineStore('tournamentStatus', {
  state: () => ({
    statuses: [], // stocke la liste des statuts de tournoi
    loading: false, // inndique si une requête est en cours
    error: null // stock un message derreur en cas de problème
  }),

  actions: {
    /*
    ----------------------------------------------------------------------
    | recup la liste des statuts de tournoi depuis l'API et met à jour le store |
    | geere aussi l'affichage d'un etat de chargement et des erreurs.     |
    ----------------------------------------------------------------------
    */
    async fetchTournamentStatuses() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axiosInstance.get('/tournament-status');
        this.statuses = response.data;
      } catch (err) {
        this.error = "Erreur de chargement des statuts de tournoi";
        console.error("❌ Erreur chargement statuts de tournoi :", err);
      } finally {
        this.loading = false;
      }
    }
  }
});
