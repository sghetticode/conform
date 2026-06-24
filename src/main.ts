// Conform entry point
import './style.css'

console.log('Starting up Conform...')

// Start trait test
const readyCollapse = document.getElementById('ready-collapse')

readyCollapse?.addEventListener('click', () => {
  console.log('Ready to start.')
})
