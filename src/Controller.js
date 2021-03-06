import View from './View'
import Model from './Model'
import Transition from './Transition'
import config from './Config'

const SUPPORTED = 'pushState' in history
const attr = key => config.attribute(key)

/**
 * @class Controller
 * @classdesc Handles updating the views on the page with new models
 */
class Controller {

  /**
   * Controller is a singleton which should be initialized once trough the init() method to set the options
   * @param {object} options - Options
   * @param {string[]} options.defaultHints - Which views are expected to be present, when a link is loaded with an empty [data-view-link]
   * @param {Object.<string, Transition>} options.transitions - An object containing the Transition's (value) for a given view (property)
   * @param {function(string)} options.sanitizeUrl - A function to transform the url, before it's compared and pushed to the history
   * @param {object} options.fetch - The options to pass into a fetch request
   */
  init (options = {}) {

    if (!SUPPORTED) return

    if (this._initialized) {
      throw new Error('You can only initialize Lipgloss once.')
    }

    this._initialized = true
    this._options = Object.assign(Controller.options, options)
    this._viewsMap = new WeakMap()

    config.assign(this._options.attributes)

    const url = this._options.sanitizeUrl(window.location.href)
    this._model = new Model({url, hints: this._options.defaultHints}, this._options.fetch)

    this._addHistoryEntry(this._model, true)
    this._bindEvents()

    this.initializeContext(document)

  }

  /**
   * Default init options
   * @type {object}
   */
  static get options () {
    return {
      defaultHints: [],
      transitions: {},
      sanitizeUrl: url => url,
      updateDocument: doc => { document.title = doc.title },
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

  /**
   * Return all the views contained in the current document
   * @returns {View[]} - An array of View instances
   */
  get views () {
    return Array
      .from(document.querySelectorAll(`[${attr('data-view')}]`))
      .map(element => this._viewsMap.get(element))
  }

  /**
   * Bind global events
   * @private
   */
  _bindEvents () {
    this._onLinkClick = this._onLinkClick.bind(this)
    this._onActivateViewClick = this._onActivateViewClick.bind(this)
    document.addEventListener('viewdidenter', e => this.initializeContext(e.target))
    window.addEventListener('popstate', e => this._onPopState(e))
  }

  /**
   * Initialize a piece of context. Is automatically called after a Transition updates the HTML, but can also be called
   * manually if you have udpated the HTML manually.
   * This function creates Views when they are not initialized yet and binds events for the context.
   * @param {Element} context - The context to intialize
   */
  initializeContext (context) {

    Array
      .from(context.querySelectorAll(`[${attr('data-view')}]`))
      .filter(element => !this._viewsMap.has(element))
      .forEach(element => this._viewsMap.set(element, this._buildView(element, this._model)))

    Array
      .from(context.querySelectorAll(`[href][${attr('data-view-link')}]`))
      .forEach(link => link.addEventListener('click', this._onLinkClick))

    Array
      .from(context.querySelectorAll(`[${attr('data-activate-view')}]`))
      .forEach(link => link.addEventListener('click', this._onActivateViewClick))

  }

  /**
   * Creates a View component based on a given element and an initial model
   * @param {Element} element - The element to create a view for
   * @param {Model} model - The initial model for the view
   * @returns {View} - The created view
   * @private
   */
  _buildView (element, model) {
    const name = element.getAttribute(attr('data-view'))
    const persist = element.hasAttribute(attr('data-persist-view'))
    const transition = this._options.transitions[name] || Transition
    return new View(element, {name, transition, persist, model})
  }

  /**
   * Throw an error when there are views in the doc for which we cannot determine where they should be placed in the
   * document. This is the case when the doc which is loaded contains views which are not in the current document and
   * do not have a parent view which is in the current document.
   * @param doc
   * @private
   */
  _throwOnUnknownViews (doc) {
    const message = name => `Not able to determine where [${attr('data-view')}='${name}'] should be inserted.`

    Array
      .from(doc.querySelectorAll(`[${attr('data-view')}]`))
      .map(viewElement => viewElement.getAttribute(attr('data-view')))
      .filter(name => !this.views.some(view => view.name === name))
      .forEach(name => { throw new Error(message(name)) })

  }

  /**
   * Checks whether a url is equal to the current url (after sanitizing)
   * @param {string} url - The url to compare to the current url
   * @returns {boolean}
   * @private
   */
  _isCurrentUrl (url) {
    return this._options.sanitizeUrl(url) === this._options.sanitizeUrl(window.location.href)
  }

  /**
   * Handles a click on an element with a [data-view-link] attribute.
   * Loads the document found at [href], unless that's the current url already.
   * This function calls the _updatePage function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  async _onLinkClick (e) {
    e.preventDefault()

    const url = this._options.sanitizeUrl(e.currentTarget.href)
    const viewLink = e.currentTarget.getAttribute(attr('data-view-link'))
    const hints = viewLink ? viewLink.split(',') : this._options.defaultHints
    const model = new Model({url, hints}, this._options.fetch)

    if (this._isCurrentUrl(model.url)) return
    await this._updatePage(model)
    this._addHistoryEntry(model)

  }

  /**
   * Handles a click on an element with a [data-activate-view="viewname"] attribute.
   * Navigates to the current url of the given View. This is particularly useful when you want to close an overlay or lightbox.
   * This function calls the _updatePage function and adds a history entry.
   * @param {Event} e - Click event
   * @private
   */
  _onActivateViewClick (e) {
    e.preventDefault()
    const name = e.currentTarget.getAttribute(attr('data-activate-view'))
    this.activateView(name)
  }

  /**
   * Activate a view by name
   * @param {string} name - Name of the view to activate
   * @returns {Promise.<void>}
   */
  async activateView (name) {
    const model = this._getViewByName(name).model
    if (this._isCurrentUrl(model.url)) return
    await this._updatePage(model)
    this._addHistoryEntry(model)
  }

  /**
   * Retreive a Model from a View
   * @param {string} name - The name of a View
   * @returns {Model} - The model currently active for the given View
   * @private
   */
  _getViewByName (name) {
    const element = document.querySelector(`[${attr('data-view')}="${name}"]`)
    return this._viewsMap.get(element)
  }

  /**
   * Recreate a model for a given popstate and update the page
   * @param {Event} e - Event
   * @private
   */
  _onPopState (e) {
    try {
      const model = new Model(e.state.model, this._options.fetch)
      this._updatePage(model)
    } catch (err) {}
  }

  /**
   * Updates given views in a page with a new model
   * @param {Model} model - The model to update the page with
   * @returns {Promise.<void>} - Resolves when updating the page is done
   * @private
   */
  async _updatePage (model) {
    this._model = model
    try {
      this.views.forEach(view => view.model = model)
      const doc = await model.doc
      this._throwOnUnknownViews(doc)
      this._options.updateDocument(doc)
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
  _addHistoryEntry (model, replaceEntry = false) {

    const state = {
      title: document.title,
      url: model.url,
      model: model.getRepresentation()
    }

    const method = replaceEntry ? 'replaceState' : 'pushState'
    history[method](state, document.title, model.url)

    window.dispatchEvent(new CustomEvent('statechange', {detail: state}))

  }

}

export default Controller
