import attributes from './Attributes'

let modelId = 0

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
    this._id = options.id || modelId++;
  }

  get id () {
    return this._id
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
   * Get an object blueprint of the Model, which can be added to the history state. You can pass it to the
   * options parameter in the constructor to recreate the model:
   * @example <caption>Using the model blueprint</caption>
   * const twin = new Model(model.blueprint, fetchOptions)
   * @returns {{url: string, hints: string[]}}
   */
  get blueprint () {
    return {id: this._id, url: this._request.url, hints: this._hints}
  }

  hasHint (name) {
    return this._hints.includes(name)
  }

  /**
   * A check to see if name was included the given hints
   * @param {string} name - A name of a view
   * @returns {boolean}
   */
  async includesView (name) {
    const doc = await this.doc
    return Boolean(doc.querySelector(`[${attributes.dict.view}="${name}"]`))
  }

  equals (model) {
    if (!model) return false
    return this === model || this.id === model.id
  }

}

export default Model
