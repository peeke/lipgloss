/**
 * @class Config
 * @classdesc Configuration class for Lipgloss
 */
class Config {

  /**
   * Unless overwritten, the default attributes are used
   */
  constructor () {
    this._overrides = {}
  }

  /**
   * Overwrite the default attributes
   * @param {object} attributes - Object with the attributes you want to overwrite. The values of the object are the new attribute names.
   */
  assign (attributes) {
    this._overrides = Object.assign(this._overrides, attributes)
  }

  /**
   * Get the attribute name for a given normalized attribute name
   * @param {string} attribute - The normalized attribute name
   * @returns {string} - The configured attribute name
   */
  attribute (attribute) {
    return this._overrides[attribute] || attribute
  }

}

export default new Config()
