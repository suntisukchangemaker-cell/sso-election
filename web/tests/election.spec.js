import { describe, it, expect } from 'vitest'
import { parseCsv, stripBom } from '../src/lib/parse.js'
import {
  aggregateRace,
  canonicalName,
  computeSummary,
  raceTotalVotes,
  rankUnitCandidates,
  summarizeUnits,
  toInt,
  unitsForRace,
} from '../src/lib/election.js'

describe('parseCsv', () => {
  it('strips a UTF-8 BOM and reads Thai headers', () => {
    const csv =
      '\uFEFFจังหวัด,อำเภอ,หน่วยเลือกตั้ง,ประเภท,หมายเลข,ชื่อ-สกุล,ได้คะแนน\n' +
      'สระบุรี,หนองแค,หนองแค ที่1,ผู้ประกันตน,1,นายทดสอบ ใจดี,10\n'

    const rows = parseCsv(csv)

    expect(rows).toHaveLength(1)
    expect(rows[0]['จังหวัด']).toBe('สระบุรี')
    expect(rows[0]['ชื่อ-สกุล']).toBe('นายทดสอบ ใจดี')
    expect(rows[0]['ได้คะแนน']).toBe('10')
  })

  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('stripBom leaves text without a BOM unchanged', () => {
    expect(stripBom('abc')).toBe('abc')
  })
})

describe('toInt', () => {
  it('parses numeric strings and tolerates junk', () => {
    expect(toInt('12')).toBe(12)
    expect(toInt(' 3 ')).toBe(3)
    expect(toInt('')).toBe(0)
    expect(toInt(undefined)).toBe(0)
    expect(toInt('๑๒')).toBe(0)
  })
})

describe('canonicalName', () => {
  it('returns the most frequent spelling', () => {
    const counts = new Map([
      ['นายก ข', 1],
      ['นายก ค', 4],
      ['นายก ก', 2],
    ])
    expect(canonicalName(counts)).toBe('นายก ค')
  })

  it('breaks ties by first inserted name', () => {
    const counts = new Map([
      ['first', 1],
      ['second', 1],
    ])
    expect(canonicalName(counts)).toBe('first')
  })
})

describe('aggregateRace', () => {
  const rows = [
    { หมายเลข: '1', 'ชื่อ-สกุล': 'นายก ข', ได้คะแนน: '10', หน่วยเลือกตั้ง: 'หน่วย A' },
    { หมายเลข: '1', 'ชื่อ-สกุล': 'นายก ข', ได้คะแนน: '5', หน่วยเลือกตั้ง: 'หน่วย A' },
    { หมายเลข: '1', 'ชื่อ-สกุล': 'นายก ค', ได้คะแนน: '0', หน่วยเลือกตั้ง: 'หน่วย B' },
    { หมายเลข: '2', 'ชื่อ-สกุล': 'นายข ค', ได้คะแนน: '3', หน่วยเลือกตั้ง: 'หน่วย B' },
  ]

  it('sums votes by candidate number and picks the dominant spelling', () => {
    const [first, second] = aggregateRace(rows)

    expect(first).toMatchObject({ number: 1, name: 'นายก ข', votes: 15 })
    expect(first.byUnit).toEqual({ 'หน่วย A': 15, 'หน่วย B': 0 })
    expect(second).toMatchObject({ number: 2, name: 'นายข ค', votes: 3 })
  })

  it('sorts by votes descending then by number', () => {
    const tied = aggregateRace([
      { หมายเลข: '5', 'ชื่อ-สกุล': 'ก', ได้คะแนน: '7', หน่วยเลือกตั้ง: 'U' },
      { หมายเลข: '3', 'ชื่อ-สกุล': 'ข', ได้คะแนน: '7', หน่วยเลือกตั้ง: 'U' },
    ])
    expect(tied.map((c) => c.number)).toEqual([3, 5])
  })

  it('returns an empty array for no rows', () => {
    expect(aggregateRace([])).toEqual([])
  })
})

describe('rankUnitCandidates', () => {
  const candidates = [
    { number: 1, name: 'ก', votes: 100, byUnit: { A: 10, B: 90 } },
    { number: 2, name: 'ข', votes: 80, byUnit: { A: 60, B: 20 } },
    { number: 3, name: 'ค', votes: 50, byUnit: { A: 5 } },
  ]

  it('only keeps candidates present in the unit and ranks by unit votes', () => {
    expect(rankUnitCandidates(candidates, 'A')).toEqual([
      { number: 2, name: 'ข', votes: 60 },
      { number: 1, name: 'ก', votes: 10 },
      { number: 3, name: 'ค', votes: 5 },
    ])
  })

  it('returns empty when the unit is unknown', () => {
    expect(rankUnitCandidates(candidates, 'Z')).toEqual([])
  })
})

describe('unitsForRace', () => {
  it('collects and sorts the distinct units', () => {
    const race = {
      candidates: [
        { byUnit: { 'หน่วย B': 1, 'หน่วย A': 2 } },
        { byUnit: { 'หน่วย A': 3, 'หน่วย C': 4 } },
      ],
    }
    expect(unitsForRace(race)).toEqual(['หน่วย A', 'หน่วย B', 'หน่วย C'])
  })
})

describe('summarizeUnits / computeSummary', () => {
  const rows = [
    {
      อำเภอ: 'หนองแค',
      หน่วยเลือกตั้ง: 'หน่วย A',
      ประเภท: 'ผู้ประกันตน',
      ผู้มีสิทธิเลือกตั้ง: '600',
      มาแสดงตนขอรับบัตร: '200',
      บัตรดี: '190',
      บัตรเสีย: '2',
      บัตรเหลือ: '400',
    },
    {
      อำเภอ: 'แก่งคอย',
      หน่วยเลือกตั้ง: 'หน่วย B',
      ประเภท: 'นายจ้าง',
      ผู้มีสิทธิเลือกตั้ง: '400',
      มาแสดงตนขอรับบัตร: '200',
      บัตรดี: '180',
      บัตรเสีย: '3',
      บัตรเหลือ: '200',
    },
  ]

  it('normalizes Thai column names to keys', () => {
    const units = summarizeUnits(rows)
    const unitA = units.find((unit) => unit.unit === 'หน่วย A')
    expect(unitA).toMatchObject({
      district: 'หนองแค',
      unit: 'หน่วย A',
      type: 'ผู้ประกันตน',
      eligible: 600,
      turnout: 200,
      validBallots: 190,
      invalidBallots: 2,
      remaining: 400,
    })
  })

  it('computes totals and turnout rate across distinct units', () => {
    const summary = computeSummary(summarizeUnits(rows))
    expect(summary).toMatchObject({
      unitCount: 2,
      districtCount: 2,
      eligible: 1000,
      turnout: 400,
      validBallots: 370,
      invalidBallots: 5,
    })
    expect(summary.turnoutRate).toBeCloseTo(0.4)
  })

  it('reports a zero turnout rate when there are no eligible voters', () => {
    const summary = computeSummary(summarizeUnits([]))
    expect(summary.turnoutRate).toBe(0)
    expect(summary.unitCount).toBe(0)
  })
})

describe('raceTotalVotes', () => {
  it('sums all candidate votes', () => {
    expect(raceTotalVotes({ candidates: [{ votes: 10 }, { votes: 5 }] })).toBe(15)
  })
})
