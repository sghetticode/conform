import './style.css'

console.log('Starting up Conform...')

// Load any saved answers or create new answers obj
const answers: { [key: string]: string } = JSON.parse(
  localStorage.getItem('answers') ?? '{}'
)

const hiwCollapse = document.getElementById('hiw-collapse')

// Log when 'how it works' collapse expands
hiwCollapse?.addEventListener('focus', () => {
  console.log('How it works section expanded')
})

const dropdownBtn = document.getElementById('dropdown-btn')

// Log when test dropdown opens
dropdownBtn?.addEventListener('focus', () => {
  console.log('Trait test dropdown opened')
})

const itemRows = document.querySelectorAll<HTMLTableRowElement>('tbody tr')

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

  // Note this item's factor and key for grading
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

    // Check localStorage for saved answers and restore on load
    if (answers[radio.name] === radio.value) radio.checked = true
  })

  responseCell.append(radioGroup)
  responseRow.append(blankCell, responseCell)
  row.after(responseRow)
})

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

const progress = document.querySelector<HTMLProgressElement>('.progress')!

// Sync progress bar with answered count
function syncProgressBar() {
  progress.value = getAnsweredCount()
  updateSubmitState()
}

let current = 0

// Count number of radio btns currently selected
function getAnsweredCount() {
  return document.querySelectorAll('input[type="radio"][data-trait-radio]:checked').length
}

const submitButton = document.getElementById('submit-button') as HTMLButtonElement
const submitError = document.getElementById('submit-error')!

// Enable submit when complete or show remaining count
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

// True when all 50 items have a rating
function formComplete() {
  return getAnsweredCount() === 50
}

// IPIP item plus key scores
const plusScores: Record<string, number> = {
  'way off': 1,
  'inaccurate': 2,
  'neither': 3,
  'accurate': 4,
  'spot on': 5
}

// IPIP item minus key scores
const minusScores: Record<string, number> = {
  'way off': 5,
  'inaccurate': 4,
  'neither': 3,
  'accurate': 2,
  'spot on': 1
}

function gradeTest(answersObj: Record<string, string>) {
  console.log('Grading trait test...')

  const rawSums = {} as Record<Factor, number>
  for (const factor of factors) rawSums[factor] = 0

  for (const [itemKey, response] of Object.entries(answersObj)) {
    const meta = items[itemKey]
    if (meta === undefined) continue

    const scoreMap = meta.sign === '+' ? plusScores : minusScores
    const score = scoreMap[response]
    if (score === undefined) continue

    rawSums[meta.factor] += score
  }

  const results = {} as Record<Factor, { rawSum: number; percentage: number}>
  for (const factor of factors) {
    const rawSum = rawSums[factor]
    results[factor] = { rawSum, percentage: ((rawSum - 10) / 40) * 100 }
  }

  console.log('Trait test results:\n', results)
  console.table(results)
}

// Block incomplete submissions
submitButton.addEventListener('click', () => {
  if (!formComplete()) {
    updateSubmitState()
    return
  }

  submitError.hidden = true
  submitError.textContent = ''

  console.log('Trait test submitted')
  gradeTest(answers)
})

const panels = document.querySelectorAll<HTMLElement>('[data-page-panel]')
const pageButtons = document.querySelectorAll<HTMLElement>('.join [data-page]')

// Render current page panel and highlight its nav btn
function renderPanel() {
  panels.forEach((panel) => {
    panel.hidden = Number(panel.dataset.pagePanel) !== current
  })

  pageButtons.forEach((button) => {
    const isActive = Number(button.dataset.page) === current
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

  if (btn.dataset.page) {
    current = Number(btn.dataset.page)
  } else if (btn.dataset.nav === 'prev') {
    current = Math.max(0, current - 1)
  } else if (btn.dataset.nav === 'next') {
    current = Math.min(pages - 1, current + 1)
  }

  renderPanel()
})

renderPanel()
syncProgressBar()
