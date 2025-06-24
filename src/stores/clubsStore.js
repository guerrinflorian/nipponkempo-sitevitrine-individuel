import { defineStore } from 'pinia';
import axiosInstance from '../utils/axiosIntance.js';

export const useClubsStore = defineStore('clubs', {
  state: () => ({
    clubs: [], // stocke la liste des clubs disponibles
    loading: false, // indique si une requete est en cours
    error: null // stocke un message d erreur en cas de probleme
  }),

  actions: {
    /*
    ----------------------------------------------------------------------
    | recupere la liste des clubs depuis l api et met a jour le store.   |
    | gere aussi l affichage d un etat de chargement et des erreurs.     |
    ----------------------------------------------------------------------
    */
    async fetchClubs() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axiosInstance.get('/clubs');
        console.log(response)
        this.clubs = response.data;
      } catch (err) {
        this.error = "erreur de chargement des clubs";
        console.error("❌ erreur chargement clubs :", err);
      } finally {
        this.loading = false;
      }
    }
  }
});
