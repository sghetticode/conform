// Conform entry point
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

const pages = 11
const progress = document.querySelector<HTMLProgressElement>('.progress')!
const panels = document.querySelectorAll<HTMLElement>('[data-page-panel]')
const pageButtons = document.querySelectorAll<HTMLElement>('.join [data-page]')
const submitButton = document.getElementById('submit-button') as HTMLButtonElement
const submitError = document.getElementById('submit-error')!
const itemRows = document.querySelectorAll<HTMLTableRowElement>('tbody tr')
const joinNav = document.querySelector<HTMLElement>('.join')!

itemRows.forEach((row) => {
  const itemNumber = row.cells[0].textContent!.trim()
  const responseRow = document.createElement('tr')
  const blankCell = document.createElement('td')
  const responseCell = document.createElement('td')
  const radioGroup = document.createElement('div')

  radioGroup.className = 'grid grid-cols-5 justify-items-center'

  // Generate radio rows for every item and assign label vals to each btn
  const radioLabels = ['way-off', 'inaccurate', 'neither', 'accurate', 'spot-on']

  radioLabels.forEach((label) => {
    const radio = document.createElement('input')

    radio.type = 'radio'
    radio.name = `item-${itemNumber}`
    radio.value = label
    radio.className = 'radio'
    radio.setAttribute('aria-label', label.replace(/-/g, ' '))

    radioGroup.append(radio)

    // Check localStorage for saved answers and restore on load
    if (answers[radio.name] === radio.value) radio.checked = true
  })

  responseCell.append(radioGroup)
  responseRow.append(blankCell, responseCell)
  row.after(responseRow)
})

let current = 0

// Count number of radio btns currently selected
function getAnsweredCount() {
  return document.querySelectorAll('input[type="radio"][name^="item-"]:checked').length
}

// True when all 50 items have a rating
function formComplete() {
  return getAnsweredCount() === 50
}

// Enable submit when complete, otherwise show remaining count
function updateSubmitState() {
  const complete = formComplete()
  submitButton.disabled = !complete

  if (complete) {
    submitError.hidden = true
    submitError.textContent = ''
  } else {
    const remaining = 50 - getAnsweredCount()
    submitError.textContent = `Rate every item to submit (${remaining} items remain)`
    submitError.hidden = false
  }
}

// Sync progress bar and submit state to current answers
function updateProgress() {
  progress.value = getAnsweredCount()
  updateSubmitState()
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

// Save radio input to localStorage and update progress bar
document.addEventListener('change', (ev) => {
  const target = ev.target as HTMLInputElement

  if (target.matches('input[type="radio"][name^="item-"]')) {
    console.log(`${target.name}: ${target.value}`)
    answers[target.name] = target.value
    localStorage.setItem('answers', JSON.stringify(answers))
    updateProgress()
  }
})

// Block incomplete submissions
submitButton.addEventListener('click', () => {
  if (!formComplete()) {
    updateSubmitState()
    return
  }

  submitError.hidden = true
  submitError.textContent = ''
  console.log('Trait test submitted')
})

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
