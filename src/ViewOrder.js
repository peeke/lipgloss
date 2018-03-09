class ViewOrder {

  constructor() {
    this._order = []
  }

  push(name) {
    this._order = [name, ...this._order.filter(n => name !== n)]
  }

  delete(name) {
    this._order = this._order.filter(n => name !== n)
  }

  get head() {
    return this._order[0]
  }

}

export default new ViewOrder()