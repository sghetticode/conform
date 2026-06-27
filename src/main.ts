// Conform entry point
import './style.css'

console.log('Starting up Conform...')

// Start trait test
const dropdownBtn = document.getElementById('dropdown-btn')

dropdownBtn?.addEventListener('click', () => {
  console.log('Test dropdown opened')
})
