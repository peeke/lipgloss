import config from './Config'

const attr = key => config.attribute(key)
const reflow = element => element.offsetHeight

/**
 * @class Transition
 * @classdesc Basic Transition class. All transitions you create should have this class as (grand)parent. When extending Transition,
 * as a rule of thumb it's good to call this the super functions before your own functionality. E.g.:
 * Sometimes you may want to do some preperation work, in which it is just fine to do this before you call super.exit()
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
    this._view.removeAttribute(attr('data-transition'))
    reflow(this._view)
    this._view.setAttribute(attr('data-transition'), 'out')
  }

  /**
   * @description Loading transition for the given view. This transition state will only occur if the requested document is still loading when exit() completes.
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'loading'
   */
  async loading () {
    this._view.removeAttribute(attr('data-transition'))
    reflow(this._view)
    this._view.setAttribute(attr('data-transition'), 'loading')
  }

  /**
   * @description Exit transition for the given view.
   * @param {String} node - The new views node
   * @returns {Promise.<void>} - Resolves when the data-transition attribute is set to 'out'
   */
  async enter (node) {
    this._view.innerHTML = node.innerHTML
    this._view.removeAttribute(attr('data-transition'))
    reflow(this._view)
    this._view.setAttribute(attr('data-transition'), 'in')
  }

}

export default Transition