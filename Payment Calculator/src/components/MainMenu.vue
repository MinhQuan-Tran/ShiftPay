<script lang="ts">
export default {
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

      if (!file) return; // Do nothing if no file is selected

      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>): void => {
        try {
          const data = JSON.parse(e.target?.result as string);

          // Clear existing localStorage data and add new data
          localStorage.clear();
          Object.keys(data).forEach((key) => {
            localStorage.setItem(key, data[key]);
          });
        } catch (error) {
          // Silent error, you can add console.log for debugging
          console.error('Invalid JSON file', error);
        }

        alert('Data imported successfully, please refresh the page to see the changes.');
      };

      reader.readAsText(file);
    }
  }
};
</script>

<template>
  <div class="main-menu">
    <input type="file" id="fileInput" accept=".json" @change="uploadData" />
    <button id="downloadButton" @click="downloadData">Download Data</button>
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
