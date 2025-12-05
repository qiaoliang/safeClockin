// store/index.js
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia

export { useUserStore } from './modules/user'
export { useCheckinStore } from './modules/checkin'