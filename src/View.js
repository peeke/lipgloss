import ViewOrder from './ViewOrder'
import Transition from './Transition'
import Model from './Model'
import attributes from './Attributes'

const errorHintedAtButNotFound = name => {
  console.warn(
    `Hint '${name}' was given, but not found in the loaded document.`
  )
}

/**
 * @class View
 * @classdesc This class manages it's own bit of the document, invoking the transitions for it.
 */
class View {
  /**
   * @param {Element} element - The element associated with the view
   * @param {Object} options - Options for the view
   * @param {string|null} options.name = null - The name of the view. You should set this
   * @param {Transition} options.transition = Transition - The transition to use for this view
   * @param {string|null} options.selector = null - The selector to retreive a new node for this view from the loaded document. If left set to `null`, `[data-view="viewname"]` will be used. If you set an attributeOverride for 'data-view', that will be used instead.
   * @param {Model|null} options.model = null - The initial model of the view. You should set this.
   */
  constructor(element, options = {}) {
    this._element = element
    this._options = Object.assign(View.options, options)

    this.active = !!this._element.innerHTML.trim()

    this._model = this._options.model
    this._selector = `[${attributes.dict.view}="${this._options.name}"]`
    this._transition = new this._options.transition(this._element)

    if (!(this._transition instanceof Transition)) {
      throw new Error('Provided transition is not an instance of Transition')
    }

    this.active && ViewOrder.push(this)
  }

  /**
   * Default options
   * @type {object}
   */
  static get options() {
    return {
      name: null,
      transition: Transition,
      model: null
    }
  }

  /**
   * Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
   * @returns {boolean} - Active
   */
  get active() {
    return this._active
  }

  /**
   * Set the active state of this View.
   * @param {boolean} bool - Active
   */
  set active(bool) {
    this._active = bool
    this._element.setAttribute(attributes.dict.viewActive, bool)
    bool ? ViewOrder.push(this) : ViewOrder.delete(this)
  }

  /**
   * @returns {boolean} - Whether this View is loading
   */
  get loading() {
    return this._isLoading
  }

  /**
   * Set's the loading state for this View
   * @param {boolean} bool
   */
  set loading(bool) {
    if (this._isLoading === bool) return
    this._isLoading = bool

    const value = document.body.getAttribute(attributes.dict.viewsLoading) || ''
    const tokenList = new Set(value.split(' '))
    bool ? tokenList.add(this.name) : tokenList.delete(this.name)

    document.body.setAttribute(
      attributes.dict.viewsLoading,
      Array.from(tokenList).join(' ')
    )
  }

  /**
   * @returns {Model} - The Model currently associated with this view
   */
  get model() {
    return this._model
  }

  set model(model) {
    this._model = model
    this._transition.start()
    const action = model ? this._activate(model) : this._deactivate()
    action.then(() => this._transition.done())
  }

  /**
   * @returns {string} - The name of this view
   */
  get name() {
    return this._options.name
  }

  get transition() {
    return this._transition
  }

  /**
   * Set the model associated with this view
   * Has three flows:
   *   1. The same Model is already set, do nothing
   *   2. The view is included in the Model, activate
   *   3. The view is not included in the Model, deactivate
   * @param {Model} model
   */
  async updateModel(model) {
    if (model.equals(this.model)) return

    // Take a leap of faith and activate the view based on a hint from the user
    if (model.hasHint(this._options.name)) {
      this.model = model
      return
    }

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    if (!node) return

    const active = node && Boolean(node.innerHTML.trim())
    this.model = active ? model : null
  }

  /**
   * Activate a new Model for this View. The selector will query the retreived document for a node to use.
   * @param {Model} model - The model to update the view with
   * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
   * @private
   */
  async _activate(model) {
    this.loading = true
    model.doc.then(() => (this.loading = false))

    this.active && (await this._exit())
    this.loading && this._transition.loading()

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    if (!node) errorHintedAtButNotFound(this.name)

    const done = this._enter(node, doc)
    this.active = true
    await done
  }

  /**
   * Deactivate the Model for this View.
   * @private
   */
  async _deactivate() {
    if (!this.active) return
    const done = this._exit()
    this.active = false
    await done
  }

  async _enter(node, doc) {
    this._dispatch('viewwillenter')
    await this._transition.enter(node, doc)
    this._transition.enterDone()
    this._dispatch('viewdidenter')
  }

  async _exit() {
    this._dispatch('viewwillexit')
    await this._transition.exit()
    this._transition.exitDone()
    this._dispatch('viewdidexit')
  }

  _dispatch(eventName) {
    const eventOptions = { bubbles: true, cancelable: true }
    this._element.dispatchEvent(new CustomEvent(eventName, eventOptions))
  }
}

export default View
