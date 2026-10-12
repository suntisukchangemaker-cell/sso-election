import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'

const fmt = (value) => new Intl.NumberFormat('th-TH').format(value)

const fixture = {
  generatedAt: '2026-01-01T00:00:00.000Z',
  province: 'สระบุรี',
  summary: {
    unitCount: 2,
    districtCount: 2,
    eligible: 1000,
    turnout: 400,
    validBallots: 370,
    invalidBallots: 5,
    turnoutRate: 0.4,
  },
  races: [
    {
      id: 'insured',
      label: 'ตัวแทนผู้ประกันตน',
      candidateCount: 2,
      totalVotes: 180,
      candidates: [
        { number: 2, name: 'ผู้สมัคร ข', votes: 110, byUnit: { 'หน่วย A': 30, 'หน่วย B': 80 } },
        { number: 1, name: 'ผู้สมัคร ก', votes: 70, byUnit: { 'หน่วย A': 60, 'หน่วย B': 10 } },
      ],
    },
    {
      id: 'employer',
      label: 'ตัวแทนนายจ้าง',
      candidateCount: 1,
      totalVotes: 20,
      candidates: [
        { number: 10, name: 'ผู้สมัคร นายจ้าง', votes: 20, byUnit: { 'หน่วย A': 20 } },
      ],
    },
  ],
  units: [
    {
      district: 'หนองแค',
      unit: 'หน่วย A',
      type: 'ผู้ประกันตน',
      eligible: 600,
      turnout: 200,
      validBallots: 190,
      invalidBallots: 2,
    },
    {
      district: 'แก่งคอย',
      unit: 'หน่วย B',
      type: 'นายจ้าง',
      eligible: 400,
      turnout: 200,
      validBallots: 180,
      invalidBallots: 3,
    },
  ],
}

const mountApp = () => mount(App, { props: { results: fixture } })

describe('App (integration)', () => {
  it('shows the heading and summary figures from the provided data', () => {
    const wrapper = mountApp()

    expect(wrapper.find('h1').text()).toContain('ผลการเลือกตั้งคณะกรรมการประกันสังคม')
    expect(wrapper.find('[data-test=summary-units]').text()).toBe(fmt(2))
    expect(wrapper.find('[data-test=summary-eligible]').text()).toBe(fmt(1000))
    expect(wrapper.find('[data-test=summary-turnout]').text()).toContain(fmt(400))
    expect(wrapper.find('[data-test=summary-turnout]').text()).toContain('40.0%')
  })

  it('renders candidates ranked by total votes for the default race', () => {
    const wrapper = mountApp()
    const items = wrapper.findAll('[data-test=candidate]')

    expect(items).toHaveLength(2)
    expect(items[0].find('strong').text()).toBe('ผู้สมัคร ข')
    expect(items[0].text()).toContain('หมายเลข 2')
    expect(items[0].text()).toContain(fmt(110))
  })

  it('switches to the employer race', async () => {
    const wrapper = mountApp()
    await wrapper.find('[data-test=race-employer]').trigger('click')

    const items = wrapper.findAll('[data-test=candidate]')
    expect(items).toHaveLength(1)
    expect(items[0].find('strong').text()).toBe('ผู้สมัคร นายจ้าง')
  })

  it('ranks per selected unit and reacts to unit changes', async () => {
    const wrapper = mountApp()
    await wrapper.find('[data-test=view-unit]').trigger('click')

    const select = wrapper.find('[data-test=unit-select]')
    expect(select.exists()).toBe(true)
    expect(wrapper.find('[data-test=panel] .panel-head span').text()).toBe('หน่วย A')
    expect(wrapper.findAll('[data-test=candidate]')[0].find('strong').text()).toBe('ผู้สมัคร ก')

    await select.setValue('หน่วย B')
    expect(wrapper.findAll('[data-test=candidate]')[0].find('strong').text()).toBe('ผู้สมัคร ข')
  })

  it('reveals the per-unit turnout table on demand', async () => {
    const wrapper = mountApp()
    expect(wrapper.find('[data-test=unit-table]').exists()).toBe(false)

    await wrapper.find('[data-test=toggle-units]').trigger('click')

    const rows = wrapper.findAll('[data-test=unit-table] tbody tr')
    expect(rows).toHaveLength(fixture.units.length)
    expect(rows[0].text()).toContain('หน่วย A')
  })
})
