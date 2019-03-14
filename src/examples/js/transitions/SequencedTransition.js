import { AnimationTransition } from './AnimationTransition'

/**
 * Extended Transition
 */
export class SequencedTransition extends AnimationTransition {

  /**
   *
   */
  async exit () {
    super.exit()
  }

  /**
   *
   * @param {String} html - HTML to load in the view
   */
  async enter (node) {
    super.enter(node)
  }

}

export default SequencedTransition
