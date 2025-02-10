<script lang="ts">
import { Entry } from '@/classes';
import { currencyFormat, toTimeStr, getEntries } from '@/utils';

import { mapStores } from 'pinia';
import { useUserDataStore } from '@/stores/userData';

import DayScheduleEntry from '@/components/DayScheduleEntry.vue';
import BaseDialog from '@/components/BaseDialog.vue';
import ClearEntriesForm from '@/components/ClearEntriesForm.vue';
import EntryForm from '@/components/EntryForm.vue';

export default {
  props: {
    selectedDate: {
      type: Date,
      required: true
    }
  },
  data() {
    return {
      selectedEntry: undefined as Entry | undefined,
      entryFormData: {
        title: 'Entry',
        resetForm: true, // Reset the form when the dialog is closed
        action: '',
        placeholderEntry: undefined as
          | {
              id?: number;
              workplace?: string;
              payRate?: number;
              from?: Date;
              to?: Date;
            }
          | undefined
      },
      datetimeWidth: 'auto'
    };
  },
  methods: {
    currencyFormat,
    toTimeStr,

    handleEditEntry(entry: Entry) {
      this.selectedEntry = entry;
      this.entryFormData = {
        title: 'Edit Entry',
        resetForm: true,
        action: 'edit',
        placeholderEntry: this.selectedEntry
      };
      (this.$refs.entryDialog as any).showModal();
    },

    handleCheckInOut() {
      // If not checked in
      if (!this.isCheckIn) {
        // Check in
        this.userDataStore.checkInTime = new Date();
        return;
      }

      // If no check in time found
      if (!this.userDataStore.checkInTime) {
        if (confirm('Check in time is not set. Do you want to set it now?')) {
          this.userDataStore.checkInTime = new Date();
        }
        return;
      }

      if (isNaN(this.userDataStore.checkInTime.getTime())) {
        if (confirm('Invalid check in time. Do you want to remove it?')) {
          this.userDataStore.checkInTime = undefined;
        }
        return;
      }

      // Check out
      this.entryFormData = {
        title: 'Check Out',
        resetForm: false,
        action: 'check in/out',
        placeholderEntry: {
          from: this.userDataStore.checkInTime,
          to: new Date()
        }
      };

      (this.$refs.entryDialog as any).showModal();
    },

    handleAddEntry() {
      this.entryFormData = {
        title: 'Add Entry',
        resetForm: false,
        action: 'add',
        placeholderEntry: {
          // Set the from and to time to the selected date with the current time
          from: new Date(new Date(this.selectedDate).setHours(new Date().getHours(), new Date().getMinutes())),
          to: new Date(new Date(this.selectedDate).setHours(new Date().getHours(), new Date().getMinutes()))
        }
      };
      (this.$refs.entryDialog as any).showModal();
    },

    updateTimeWidth() {
      this.datetimeWidth = 'auto';

      this.$nextTick(() => {
        this.datetimeWidth =
          Math.max(...Array.from(document.querySelectorAll('.entry .datetime > *')).map((time) => time.clientWidth)) +
          'px';
      });
    }
  },
  computed: {
    ...mapStores(useUserDataStore),
    isCheckIn() {
      return this.userDataStore.checkInTime !== undefined;
    },

    entries() {
      // from 12am on the given day
      const from = new Date(this.selectedDate);
      from.setHours(0, 0, 0, 0);

      // to 12am on the next day
      const to = new Date(this.selectedDate);
      to.setDate(to.getDate() + 1);
      to.setHours(0, 0, 0, 0);

      this.$forceUpdate();

      return getEntries(this.userDataStore.entries as Array<Entry>, from, to);
    }
  },
  mounted() {
    this.updateTimeWidth();
  },
  updated() {
    this.updateTimeWidth();
  },
  components: { DayScheduleEntry, BaseDialog, ClearEntriesForm, EntryForm }
};
</script>

<template>
  <div class="day-schedule">
    <div class="actions">
      <button @click="($refs.clearEntriesDialog as any).showModal()" class="danger" id="clear-btn">Clear</button>

      <Transition>
        <button
          v-if="selectedDate.setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0)"
          @click="handleCheckInOut"
          id="check-in-out-btn"
          :class="{ primary: !isCheckIn, warning: isCheckIn }"
        >
          Check {{ isCheckIn ? 'Out' : 'In' }}
        </button>
      </Transition>

      <button @click="handleAddEntry" class="success" id="add-btn">Add Entry</button>
    </div>

    <div class="entry-list">
      <DayScheduleEntry
        v-for="entry in entries!.sort((a: Entry, b: Entry) => {
          // Sort by from time, then by to time
          return a.from.getTime() - b.from.getTime() || a.to.getTime() - b.to.getTime();
        })"
        :key="entry.id"
        :entry="entry"
        :selected-date="selectedDate"
        @edit-entry="handleEditEntry"
      />
    </div>

    <BaseDialog
      ref="clearEntriesDialog"
      title="Clear Entries"
      open-dialog-text="Clear"
      class="danger"
      :reset-forms="true"
    >
      <ClearEntriesForm :selected-date="selectedDate" />
    </BaseDialog>

    <BaseDialog ref="entryDialog" :title="entryFormData.title" :reset-forms="entryFormData.resetForm">
      <EntryForm :selected-date="selectedDate" :entry="entryFormData.placeholderEntry" :action="entryFormData.action" />
    </BaseDialog>
  </div>
</template>

<style scoped>
.day-schedule {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--gap-horizontal);
  margin-bottom: var(--padding);
}

.actions > * {
  flex: 1;
  text-wrap: nowrap;
}

.actions #clear-btn {
  flex-grow: 0;
}

.actions #check-in-out-btn {
  overflow: hidden;
  flex-grow: 10;
}

.actions #check-in-out-btn.v-enter-from,
.actions #check-in-out-btn.v-leave-to {
  flex-grow: 0;
  width: 0;
}

.entry-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: var(--padding) 0;
  gap: calc(var(--padding) * 2);
}

.entry-list:has(.info[open]) .entry:not(:has(.info[open]), :hover) {
  opacity: 0.5;
}

.entry-list {
  --datetime-width: v-bind('datetimeWidth');
}
</style>
