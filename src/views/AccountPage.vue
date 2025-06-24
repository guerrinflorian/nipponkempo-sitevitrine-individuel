<template>
    <n-layout v-if="authStore.user" class="account-page">
        <n-layout-header class="header">
            <h1>Mon compte</h1>
        </n-layout-header>

        <n-layout-content class="content">
            <div class="account-container">
                <n-tabs type="line" animated @update:value="resetMessages">
                    <!-- infos personnelles -->
                    <n-tab-pane name="profile" tab="Profil">
                        <div class="form-section">
                            <n-alert v-if="authStore.user && !authStore.user.email_verified" type="warning"
                                class="alert-warning">
                                Votre adresse e mail n est pas verifiee pensez a la confirmer
                                <n-button v-if="canResendEmail" type="info" size="small"
                                    @click="resendVerificationEmail" class="resend-btn">
                                    Renvoyer email de confirmation
                                </n-button>
                                <n-countdown v-if="!canResendEmail" :duration="resendCooldown * 1000" :active="true"
                                    :precision="1" @finish="resendCooldown = 0" class="resend-timer" />
                            </n-alert>

                            <n-form label-placement="top">
                                <n-grid :cols="isMobile ? 1 : 2" responsive="screen">
                                    <n-gi>
                                        <n-form-item label="Prenom">
                                            <n-input v-model:value="authStore.user.first_name" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Nom">
                                            <n-input v-model:value="authStore.user.last_name" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi :span="2">
                                        <n-form-item label="Email">
                                            <n-input v-model:value="authStore.user.email" disabled />
                                        </n-form-item>
                                    </n-gi>
                                </n-grid>
                            </n-form>
                        </div>
                    </n-tab-pane>

                    <!-- onglet profil participant -->
                    <n-tab-pane name="participant" tab="Profil participant">
                        <div class="form-section">
                            <n-form label-placement="top">
                                <n-grid :cols="isMobile ? 1 : 2" responsive="screen" v-if="authStore.participant">
                                    <n-gi>
                                        <n-form-item label="Prenom">
                                            <n-input v-model:value="authStore.participant.first_name" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Nom">
                                            <n-input v-model:value="authStore.participant.last_name" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Date de naissance">
                                            <n-input v-model:value="authStore.participant.birth_date" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Club">
                                            <n-input v-model:value="authStore.participant.club" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi :span="2">
                                        <n-form-item label="Email">
                                            <n-input v-model:value="authStore.participant.email" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Grade">
                                            <n-input v-model:value="authStore.participant.grade.name" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Genre">
                                            <n-input v-model:value="authStore.participant.gender.name" disabled />
                                        </n-form-item>
                                    </n-gi>
                                    <n-gi>
                                        <n-form-item label="Poids">
                                            <n-input v-model:value="authStore.participant.weight" disabled />
                                        </n-form-item>
                                    </n-gi>
                                </n-grid>
                                <div style="margin-top:1rem; text-align:center">
                                    <n-button type="primary" @click="goToStatistics" v-if="authStore.participant">
                                        Voir mes statistiques
                                    </n-button>
                                </div>
                            </n-form>
                        </div>
                    </n-tab-pane>


                    <!-- changer mot de passe -->
                    <n-tab-pane name="security" tab="Mot de passe">
                        <div class="form-section">
                            <n-form @submit.prevent="handleUpdatePassword">
                                <n-form-item label="Ancien mot de passe">
                                    <n-input v-model:value="oldPassword" placeholder="Entrez ancien mot de passe"
                                        type="password" show-password-on="mousedown" clearable />
                                </n-form-item>

                                <n-form-item label="Nouveau mot de passe" :feedback="errorMessages.newPassword"
                                    feedback-status="error">
                                    <n-input v-model:value="newPassword" placeholder="Entrez nouveau mot de passe"
                                        type="password" show-password-on="mousedown" clearable
                                        @input="validatePassword" />
                                </n-form-item>

                                <n-form-item label="Confirmer mot de passe" :feedback="errorMessages.confirmPassword"
                                    feedback-status="error">
                                    <n-input v-model:value="confirmPassword"
                                        placeholder="Confirmez nouveau mot de passe" type="password"
                                        show-password-on="mousedown" clearable @input="validatePassword" />
                                </n-form-item>

                                <n-button type="warning" block attr-type="submit" :loading="loading"
                                    :disabled="!isFormValid">
                                    Modifier mot de passe
                                </n-button>

                                <p v-if="globalMessage" :class="globalMessageClass">
                                    {{ globalMessage }}
                                </p>
                            </n-form>
                        </div>
                    </n-tab-pane>
                </n-tabs>

                <n-divider />

                <!-- deconnexion -->
                <n-button type="error" block @click="handleLogout">
                    Se déconnecter
                </n-button>
            </div>
        </n-layout-content>
    </n-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import {
    NLayout, NLayoutHeader, NLayoutContent, NTabs, NTabPane,
    NForm, NFormItem, NInput, NButton, NAlert, NGrid, NGi,
    NDivider, NCountdown
} from 'naive-ui'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(false)

function goToStatistics() {
    router.push('/mon-compte/statistics')
}

// champs pour changer de mot de passe
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// messages d erreur
const errorMessages = ref({
    newPassword: '',
    confirmPassword: ''
})

const globalMessage = ref('')
const globalMessageClass = ref('')
const passwordRegex = /^(?=.*[a-z].*[a-z])(?=.*[A-Z].*[A-Z])(?=.*\d.*\d).{10,}$/

// detecter si on est mode mobile
const isMobile = ref(window.innerWidth < 768)
const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
}

onMounted(() => {
    window.addEventListener("resize", checkMobile)
})

// redirection si deconnexion
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
    if (!isAuthenticated) {
        router.push('/')
    }
})

const resendCooldown = ref(0)

const canResendEmail = computed(() => resendCooldown.value === 0)

const resendVerificationEmail = async () => {
    try {
        await authStore.resendVerificationEmail(authStore.user.email)
        resendCooldown.value = 60

        const interval = setInterval(() => {
            if (resendCooldown.value > 0) {
                resendCooldown.value -= 1
            } else {
                clearInterval(interval)
                resendCooldown.value = 0
            }
        }, 1000)

    } catch (error) {
        console.error('erreur envoye email', error.message)
    }
}

const isFormValid = computed(() => {
    return oldPassword.value &&
        passwordRegex.test(newPassword.value) &&
        newPassword.value === confirmPassword.value
})

function validatePassword() {
    globalMessage.value = ''

    if (!newPassword.value) {
        errorMessages.value.newPassword = 'Champ nouveau mot de passe requis'
    } else if (!passwordRegex.test(newPassword.value)) {
        errorMessages.value.newPassword =
            'Mot de passe doit contenir 10 caracteres 2 majuscules 2 minuscules 2 chiffres'
    } else {
        errorMessages.value.newPassword = ''
    }

    if (!confirmPassword.value) {
        errorMessages.value.confirmPassword = 'Champ confirmer mot de passe requis'
    } else if (newPassword.value !== confirmPassword.value) {
        errorMessages.value.confirmPassword = 'Mots de passe ne correspondent pas'
    } else {
        errorMessages.value.confirmPassword = ''
    }
}

function resetMessages() {
    errorMessages.value.newPassword = ''
    errorMessages.value.confirmPassword = ''
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
}

async function handleUpdatePassword() {
    validatePassword()
    if (!isFormValid.value) return

    loading.value = true
    try {
        const response = await authStore.updatePassword(
            authStore.user.id, oldPassword.value, newPassword.value
        )
        globalMessage.value = response.message
        globalMessageClass.value = 'success-message'
        resetMessages()
    } catch (error) {
        globalMessage.value = error.message
        globalMessageClass.value = 'error-message'
    }
    loading.value = false
}

function handleLogout() {
    authStore.logout()
    router.push('/')
}
</script>

<style scoped>
.account-page {
    display: flex;
    flex-direction: column;
    background: #f9f9f9;
    color: #333;
}

.header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 80px;
    font-size: 24px;
    font-weight: bold;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.content {
    display: flex;
    justify-content: center;
    width: 100%;
}

.account-container {
    width: 100%;
    max-width: 600px;
    padding: 20px;
    border-radius: 12px;
    background: white;
}
</style>
