import Papa from 'papaparse'

export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

export function parseCsv(text) {
  const { data, errors } = Papa.parse(stripBom(String(text ?? '')), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })
  if (errors.length > 0) {
    const fatal = errors.filter((error) => error.type === 'Quotes')
    if (fatal.length > 0) throw new Error(`CSV parse error: ${fatal[0].message}`)
  }
  return data
}
