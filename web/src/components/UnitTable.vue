<script setup>
const props = defineProps({
  units: { type: Array, required: true },
})

const nf = new Intl.NumberFormat('th-TH')
const format = (value) => nf.format(value ?? 0)
</script>

<template>
  <div class="table-wrap">
    <table data-test="unit-table">
      <thead>
        <tr>
          <th>หน่วยเลือกตั้ง</th>
          <th>ประเภท</th>
          <th>ผู้มีสิทธิ</th>
          <th>มาใช้สิทธิ</th>
          <th>บัตรดี</th>
          <th>บัตรเสียบางส่วน</th>
          <th>บัตรเสีย</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in props.units" :key="index">
          <td>{{ row.district }} · {{ row.unit }}</td>
          <td>{{ row.type }}</td>
          <td>{{ format(row.eligible) }}</td>
          <td>{{ format(row.turnout) }}</td>
          <td>{{ format(row.validBallots) }}</td>
          <td>{{ format(row.partialInvalid) }}</td>
          <td>{{ format(row.invalidBallots) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
