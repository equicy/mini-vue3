import { hasChanged, isArray, isObject } from "@vue/shared/src"
import { track, trigger } from "./effect"
import { TrackOpTypes, TriggerOpTypes } from "./operators"
import { reactive } from "./reactive"

export function ref(value) {
  return createRef(value)
}

export function shallowRef(value) {
  return createRef(value, true)
}

// ref reactive的区别 reactive内部采用proxy，ref采用defineProperty
const convert = val => isObject(val) ? reactive(val): val

class RefImpl {
  public _value
  public __v_isRef = true // 产生的实例会被添加__v_isRef表示是一个ref属性
  constructor(public rawValue, public shallow){ // 参数前面添加修饰符，默认添加到实例属性上
    this._value = shallow ? rawValue : convert(rawValue)
  }

  // 相当与defineProperty get set
  get value() {
    track(this, TrackOpTypes.GET, 'value')
    return this._value
  }

  set value(newValue) {
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue
      this._value = this.shallow ? newValue : convert(newValue)
      trigger(this, TriggerOpTypes.SET, 'value', newValue)
    }
  }
}

function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow)
}

class ObjectRefImpl {
  public _value
  public __v_isRef = true
  constructor(public target, public key) {

  }

  get value() {
    return this.target[this.key] // 如果原对象是响应式的 那么就会触发依赖收集
  }

  set value(newValue) {
    this.target[this.key] = newValue // 如果原对象是响应式的 那么就会触发更新
  }
}

export function toRef(target, key) { // 可以把一个对象的值转化成ref类型
  return new ObjectRefImpl(target, key)
}

export function toRefs(object) { // array or object

  const ret = isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    ret[key] = toRef(object, key)
  }
  return ret
}