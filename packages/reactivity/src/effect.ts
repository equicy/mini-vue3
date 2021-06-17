import { isArray, isIntegerKey } from "@vue/shared/src"
import { TriggerOpTypes } from "./operators"

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
        return fn() // 函数执行会执行get
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
}

// weakMap key: {name: 'equicy', age: 20} value: map => {name => Set， age => Set}
// Set中存放着当前属性的activeEffect, Set是指可以有多个effect被调用，并且可以防止重复

export function trigger(target, type, key?, newValue?, oldValue?) {
  // 如果这个属性没有收集过effect，那就不需要做任何操作

  const depsMap = targetMap.get(target) 
  if (!depsMap) return

  const effects = new Set()

  const add = effectsToAdd => {
    if (effectsToAdd) {
      effectsToAdd.forEach(effect => {
        effects.add(effect)
      });
    }
  }

  if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      console.log(depsMap, dep, key)
      if(key === 'length' || key > newValue) { // 如果更改的长度小于收集的索引，那么这个索引也需要触发effect重新执行
        add(dep)
      }
    })
  } else {
    // 可能是对象
    if (key !== undefined) { // 这里肯定是修改
      add(depsMap.get(key))
    }

    // 如果修改数组中的某个索引？ arr[100] = 3
    switch(type) { // 如果添加了一个索引，就触发长度的更新
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get('length'))
        }
    }
  }
  effects.forEach((effect: any) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect)
    } else {
      effect()
    }
  })
}