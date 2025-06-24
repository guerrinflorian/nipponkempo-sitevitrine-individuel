import axios from 'axios'
import { createDiscreteApi } from 'naive-ui'

// creer une instance "message" qu'on peut appeler en dehors d un composant
const { message } = createDiscreteApi(['message'])

const axiosInstance = axios.create({
  baseURL: 'https://nipponkempo-api-individuel.vercel.app',
  headers: { 'Content-Type': 'application/json' },
})

// 1) reqeuete interceptor : ajoute l'Authorization
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err),
)

// 2) reponse interceptor : gère le token expiré
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    if (status === 401 && code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      // supp le token
      localStorage.removeItem('token')
      // affiche un message d erreur
      message.error('Votre session a expiré, veuillez vous reconnecter.')
      // redirige vers la page de login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default axiosInstance
