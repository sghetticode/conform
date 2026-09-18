import { preloadGenerator, generateDescription } from './generator'
import { factors, factorNames, levelFor, type Factor } from './factors'

const downloadTimestamp = Number(localStorage.getItem('downloadTimestamp'))
const hour = 3600 * 1000
// Delete following keys: downloadTimestamp, panelRendered, results, testSubmitted
if (downloadTimestamp && Date.now() - downloadTimestamp > hour) {
  localStorage.clear()
}

let started: boolean

if (localStorage.getItem('testStarted') === 'true') {
  started = true
} else {
  localStorage.setItem('testStarted', 'false')
  started = false
}

// Start trait test, load panel 1, and enable nav buttons
const startBtn = document.querySelector<HTMLButtonElement>('#start-btn')!

startBtn.addEventListener('click', () => {
  console.log('User started test')
  started = true
  localStorage.setItem('testStarted', 'true')

  renderPanel(1)
  console.log('Rendered test panel 1')

  startBtn.disabled = true

  // Load lang model in background
  preloadGenerator()
})

const items: Record<string, { factor: Factor; sign: '+' | '-' }> = {}
const itemRows = document.querySelectorAll<HTMLTableRowElement>('#trait-test tbody tr')

// Load saved answers or create empty answers obj
const answers: { [key: string]: string } = JSON.parse(localStorage.getItem('answers') ?? '{}')

// Load saved results if they exist
const savedResults = localStorage.getItem('results')

if (savedResults) {
  revealResults(JSON.parse(savedResults))
} else {
  // Insert response rows after every IPIP item
  itemRows.forEach((row) => {
    const itemString = row.cells[1].textContent!.trim()
    const itemKey = itemString.toLowerCase().replace(/\.$/, '')
    const blankCell = document.createElement('td')
    const responseRow = document.createElement('tr')
    const responseCell = document.createElement('td')
    const radioGroup = document.createElement('div')

    radioGroup.className = 'rating-grid'

    const classes = row.cells[1].classList
    const factor = factors.find((f) => classes.contains(f))

    // Record this item's factor and key for grading
    if (factor) items[itemKey] = { factor, sign: classes.contains('minus') ? '-' : '+' }

    const checkedFill = 'checked:text-neutral-100/80'

    // Generate radio rows for every item and assign label values to each btn
    const radioProps = [
      { val: 'way off', color: 'bg-red-800/60', border: 'border-red-900/70', fill: checkedFill },
      {
        val: 'inaccurate',
        color: 'bg-amber-700/60',
        border: 'border-amber-800/70',
        fill: checkedFill,
      },
      { val: 'neither', color: 'bg-gray-600/60', border: 'border-gray-700/70', fill: checkedFill },
      { val: 'accurate', color: 'bg-cyan-700/60', border: 'border-cyan-800/70', fill: checkedFill },
      {
        val: 'spot on',
        color: 'bg-green-800/60',
        border: 'border-green-900/70',
        fill: checkedFill,
      },
    ]

    radioProps.forEach(({ val, color, border, fill }) => {
      const radio = document.createElement('input')

      radio.type = 'radio'
      radio.name = `${itemKey}`
      radio.value = val
      radio.dataset.traitRadio = ''
      radio.className = `radio ${color} ${border} ${fill}`
      radio.setAttribute('aria-label', `${val}`)
      radioGroup.append(radio)

      // Check for saved answers and restore on load
      if (answers[radio.name] === radio.value) radio.checked = true
    })

    responseCell.append(radioGroup)
    responseRow.append(blankCell, responseCell)
    row.after(responseRow)
  })
}

const storedPanel = Number(localStorage.getItem('panelRendered'))
let currentPanel = Number.isFinite(storedPanel) ? storedPanel : 0
const panels = document.querySelectorAll<HTMLElement>('[data-test-panel]')
const navBtns = document.querySelectorAll<HTMLButtonElement>('#nav-btns button')

// Render current test panel and highlight its corresponding nav button
function renderPanel(panelNum: number = currentPanel) {
  currentPanel = panelNum
  localStorage.setItem('panelRendered', String(panelNum))

  panels.forEach((panel) => {
    panel.hidden = Number(panel.dataset.testPanel) !== panelNum
  })

  navBtns.forEach((btn) => {
    if (currentPanel === 0 && started === false) {
      btn.disabled = true
    } else if (currentPanel >= 0 && started === true) {
      startBtn.disabled = true
      btn.disabled = false

      const isActive = Number(btn.dataset.navbtn) === panelNum
      btn.classList.toggle('bg-mist-700/80', !isActive)
      btn.classList.toggle('bg-mist-600/70', isActive)

      if (isActive) {
        btn.setAttribute('aria-current', 'page')
      } else {
        btn.removeAttribute('aria-current')
      }
    }
  })
}

const joinNav = document.querySelector<HTMLElement>('#nav-btns')!
const pages = 12

// Use previous, number, or next buttons to navigate pages
joinNav.addEventListener('click', (ev) => {
  const target = ev.target
  if (!(target instanceof Element)) return

  const btn = target.closest('button')
  if (!btn) return

  let nextPanel = currentPanel

  if (btn.dataset.navbtn) {
    nextPanel = Number(btn.dataset.navbtn)
  } else if (btn.dataset.nav === 'prev') {
    nextPanel = Math.max(0, currentPanel - 1)
  } else if (btn.dataset.nav === 'next') {
    nextPanel = Math.min(pages - 1, currentPanel + 1)
  }

  renderPanel(nextPanel)
})

// Sync progress bar with number of radios selected
const progress = document.querySelector<HTMLProgressElement>('#test-progress')!

function syncProgressBar() {
  progress.value = countSelectedRadios()
  updateSubmitState()
}

// Count number of radios currently selected
function countSelectedRadios() {
  return document.querySelectorAll('input[type="radio"][data-trait-radio]:checked').length
}

// Save radio input to localStorage and update progress bar
document.addEventListener('change', (ev) => {
  const target = ev.target as HTMLInputElement

  if (target.matches('input[type="radio"][data-trait-radio]')) {
    console.log(`${target.name}: ${target.value}`)
    answers[target.name] = target.value
    localStorage.setItem('answers', JSON.stringify(answers))
    syncProgressBar()
  }
})

const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!
const submitError = document.getElementById('submit-error')!

// Block incomplete submissions until all items have ratings
function testComplete() {
  return countSelectedRadios() === 50
}

// Enable submit button when test is complete or show remaining count
function updateSubmitState() {
  const complete = testComplete()
  submitBtn.disabled = !complete

  if (complete) {
    submitError.hidden = true
    submitError.textContent = ''
  } else {
    const remaining = 50 - countSelectedRadios()
    submitError.textContent = `Rate every item to submit (${remaining} remain)`
    submitError.hidden = false
  }
}

// IPIP plus key item scores
const plusScores: Record<string, number> = {
  'way off': 1,
  inaccurate: 2,
  neither: 3,
  accurate: 4,
  'spot on': 5,
}

// IPIP minus key item scores
const minusScores: Record<string, number> = {
  'way off': 5,
  inaccurate: 4,
  neither: 3,
  accurate: 2,
  'spot on': 1,
}

// Calculate trait test results for each factor
function gradeTest(
  answers: Record<string, string>,
): Record<Factor, { total: number; percentage: number }> {
  console.log('Grading trait test...')

  const totals = {} as Record<Factor, number>
  for (const factor of factors) totals[factor] = 0

  for (const [itemKey, response] of Object.entries(answers)) {
    const meta = items[itemKey]
    if (meta === undefined) continue

    const scoreMap = meta.sign === '+' ? plusScores : minusScores
    const score = scoreMap[response]
    if (score === undefined) continue

    totals[meta.factor] += score
  }

  // Populate results obj with total and percentage for each factor
  const results = {} as Record<Factor, { total: number; percentage: number }>

  for (const factor of factors) {
    const total = totals[factor]
    results[factor] = { total, percentage: ((total - 10) / 40) * 100 }
  }

  // Save results to localStorage and log to console
  localStorage.setItem('results', JSON.stringify(results))

  console.log('Trait test results:')
  console.table(
    factors.map((factor) => ({
      factor,
      total: results[factor].total,
      percentage: results[factor].percentage,
    })),
  )

  return results
}

function revealResults(results: Record<Factor, { total: number; percentage: number }>) {
  factors.forEach((factor, i) => {
    const percentCell = document.getElementById(`factor-${i + 1}-results`)
    if (percentCell) percentCell.textContent = `${Math.round(results[factor].percentage)}%`

    const levelCell = document.getElementById(`factor-${i + 1}-level`)
    if (levelCell) levelCell.textContent = levelFor(results[factor].percentage)
  })

  // Show generated description below table
  const storedDesc = localStorage.getItem('traitDescription')
  const traitDesc = document.getElementById('trait-description')!
  traitDesc.hidden = !storedDesc
  if (storedDesc) traitDesc.textContent = storedDesc

  // Hide landing page content and display test results
  document.getElementById('header')!.hidden = true
  document.querySelector('main')!.hidden = true
  document.getElementById('test-results')!.hidden = false
}

// Test submission handler
submitBtn.addEventListener('click', async () => {
  if (!testComplete()) {
    updateSubmitState()
    return
  }

  submitError.hidden = true
  submitError.textContent = ''

  console.log('Trait test submitted')
  localStorage.removeItem('testStarted')
  localStorage.setItem('testSubmitted', 'true')

  const results = gradeTest(answers)
  localStorage.removeItem('answers')

  // Hide submit page content then replace with loading component
  document.getElementById('submit-heading')!.hidden = true
  const scoreLoading = document.getElementById('score-loading')!
  scoreLoading.hidden = false
  scoreLoading.focus()
  submitBtn.hidden = true
  joinNav.hidden = true

  const scoreStatus = document.getElementById('score-status')!

  try {
    const description = await generateDescription(results, (status) => {
      scoreStatus.textContent = status
    })
    localStorage.setItem('traitDescription', description)
  } catch (err) {
    console.error('Generator: Falling back to table-only results:', err)
    localStorage.removeItem('traitDescription')
  }

  // Show trait test results
  localStorage.removeItem('panelRendered')
  revealResults(results)
  document.body.classList.add('overflow-x-hidden')
})

// Log un/checked state of 'how it works' collapse component
const hiwToggle = document.querySelector<HTMLInputElement>('#hiw-toggle')

hiwToggle?.addEventListener('change', () => {
  if (hiwToggle.checked) {
    console.log('How it works section expanded')
  } else {
    console.log('How it works section collapsed')
  }
})

// Build results file with table and personality description
function buildMarkdown(
  results: Record<Factor, { total: number; percentage: number }>,
  description: string | null,
): string {
  const lines = factors
    .map((factor) => {
      const name = factorNames[factor].padEnd(21)
      const percent = `${Math.round(results[factor].percentage)}%`.padEnd(7)
      const level = levelFor(results[factor].percentage).padEnd(8)
      return `| ${name} | ${percent} | ${level} |`
    })
    .join('\n')

  let markdown = `# TRAITS.md

| Factor                | Percent | Level    |
| --------------------- | ------- | -------- |
${lines}
`

  if (description) markdown += `\n${description}\n`

  return markdown
}

// Create object URL blob and trigger browser download of results Markdown
function downloadResults(
  results: Record<Factor, { total: number; percentage: number }>,
  description: string | null,
) {
  const blob = new Blob([buildMarkdown(results, description)], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'TRAITS.md'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const downloadBtn = document.querySelector<HTMLButtonElement>('#download-btn')!

// Download trait test results and clear local data after an hour
downloadBtn.addEventListener('click', () => {
  const currentResults = localStorage.getItem('results')
  if (!currentResults) return

  console.log('Downloading TRAITS.md file...')
  localStorage.setItem('downloadTimestamp', String(Date.now()))
  downloadResults(JSON.parse(currentResults), localStorage.getItem('traitDescription'))
})

renderPanel()
syncProgressBar()
