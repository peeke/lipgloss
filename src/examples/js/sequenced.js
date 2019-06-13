import lipgloss from '../../../src/index'
import AnimationTransition from './transitions/AnimationTransition'
import SequencedTransition from './transitions/SequencedTransition'

lipgloss.init({
  transitions: {
    main: AnimationTransition,
    lightbox: AnimationTransition,
    sequenced: SequencedTransition
  }
})

// TODO: This is a snippet to test prevention of viewlinkclick events. 
// A dedicated example should be added.
window.addEventListener('viewdidupdate', e => {
  e.target.querySelectorAll('a').forEach(element => {
    element.addEventListener('click', e => {
      if (Math.random() < .5) {
        e.preventDefault()
        e.stopPropagation()
        console.log('prevented')
      }
    })
  })
})