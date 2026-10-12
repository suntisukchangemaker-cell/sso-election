import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsv } from '../src/lib/parse.js'
import {
  aggregateRace,
  computeSummary,
  raceTotalVotes,
  summarizeUnits,
} from '../src/lib/election.js'

const here = dirname(fileURLToPath(import.meta.url))
const outputDir = prop('--output') ?? resolve(here, '../../output')
const target = resolve(here, '../src/data/results.json')

const RACES = [
  { id: 'insured', label: 'ตัวแทนผู้ประกันตน', type: 'ผู้ประกันตน', file: 'ตัวแทนผู้ประกันตน_คะแนนดิบ.csv' },
  { id: 'employer', label: 'ตัวแทนนายจ้าง', type: 'นายจ้าง', file: 'ตัวแทนนายจ้าง_คะแนนดิบ.csv' },
]

function prop(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : null
}

function read(file) {
  return parseCsv(readFileSync(resolve(outputDir, file), 'utf8'))
}

const raceRows = new Map()
for (const race of RACES) raceRows.set(race.id, read(race.file))
const unitRowsRaw = read('ข้อมูลหน่วยเลือกตั้ง.csv')
const units = summarizeUnits(unitRowsRaw)

const province =
  units[0]?.district && raceRows.get('insured')[0]?.['จังหวัด']
    ? String(raceRows.get('insured')[0]['จังหวัด']).trim()
    : 'สระบุรี'

const races = RACES.map((race) => {
  const candidates = aggregateRace(
    raceRows.get(race.id).filter((row) => String(row['ประเภท']).trim() === race.type),
  )
  const enriched = { ...race, candidates }
  return {
    id: race.id,
    label: race.label,
    candidateCount: candidates.length,
    totalVotes: raceTotalVotes(enriched),
    candidates,
  }
})

const summary = computeSummary(units)

const results = {
  generatedAt: new Date().toISOString(),
  province,
  summary,
  races,
  units,
}

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, `${JSON.stringify(results, null, 1)}\n`, 'utf8')
console.log(
  `wrote ${target}: ${races.map((r) => `${r.id}=${r.candidateCount}`).join(', ')}, units=${units.length}`,
)
