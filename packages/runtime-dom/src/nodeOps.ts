export const nodeOps = {

  createElement: tagName => document.createElement(tagName),
  removee: child => {
    const parent = child.parentNode;

    if (parent) {
      parent.removeChild(child)
    }
  },
  insert: (child, parent, anchor = null) => {
    parent.insertBefore(child, anchor); // 如果 anchor为null 则相当于appendChild
  },
  querySelector: selector => document.querySelector(selector),
  setElementText: (el, text) => el.textContent = text,
  createText: text => document.createTextNode(text),
  setText: (node, text) => node.nodeValue = text
}