<script lang="ts">
import { mapState, mapActions } from 'pinia';
import { useAuthStore } from '@/stores/authStore';

export default {
  computed: {
    ...mapState(useAuthStore, ['account', 'isAuthenticated'])
  },

  methods: {
    downloadData() {
      const data = JSON.stringify(localStorage);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'localStorageData.json';
      a.click();
      URL.revokeObjectURL(url);
    },

    uploadData(event: Event) {
      if (!confirm('Are you sure you want to import data?\nThis will overwrite your existing data.')) return;

      const fileInput = event.target as HTMLInputElement;
      const file = fileInput.files ? fileInput.files[0] : null;

      if (!file) return;

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>): void => {
        try {
          const data = JSON.parse(e.target?.result as string);
          localStorage.clear();
          Object.keys(data).forEach((key) => {
            localStorage.setItem(key, data[key]);
          });
        } catch (error) {
          console.error('Invalid JSON file', error);
        }

        alert('Data imported successfully, please refresh the page to see the changes.');
      };

      reader.readAsText(file);
    },

    ...mapActions(useAuthStore, ['login', 'logout'])
  }
};
</script>

<template>
  <div class="main-menu">
    <input type="file" id="fileInput" accept=".json" @change="uploadData" />
    <button id="downloadButton" @click="downloadData">Download Data</button>
    <button v-if="!isAuthenticated" @click="login">Login</button>
    <button v-else @click="logout">Logout</button>
  </div>
</template>

<style scoped>
.main-menu {
  position: absolute;
  top: calc(100% + var(--padding));
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  gap: var(--padding);
  width: 250px;
  border-radius: var(--border-radius);
  background-color: var(--popup-background-color);
}
</style>
