import ViewOrder from './ViewOrder'
import Transition from './Transition'
import Model from './Model'
import attributes from './Attributes'

const unique = arr => Array.from(new Set(arr))
const eventOptions = { bubbles: true, cancelable: true }
const errorHintedAtButNotFound = name => err => {
  console.warn(
    `Hint '${name}' was given, but not found in the loaded document.`
  )
  throw err
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

    this._activeModel = this._options.model
    this._selector = `[${attributes.dict.view}="${this._options.name}"]`
    this._transition = new this._options.transition(this._element)

    if (!(this._transition instanceof Transition)) {
      throw new Error('Provided transition is not an instance of Transition')
    }
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
    this._isLoading = bool
    const loadingViews = document.body.hasAttribute(
      attributes.dict.viewsLoading
    )
      ? document.body.getAttribute(attributes.dict.viewsLoading).split(' ')
      : []

    const newLoadingViews = bool
      ? unique([...loadingViews, this._options.name])
      : loadingViews.filter(name => name !== this._options.name)

    document.body.setAttribute(
      attributes.dict.viewsLoading,
      newLoadingViews.join(' ')
    )
  }

  /**
   * @returns {Model} - The Model currently associated with this view
   */
  get model() {
    return this._activeModel
  }

  /**
   * Set the model associated with this view
   * Has three flows:
   *   1. The same Model is already set, do nothing
   *   2. The view is included in the Model, activate
   *   3. The view is not included in the Model, deactivate
   * @param {Model} model
   */
  async setModel(model) {
    
    if (Model.equal(model, this._activeModel)) return

    if (!model) {
      this._transition.start()
      await this._deactivate()
      this._transition.done()
      return
    }

    const isHintedAt = model.hasHint(this._options.name)
    const includedInModel =
      isHintedAt || (await model.includesView(this._options.name))
    if (!includedInModel) return

    this._transition.start()

    // Take a leap of faith and activate the view based on a hint from the user
    if (isHintedAt) {
      await this._activate(model).catch(
        errorHintedAtButNotFound(this._options.name)
      )
      this._transition.done()
      return
    }

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    const active = node && Boolean(node.innerHTML.trim())

    await (active ? this._activate(model) : this._deactivate())
    this._transition.done()
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
   * Activate a new Model for this View. The selector will query the retreived document for a node to use.
   * @param {Model} model - The model to update the view with
   * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
   * @private
   */
  async _activate(model) {
    this.loading = true
    model.doc.then(() => {
      this.loading = false
    })

    if (this.active) {
      this._dispatch('viewwillexit')
      await this._transition.exit()
      this._transition.exitDone()
      this._dispatch('viewdidexit')
    }

    if (this.loading) {
      this._transition.loading()
    }

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    const active = node && Boolean(node.innerHTML.trim())

    ViewOrder.push(this._options.name)

    if (active) {
      this._dispatch('viewwillenter')
      await this._transition.enter(node, doc)
      this._transition.enterDone()
      this._dispatch('viewdidenter')
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
  async _deactivate() {
    
    ViewOrder.delete(this._options.name)

    if (!this.active) return

    this._dispatch('viewwillexit')
    await this._transition.exit()
    this._transition.exitDone()
    this._dispatch('viewdidexit')

    this.active = false
    this._activeModel = null
  }

  _dispatch(eventName) {
    this._element.dispatchEvent(new CustomEvent(eventName, eventOptions))
  }
}

export default View
