const dispatchEvent = (source, event, options = {bubbles: true, cancelable: true}) => {
  source.dispatchEvent(new CustomEvent(event, options))
}

export default dispatchEvent
