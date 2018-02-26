import attributes from './Attributes'

const reflow = element => element.offsetHeight
const eventOptions = {bubbles: true, cancelable: true}

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
  constructor (view) {
    this._view = view
  }

  /**
   * @description Exit transition for the given view.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async exit () {
    this._view.removeAttribute(attributes.dict.transition)
    reflow(this._view)
    this._view.setAttribute(attributes.dict.transition, 'out')
  }

  /**
   * @description Loading transition for the given view. This transition state will only occur
   * if the requested document is still loading when exit() completes.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
   */
  async loading () {
    this._view.removeAttribute(attributes.dict.transition)
    reflow(this._view)
    this._view.setAttribute(attributes.dict.transition, 'loading')
  }

  /**
   * @description Enter transition for the given view.
   * @param {String} newNode - The new views node
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async enter (newNode, newDoc) {
    this.updateHtml(newNode)
    this._view.removeAttribute(attributes.dict.transition)
    reflow(this._view)
    this._view.setAttribute(attributes.dict.transition, 'in')
  }

  /**
   * Updates the view element with new HTML and dispatches the 'viewhtmlupdated' lifecycle event
   * @param {String} newNode - The new views node
   */
  updateHtml (newNode) {
    this._view.dispatchEvent(new CustomEvent('viewhtmlwillupdate', eventOptions))
    this._view.innerHTML = newNode.innerHTML
    this._view.dispatchEvent(new CustomEvent('viewhtmldidupdate', eventOptions))
  }

  /**
   * Cleans up after transitions have completed
   */
  done () {
    this._view.removeAttribute(attributes.dict.transition)
    reflow(this._view)
  }

}

export default Transition