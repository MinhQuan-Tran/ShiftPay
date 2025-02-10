<script lang="ts">
import { Entry } from '@/classes';

import { currencyFormat, toTimeStr } from '@/utils';

export default {
  props: {
    entry: {
      type: Object as () => Entry,
      required: true
    },
    selectedDate: {
      type: Date,
      required: true
    }
  },

  emits: ['edit-entry'],

  methods: {
    currencyFormat,
    toTimeStr,

    handleEditEntry(entry: Entry) {
      this.$emit('edit-entry', entry);
    }
  }
};
</script>

<template>
  <div class="entry">
    <div class="datetime">
      <div class="from">
        <div
          class="date"
          v-if="new Date(entry.from).setHours(0, 0, 0, 0) !== new Date(selectedDate).setHours(0, 0, 0, 0)"
        >
          {{
            entry.from.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })
          }}
        </div>
        <div class="time">{{ toTimeStr(entry.from) }}</div>
      </div>
      <div class="to">
        <div
          class="date"
          v-if="new Date(entry.to).setHours(0, 0, 0, 0) !== new Date(selectedDate).setHours(0, 0, 0, 0)"
        >
          {{
            entry.to.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric'
            })
          }}
        </div>
        <div class="time">{{ toTimeStr(entry.to) }}</div>
      </div>
    </div>
    <div class="divider"></div>
    <!-- Allow user to open multiple entries to compare -->
    <details class="info">
      <summary>
        <div class="workplace">{{ entry.workplace }}</div>
        <div class="billable-time">
          {{ entry.billableDuration?.format('short') ?? 'error' }}
          <img
            width="48"
            height="48"
            src="https://img.icons8.com/fluency/48/time-card.png"
            alt="time-card"
            class="inline-icon"
          />
        </div>
        <div class="earning">
          <img
            width="48"
            height="48"
            src="https://img.icons8.com/fluency/48/cash--v1.png"
            alt="cash--v1"
            class="inline-icon"
          />
          {{ entry.income === undefined ? 'error' : currencyFormat(entry.income) }}
        </div>
        <div class="unpaid-breaks">
          {{ entry.totalBreakDuration.format('short') }}
          <img width="48" height="48" src="https://img.icons8.com/fluency/48/tea.png" alt="tea" class="inline-icon" />
        </div>
      </summary>
      <div class="details">
        <div class="secondary-info">
          <div class="others">
            <div class="hourly-rate">{{ currencyFormat(entry.payRate) }}/hr</div>
          </div>
          <div class="times">
            <div v-for="(breakTime, index) in entry.unpaidBreaks" :key="index">
              <div>
                {{ breakTime.format('short') }}
                <img
                  width="48"
                  height="48"
                  src="https://img.icons8.com/fluency/48/tea.png"
                  alt="tea"
                  class="inline-icon"
                />
              </div>
            </div>
            <div class="shift-duration">
              {{ entry.duration.format('short') }}
              <img
                width="48"
                height="48"
                src="https://img.icons8.com/fluency/48/clock.png"
                alt="clock"
                class="inline-icon"
              />
            </div>
          </div>
        </div>
        <div class="actions">
          <button @click="handleEditEntry(entry)">Edit</button>
        </div>
      </div>
    </details>
  </div>
</template>

<style scoped>
.entry {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: start;
  text-wrap: balance;
  text-wrap: pretty;
  word-break: break-word;
  overflow-wrap: break-word;
  --divider-width: 4px;
  /* --divider-border-radius: calc(var(--divider-width) / 2); */
  border-radius: var(--border-radius);
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.5);
  transition: all 0.3s;
}

.entry:hover,
.entry:has(.info[open]) {
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.8);
}

.divider {
  align-self: stretch;
  width: var(--divider-width);
  /* border-radius: var(--divider-border-radius); */
  background: var(--primary-color);
}

.datetime {
  /* using props and v-bind cause DaySchedule to update */
  width: var(--datetime-width);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  text-align: right;
  gap: 1em;
  padding: var(--padding-small) var(--padding);
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  white-space: nowrap;
  background-color: var(--input-background-color);
}

.datetime .date {
  font-size: smaller;
  font-weight: bold;
  opacity: 0.5;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  background: light-dark(#d8d8d8, #343434);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  padding: 0;
  transition: all 0.3s;
}

.info summary::marker,
.info summary::-webkit-details-marker {
  display: none !important;
}

.info summary {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'workplace billable-time'
    'earning   unpaid-breaks';
  gap: var(--padding);
  justify-items: stretch;
  justify-content: stretch;
  align-items: center;
  align-content: space-between;
  background-color: var(--input-background-color);
  padding: var(--padding);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  position: relative;
  cursor: pointer;
}

.info summary > * {
  text-wrap: balance;
  text-wrap: pretty;
  word-break: break-word;
  overflow-wrap: break-word;
}

.info summary > *:nth-child(2n) {
  text-align: right;
}

.info summary .workplace {
  grid-area: workplace;
  font-weight: bold;
}

.info summary .earning {
  grid-area: earning;
}

.info summary .billable-time {
  grid-area: billable-time;
}

.info summary .unpaid-breaks {
  grid-area: unpaid-breaks;
}

.details {
  padding: var(--padding);
  border-radius: 0 0 var(--border-radius) 0;
  display: flex;
  flex-direction: column;
  gap: var(--padding-small);
}

.details .secondary-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.details .secondary-info > * {
  text-wrap: balance;
  text-wrap: pretty;
  word-break: break-word;
  overflow-wrap: break-word;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: stretch;
  gap: var(--padding);
}

.details .secondary-info .times {
  text-align: right;
}

.details .actions {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: var(--padding);
}

.details .actions > * {
  flex: 1;
  box-shadow: none;
}
</style>
