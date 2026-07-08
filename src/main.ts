// Conform entry point
import './style.css'

console.log('Starting up Conform...')

const dropdownBtn = document.getElementById('dropdown-btn')

// Log when test dropdown is opened
dropdownBtn?.addEventListener('click', () => {
  console.log('Test dropdown opened')
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

  for (let value = 1; value <= 5; value += 1) {
    const radio = document.createElement('input')

    radio.type = 'radio'
    radio.name = `item-${itemNumber}`
    radio.value = String(value)
    radio.className = 'radio'
    radio.setAttribute('aria-label', `${value}`)

    radioGroup.append(radio)
  }

  responseCell.append(radioGroup)
  responseRow.append(blankCell, responseCell)
  row.after(responseRow)
})

let current = 0

// Count how many item radios have been selected
function getAnsweredCount() {
  return document.querySelectorAll('input[type="radio"][name^="item-"]:checked').length
}

// True when all 50 items have a rating
function isComplete() {
  return getAnsweredCount() === 50
}

// Enable submit when complete, otherwise show remaining count
function updateSubmitState() {
  const complete = isComplete()
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

// Show the active page panel and highlight its nav button
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

// Update progress when an item rating changes
document.addEventListener('change', (e) => {
  const target = e.target
  if (target instanceof HTMLInputElement && target.matches('input[type="radio"][name^="item-"]')) {
    updateProgress()
  }
})

// Block incomplete submissions
submitButton.addEventListener('click', () => {
  if (!isComplete()) {
    updateSubmitState()
    return
  }

  submitError.hidden = true
  submitError.textContent = ''
})

// Use previous, number, or next buttons to navigate pages
joinNav.addEventListener('click', (e) => {
  const target = e.target
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
