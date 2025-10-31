import '@/assets/main.css';

import { createApp } from 'vue';
import App from '@/App.vue';

import { createPinia } from 'pinia';

import { useAuthStore } from '@/stores/authStore';

const app = createApp(App);

// Pinia Setup
const pinia = createPinia();
app.use(pinia);

// Auth Store Init
const auth = useAuthStore(pinia);
await auth.init();

// Mount App
app.mount('#app');
