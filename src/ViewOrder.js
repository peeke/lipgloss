class ViewOrder {
  constructor() {
    this._order = []
  }

  push(view) {
    this._order = [view, ...this._order.filter(v => view.name !== v.name)]
  }

  delete(view) {
    this._order = this._order.filter(v => view.name !== v.name)
  }

  has(view) {
    return this._order.includes(view)
  }

  get order() {
    return this._order
  }
}

export default new ViewOrder()
