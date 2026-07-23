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

const pages = 12
const progress = document.querySelector<HTMLProgressElement>('.progress')!
const panels = document.querySelectorAll<HTMLElement>('[data-page-panel]')
const pageButtons = document.querySelectorAll<HTMLElement>('.join [data-page]')
const submitButton = document.getElementById('submit-button') as HTMLButtonElement
const submitError = document.getElementById('submit-error')!
const joinNav = document.querySelector<HTMLElement>('.join')!
const itemRows = document.querySelectorAll<HTMLTableRowElement>('tbody tr')

itemRows.forEach((row) => {
  const itemString = row.cells[1].textContent!.trim()
  const itemKey = itemString.toLowerCase().replace(/\.$/, '')
  const responseRow = document.createElement('tr')
  const blankCell = document.createElement('td')
  const responseCell = document.createElement('td')
  const radioGroup = document.createElement('div')

  radioGroup.className = 'grid grid-cols-5 justify-items-center'

  // Generate radio rows for every item and assign label vals to each btn
  const radioProps = [
    { val: 'way off', color: 'bg-red-800/60', border: 'border-red-900/70', check: 'checked:text-neutral-100' },
    { val: 'inaccurate', color: 'bg-amber-700/60', border: 'border-amber-800/70', check: 'checked:text-neutral-100' },
    { val: 'neither', color: 'bg-gray-600/60', border: 'border-gray-700/70', check: 'checked:text-neutral-100' },
    { val: 'accurate', color: 'bg-cyan-700/60', border: 'border-cyan-800/70', check: 'checked:text-neutral-100' },
    { val: 'spot on', color: 'bg-green-800/60', border: 'border-green-900/70', check: 'checked:text-neutral-100' }
  ]

  radioProps.forEach(({ val, color, border, check}) => {
    const radio = document.createElement('input')

    radio.type = 'radio'
    radio.name = `${itemKey}`
    radio.value = val
    radio.dataset.traitRadio = ''
    radio.className = `radio ${color} ${border} ${check}`
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
    updateProgress()
  }
})

// Sync progress bar and submit state to current answers
function updateProgress() {
  progress.value = getAnsweredCount()
  updateSubmitState()
}

let current = 0

// Count number of radio btns currently selected
function getAnsweredCount() {
  return document.querySelectorAll('input[type="radio"][data-trait-radio]:checked').length
}

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

function gradeTest(answersObj: Record<string, string>) {
  console.log('Grading trait test...')

  for (const key of Object.keys(answersObj)) {
    const val = answersObj[key]
  }

  console.log('Answer set:\n', answersObj)
}

// Render current page panel and highlight its nav btn
function render() {
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

  render()
})

render()
updateProgress()
