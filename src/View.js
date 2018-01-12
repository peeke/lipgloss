import Transition from './Transition'
import config from './Config'
import dispatchEvent from './utils/dispatchEvent'

const unique = arr => Array.from(new Set(arr))
const attr = key => config.attribute(key)

/**
 * @class View
 * @classdesc This class manages it's own bit of the document, invoking the transitions for it.
 */
class View {

  /**
   * @param {Element} element - The element associated with the view
   * @param {Object} options - Options for the view
   * @param {string|null} options.name = null - The name of the view. You should set this
   * @param {boolean} options.persist = false - If a view is persistant, it will not exit if it's not found within the loaded document.
   * @param {Transition} options.transition = Transition - The transition to use for this view
   * @param {string|null} options.selector = null - The selector to retreive a new node for this view from the loaded document. If left set to `null`, `[data-view="viewname"]` will be used. If you set an attributeOverride for 'data-view', that will be used instead.
   * @param {Model|null} options.model = null - The initial model of the view. You should set this.
   */
  constructor (element, options = {}) {

    this._element = element
    this._options = Object.assign(View.options, options)

    this.active = !!this._element.innerHTML.trim()
    this._persist = this._element.hasAttribute(attr('data-persist-view'))
    this._activeModel = this._options.model

    const ViewTransition = this._options.transition
    this._transition = new ViewTransition(this._element)

    if (!(this._transition instanceof Transition)) {
      throw new Error('Provided transition is not an instance of Transition')
    }

  }

  /**
   * Default options
   * @type {object}
   */
  static get options () {
    return {
      name: null,
      persist: false,
      transition: Transition,
      selector: null,
      model: null
    }
  }

  get eventOptions () {
    return {
      bubbles: true,
      cancelable: true,
      detail: {
        name: this._name
      }
    }
  }

  /**
   * The selector to use to obtain a new node for this View from the loaded document
   * @returns {string}
   */
  get selector () {
    return this._options.selector || `[${attr('data-view')}="${this._options.name}"]`
  }

  /**
   * Returns whether this View is currently active. A View is set to active when its entered and set to inactive when its exited.
   * @returns {boolean} - Active
   */
  get active () {
    return this._active
  }

  /**
   * Set the active state of this View.
   * @param {boolean} bool - Active
   */
  set active (bool) {
    this._active = bool
    this._element.setAttribute(attr('data-view-active'), bool)
  }

  /**
   * @returns {boolean} - Whether this View is loading
   */
  get loading () {
    return this._isLoading
  }

  /**
   * Set's the loading state for this View
   * @param {boolean} bool
   */
  set loading (bool) {

    this._isLoading = bool
    const loadingViews = document.body.hasAttribute(attr('data-views-loading'))
      ? document.body.getAttribute(attr('data-views-loading')).split(' ')
      : []

    const newLoadingViews = bool
      ? unique([...loadingViews, this._options.name])
      : loadingViews.filter(name => name !== this._options.name)

    document.body.setAttribute(attr('data-views-loading'), newLoadingViews.join(' '))

  }

  /**
   * @returns {Model} - The Model currently associated with this view
   */
  get model () {
    return this._activeModel
  }

  /**
   * Set the model associated with this view
   * @param {Model} model
   */
  set model (model) {

    if (this._activeModel && this._activeModel.url === model.url) {
      return
    }

    const modelHasHint = model.includesView(this._options.name)
    const docHasView = Promise.resolve(modelHasHint || model.querySelector(this.selector))
    docHasView.then(() => this._activate(model), () => this._deactivate())

  }

  /**
   * @returns {string} - The name of this view
   */
  get name () {
    return this._options.name
  }

  /**
   * Activate a new Model for this View. The selector will query the retreived document for a node to use.
   * @param {Model} model - The model to update the view with
   * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
   * @private
   */
  async _activate (model) {

    this.loading = true
    model.doc.then(() => { this.loading = false })

    this.active && await this._exit(true)
    this.loading && this._transition.loading()

    const node = await model.querySelector(this.selector)
    const active = !!node.innerHTML.trim()

    if (active) {
      await this._enter(node)
      this._activeModel = model
    } else {
      this._activeModel = null
    }

    this.active = active

  }

  /**
   * Deactivate the Model for this View.
   * @private
   */
  async _deactivate () {

    if (!this.active) return
    if (this._persist) return

    await this._exit()
    this.active = false
    this._activeModel = null

  }

  /**
   * Initialize the enter transition and fire relevant lifecycle events
   * @param {Element} node - The new node to update the view with
   * @returns {Promise.<void>}
   * @private
   */
  async _enter (node) {
    dispatchEvent(this._element, 'viewwillenter', this.eventOptions)
    await this._transition.enter(node)
    dispatchEvent(this._element, 'viewdidenter', this.eventOptions)
  }

  /**
   * Initialize the exit transition and fire relevant lifecycle events
   * @returns {Promise.<void>}
   * @private
   */
  async _exit () {
    dispatchEvent(this._element, 'viewwillexit', this.eventOptions)
    await this._transition.exit()
    dispatchEvent(this._element, 'viewdidexit', this.eventOptions)
  }

}

export default View
