import { extend, isObject } from "@vue/shared/src"
import { track } from "./effect"
import { TrackOpTypes } from "./operators"
import { reactive, readonly } from "./reactive"


const get = createGetter()
const shallowGet = createGetter(false, true)
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

const set = createSetter()
const shallowSet = createSetter(true)

export const mutableHandlers = {
  get,
  set
}
export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet
}

let readonlyObj = {
  set: (target, key) => {
    console.warn(`set on key ${key} failed`)
  }
}
export const readonlyHandlers = extend(
  {
    get: readonlyGet
  },
  readonlyObj
) 
export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet
  },
  readonlyObj
) 

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)

    if (!isReadonly) {
      // 收集依赖，等数据变化后更新对应的视图

      track(target, TrackOpTypes.GET, key)
    }

    if (shallow) {
      return res
    }


    if (isObject(res)){
      // vue2是一上来就递归，vue3是当取值的时候会进行代理，vue3是懒代理
      return isReadonly ? readonly(res) : reactive(res)
    }

    return res
  }
}

function createSetter(isShallow= false) {
  return function set(target, key, value, receiver) {
    // target[key] = value 可能会失败，但是不会返回异常，但是Reflect.set会返回是否设置成功

    const result = Reflect.set(target, key, value, receiver) // target[key] = value

    // 当数据更改时，effect重新执行
    return result
  }
}