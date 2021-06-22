import { isFunction, isObject, ShapeFlags } from "@vue/shared"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export const createComponentInstance = (vnode) => {

  const instance = {
    vnode,
    type: vnode.type,
    props: {},
    attrs: {},
    slots: {},
    setupState: {},
    ctx: {},
    isMounted: false
  }

  instance.ctx = { _: instance }

  return instance
}

export function setupComponent (instance) {
  const { props, children } = instance.vnode

  instance.props = props
  instance.children = children

  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT

  if (isStateful) {
    // 调用当前实例的setup方法， 用setup的返回值 填充setupState和对应的render方法

    setupStatefulComponent(instance)
  }
}

function setupStatefulComponent(instance) {
  // 代理 传递给render函数的参数

  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

  // 获取组件类型，拿到组件的setup方法

  let Component = instance.type

  let { setup } = Component

  if (setup) {
    let setupContext = createSetupContext(instance)
    const setupResult = setup(instance.props, setupContext)

    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
  let Component = instance.type

  if (!instance.render) {
    // 对template模版编译，产生render函数
    // instance.render = render

    if (!Component.render && Component.template) {

    }

    instance.render = Component.render
  }
  // 对vue2api做了兼容处理
  // applyOptions
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {}
  }
}

// instance 表示组件的各种状态，相关信息
// context 就4个参数，是为了开发使用
// proxy是为了取值方便