<script lang="ts">
export default {
  props: {
    labelStr: {
      type: String,
      required: true
    },
    forId: {
      type: String,
      default: ''
    }
  }
};
</script>

<template>
  <div class="input" :for="forId">
    <!-- Intentionally not using "for" to let user clicks outside to lose input focus -->
    <label>{{ labelStr }}</label>
    <slot></slot>
  </div>
</template>

<style scoped>
.input {
  position: relative;
}

label {
  padding-bottom: var(--padding-small);
}
</style>
