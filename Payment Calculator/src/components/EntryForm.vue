<script lang="ts">
import { Entry, Duration } from '@/classes';
import { deepClone } from '@/utils';

import { mapWritableState } from 'pinia';
import { useUserDataStore } from '@/stores/userData';

import ButtonConfirm from './ButtonConfirm.vue';
import ComboBox from './ComboBox.vue';
import InputLabel from './InputLabel.vue';

export default {
  props: {
    selectedDate: {
      type: Date,
      required: true
    },
    entry: {
      type: Object as () => Partial<Entry>,
      default: () => ({}) as Partial<Entry>
    },
    action: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      formData: deepClone<Partial<Entry>>(this.entry),
      saveEntryTemplate: false,
      deleteEntryTemplate: false,
      entryName: '',
      hiddenElements: [] as Element[] // Elements to hide when holding a button in action bar
    };
  },

  computed: {
    ...mapWritableState(useUserDataStore, ['entries', 'checkInTime', 'prevWorkInfos', 'entryTemplates'])
  },

  emits: {
    entryChange(payload: { action: string; entry: Entry }) {
      const actions = ['add', 'edit', 'delete', 'check in/out'];
      return actions.includes(payload.action);
    }
  },

  methods: {
    // Cannot use alert directly on event
    alert(message: string) {
      alert(message);
    },

    quickAddEntry(entry: Entry) {
      const newEntry = new Entry(
        this.entries.length + 1,
        entry.workplace,
        entry.payRate,
        new Date(entry.from),
        new Date(entry.to),
        deepClone(entry.unpaidBreaks) as Duration[]
      );

      const duration = newEntry.to.getTime() - newEntry.from.getTime();

      newEntry.from.setFullYear(
        this.selectedDate.getFullYear(),
        this.selectedDate.getMonth(),
        this.selectedDate.getDate()
      );
      newEntry.to.setTime(newEntry.from.getTime() + duration);

      this.entries.push(newEntry);

      const form = this.$refs.entryForm as HTMLFormElement;
      form.reset();

      const dialog = form.closest('dialog') as HTMLDialogElement;
      dialog?.close();
    },

    entryAction(event: Event) {
      const form = event.currentTarget as HTMLFormElement;

      const action = ((event as SubmitEvent)?.submitter as HTMLButtonElement).value;

      let entry: Entry;

      if (['add', 'check in', 'edit'].includes(action)) {
        try {
          entry = new Entry(
            action === 'edit' ? this.formData.id! : 0,
            this.formData.workplace!,
            this.formData.payRate!,
            this.formData.from!,
            this.formData.to!,
            this.formData.unpaidBreaks
              ?.map((ub) => new Duration({ hours: ub.hours, minutes: ub.minutes }))
              .filter((ub) => ub.hours > 0 || ub.minutes > 0) ?? []
          );

          if (this.saveEntryTemplate) {
            this.entryTemplates[this.entryName] = {
              entry: entry
            };
          }
        } catch (error) {
          alert('Invalid entry');
          console.error(this.formData);
          throw new Error('Invalid entry: ' + error);
        }
      }

      switch (action) {
        case 'add':
        case 'check in':
          entry!.id = this.entries.length + 1;

          this.entries.push(entry!);

          // Add workplace and pay rate to prevWorkInfos
          if (entry!.workplace in this.prevWorkInfos && this.prevWorkInfos[entry!.workplace].payRate instanceof Set) {
            this.prevWorkInfos[entry!.workplace].payRate.add(Number(entry!.payRate));
          } else {
            this.prevWorkInfos[entry!.workplace] = {
              payRate: new Set<number>([Number(entry!.payRate)])
            };
          }

          // Remove check in time
          if (action === 'check in') {
            this.checkInTime = undefined;
          }

          break;

        case 'edit':
          this.entries.splice(
            this.entries.findIndex((e) => e.id === entry.id),
            1,
            entry!
          );
          break;

        case 'delete':
          if (!this.formData || !this.formData.id) {
            alert('Invalid entry');
            throw new Error('Invalid entry');
          }

          this.entries.splice(
            this.entries.findIndex((e) => e.id === this.formData!.id),
            1
          );
          break;

        case 'remove check in':
          this.checkInTime = undefined;
          break;

        default:
          alert('Invalid action');
          throw new Error('Invalid action');
      }

      form.reset();

      const dialog = form.closest('dialog') as HTMLDialogElement;
      dialog?.close();
    },

    resetForm() {
      this.saveEntryTemplate = false;
      this.deleteEntryTemplate = false;
      this.entryName = '';
      this.formData = deepClone<Partial<Entry>>(this.entry);
    },

    focusButtonConfirm(isHolding: boolean) {
      if (isHolding) {
        // Hide all elements except this button and the bar
        return (this.$refs.actionBar as HTMLElement)
          ?.querySelectorAll('*:not(.slider:has(.button-confirm.active))')
          .forEach((el) => {
            this.hiddenElements.push(el);
            el.classList.add('hide');
          });
      }

      this.hiddenElements.forEach((el) => {
        el.classList.remove('hide');
      });
      this.hiddenElements = [];
    },

    toDateTimeLocal(date: Date | undefined) {
      if (!date) {
        return '';
      }

      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60 * 1000);
      return localDate.toISOString().slice(0, 16);
    },

    addUnpaidBreak() {
      if (!this.formData.unpaidBreaks) {
        this.formData.unpaidBreaks = [] as Duration[];
      }

      this.formData.unpaidBreaks.push(new Duration());
    }
  },

  components: {
    ButtonConfirm,
    ComboBox,
    InputLabel
  },

  watch: {
    entry() {
      this.resetForm();
    }
  }
};
</script>

<template>
  <form @submit.prevent="entryAction" @reset.prevent="resetForm" ref="entryForm">
    <input type="hidden" name="id" v-model="formData.id" />

    <InputLabel
      label-text="Entry Templates"
      v-if="action === 'add'"
      v-model:toggle-value="deleteEntryTemplate"
      toggle-color="var(--danger-color)"
      sub-text="Delete"
    >
      <div class="entry-templates">
        <button
          v-for="(template, name) in entryTemplates"
          :key="name"
          @click="deleteEntryTemplate ? delete entryTemplates[name] : quickAddEntry(template.entry)"
          type="button"
          class="entry-info"
        >
          <div class="name">{{ name }}</div>
        </button>
        <button
          type="button"
          :class="['entry-info', { active: saveEntryTemplate }]"
          id="save-entry-template-btn"
          @click="saveEntryTemplate = !saveEntryTemplate"
        >
          <div class="name">&nbsp;+&nbsp;</div>
        </button>
      </div>
    </InputLabel>

    <InputLabel labelText="Entry Name" forId="entry-name" v-if="saveEntryTemplate">
      <input
        type="text"
        id="entry-name"
        name="entryName"
        placeholder="e.g. McDonald | Delivery"
        v-model="entryName"
        required
      />
    </InputLabel>

    <InputLabel labelText="Workplace" forId="workplace">
      <ComboBox
        :value="formData?.workplace || ''"
        @update:value="(newValue) => (formData.workplace = newValue)"
        :list="Object.keys(prevWorkInfos)"
        @delete-item="delete prevWorkInfos[$event]"
        deletable
      >
        <input
          type="text"
          id="workplace"
          name="workplace"
          placeholder="e.g. Company Name"
          v-model="formData.workplace"
          required
        />
      </ComboBox>
    </InputLabel>

    <InputLabel labelText="Pay Rate" forId="pay-rate">
      <ComboBox
        :value="formData.payRate ? formData.payRate.toString() : ''"
        @update:value="(newValue: number | undefined) => (formData.payRate = Number(newValue))"
        :list="
          formData.workplace && prevWorkInfos[formData.workplace]?.payRate
            ? Array.from(prevWorkInfos[formData.workplace]?.payRate).map((pr) => pr.toString())
            : []
        "
        @delete-item="formData.workplace && prevWorkInfos[formData.workplace]?.payRate?.delete(parseFloat($event))"
        deletable
      >
        <input
          type="number"
          id="pay-rate"
          name="payRate"
          placeholder="e.g. 23.23"
          v-model="formData.payRate"
          step="0.01"
          min="0"
          max="1000"
          required
        />
      </ComboBox>
    </InputLabel>

    <InputLabel labelText="From" forId="from">
      <input
        type="datetime-local"
        id="from"
        name="from"
        :value="toDateTimeLocal(formData.from)"
        @input="
          (event) => {
            formData.from = new Date((event.target as HTMLInputElement).value);
            if (formData.to && formData.from > formData.to) {
              formData.to = formData.from;
            }
          }
        "
        required
      />
    </InputLabel>

    <InputLabel labelText="To" forId="to">
      <input
        type="datetime-local"
        id="to"
        name="to"
        :value="toDateTimeLocal(formData.to)"
        :min="toDateTimeLocal(formData.from)"
        @input="(event) => (formData.to = new Date((event.target as HTMLInputElement).value))"
        required
      />
    </InputLabel>

    <InputLabel labelText="Unpaid Break(s)" forId="unpaid-breaks">
      <div class="unpaid-breaks">
        <div v-for="(unpaidBreak, index) in formData.unpaidBreaks" :key="index" class="unpaid-break">
          <!-- Hours -->
          <ComboBox
            @update:value="
              (hours) => {
                !isNaN(Number(hours))
                  ? (formData.unpaidBreaks![index].hours = Number(hours))
                  : alert('Invalid input: Please enter a valid number.');
              }
            "
            :list="[...Array((formData.billableDuration?.hours ?? 0) + 1).keys()].map(String)"
          >
            <input
              type="number"
              name="unpaidBreak-hours"
              placeholder="hours"
              :value="formData.unpaidBreaks![index].hours > 0 ? formData.unpaidBreaks![index].hours : ''"
              @input="
                (event) => {
                  const value = Number((event.target as HTMLInputElement).value);
                  formData.unpaidBreaks![index].hours = Math.min(value, 24);
                }
              "
              step="1"
              min="0"
              max="24"
            />
          </ComboBox>

          <!-- Minutes (0, 15, 30, 45) -->
          <ComboBox
            @update:value="
              (minutes) => {
                !isNaN(Number(minutes))
                  ? (formData.unpaidBreaks![index].minutes = Number(minutes))
                  : alert('Invalid input: Please enter a valid number.');
              }
            "
            :list="[...Array(4).keys()].map((i) => (i * 15).toString())"
          >
            <input
              type="number"
              name="unpaidBreak-minutes"
              placeholder="minutes"
              :value="formData.unpaidBreaks![index].minutes > 0 ? formData.unpaidBreaks![index].minutes : ''"
              @input="
                (event) => {
                  const value = Number((event.target as HTMLInputElement).value);
                  formData.unpaidBreaks![index].minutes = Math.min(value, 59);
                }
              "
              step="1"
              min="0"
              max="59"
            />
          </ComboBox>

          <!-- Delete unpaid break -->
          <button class="delete-btn danger" type="button" @click="formData.unpaidBreaks?.splice(index, 1)">
            <div class="icons8-close"></div>
          </button>
        </div>

        <!-- Add unpaid break -->
        <button type="button" @click="addUnpaidBreak">+</button>
      </div>
    </InputLabel>

    <InputLabel labelText="Recurring?" forId="recurring">
      <input type="checkbox" name="recurring" id="recurring" />
    </InputLabel>

    <div ref="actionBar" class="actions">
      <!-- Edit -->
      <template v-if="action == 'edit'">
        <ButtonConfirm
          @is-holding="focusButtonConfirm"
          type="submit"
          name="action"
          value="delete"
          class="danger"
          id="delete-entry-btn"
          formnovalidate
        >
          Delete
        </ButtonConfirm>
        <button type="submit" name="action" value="edit" class="warning" id="edit-entry-btn">Edit Entry</button>
      </template>

      <!-- Add, Check in/out -->
      <template v-else>
        <ButtonConfirm
          v-if="action == 'check in/out'"
          @is-holding="focusButtonConfirm"
          type="submit"
          name="action"
          value="remove check in"
          class="danger"
          id="remove-check-in-out-btn"
          formnovalidate
        >
          Remove
        </ButtonConfirm>

        <button
          type="submit"
          name="action"
          value="add"
          :class="['primary', { active: saveEntryTemplate }]"
          id="add-entry-btn"
        >
          {{ saveEntryTemplate ? 'Save & ' : '' }}Add Entry
        </button>
      </template>
    </div>
  </form>
</template>

<style scoped>
form {
  gap: calc(var(--padding) * 1.5);
}

.entry-templates {
  position: relative;
  display: flex;
  overflow-x: auto;
  white-space: nowrap; /* Prevent wrapping */
  gap: var(--padding-small);
  padding: var(--padding-small);
}

.entry-templates .entry-info {
  flex: 0 0 auto; /* Prevent buttons from shrinking or growing */
  background-color: var(--input-background-color);
  min-width: 80px;
}

#save-entry-template-btn.active,
#add-entry-btn.active {
  background-color: var(--success-color) !important;
  color: var(--text-color-black);
}

.actions {
  transition: all 0.3s ease;
}

.actions > * {
  max-width: 100%;
  overflow: hidden;
}

.actions button {
  flex: 1;
  transition: all 0.3s ease;
}

.actions .danger {
  flex-grow: 0;
}

.actions:has(.hide) {
  gap: 0;
}

.hide {
  max-width: 0;
  padding: 0;
}

.unpaid-breaks {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--padding-small);
}

.unpaid-break {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  gap: var(--padding-small);
}

.unpaid-break > * {
  flex: 1;
}

.unpaid-break .delete-btn {
  flex-grow: 0;
  box-sizing: border-box;
}
</style>
