<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  candidates: { type: Array, required: true },
})

const nf = new Intl.NumberFormat('th-TH')
const format = (value) => nf.format(value ?? 0)

const PREVIEW_COUNT = 20
const expanded = ref(false)
watch(
  () => props.candidates,
  () => {
    expanded.value = false
  },
)

const maxVotes = computed(() =>
  props.candidates.reduce((max, candidate) => Math.max(max, candidate.votes), 0),
)
const visible = computed(() =>
  expanded.value ? props.candidates : props.candidates.slice(0, PREVIEW_COUNT),
)
const hiddenCount = computed(() => props.candidates.length - visible.value.length)

const width = (votes) => (maxVotes.value > 0 ? Math.max((votes / maxVotes.value) * 100, 1.5) : 0)
</script>

<template>
  <div>
    <p v-if="candidates.length === 0" class="empty" data-test="no-candidates">
      ไม่พบข้อมูลคะแนนในส่วนนี้
    </p>
    <template v-else>
      <ol class="candidate-list" data-test="candidate-list">
        <li
          v-for="(candidate, index) in visible"
          :key="candidate.number"
          class="candidate"
          data-test="candidate"
        >
          <span class="rank" :class="{ top: index < 3 }">{{ index + 1 }}</span>
          <span class="name">
            <strong>{{ candidate.name || `ผู้สมัครหมายเลข ${candidate.number}` }}</strong>
            <span class="num">หมายเลข {{ candidate.number }}</span>
            <span class="bar"><i :style="{ width: `${width(candidate.votes)}%` }" /></span>
          </span>
          <span class="votes">{{ format(candidate.votes) }}<small>คะแนน</small></span>
        </li>
      </ol>
      <button
        v-if="hiddenCount > 0"
        class="more"
        type="button"
        data-test="show-all"
        @click="expanded = true"
      >
        ดูทั้งหมด {{ format(candidates.length) }} รายชื่อ (เหลืออีก {{ format(hiddenCount) }})
      </button>
      <button v-else-if="expanded && candidates.length > PREVIEW_COUNT" class="more" type="button" @click="expanded = false">
        ย่อรายชื่อ
      </button>
    </template>
  </div>
</template>
