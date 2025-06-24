import { defineStore } from 'pinia';
import axiosInstance from '../utils/axiosIntance.js';
import { supabase } from '../utils/supabaseClient.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: !!localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user')) || null,
    participant: JSON.parse(localStorage.getItem('participant')) || null,
    token: localStorage.getItem('token') || null,
    isSubscribed: false,
  }),

  actions: {
    /*
    ----------------------------------------------------------------
    | connecte un utilisateur en envoyant une requete au serveur.  |
    | stocke ensuite ses informations et active l ecoute supabase  |
    ----------------------------------------------------------------
    */
    async login(email, password) {
      try {
        const response = await axiosInstance.post('/login', { email, password });

        // mettre à jour l’état
        this.isAuthenticated = true;
        this.user = response.data.user;
        this.participant = response.data.participant || null;
        this.token = response.data.token;

        // sauvegarder en localStorage
        localStorage.setItem('user', JSON.stringify(this.user));
        localStorage.setItem(
          'participant',
          JSON.stringify(this.participant)
        );
        localStorage.setItem('token', this.token);

        // reeabonner a Supabase
        supabase.removeAllChannels();
        setTimeout(() => {
          this.subscribeToUserUpdates();
        }, 1000);

      } catch (error) {
        throw new Error(
          error.response?.data?.message || "Erreur de connexion"
        );
      }
    },
  

    /*
    ------------------------------------------------------------------
    | inscrit un nouvel utilisateur en l enregistrant sur le serveur. |
    | une fois inscrit, l utilisateur est connecte automatiquement   |
    ------------------------------------------------------------------
    */
    async register(firstName, lastName, email, password) {
      try {
        await axiosInstance.post('/register', {
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          id_role: 3, // role utilisateur classique
          id_club: null
        });

        await this.login(email, password);
      } catch (error) {
        throw new Error(error.response?.data?.message || "erreur d inscription");
      }
    },


    /*
    ---------------------------------------------------------------
    | envoie une requete pour verifier l adresse mail.      |
    | l utilisateur recevra un email avec un lien de verif de mail |
    ---------------------------------------------------------------
    */
    async resendVerificationEmail(email) {
      try {
        const response = await axiosInstance.post('/resend-verification-email', { email });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors du renvoi de l'email.");
      }
    },


    /*
    ---------------------------------------------------------------
    | envoie une requete pour reinitialiser le mot de passe.      |
    | l utilisateur recevra un email avec un code de verification |
    ---------------------------------------------------------------
    */
    async forgotPassword(email) {
      try {
        await axiosInstance.post('/forgot-password', { email });
      } catch (error) {
        throw new Error(error.response?.data?.message || "erreur lors de l envoi du code");
      }
    },

    /*
    ------------------------------------------------------------------
    | verifie si le code de reinitialisation envoye a l utilisateur  |
    | est correct avant de permettre la modification du mot de passe |
    ------------------------------------------------------------------
    */
    async verifyResetCode(email, code) {
      try {
        const response = await axiosInstance.post('/verify-reset-code', { email, code });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "code invalide");
      }
    },

    /*
    --------------------------------------------------------------
    | met a jour le mot de passe d un utilisateur connecte.      |
    | verifie dabord l ancien mot de passe avant la modification |
    --------------------------------------------------------------
    */
    async updatePassword(userId, oldPassword, newPassword) {
      try {
        const response = await axiosInstance.put('/users/update-password', {
          id: userId,
          oldPassword,
          newPassword
        });

        return response.data;
      } catch (error) {
        if (error.response) {
          const { status, data } = error.response;

          if (status === 400) throw new Error(data.message || "requete invalide");
          if (status === 401) throw new Error("ancien mot de passe incorrect");
          if (status === 404) throw new Error("utilisateur introuvable");
          if (status === 500) throw new Error("erreur serveur, veuillez reessayer plus tard");
        }

        throw new Error("une erreur inconnue est survenue");
      }
    },

    /*
    ----------------------------------------------------------------------
    | met a jour le mot de passe sans necessiter d etre connecte.        |
    | utilise un code de verification envoye par email pour confirmer    |
    ----------------------------------------------------------------------
    */
    async updatePasswordWithoutJWT(email, newPassword, code) {
      try {
        const response = await axiosInstance.put('/users/update-password-without-jwt', { email, newPassword, code });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "erreur lors de la modification du mot de passe");
      }
    },


    /*
    ---------------------------------------------------------------------
    | recupere les dernieres informations de l utilisateur depuis l api |
    | met ensuite a jour les donnees stockees en local                  |
    ---------------------------------------------------------------------
    */
    async fetchUser() {
      if (!this.user?.id) return;

      try {
        const response = await axiosInstance.get(`/users/${this.user.id}`);
        this.user = response.data;
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error("erreur lors de la recuperation de l utilisateur", error);
      }
    },

    /*
    --------------------------------------------------------------------
    | ecoute en temps reel les mises a jour du compte utilisateur.     |
    | met a jour les informations locales si des changements sont faits |
    --------------------------------------------------------------------
    */
    subscribeToUserUpdates() {
      if (!this.user?.id || this.isSubscribed) return;
      supabase
        .channel(`user_updates_${this.user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${this.user.id}` },
          async (payload) => {
            if (payload.new.email_verified !== this.user.email_verified) {
              this.user.email_verified = payload.new.email_verified;
              localStorage.setItem('user', JSON.stringify(this.user));
            }
          }
        )
        .subscribe();
      this.isSubscribed = true;
    },


    /*
    ----------------------------------------------------------------------
    | deconnecte l utilisateur en supprimant son token et ses donnees.   |
    | arrete aussi tous les listeners supabase pour eviter les écoutes   |
    ----------------------------------------------------------------------
    */
    logout() {
      this.isAuthenticated = false;
      this.user = null;
      this.participant = null;
      this.token = null;
      this.isSubscribed = false;

      localStorage.removeItem('user');
      localStorage.removeItem('participant');
      localStorage.removeItem('token');

      supabase.removeAllChannels();
    }
  }
});
