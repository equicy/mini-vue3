export const patchStyle = (el, preValue, nextValue) => {
  const style = el.style;
  if (nextValue == null) {
    el.removeAttribute('style')
  } else {

    if (preValue) {
      for (let key in preValue) {
        if (nextValue[key] == null) { // 老的里面有，新的里面没有 需要删除
          style[key] = ''
        }
      }
    }

    // 新的里面有值
    for (let key in nextValue) {
      style[key] = nextValue[key]
    }
  }
}