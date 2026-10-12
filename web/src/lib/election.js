export const UNIT_FIELDS = {
  eligible: 'ผู้มีสิทธิเลือกตั้ง',
  turnout: 'มาแสดงตนขอรับบัตร',
  ballotsReceived: 'บัตรที่ได้รับ',
  ballotsCast: 'บัตรที่ใช้ลงคะแนน',
  validBallots: 'บัตรดี',
  partialInvalid: 'บัตรเสียบางส่วน',
  invalidBallots: 'บัตรเสีย',
  noVote: 'ไม่ประสงค์ลงคะแนน',
  remaining: 'บัตรเหลือ',
}

export function toInt(value) {
  const normalized = String(value ?? '').replace(/[^0-9-]/g, '')
  if (normalized === '' || normalized === '-') return 0
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function canonicalName(counts) {
  let best = ''
  let bestCount = -1
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return best
}

export function aggregateRace(rows) {
  const byNumber = new Map()
  for (const row of rows) {
    const number = toInt(row['หมายเลข'])
    const votes = toInt(row['ได้คะแนน'])
    const name = String(row['ชื่อ-สกุล'] ?? '').trim()
    const unit = String(row['หน่วยเลือกตั้ง'] ?? '').trim()

    if (!byNumber.has(number)) {
      byNumber.set(number, { number, nameCounts: new Map(), votes: 0, byUnit: {} })
    }
    const candidate = byNumber.get(number)
    candidate.votes += votes
    if (name) candidate.nameCounts.set(name, (candidate.nameCounts.get(name) ?? 0) + 1)
    if (unit) candidate.byUnit[unit] = (candidate.byUnit[unit] ?? 0) + votes
  }

  return [...byNumber.values()]
    .map((candidate) => ({
      number: candidate.number,
      name: canonicalName(candidate.nameCounts),
      votes: candidate.votes,
      byUnit: candidate.byUnit,
    }))
    .sort((a, b) => b.votes - a.votes || a.number - b.number)
}

export function rankUnitCandidates(candidates, unit) {
  return candidates
    .filter((candidate) => unit in candidate.byUnit)
    .map((candidate) => ({
      number: candidate.number,
      name: candidate.name,
      votes: candidate.byUnit[unit],
    }))
    .sort((a, b) => b.votes - a.votes || a.number - b.number)
}

export function unitsForRace(race) {
  const units = new Set()
  for (const candidate of race.candidates) {
    for (const unit of Object.keys(candidate.byUnit)) units.add(unit)
  }
  return [...units].sort((a, b) => a.localeCompare(b, 'th'))
}

export function summarizeUnits(rows) {
  return rows
    .map((row) => {
      const unit = {
        district: String(row['อำเภอ'] ?? '').trim(),
        unit: String(row['หน่วยเลือกตั้ง'] ?? '').trim(),
        type: String(row['ประเภท'] ?? '').trim(),
      }
      for (const [key, field] of Object.entries(UNIT_FIELDS)) unit[key] = toInt(row[field])
      return unit
    })
    .sort(
      (a, b) =>
        a.district.localeCompare(b.district, 'th') ||
        a.unit.localeCompare(b.unit, 'th') ||
        a.type.localeCompare(b.type, 'th'),
    )
}

export function computeSummary(unitRows) {
  const units = new Set()
  const districts = new Set()
  const totals = { eligible: 0, turnout: 0, validBallots: 0, invalidBallots: 0 }
  for (const row of unitRows) {
    units.add(`${row.district}|${row.unit}`)
    if (row.district) districts.add(row.district)
    totals.eligible += row.eligible
    totals.turnout += row.turnout
    totals.validBallots += row.validBallots
    totals.invalidBallots += row.invalidBallots
  }
  return {
    unitCount: units.size,
    districtCount: districts.size,
    ...totals,
    turnoutRate: totals.eligible > 0 ? totals.turnout / totals.eligible : 0,
  }
}

export function raceTotalVotes(race) {
  return race.candidates.reduce((sum, candidate) => sum + candidate.votes, 0)
}
