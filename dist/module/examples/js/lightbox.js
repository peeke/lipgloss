import 'regenerator-runtime/runtime';
import lipgloss from '../../../src/index';
import AnimationTransition from './transitions/AnimationTransition'

lipgloss.init({
  defaultViews: ['main'],
  transitions: {
    main: AnimationTransition,
    lightbox: AnimationTransition
  }
});