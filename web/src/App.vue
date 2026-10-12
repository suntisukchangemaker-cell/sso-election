<script setup>
import { computed, ref } from 'vue'
import defaultResults from './data/results.json'
import SummaryCards from './components/SummaryCards.vue'
import CandidateList from './components/CandidateList.vue'
import UnitTable from './components/UnitTable.vue'
import { rankUnitCandidates, unitsForRace } from './lib/election.js'

const props = defineProps({
  results: { type: Object, default: null },
})

const data = computed(() => props.results ?? defaultResults)
const nf = new Intl.NumberFormat('th-TH')
const format = (value) => nf.format(value ?? 0)

const activeRaceId = ref(data.value.races[0]?.id ?? null)
const view = ref('overall')
const selectedUnit = ref('')
const showUnits = ref(false)

const activeRace = computed(
  () => data.value.races.find((race) => race.id === activeRaceId.value) ?? data.value.races[0] ?? null,
)
const raceUnits = computed(() => (activeRace.value ? unitsForRace(activeRace.value) : []))
const effectiveUnit = computed(() => selectedUnit.value || raceUnits.value[0] || '')
const ranked = computed(() => {
  if (!activeRace.value) return []
  if (view.value === 'unit') {
    return rankUnitCandidates(activeRace.value.candidates, effectiveUnit.value)
  }
  return activeRace.value.candidates
})

function selectRace(id) {
  activeRaceId.value = id
  selectedUnit.value = ''
}

const generatedLabel = computed(() => {
  const date = new Date(data.value.generatedAt)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('th-TH')
})
</script>

<template>
  <main class="app">
    <header class="hero">
      <h1>ผลการเลือกตั้งคณะกรรมการประกันสังคม</h1>
      <p>
        จังหวัด{{ data.province }} · ตัวแทนผู้ประกันตนและตัวแทนนายจ้าง ·
        เรียงตามคะแนนรวม
      </p>
    </header>

    <SummaryCards :summary="data.summary" />

    <section class="controls">
      <div class="segmented" role="tablist" aria-label="ประเภทผู้สมัคร">
        <button
          v-for="race in data.races"
          :key="race.id"
          type="button"
          role="tab"
          :aria-selected="race.id === activeRace?.id"
          :class="{ active: race.id === activeRace?.id }"
          :data-test="`race-${race.id}`"
          @click="selectRace(race.id)"
        >
          {{ race.label }}
        </button>
      </div>

      <div class="segmented" role="tablist" aria-label="มุมมอง">
        <button
          type="button"
          role="tab"
          :aria-selected="view === 'overall'"
          :class="{ active: view === 'overall' }"
          data-test="view-overall"
          @click="view = 'overall'"
        >
          ภาพรวมทุกหน่วย
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="view === 'unit'"
          :class="{ active: view === 'unit' }"
          data-test="view-unit"
          @click="view = 'unit'"
        >
          เลือกรายหน่วย
        </button>
      </div>

      <select v-if="view === 'unit'" v-model="selectedUnit" data-test="unit-select" aria-label="เลือกหน่วยเลือกตั้ง">
        <option v-for="unit in raceUnits" :key="unit" :value="unit">{{ unit }}</option>
      </select>
    </section>

    <section class="card panel" data-test="panel">
      <div class="panel-head">
        <h2>{{ activeRace?.label }}</h2>
        <span v-if="view === 'overall'">
          {{ format(activeRace?.candidateCount) }} ผู้สมัคร ·
          {{ format(activeRace?.totalVotes) }} คะแนนรวม
        </span>
        <span v-else>{{ effectiveUnit }}</span>
      </div>
      <CandidateList :candidates="ranked" />
    </section>

    <button class="toggle-units" type="button" data-test="toggle-units" @click="showUnits = !showUnits">
      <span>สรุปผู้มาใช้สิทธิรายหน่วย</span>
      <span>{{ showUnits ? 'ซ่อน' : 'แสดง' }}</span>
    </button>
    <section v-if="showUnits" class="card panel" style="margin-top: 12px">
      <UnitTable :units="data.units" />
    </section>

    <footer>
      <p>
        ข้อมูลประมวลผลจากเอกสารผลการนับคะแนน (OCR) บางหน่วยอาจไม่ครบถ้วน
        <template v-if="generatedLabel"> · ประมวลผลเมื่อ {{ generatedLabel }}</template>
      </p>
    </footer>
  </main>
</template>
