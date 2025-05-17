import '@/assets/main.css';

import { createApp } from 'vue';
import App from '@/App.vue';

import { createPinia } from 'pinia';

import { useAuthStore } from '@/stores/authStore';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);

const auth = useAuthStore(pinia);
await auth.init();

app.mount('#app');
