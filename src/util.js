const listen = (elements, event, fn, options = {}) => {
  elements.forEach(element => {
    element.addEventListener(event, fn, options)
  })
}

const dispatch = (element, eventName, data = {}) => {
  const event = new CustomEvent(eventName, {
    detail: data,
    bubbles: true,
    cancelable: true
  })
  element.dispatchEvent(event)
  return event
}

const reflow = element => element.offsetHeight

const merge = (a, b) => ({ ...a, ...b })

const milestone = () => {
  let resolve
  const promise = new Promise(r => {
    resolve = r
  })
  promise.resolve = resolve
  return promise
}

const attributeList = {
  list(element, attribute) {
    const string = element.getAttribute(attribute) || ''
    return new Set(string.split(' ').filter(Boolean))
  },
  add(element, attribute, value) {
    attributeList.toggle(element, attribute, value, true)
  },
  remove(element, attribute, value) {
    attributeList.toggle(element, attribute, value, false)
  },
  has(element, attribute, value) {
    return attributeList.list(element, attribute).has(value)
  },
  toggle(element, attribute, value, force) {
    const list = attributeList.list(element, attribute)
    if (typeof force === 'undefined') force = !list.has(value)
    const action = force ? 'add' : 'delete'

    list[action](value)

    element.setAttribute(attribute, Array.from(list).join(' '))
  }
}

export { listen, dispatch, reflow, merge, milestone, attributeList }
