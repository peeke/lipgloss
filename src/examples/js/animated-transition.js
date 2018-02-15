import lipgloss from '../../../src/index'
import AnimationTransition from './transitions/AnimationTransition'

lipgloss.init({
  defaultHints: ['main', 'navigation'],
  transitions: {
    main: AnimationTransition
  }
})