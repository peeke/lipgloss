import View from './View'
import ViewOrder from './ViewOrder'
import Model from './Model'
import Transition from './Transition'
import attributes from './attributes'
import { listen, dispatch, milestone, merge } from './util'

const SUPPORTED = 'pushState' in history

const viewSelector = name => `
  [${attributes.view}=${name}],
  [${attributes.slot}=${name}]
`

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */
class Controller {
  /**
   * Controller is a singleton which should be initialized once trough the init() method to set the options
   * @param {object} options - Options
   * @param {Object.<string, Transition>} options.transitions - An object containing the Transition's (value) for a given view (property)
   * @param {function(string)} options.sanitizeUrl - A function to transform the url, before it's compared and pushed to the history
   * @param {object} options.fetch - The options to pass into a fetch request
   */
  init(options = {}) {
    if (!SUPPORTED) return

    this._options = Object.assign({}, Controller.options, options)
    this._viewsMap = new WeakMap()
    this._views = []

    Object.assign(attributes, this._options.attributes)

    const url = this._options.sanitizeUrl(window.location.href)
    this._model = new Model({ url }, this._options.fetch)

    this._queuedModel = this._model
    this._updatingPage = false

    this._onLinkClick = this._onLinkClick.bind(this)
    this._onDeactivateViewClick = this._onDeactivateViewClick.bind(this)

    this._addHistoryEntry(this._model, true)
    this._bindEvents()
    this.initializeContext(document)

    dispatch(window, 'lipglossready')
  }

  /**
   * Default init options
   * @type {object}
   */
  static get options() {
    return {
      transitions: {},
      sanitizeUrl: url => url,
      updateDocument: doc => {
        document.title = doc.title
      },
      attributes: {},
      fetch: {
        credentials: 'same-origin',
        cache: 'default',
        redirect: 'error',
        headers: {
          'X-Requested-With': 'XmlHttpRequest'
        }
      }
    }
  }

  isActive(name) {
    const view = this._getViewByName(name)
    return Boolean(view && view.active)
  }

  /**
   * Bind global events
   * @private
   */
  _bindEvents() {
    document.addEventListener('viewdidenter', e =>
      this.initializeContext(e.target)
    )
    window.addEventListener('popstate', e => this._onPopState(e))
  }

  /**
   * Initialize a piece of context. Is automatically called after a Transition updates the HTML, but can also be called
   * manually if you have udpated the HTML manually.
   * This function creates Views when they are not initialized yet and binds events for the context.
   * @param {Element} context - The context to intialize
   */
  initializeContext(context) {
    const selector = `[${attributes.view}], [${attributes.slot}]`

    Array.from(context.querySelectorAll(selector))
      .filter(element => !this._viewsMap.has(element))
      .forEach(element => {
        const view = this._createView(element, this._model)
        this._viewsMap.set(element, view)
        this._views.push(view)
      })

    setTimeout(() => {
      listen(
        context.querySelectorAll(`[href][${attributes.viewLink}]`),
        'click',
        this._onLinkClick
      )

      listen(
        context.querySelectorAll(`[${attributes.deactivateView}]`),
        'click',
        this._onDeactivateViewClick
      )
    })
  }

  /**
   * Creates a View component based on a given element and an initial model
   * @param {Element} element - The element to create a view for
   * @param {Model} model - The initial model for the view
   * @returns {View} - The created view
   * @private
   */
  _createView(element, model) {
    const name =
      element.getAttribute(attributes.view) ||
      element.getAttribute(attributes.slot)
    const transition = this._options.transitions[name] || Transition
    return new View(element, { name, transition, model })
  }

  /**
   * Handles a click on an element with a [data-view-link] attribute. Loads the document found at [href].
   * This function calls the _setModel function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  async _onLinkClick(e) {
    if (e.defaultPrevented) return
    e.preventDefault()

    const url = this._options.sanitizeUrl(e.currentTarget.href)
    this.openUrl(url)
  }

  /**
   *
   * @param {String} url - The url to open.
   * @param {Object} fetchOptions - The options to pass to fetch().
   */
  openUrl(url, fetchOptions = this._options.fetch) {
    const model = new Model({ url }, fetchOptions)
    const samePage = this._model && this._model.equals(model)
    this._queueModel(model)
    this._addHistoryEntry(model, samePage)
  }

  /**
   * Handles a click on an element with a [data-deactivate-view="viewname"] attribute.
   * Navigates to the current url of View next up in the ViewOrder. This is particularly useful when you want to close an overlay or lightbox.
   * This function calls the _setModel function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  _onDeactivateViewClick(e) {
    if (e.detail && e.detail.redispatched) return
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    const event = dispatch(e.currentTarget, 'click', { redispatched: true })
    if (event.defaultPrevented) return
    
    const name = e.currentTarget.getAttribute(attributes.deactivateView)
    this.deactivateView(name)
  }

  /**
   * Deactivate a view by name
   * @param {string} name - Name of the view to activate
   */
  deactivateView(name) {
    const view = this._getViewByName(name)
    const newView = ViewOrder.order.find(v => !v.model.equals(view.model))

    if (!newView) {
      throw new Error(
        `Unable to deactivate view ${name}, because there's no view to fall back to.`
      )
    }

    this._queueModel(newView.model)
    this._addHistoryEntry(newView.model)
  }

  /**
   * Retreive a Model from a View
   * @param {string} name - The name of a View
   * @returns {Model} - The model currently active for the given View
   * @private
   */
  _getViewByName(name) {
    return this._views.find(view => view.name === name)
  }

  /**
   * Recreate a model for a given popstate and update the page
   * @param {Event} e - Event
   * @private
   */
  _onPopState(e) {
    if (!e.state) return // popstate fires on page load as well

    try {
      // We use an existing model (if it exists) so we don't have to refetch the associated request
      let model = Model.getById(e.state.modelId)

      // Recreate the model if it's not in the cache
      if (!model) {
        const options = { url: e.state.url, id: e.state.modelId }
        model = new Model(options, this._options.fetch)
      }

      this._queueModel(model)
    } catch (err) {
      console.error(err)
      window.location.href = model.url
    }
  }

  /**
   * Page updates are always queued, because we want to finish the current transition before starting the next
   * @param {Model} model - The model to update the page with
   * @private
   */
  _queueModel(model) {
    this._queuedModel = model
    if (this._updatingPage) return
    this._setModel(model)
  }

  /**
   * Updates given views in a page with a new model
   * @param {Model} model - The model to update the page with
   * @returns {Promise.<void>} - Resolves when updating the page is done
   * @private
   */
  async _setModel(model) {
    this._model = model
    this._updatingPage = true

    try {
      await this.updatePage(model)
    } catch (err) {
      console.error(err)
      window.location.href = model.url
    }

    this._updatingPage = false
    if (this._queuedModel !== model) {
      this._setModel(this._queuedModel)
    }
  }

  async updatePage(model) {
    const event = dispatch(window, 'pagewillupdate')
    if (event.defaultPrevented) return

    const milestones = this._getFreshMilestones()
    const updates = this._views.map(async view => {
      const timeout = setTimeout(
        () => console.warn(view.name, 'timed out'),
        3000
      )
      await new Promise(resolve => requestAnimationFrame(resolve))
      await view.setModel(model, milestones)
      clearTimeout(timeout)
    })

    const doc = await model.doc
    dispatch(window, 'pagestartsupdate')
    this._options.updateDocument(doc)

    this._views = this._views.filter(view =>
      Boolean(document.querySelector(viewSelector(view.name)))
    )

    await Promise.all(updates)
    dispatch(window, 'pagedidupdate')
  }

  _getFreshMilestones() {
    return this._views
      .map(view => ({
        [view.name]: {
          willExit: milestone(),
          didExit: milestone(),
          willEnter: milestone(),
          didEnter: milestone()
        }
      }))
      .reduce(merge)
  }

  /**
   * Add an history entry
   * @param {Model} model - The model to add an history entry for
   * @param {boolean} [replaceEntry=false] - Whether to replace the history entry, instead of pushing it.
   * @private
   */
  _addHistoryEntry(model, replaceEntry = false) {
    const state = {
      title: document.title,
      url: model.url,
      modelId: model.id
    }

    const method = replaceEntry ? 'replaceState' : 'pushState'
    history[method](state, document.title, model.url)

    dispatch(window, 'statechange', state)
  }
}

export default Controller
