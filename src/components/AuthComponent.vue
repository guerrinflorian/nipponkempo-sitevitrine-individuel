<template>
  <n-card title="🔐 Mon compte" class="auth-modal">
    <div class="fixed-container">
      <n-tabs v-if="!isVerifying && !isResettingPassword" v-model:value="authMode" type="line" animated
        @update:value="resetForm">

        <!-- connexion -->
        <n-tab-pane name="login" tab="Connexion">
          <n-form @submit.prevent="handleLogin">
            <n-form-item label="Email" :feedback="errorMessages.email" feedback-status="error">
              <n-input v-model:value="email" placeholder="Votre email" type="email" clearable />
            </n-form-item>

            <n-form-item label="Mot de passe" :feedback="errorMessages.password" feedback-status="error">
              <n-input v-model:value="password" placeholder="Votre mot de passe" type="password"
                show-password-on="mousedown" clearable />
            </n-form-item>

            <!-- captcha -->
            <n-form-item label="Code CAPTCHA" :feedback="errorMessages.captcha" feedback-status="error">
              <vue-client-recaptcha ref="captchaRef" @getCode="onCaptchaGenerated" :count="5" />
              <n-input v-model:value="captchaInput" placeholder="Recopiez le code CAPTCHA ici." clearable
                @input="validateCaptcha" />
            </n-form-item>

            <n-button type="primary" block attr-type="submit" :loading="loading" :disabled="!isLoginValid">
              🔑 Se connecter
            </n-button>

            <p class="error-message" v-if="errorMessages.api">{{ errorMessages.api }}</p>

            <n-button text class="forgot-link" @click="authMode = 'forgot'">
              Mot de passe oublié ?
            </n-button>
          </n-form>
        </n-tab-pane>

        <!-- inscription -->
        <n-tab-pane name="register" tab="Inscription">
          <n-form @submit.prevent="handleRegister">
            <div style="display: flex; gap: 16px; width: 100%;">
              <n-form-item label="Prénom" :feedback="errorMessages.firstName" feedback-status="error" style="flex: 1;">
                <n-input v-model:value="firstName" placeholder="Votre prénom" clearable />
              </n-form-item>

              <n-form-item label="Nom" :feedback="errorMessages.lastName" feedback-status="error" style="flex: 1;">
                <n-input v-model:value="lastName" placeholder="Votre nom" clearable />
              </n-form-item>
            </div>

            <n-form-item label="Email" :feedback="errorMessages.email" feedback-status="error">
              <n-input v-model:value="email" placeholder="Votre email" type="email" clearable />
            </n-form-item>

            <n-form-item label="Mot de passe" :feedback="errorMessages.password" feedback-status="error">
              <n-input v-model:value="password" placeholder="Votre mot de passe" type="password"
                show-password-on="mousedown" clearable />
            </n-form-item>

            <!-- captcha -->
            <n-form-item label="Code CAPTCHA" :feedback="errorMessages.captcha" feedback-status="error">
              <vue-client-recaptcha ref="captchaRef" @getCode="onCaptchaGenerated" :count="5" />
              <n-input v-model:value="captchaInput" placeholder="Recopiez le code CAPTCHA ici." clearable
                @input="validateCaptcha" />
            </n-form-item>

            <n-button type="primary" block attr-type="submit" :loading="loading" :disabled="!isRegisterValid">
              ✨ S'inscrire
            </n-button>

            <p class="error-message" v-if="errorMessages.api">{{ errorMessages.api }}</p>
          </n-form>
        </n-tab-pane>

        <!-- recup mot de passe -->
        <n-tab-pane name="forgot" tab="Mot de passe oublié">
          <n-form @submit.prevent="handleForgotPassword">
            <n-form-item label="Email" :feedback="errorMessages.email" feedback-status="error">
              <n-input v-model:value="email" placeholder="Votre email" type="email" clearable />
            </n-form-item>

            <!-- captcha -->
            <n-form-item label="Code CAPTCHA" :feedback="errorMessages.captcha" feedback-status="error">
              <vue-client-recaptcha ref="captchaRef" @getCode="onCaptchaGenerated" :count="5" />
              <n-input v-model:value="captchaInput" placeholder="Recopiez le code CAPTCHA ici." clearable
                @input="validateCaptcha" />
            </n-form-item>

            <n-button type="primary" block attr-type="submit" :loading="loading" :disabled="!isForgotValid">
              📩 Envoyer le code
            </n-button>

            <p class="error-message" v-if="errorMessages.api">{{ errorMessages.api }}</p>
          </n-form>
        </n-tab-pane>
      </n-tabs>

      <!-- verif code temporaire -->
      <div v-if="isVerifying">
        <h3>🛡️ Vérification du code</h3>
        <n-form @submit.prevent="handleVerifyCode" style="padding-top: 0px;">
          <n-form-item label="Code de vérification" :feedback="errorMessages.verificationCode" feedback-status="error">
            <n-input v-model:value="verificationCode" placeholder="Entrez le code reçu" clearable />
          </n-form-item>

          <n-button type="primary" block attr-type="submit" :loading="loading" :disabled="!verificationCode">
            ✅ Vérifier et continuer
          </n-button>

          <p class="error-message" v-if="errorMessages.api">{{ errorMessages.api }}</p>
        </n-form>
      </div>

      <!-- modif mdp apres code -->
      <div v-if="isResettingPassword">
        <h3>🔒 Modifier votre mot de passe</h3>
        <n-form @submit.prevent="handleUpdatePassword">
          <n-form-item label="Email">
            <n-input v-model:value="email" disabled />
          </n-form-item>

          <n-form-item label="Nouveau mot de passe" :feedback="errorMessages.newPassword" feedback-status="error">
            <n-input v-model:value="newPassword" type="password" placeholder="Entrez votre nouveau mot de passe"
              clearable show-password-on="mousedown" />
          </n-form-item>

          <n-button type="primary" block attr-type="submit" :loading="loading">
            🔄 Modifier le mot de passe
          </n-button>

          <p class="error-message" v-if="errorMessages.api">{{ errorMessages.api }}</p>
        </n-form>
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'vue-router';
import { NCard, NTabs, NTabPane, NForm, NFormItem, NInput, NButton, NSpace } from 'naive-ui';
import VueClientRecaptcha from 'vue-client-recaptcha';

// stores et router
const authStore = useAuthStore();
const router = useRouter();
const emit = defineEmits(['close']);

// init etats reactifs
const authMode = ref("login");
const isVerifying = ref(false);
const loading = ref(false);

// champs utilisateurs
const email = ref('');
const password = ref('');
const firstName = ref('');
const lastName = ref('');
const verificationCode = ref('');
const isResettingPassword = ref(false);
const newPassword = ref('');

// captcha
const captchaRef = ref(null);
const captchaValid = ref(false);
const captchaText = ref('');
const captchaInput = ref('');
const validateCaptcha = ref('');

// gestion des erreurs
const errorMessages = ref({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  verificationCode: '',
  captcha: '',
  api: ''
});

// verif champs
const isEmailValid = computed(() => email.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
const isPasswordValid = computed(() => password.value.length >= 6);
const isNameValid = computed(() => firstName.value.length > 1 && lastName.value.length > 1);
const isCaptchaValid = computed(() => captchaValid.value);
const isLoginValid = computed(() => isEmailValid.value && isPasswordValid.value && isCaptchaValid.value);
const isRegisterValid = computed(() => isLoginValid.value && isNameValid.value);
const isForgotValid = computed(() => isEmailValid.value && isCaptchaValid.value);

// verif captcha
watch([captchaInput, captchaText], () => {
  captchaValid.value = captchaInput.value?.trim().toLowerCase() === captchaText.value?.toLowerCase();
});

// reset erreurs on change onglet ou mode
watch(authMode, () => {
  resetErrors();
});
watch([isVerifying, isResettingPassword], () => {
  resetErrors();
});

// gen captcha
const onCaptchaGenerated = (captcha) => {
  captchaText.value = captcha;
  captchaInput.value = '';
  captchaValid.value = false;
};

// reset form
const resetForm = () => {
  email.value = '';
  password.value = '';
  firstName.value = '';
  lastName.value = '';
  verificationCode.value = '';
  captchaInput.value = '';
  captchaValid.value = false;
  resetErrors();
  if (captchaRef.value) {
    captchaRef.value.$emit("getCode");
  }
};

// reset erreurs
const resetErrors = () => {
  errorMessages.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    verificationCode: '',
    captcha: '',
    api: '',
    newPassword: ''
  };
};

// login utilisateur
const handleLogin = async () => {
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    emit('close');
  } catch (error) {
    errorMessages.value.api = error.message;
  }
  loading.value = false;
};

// inscription utilisateur
const handleRegister = async () => {
  loading.value = true;
  try {
    await authStore.register(firstName.value, lastName.value, email.value, password.value);
    emit('close');
  } catch (error) {
    errorMessages.value.api = error.message;
  }
  loading.value = false;
};

// recup mot de passe
const handleForgotPassword = async () => {
  loading.value = true;
  try {
    await authStore.forgotPassword(email.value);
    isVerifying.value = true;
  } catch (error) {
    errorMessages.value.api = error.message;
  }
  loading.value = false;
};

// verif code temporaire
const handleVerifyCode = async () => {
  loading.value = true;
  try {
    const response = await authStore.verifyResetCode(email.value, verificationCode.value);
    if (response.userId !== -1) {
      isVerifying.value = false;
      isResettingPassword.value = true;
    } else {
      errorMessages.value.api = response.message;
    }
  } catch (error) {
    errorMessages.value.api = error.message;
  }
  loading.value = false;
};

// modif mdp
const handleUpdatePassword = async () => {
  loading.value = true;
  try {
    await authStore.updatePasswordWithoutJWT(email.value, newPassword.value, verificationCode.value);
    await authStore.login(email.value, newPassword.value);
    emit('close');
  } catch (error) {
    errorMessages.value.api = error.message;
  }
  loading.value = false;
};
</script>

<style scoped>
.auth-modal {
  width: 500px;
  min-height: 450px;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%);
}

.fixed-container {
  min-height: 300px;
}

.error-message {
  color: red;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}
</style>
