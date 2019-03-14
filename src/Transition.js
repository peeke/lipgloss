import attributes from './attributes'
import { dispatch, reflow } from './util'

/**
 * @class Transition
 * @classdesc Basic Transition class. All transitions you create should have this class as
 * (grand)parent. When extending Transition, as a rule of thumb it's good to call this the
 * super functions before your own functionality. E.g.: Sometimes you may want to do some
 * preperation work, in which it is just fine to do this before you call super.exit()
 *
 * If you extend Transition, but choose to implement your own enter method, you have to call
 * this.updateHtml(newNode) to update the HTML in order to preserve the lifecycle events.
 * @example <caption>Extending Transition</caption>
 * async exit() {
 *   super.exit()
 *   // Your code
 * }
 */
class Transition {
  /**
   * @param {Element} view - The view element
   */
  constructor(view, milestones) {
    this._view = view
    this._milestones = milestones
  }

  get view() {
    return this._view
  }

  async beforeExit() {
    return
  }

  /**
   * @description Exit transition for the given view.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async exit(docPromise) {
    this._view.removeAttribute(attributes.transition)
    reflow(this._view)
    this._view.setAttribute(attributes.transition, 'out')
  }

  async beforeEnter() {
    return
  }

  /**
   * @description Enter transition for the given view.
   * @param {String} newNode - The new views node
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async enter(newNode, newDoc) {
    this.updateHtml(newNode)
    this._view.removeAttribute(attributes.transition)
    reflow(this._view)
    this._view.setAttribute(attributes.transition, 'in')
  }

  /**
   * Updates the view element with new HTML and dispatches the 'viewhtmldidupdate' lifecycle event
   * @param {String} newNode - The new views node
   */
  updateHtml(newNode) {
    dispatch(this._view, 'viewhtmlwillupdate')
    this._view.innerHTML = newNode.innerHTML
    dispatch(this._view, 'viewhtmldidupdate')
  }

  /**
   * Cleans up after transitions have completed
   */
  done() {
    this._view.removeAttribute(attributes.transition)
    reflow(this._view)
  }
}

export default Transition
