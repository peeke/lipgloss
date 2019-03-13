import attributes from "./Attributes";
import { dispatch } from "./util";

let modelId = 0;
const modelCache = {};
const newId = () => [Date.now(), modelId++].join("-");

/**
 * @class Model
 * @classdesc The Model contains all the data needed by a View to update.
 */
class Model {
  /**
   * Initialize a new Model
   * @param {object} options - The configuration for the Model
   * @param {string} options.url - The url to request
   * @param {object} fetchOptions = The options used to fetch the url
   */
  constructor(options, fetchOptions = {}) {
    this._request = new Request(options.url, fetchOptions);
    this._doc = null;
    this._id = typeof options.id === 'number' ? options.id : newId();

    modelCache[this._id] = this;

    this._response = fetch(this._request)
      .then(response => (response.ok ? response : Promise.reject()))
      .then(response => {
        // { redirect: 'error' } fallback for IE and some older browsers
        if (fetchOptions.redirect !== "error") return response;
        if (options.url !== response.url) return Promise.reject();
        return response;
      });
  }

  static getById(id) {
    return modelCache[id];
  }

  get id() {
    return this._id;
  }

  /**
   * @description The url used to fetch the new document
   * @returns {string}
   */
  get url() {
    return this._request.url;
  }

  /**
   * @description Gets the loaded document (lazily)
   * @returns {Promise.<Element>} - A promise containing the new document
   */
  get doc() {
    if (!this._doc) {
      this._doc = this._response
        .then(response => response.text())
        .then(html => new DOMParser().parseFromString(html, "text/html"));
    }
    return this._doc;
  }

  /**
   * A check to see if name was included in the document
   * @param {string} name - A name of a view
   * @returns {boolean}
   */
  async includesView(name) {
    const doc = await this.doc;
    return Boolean(doc.querySelector(`[${attributes.dict.view}="${name}"]`));
  }

  equals(model) {
    if (!model) return false;
    return this.id === model.id;
  }
}

export default Model;
