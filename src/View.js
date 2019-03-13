import ViewOrder from './ViewOrder'
import Transition from './Transition'
import Model from './Model'
import attributes from './Attributes'
import AttributeList from './AttributeList'
import { dispatch } from "./util";

const errorViewNotFound = name => {
  return new Error(
    `View '${name}' activated, but not found in the loaded document`
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

    this._loadingList = new AttributeList(
      document.body,
      attributes.dict.viewsLoading
    )
    this._activeList = new AttributeList(
      document.body,
      attributes.dict.viewsActive
    )
    this._visibleList = new AttributeList(document.body, 'data-views-visible')

    this.active = this.visible = !!this._element.innerHTML.trim()

    this._model = this._options.model
    this._selector = `[${attributes.dict.view}="${this._options.name}"]`
    this._transition = new this._options.transition(this._element)

    if (this.active) {
      ViewOrder.push(this)
    }

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
    if (this._active === bool) return
    this._active = bool
    this._element.setAttribute(attributes.dict.viewActive, bool)
    this._activeList.toggle(this._options.name, bool)
  }

  set visible(bool) {
    if (this._visible === bool) return
    this._visible = bool
    this._element.setAttribute(attributes.dict.viewActive, bool)
    this._visibleList.toggle(this._options.name, bool)
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
    this._loadingList.toggle(this._options.name, bool)
  }

  /**
   * @returns {Model} - The Model currently associated with this view
   */
  get model() {
    return this._model
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
    if (model && model.equals(this._model)) {
      this._transition.done()
      return
    }

    const includedInModel = (await model.includesView(this._options.name))

    if (!includedInModel) {
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
    model.doc.then(() => (this.loading = false))

    if (this.active) {
      await this._transition.beforeExit()
      await this._exit()
    }

    if (this.loading) {
      await this._transition.loading()
    }

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    if (!node) throw errorViewNotFound(this.name)
    const active = Boolean(node.innerHTML.trim())

    if (!active) {
      this.active = false
      this.visible = false
      return
    }

    if (!ViewOrder.has(this)) {
      ViewOrder.push(this)
    }

    await this._transition.beforeEnter(node, doc)
    this.visible = true
    this.active = true
    await this._enter(node, doc)

    this._model = model
  }

  /**
   * Deactivate the Model for this View.
   * @private
   */
  async _deactivate() {
    if (!this.active) return

    ViewOrder.delete(this)

    await this._transition.beforeExit()
    this.active = false
    await this._exit()
    this.visible = false

    this._model = null
  }

  async _enter(node, doc) {
    dispatch(this._element, 'viewwillenter')
    await this._transition.enter(node, doc)
    dispatch(this._element, 'viewdidenter')
  }

  async _exit() {
    dispatch(this._element, 'viewwillexit')
    await this._transition.exit()
    dispatch(this._element, 'viewdidexit')
  }
}

export default View
