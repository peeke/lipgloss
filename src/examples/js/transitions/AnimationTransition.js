import { Transition } from '../../../../src/index'

/**
 * Extended Transition
 */
export class AnimationTransition extends Transition {

  /**
   *
   */
  async exit () {
    super.exit()
    await new Promise(resolve => {
      const animationEnd = e => {
        if (e.target !== this._view) return
        this._view.removeEventListener('animationend', animationEnd)
        resolve()
      }
      this._view.addEventListener('animationend', animationEnd)
    })
  }

  /**
   *
   * @param {String} html - HTML to load in the view
   */
  async enter (node) {
    super.enter(node)
    await new Promise(resolve => {
      const animationEnd = e => {
        if (e.target !== this._view) return
        this._view.removeEventListener('animationend', animationEnd)
        resolve()
      }
      this._view.addEventListener('animationend', animationEnd)
    })
  }

}

export default AnimationTransition
