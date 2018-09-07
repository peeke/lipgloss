import View from './View'
import ViewOrder from './ViewOrder'
import Model from './Model'
import Transition from './Transition'
import attributes from './Attributes'

const SUPPORTED = 'pushState' in history

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */
class Controller {
  constructor() {
    this._initialized = new Promise(resolve => (this._didInitialize = resolve))
  }

  /**
   * Controller is a singleton which should be initialized once trough the init() method to set the options
   * @param {object} options - Options
   * @param {string[]} options.defaultHints - Which views are expected to be present, when a link is loaded with an empty [data-view-link]
   * @param {Object.<string, Transition>} options.transitions - An object containing the Transition's (value) for a given view (property)
   * @param {function(string)} options.sanitizeUrl - A function to transform the url, before it's compared and pushed to the history
   * @param {object} options.fetch - The options to pass into a fetch request
   */
  init(options = {}) {
    if (!SUPPORTED) return

    this._options = Object.assign(Controller.options, options)
    this._viewsMap = new WeakMap()

    attributes.assign(this._options.attributes)

    const url = this._options.sanitizeUrl(window.location.href)
    this._model = new Model(
      { url, hints: this._options.defaultHints },
      this._options.fetch
    )

    this._onLinkClick = this._onLinkClick.bind(this)
    this._onDeactivateViewClick = this._onDeactivateViewClick.bind(this)

    this._addHistoryEntry(this._model, true)
    this._bindEvents()
    this.initializeContext(document)
    this._didInitialize()
  }

  /**
   * Default init options
   * @type {object}
   */
  static get options() {
    return {
      defaultHints: [],
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

  get initialized() {
    return this._initialized
  }

  /**
   * Return all the views contained in the current document
   * @returns {View[]} - An array of View instances
   */
  _gatherViews() {
    const selector = `[${attributes.dict.view}], [${attributes.dict.slot}]`
    return Array.from(document.querySelectorAll(selector)).map(element =>
      this._viewsMap.get(element)
    )
  }

  _transitionAction(viewName, action) {
    const view = this._getViewByName(viewName)
    if (!view) return Promise.resolve()
    return view.transition[action]
  }

  didExit(name) {
    return this._transitionAction(name, 'didExit')
  }

  didEnter(name) {
    return this._transitionAction(name, 'didEnter')
  }

  didComplete(name) {
    return this._transitionAction(name, 'didComplete')
  }

  willEnter(name) {
    return this._transitionAction(name, 'willEnter')
  }

  willExit(name) {
    return this._transitionAction(name, 'willExit')
  }

  isActive(name) {
    const view = this._getViewByName(name)
    return view && view.active
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
    const selector = `[${attributes.dict.view}], [${attributes.dict.slot}]`
    Array.from(context.querySelectorAll(selector))
      .filter(element => !this._viewsMap.has(element))
      .forEach(element =>
        this._viewsMap.set(element, this._createView(element, this._model))
      )

    Array.from(
      context.querySelectorAll(`[href][${attributes.dict.viewLink}]`)
    ).forEach(link => link.addEventListener('click', this._onLinkClick))

    Array.from(
      context.querySelectorAll(`[${attributes.dict.deactivateView}]`)
    ).forEach(link =>
      link.addEventListener('click', this._onDeactivateViewClick)
    )
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
      element.getAttribute(attributes.dict.view) ||
      element.getAttribute(attributes.dict.slot)
    const transition = this._options.transitions[name] || Transition
    return new View(element, { name, transition, model })
  }

  /**
   * Throw an error when there are views in the doc for which we cannot determine where they should be placed in the
   * document. This is the case when the doc which is loaded contains views which are not in the current document and
   * do not have a parent view which is in the current document.
   * @param doc
   * @private
   */
  _throwOnUnknownViews(doc) {
    const message = name =>
      `Not able to determine where [${
        attributes.dict.view
      }='${name}'] should be inserted.`
    const views = this._gatherViews()

    Array.from(doc.querySelectorAll(`[${attributes.dict.view}]`))
      .map(viewElement => viewElement.getAttribute(attributes.dict.view))
      .filter(name => !views.some(view => view.name === name))
      .forEach(name => {
        throw new Error(message(name))
      })
  }

  /**
   * Checks whether a url is equal to the current url (after sanitizing)
   * @param {string} url - The url to compare to the current url
   * @returns {boolean}
   * @private
   */
  _isCurrentUrl(url) {
    return (
      this._options.sanitizeUrl(url) ===
      this._options.sanitizeUrl(window.location.href)
    )
  }

  /**
   * Handles a click on an element with a [data-view-link] attribute.
   * Loads the document found at [href], unless that's the current url already.
   * This function calls the _updatePage function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  async _onLinkClick(e) {
    e.preventDefault()
    const url = this._options.sanitizeUrl(e.currentTarget.href)
    const viewLink = e.currentTarget.getAttribute(attributes.dict.viewLink)
    const hints = viewLink ? viewLink.split(',') : this._options.defaultHints
    this.openUrl(url, hints)
  }

  /**
   *
   * @param {String} url - The url to open.
   * @param {Array<String>|String} hints - The views to update. Can be either a string or an array with multiple strings.
   * @param {Object} fetchOptions - The options to pass to fetch().
   */
  openUrl(
    url,
    hints = this._options.defaultHints,
    fetchOptions = this._options.fetch
  ) {
    hints = Array.isArray(hints) ? hints : [hints]
    const model = new Model({ url, hints }, fetchOptions)
    const samePage = this._model && this._model.equals(model)
    this._updatePage(model)
    this._addHistoryEntry(model, samePage)
  }

  /**
   * Handles a click on an element with a [data-deactivate-view="viewname"] attribute.
   * Navigates to the current url of View next up in the ViewOrder. This is particularly useful when you want to close an overlay or lightbox.
   * This function calls the _updatePage function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  _onDeactivateViewClick(e) {
    e.preventDefault()
    const name = e.currentTarget.getAttribute(attributes.dict.deactivateView)
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

    this._updatePage(newView.model)
    this._addHistoryEntry(newView.model)
  }

  /**
   * Retreive a Model from a View
   * @param {string} name - The name of a View
   * @returns {Model} - The model currently active for the given View
   * @private
   */
  _getViewByName(name) {
    const element = document.querySelector(
      `[${attributes.dict.view}="${name}"], [${attributes.dict.slot}="${name}"]`
    )
    return this._viewsMap.get(element)
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
      const similarView = this._gatherViews()
        .filter(view => Boolean(view.model))
        .find(view => view.model.equals(e.state.model))

      const model = similarView
        ? similarView.model
        : new Model(e.state.model, this._options.fetch)

      this._updatePage(model)
    } catch (err) {
      console.error(err)
      window.location.href = model.url
    }
  }

  /**
   * Updates given views in a page with a new model
   * @param {Model} model - The model to update the page with
   * @returns {Promise.<void>} - Resolves when updating the page is done
   * @private
   */
  async _updatePage(model) {
    window.dispatchEvent(
      new CustomEvent('pagewillupdate', {
        detail: model.getBlueprint()
      })
    )
    this._model = model
    try {
      const views = this._gatherViews()
      views.forEach(view => view.transition.reset())
      views.forEach(view => view.setModel(model))

      const done = Promise.all(
        views
          .map(view => view.transition)
          .map(transition => transition.didComplete)
      )

      const doc = await model.doc
      this._throwOnUnknownViews(doc)
      this._options.updateDocument(doc)

      await done
      window.dispatchEvent(new CustomEvent('pagedidupdate', {
        detail: model.getBlueprint()
      }))
    } catch (err) {
      console.error(err)
      window.location.href = model.url
    }
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
      model: model.getBlueprint()
    }

    const method = replaceEntry ? 'replaceState' : 'pushState'
    history[method](state, document.title, model.url)

    window.dispatchEvent(new CustomEvent('statechange', { detail: state }))
  }
}

export default Controller
