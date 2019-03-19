import ViewOrder from './ViewOrder'
import Transition from './Transition'
import Model from './Model'
import attributes from './attributes'
import { dispatch, attributeList, reflow } from './util'

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

    this.active = this.visible = !!this._element.innerHTML.trim()

    this._model = this._options.model
    this._selector = `[${attributes.view}="${this._options.name}"]`

    if (this.active) {
      ViewOrder.push(this)
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
    this._element.setAttribute(attributes.viewActive, bool)
    reflow(this._element)
    attributeList.toggle(document.body, 'data-views-active', this.name, bool)
  }

  set visible(bool) {
    if (this._visible === bool) return
    this._visible = bool
    this._element.setAttribute(attributes.viewActive, bool)
    reflow(this._element)
    attributeList.toggle(document.body, 'data-views-visible', this.name, bool)
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
    attributeList.toggle(
      document.body,
      attributes.viewsLoading,
      this.name,
      bool
    )
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
  async setModel(model, milestones) {
    const milestone = milestones[this.name]

    if (model && model.equals(this._model)) {
      this._clearMilestone(milestone)
      return
    }

    const includedInModel = await model.includesView(this._options.name)
    if (!includedInModel) {
      this._clearMilestone(milestone)
      return
    }

    dispatch(this._element, 'viewwillupdate')

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    const active = node && Boolean(node.innerHTML.trim())

    active
      ? await this._activate(model, milestones)
      : await this._deactivate(milestones)

    dispatch(this._element, 'viewdidupdate')
  }

  /**
   * Activate a new Model for this View. The selector will query the retreived document for a node to use.
   * @param {Model} model - The model to update the view with
   * @returns {Promise.<void>} - A promise resolving when the activation of the new Model is complete
   * @private
   */
  async _activate(model, milestones) {
    const milestone = milestones[this.name]
    const transition = new this._options.transition(this._element, milestones)

    this._model = model

    this.loading = true
    model.doc.then(() => (this.loading = false))

    if (this.active) {
      await transition.beforeExit()

      dispatch(this._element, 'viewwillexit')
      milestone.willExit.resolve()

      await transition.exit(model.doc)

      dispatch(this._element, 'viewdidexit')
      milestone.didExit.resolve()
    } else {
      milestone.willExit.resolve()
      milestone.didExit.resolve()
    }

    const doc = await model.doc
    const node = doc.querySelector(this._selector)
    if (!node) throw errorViewNotFound(this.name)

    ViewOrder.push(this)
    await transition.beforeEnter(node, doc)

    this.visible = true
    this.active = true

    dispatch(this._element, 'viewwillenter')
    milestone.willEnter.resolve()

    await transition.enter(node, doc)

    dispatch(this._element, 'viewdidenter')
    milestone.didEnter.resolve()

    transition.done()
  }

  /**
   * Deactivate the Model for this View.
   * @private
   */
  async _deactivate(milestones) {
    const milestone = milestones[this.name]

    if (!this.active) {
      this._clearMilestone(milestone)
      return
    }

    const transition = new this._options.transition(this._element, milestones)

    ViewOrder.delete(this)

    await transition.beforeExit()
    this.active = false

    dispatch(this._element, 'viewwillexit')
    milestone.willExit.resolve()

    await transition.exit()

    dispatch(this._element, 'viewdidexit')
    milestone.didExit.resolve()

    this.visible = false

    milestone.willEnter.resolve()
    milestone.didEnter.resolve()

    transition.done()
    this._model = null
  }

  _clearMilestone(milestone) {
    Object.values(milestone).forEach(promise => promise.resolve())
  }
}

export default View
