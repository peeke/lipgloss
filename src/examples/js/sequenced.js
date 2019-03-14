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