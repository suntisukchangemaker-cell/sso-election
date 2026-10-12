<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: { type: Object, required: true },
})

const nf = new Intl.NumberFormat('th-TH')
const format = (value) => nf.format(value ?? 0)
const percent = computed(() => `${((props.summary.turnoutRate ?? 0) * 100).toFixed(1)}%`)
</script>

<template>
  <section class="summary" data-test="summary">
    <div class="card stat">
      <div class="label">หน่วยเลือกตั้ง</div>
      <div class="value" data-test="summary-units">{{ format(summary.unitCount) }}</div>
    </div>
    <div class="card stat">
      <div class="label">เขตอำเภอ</div>
      <div class="value">{{ format(summary.districtCount) }}</div>
    </div>
    <div class="card stat">
      <div class="label">ผู้มีสิทธิเลือกตั้ง</div>
      <div class="value" data-test="summary-eligible">{{ format(summary.eligible) }}</div>
    </div>
    <div class="card stat">
      <div class="label">มาใช้สิทธิ</div>
      <div class="value" data-test="summary-turnout">
        {{ format(summary.turnout) }} <small>({{ percent }})</small>
      </div>
    </div>
    <div class="card stat">
      <div class="label">บัตรดี</div>
      <div class="value" data-test="summary-valid">{{ format(summary.validBallots) }}</div>
    </div>
    <div class="card stat">
      <div class="label">บัตรเสียบางส่วน</div>
      <div class="value" data-test="summary-partial">{{ format(summary.partialInvalid) }}</div>
    </div>
    <div class="card stat">
      <div class="label">บัตรเสีย</div>
      <div class="value" data-test="summary-invalid">{{ format(summary.invalidBallots) }}</div>
    </div>
  </section>
</template>
