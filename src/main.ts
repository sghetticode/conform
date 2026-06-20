// Conform entry point
import './style.css'

console.log('Starting up Conform...')

// Start trait test
const readyBtn = document.getElementById('ready-btn')

readyBtn?.addEventListener('click', () => {
  console.log('Ready to start.')
})
