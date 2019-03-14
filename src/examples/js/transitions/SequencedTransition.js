import { AnimationTransition } from './AnimationTransition'

/**
 * Extended Transition
 */
export class SequencedTransition extends AnimationTransition {

  async beforeExit () {
    if (this.milestones.main) {
      await this.milestones.main.viewDidExit
    }
  }
  /**
   *
   */
  async exit () {
    await super.exit()
  }

  /**
   *
   * @param {String} html - HTML to load in the view
   */
  async enter (node) {
    await super.enter(node)
  }

}

export default SequencedTransition
