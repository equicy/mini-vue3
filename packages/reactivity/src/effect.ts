export function effect(fn, options: any = {}) {
  
  const effect = createReactiveEffect(fn, options)

  if (!options.lazy) {
    effect()
  }

  return effect
}

let uid = 0
let activeEffect // 存储当前的effect
const effectStack = []
function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect)
        activeEffect = effect
        fn() // 函数执行会执行get
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length-1]
      }
    }
  }

  effect.id = uid++
  effect._isEffect = true // 标识这是一个响应式的effect
  effect.raw = fn // 保留最初的
  effect.options = options
  return effect
}

const targetMap = new WeakMap()

// 让某个对象的属性收集当前它对应的effect函数
export function track(target, type, key) {
  console.log(target, key, activeEffect)

  // 若属性没有在effect中使用，则actvieEffect一定没有值，说明就不用收集 
  if (activeEffect === undefined) {
    return
  }

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set))
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
  }
  console.log(targetMap)
}

// weakMap key: {name: 'equicy', age: 20} value: map => {name => Set， age => Set}
// Set中存放着当前属性的activeEffect, Set是指可以有多个effect被调用，并且可以防止重复