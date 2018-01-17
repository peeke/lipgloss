/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */
class Model {

  /**
   * Initialize a new Model
   * @param {object} options - The configuration for the Model
   * @param {string} options.url - The url to request
   * @param {array} options.hints=string[] - The views expected to be present on the requested page
   * @param {object} fetchOptions = The options used to fetch the url
   */
  constructor (options, fetchOptions) {
    this._request = new Request(options.url, fetchOptions)
    this._hints = options.hints || []
    this._doc = null
  }

  /**
   * @description The url used to fetch the new document
   * @returns {string}
   */
  get url () {
    return this._request.url
  }

  /**
   * @description Gets the loaded document (lazily)
   * @returns {Promise.<Element>} - A promise containing the new document
   */
  get doc () {
    if (!this._doc) {
      this._doc = fetch(this._request)
        .then(response => response.ok ? response : Promise.reject())
        .then(response => response.text())
        .then(html => new DOMParser().parseFromString(html, 'text/html'))
    }
    return this._doc
  }

  /**
   * A check to see if name was included the given hints
   * @param {string} name - A name of a view
   * @returns {boolean}
   */
  includesView (name) {
    return this._hints.includes(name)
  }

  /**
   * Queries the loaded document for the selector, rejects if it's not found
   * @param {string} selector='body' - The selector to query for
   * @returns {Promise.<node>} - The node found in the loaded document
   */
  querySelector (selector = 'body') {
    return this.doc
      .then(doc => doc.querySelector(selector))
      .then(node => node || Promise.reject())
  }

  /**
   * Get an object representation of the Model, which can be added to the history state. You can pass it to the
   * options parameter in the constructor to recreate the model:
   * @example <caption>Using the model representation</caption>
   * const representation = model.getRepresentation()
   * const twin = new Model(representation, fetchOptions)
   * @returns {{url: string, hints: string[]}}
   */
  getRepresentation () {
    return {url: this._request.url, hints: this._hints}
  }

}

export default Model
