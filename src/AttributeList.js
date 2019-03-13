class AttributeList {
  constructor(element, attribute) {
    this._element = element
    this._attribute = attribute
  }

  _getList() {
    const string = this._element.getAttribute(this._attribute) || ''
    return new Set(string.split(' ').filter(Boolean))
  }

  add(value) {
    this.toggle(value, true)
  }

  remove(value) {
    this.toggle(value, false)
  }

  has(value) {
    return this._getList().has(value)
  }

  toggle(value, force) {
    const list = this._getList()
    if (typeof force === 'undefined') force = !list.has(value)
    const action = force ? 'add' : 'delete'

    list[action](value)

    this._element.setAttribute(this._attribute, Array.from(list).join(' '))
  }
}

export default AttributeList
