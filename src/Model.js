/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */
class Model {

  /**
   * Initialize a new Model
   * @param {Request} request - A request object to fetch the new document
   * @param {string[]} hints = [] - The views which are known to be contained in the loaded document
   */
  constructor (request, hints = []) {
    this._request = request
    this._hints = hints
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
   * Convenience method to create a Model given url, hints and optionally fetch options
   * @param {string} url - The url to fetch
   * @param {string[]} hints=[] - The views which are known to be contained in the loaded document
   * @param {object} fetchOptions - The options to pass to fetch
   * @returns {Model}
   */
  static create ({url, hints}, fetchOptions = {}) {
    const request = new Request(url, fetchOptions)
    return new Model(request, hints || [])
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
      .then(node => (node && node.innerHTML) ? node : Promise.reject())
  }

  /**
   * Get an object representation of the Model, which can be added to the history state. You can pass it to the
   * Model.create function to recreate the model:
   * @example <caption>Using the model representation</caption>
   * const representation = model.getRepresentation()
   * const twin = Model.create(representation, fetchOptions)
   * @returns {{url: string, hints: string[]}}
   */
  getRepresentation () {
    return {url: this._request.url, hints: this._hints}
  }

}

export default Model
