<script lang="ts">
import { mapWritableState } from 'pinia';
import { useUserDataStore } from '@/stores/userData';

import ButtonConfirm from './ButtonConfirm.vue';

export default {
  props: {
    selectedDate: {
      type: Date,
      required: true
    }
  },

  data() {
    return {
      formData: {
        clearOption: ''
      }
    };
  },

  computed: {
    ...mapWritableState(useUserDataStore, ['entries'])
  },

  emits: {
    clearEntries(payload: string) {
      const options = ['day', 'week', 'all'];
      return options.includes(payload);
    }
  },

  methods: {
    clearEntries(event: Event) {
      const form = event.currentTarget as HTMLFormElement;

      if (!confirm('Are you sure you want to clear this data?\nThis action cannot be undone.')) {
        return;
      }

      const startTime = new Date(this.selectedDate);
      const endTime = new Date(this.selectedDate);

      startTime.setHours(0, 0, 0, 0);
      endTime.setHours(23, 59, 59, 999);

      const option = (form.querySelector('input[name="clearOption"]:checked') as HTMLInputElement)?.value;

      switch (option) {
        case 'week':
          // Set the start and end time to the beginning and end of the week
          // getDay() returns 0 for Sunday, so the current date need to minus 7 days (1 week)
          // otherwise, minus 1 day to the current day (Monday = 0, Tuesday = 1,...)
          startTime.setDate(startTime.getDate() - (startTime.getDay() == 0 ? 7 : startTime.getDay() - 1) + 1); // Monday
          endTime.setDate(endTime.getDate() - (endTime.getDay() == 0 ? 7 : endTime.getDay() - 1) + 7); // Sunday
        // Then filter out entries like in the 'day' case

        // eslint-disable-next-line no-fallthrough
        case 'day':
          console.log(startTime, endTime);

          this.entries = this.entries.filter((entry) => {
            const fromTime = new Date(entry.from);
            const toTime = new Date(entry.to);

            // Filter out entries that intersect with the time range
            return !(fromTime <= endTime && toTime >= startTime);
          });
          break;

        case 'all':
          this.entries = [];
          break;

        default:
          alert('Something went wrong. Please try again.');
          throw new Error('Invalid option');
      }

      form.reset();

      const dialog = form.closest('dialog') as HTMLDialogElement;
      dialog?.close();
    }
  },

  components: {
    ButtonConfirm
  }
};
</script>

<template>
  <form @submit.prevent="clearEntries">
    <span>What entries do you want to clear?</span>
    <div>
      <input
        type="radio"
        id="clear-option-day"
        v-model="formData.clearOption"
        name="clearOption"
        value="day"
        required
      />
      <label for="clear-option-day">Day</label>
    </div>
    <div>
      <input
        type="radio"
        id="clear-option-week"
        v-model="formData.clearOption"
        name="clearOption"
        value="week"
        required
      />
      <label for="clear-option-week">Week</label>
    </div>
    <div>
      <input
        type="radio"
        id="clear-option-all"
        v-model="formData.clearOption"
        name="clearOption"
        value="all"
        required
      />
      <label for="clear-option-all">All</label>
    </div>

    <div class="actions">
      <ButtonConfirm type="submit">Clear</ButtonConfirm>
    </div>
  </form>
</template>

<style scoped>
input[type='radio'],
input[type='checkbox'] {
  margin-left: 0;
}
</style>
