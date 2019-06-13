import attributes from './attributes'

let modelId = 0
const modelCache = {}
const newId = () => [Date.now(), modelId++].join('-')

/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */
class Model {
  /**
   * Initialize a new Model
   * @param {object} options - The configuration for the Model
   * @param {string} options.url - The url to request
   * @param {object} options.request = The options used to fetch the url
   */
  constructor(options) {
    options.request = options.request || {}
    this._request = new Request(options.url, options.request)
    this._doc = null
    this._id = typeof options.id === 'undefined' ? newId() : options.id

    modelCache[this._id] = this

    this._doc = fetch(this._request)
      .then(response => (response.ok ? response : Promise.reject()))
      .then(response => {
        // { redirect: 'error' } fallback for IE and some older browsers
        if (options.request.redirect !== 'error') return response
        if (options.url !== response.url) return Promise.reject()
        return response
      })
      .then(response => response.text())
      .then(html => new DOMParser().parseFromString(html, 'text/html'))
  }

  static getById(id) {
    return modelCache[id]
  }

  get id() {
    return this._id
  }

  /**
   * @description The url used to fetch the new document
   * @returns {string}
   */
  get url() {
    return this._request.url
  }

  /**
   * @description Gets the loaded document (lazily)
   * @returns {Promise.<Element>} - A promise containing the new document
   */
  get doc() {
    return this._doc
  }

  /**
   * A check to see if name was included in the document
   * @param {string} name - A name of a view
   * @returns {boolean}
   */
  async includesView(name) {
    const doc = await this.doc
    return Boolean(doc.querySelector(`[${attributes.view}="${name}"]`))
  }

  equals(model) {
    return model && model.id === this.id
  }
}

export default Model
