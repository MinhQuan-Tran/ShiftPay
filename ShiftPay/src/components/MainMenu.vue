<script lang="ts">
import { mapStores } from 'pinia';

import { useAuthStore } from '@/stores/authStore';
import { useShiftStore } from '@/stores/shiftStore';

import Shift from '@/models/Shift';

export default {
  computed: {
    ...mapStores(useAuthStore, useShiftStore)
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

          console.log('Imported data:', data);

          const parsed = Shift.parseAll(JSON.parse(data.shifts || data.entries));

          if (!parsed.success && !confirm('Some shifts could not be loaded. Do you want to proceed?')) {
            throw new Error('User aborted due to parse errors.');
          }

          this.shiftStore.add(parsed.shifts).then(() => {
            console.log('Shifts added successfully.');
          })
        } catch (error: any) {
          throw new Error('Failed to import data: ' + (error && error.message ? error.message : String(error)));
        }
      };

      reader.readAsText(file);
    },

    async handleLogin() {
      await this.authStore.login();

      await this.shiftStore.fetch();
    }
  }
};
</script>

<template>
  <div class="main-menu">
    <input type="file" id="fileInput" accept=".json" @change="uploadData" />
    <button id="downloadButton" @click="downloadData">Download Data</button>
    <button v-if="!authStore.isAuthenticated" @click="handleLogin">Login</button>
    <button v-else @click="authStore.logout">Logout</button>
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
