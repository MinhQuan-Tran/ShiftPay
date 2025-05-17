<script lang="ts">
import Shift from '@/models/Shift';
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
      selectedShift: undefined as Shift | undefined,
      shiftFormData: {
        title: 'Shift',
        resetForm: true, // Reset the form when the dialog is closed
        action: '',
        placeholderShift: undefined as
          | {
              id?: number;
              workplace?: string;
              payRate?: number;
              startTime?: Date;
              endTime?: Date;
            }
          | undefined
      },
      datetimeWidth: 'auto'
    };
  },

  methods: {
    currencyFormat,
    toTimeStr,

    handleEditEntry(shift: Shift) {
      this.selectedShift = shift;
      this.shiftFormData = {
        title: 'Edit Shift',
        resetForm: true,
        action: 'edit',
        placeholderShift: this.selectedShift
      };
      (this.$refs.shiftDialog as any).showModal();
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
      this.shiftFormData = {
        title: 'Check Out',
        resetForm: false,
        action: 'check in/out',
        placeholderShift: {
          startTime: this.userDataStore.checkInTime,
          endTime: new Date()
        }
      };

      (this.$refs.shiftDialog as any).showModal();
    },

    handleAddEntry() {
      this.shiftFormData = {
        title: 'Add Shift',
        resetForm: false,
        action: 'add',
        placeholderShift: {
          // Set the startTime and endTime time to the selected date with the current time
          startTime: new Date(new Date(this.selectedDate).setHours(new Date().getHours(), new Date().getMinutes())),
          endTime: new Date(new Date(this.selectedDate).setHours(new Date().getHours(), new Date().getMinutes()))
        }
      };
      (this.$refs.shiftDialog as any).showModal();
    },

    updateTimeWidth() {
      this.datetimeWidth = 'auto';

      this.$nextTick(() => {
        this.datetimeWidth =
          Math.max(...Array.from(document.querySelectorAll('.shift .datetime > *')).map((time) => time.clientWidth)) +
          'px';
      });
    }
  },
  computed: {
    ...mapStores(useUserDataStore),
    isCheckIn() {
      return this.userDataStore.checkInTime !== undefined;
    },

    shifts() {
      // from 12am on the given day
      const startTime = new Date(this.selectedDate);
      startTime.setHours(0, 0, 0, 0);

      // to 12am on the next day
      const endTime = new Date(this.selectedDate);
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(0, 0, 0, 0);

      this.$forceUpdate();

      return getEntries(this.userDataStore.shifts as Array<Shift>, startTime, endTime);
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

      <button @click="handleAddEntry" class="success" id="add-btn">Add Shift</button>
    </div>

    <div class="shift-list">
      <DayScheduleEntry
        v-for="shift in shifts!.sort((a: Shift, b: Shift) => {
          // Sort by startTime, then by endTime
          return a.startTime.getTime() - b.startTime.getTime() || a.endTime.getTime() - b.endTime.getTime();
        })"
        :key="shift.id"
        :shift="shift"
        :selected-date="selectedDate"
        @edit-shift="handleEditEntry"
      />
    </div>

    <BaseDialog
      ref="clearShiftsDialog"
      title="Clear Shifts"
      open-dialog-text="Clear"
      class="danger"
      :reset-forms="true"
    >
      <ClearEntriesForm :selected-date="selectedDate" />
    </BaseDialog>

    <BaseDialog ref="shiftDialog" :title="shiftFormData.title" :reset-forms="shiftFormData.resetForm">
      <EntryForm :selected-date="selectedDate" :shift="shiftFormData.placeholderShift" :action="shiftFormData.action" />
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

.shift-list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  margin: var(--padding) 0;
  gap: calc(var(--padding) * 2);
}

.shift-list:has(.info[open]) .shift:not(:has(.info[open]), :hover) {
  opacity: 0.5;
}

.shift-list {
  --datetime-width: v-bind('datetimeWidth');
}
</style>
