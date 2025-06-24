<template>
  <n-layout class="not-found">
    <n-layout-content class="content">
      <div class="error-container">
        <n-image :src="notFoundImage" width="350" class="error-image" />
        <h1 class="error-title">Oups... Page Introuvable !</h1>
        <p class="error-message">
          Pas de page ici… Elle s’est pris un KO technique. <br>
        </p>
        <n-button type="primary" size="large" @click="goHome" class="error-button">
          🔙 Retour à l'accueil
        </n-button>
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { NLayout, NLayoutContent, NButton, NImage } from 'naive-ui'

const router = useRouter()

// image locale stockée dans assets/images/
const notFoundImage = new URL('@/assets/images/not-found.png', import.meta.url).href

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: white;
  text-align: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  max-width: 500px;
  padding: 30px;
  text-align: center;
  animation: fadeIn 0.8s ease-in-out;
}

.error-image {
  filter: drop-shadow(0px 0px 10px rgba(255, 255, 255, 0.2));
}

.error-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 15px rgba(0, 0, 0, 0.3);
}

.error-message {
  font-size: 1.3rem;
  opacity: 0.9;
}

.error-button {
  font-size: 1.1rem;
  padding: 12px 24px;
  border-radius: 8px;
}

/* animation apparition */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>