export const patchEvent = (el, key, value) => {
  // 对函数的缓存
  const invokers = el._vei || (el._vei = {})

  const exists = invokers[key]

  if (value && exists) { // 需要绑定事件，而且还存在的情况下

  } else {
    const eventName = key.slice(2).toLowerCase() // 前两个是on 所以去掉

    if(value) {
      let invoker = invokers[key] = createInvoker(value)

      el.addEventListener(eventName, invoker)
    } else {
      el.removeEventListener(eventName, exists)
      invokers[key] = undefined
    }
  }
}

function createInvoker(value) {
  const invoker = e => {
    invoker.value(e)
  }

  invoker.value = value;
  return invoker
}