const listen = (elements, event, fn, options = {}) => {
  Array.from(elements).forEach(element =>
    element.addEventListener(event, fn, options)
  );
};

const dispatch = (element, event, data = {}) => {
  element.dispatchEvent(
    new CustomEvent(event, {
      detail: data,
      bubbles: true, 
      cancelable: true
    })
  );
}

const reflow = element => element.offsetHeight;

export { listen, dispatch, reflow }