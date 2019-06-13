import { Transition } from '../../../../src/index'

const animationEnd = element => new Promise(resolve => {
  const onAnimationEnd = e => e.target === element && resolve()
  element.addEventListener('animationend', onAnimationEnd, { once: true })
})

/**
 * Extended Transition
 */
export class AnimationTransition extends Transition {

  /**
   *
   */
  async exit () {
    super.exit()
    await animationEnd(this.element)
  }

  /**
   *
   * @param {String} html - HTML to load in the view
   */
  async enter (node) {
    super.enter(node)
    await animationEnd(this.element)
  }

}

export default AnimationTransition
