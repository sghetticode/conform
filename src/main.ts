console.log('Starting up Conform...')

// Log un/checked state of 'how it works' collapse component
const hiwToggle = document.querySelector<HTMLInputElement>('#hiw-toggle')

hiwToggle?.addEventListener('change', () => {
  if (hiwToggle.checked) {
    console.log('How it works section expanded')
  } else {
    console.log('How it works section collapsed')
  }
})

// Log clicks of start test button
const startBtn = document.getElementById('start-btn')

startBtn?.addEventListener('click', () => {
  console.log('Start test btn clicked')
})

const itemRows = document.querySelectorAll<HTMLTableRowElement>('#trait-test tbody tr')

// Big Five personality traits
const factors = [
  'extraversion',
  'agreeableness',
  'conscientiousness',
  'emotional-stability',
  'intellect-imagination'
] as const

type Factor = (typeof factors)[number]

const items: Record<string, { factor: Factor; sign: '+' | '-' }> = {}

// Load saved answers or create empty answers obj
const answers: { [key: string]: string } = JSON.parse(
  localStorage.getItem('answers') ?? '{}'
)

const savedResults = localStorage.getItem('results')

// Load saved results if user has already taken test
if (savedResults) {
  revealResults(JSON.parse(savedResults))
} else {
  itemRows.forEach((row) => {
    const itemString = row.cells[1].textContent!.trim()
    const itemKey = itemString.toLowerCase().replace(/\.$/, '')
    const blankCell = document.createElement('td')
    const responseRow = document.createElement('tr')
    const responseCell = document.createElement('td')
    const radioGroup = document.createElement('div')
  
    radioGroup.className = 'grid grid-cols-5 justify-items-center'
  
    const classes = row.cells[1].classList
    const factor = factors.find((f) => classes.contains(f))
  
    // Record this item's factor and key for grading
    if (factor) items[itemKey] = { factor, sign: classes.contains('minus') ? '-' : '+' }
  
    const checkedFill = 'checked:text-neutral-100/80'
  
    // Generate radio rows for every item and assign label vals to each btn
    const radioProps = [
      { val: 'way off', color: 'bg-red-800/60', border: 'border-red-900/70', fill: checkedFill },
      { val: 'inaccurate', color: 'bg-amber-700/60', border: 'border-amber-800/70', fill: checkedFill },
      { val: 'neither', color: 'bg-gray-600/60', border: 'border-gray-700/70', fill: checkedFill },
      { val: 'accurate', color: 'bg-cyan-700/60', border: 'border-cyan-800/70', fill: checkedFill },
      { val: 'spot on', color: 'bg-green-800/60', border: 'border-green-900/70', fill: checkedFill }
    ]
  
    radioProps.forEach(({ val, color, border, fill}) => {
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

const panels = document.querySelectorAll<HTMLElement>('[data-survey-panel]')
const pageButtons = document.querySelectorAll<HTMLElement>('.join [data-navbtn]')

// Render current dropdown panel and highlight its nav btn
function renderPanel() {
  panels.forEach((panel) => {
    panel.hidden = Number(panel.dataset.surveyPanel) !== current
  })

  pageButtons.forEach((button) => {
    const isActive = Number(button.dataset.navbtn) === current
    button.classList.toggle('bg-mist-700/80', !isActive)
    button.classList.toggle('bg-mist-600/70', isActive)
    
    if (isActive) {
      button.setAttribute('aria-current', 'page')
    } else {
      button.removeAttribute('aria-current')
    }
  })
}

const joinNav = document.querySelector<HTMLElement>('.join')!
const pages = 12

// Use previous, number, or next buttons to navigate pages
joinNav.addEventListener('click', (ev) => {
  const target = ev.target
  if (!(target instanceof Element)) return

  const btn = target.closest('button')
  if (!btn) return

  if (btn.dataset.navbtn) {
    current = Number(btn.dataset.navbtn)
  } else if (btn.dataset.nav === 'prev') {
    current = Math.max(0, current - 1)
  } else if (btn.dataset.nav === 'next') {
    current = Math.min(pages - 1, current + 1)
  }

  renderPanel()
})

// Sync progress bar with answered count
const progress = document.querySelector<HTMLProgressElement>('.progress')!

function syncProgressBar() {
  progress.value = getAnsweredCount()
  updateSubmitState()
}

// Count number of radio btns currently selected
let current = 0

function getAnsweredCount() {
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

const submitButton = document.getElementById('submit-button') as HTMLButtonElement
const submitError = document.getElementById('submit-error')!

// Enable submit btn when complete or show remaining count
function updateSubmitState() {
  const complete = formComplete()
  submitButton.disabled = !complete

  if (complete) {
    submitError.hidden = true
    submitError.textContent = ''
  } else {
    const remaining = 50 - getAnsweredCount()
    submitError.textContent = `Rate every item to submit (${remaining} remain)`
    submitError.hidden = false
  }
}

// Block incomplete submissions until all items have ratings
function formComplete() {
  return getAnsweredCount() === 50
}

submitButton.addEventListener('click', () => {
  if (!formComplete()) {
    updateSubmitState()
    return
  }

  submitError.hidden = true
  submitError.textContent = ''

  console.log('Trait test submitted')
  const results = gradeTest(answers)

  // Hide submit page content then replace with loading component
  document.getElementById('submit-heading')!.hidden = true
  const scoreLoading = document.getElementById('score-loading')!
  scoreLoading.hidden = false
  scoreLoading.focus()
  submitButton.hidden = true
  joinNav.hidden = true

  // Show trait test results
  setTimeout(() => revealResults(results), 1000)
  document.body.classList.add('overflow-hidden')

  localStorage.removeItem('answers')
})

// IPIP plus key item scores
const plusScores: Record<string, number> = {
  'way off': 1,
  'inaccurate': 2,
  'neither': 3,
  'accurate': 4,
  'spot on': 5
}

// IPIP minus key item scores
const minusScores: Record<string, number> = {
  'way off': 5,
  'inaccurate': 4,
  'neither': 3,
  'accurate': 2,
  'spot on': 1
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
  const results = {} as Record<Factor, { total: number; percentage: number}>

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
    }))
  )

  return results
}

function revealResults(results: Record<Factor, { total: number; percentage: number }>) {
  factors.forEach((factor, i) => {
    const cell = document.getElementById(`factor-${i + 1}-results`)
    if (cell) cell.textContent = `${Math.round(results[factor].percentage)}%`
  })

  // Hide landing page content and show results
  document.getElementById('header')!.hidden = true
  document.querySelector('main')!.hidden = true
  document.getElementById('results')!.hidden = false
}

renderPanel()
syncProgressBar()
