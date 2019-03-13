import lipgloss from '../../../src/index'
import AnimationTransition from './transitions/AnimationTransition'

lipgloss.init({
  transitions: {
    main: AnimationTransition
  }
})