import { createRenderer } from "@vue/runtime-core";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

// 渲染时所有的方法
const renderOptions = extend({ patchProp }, nodeOps)

// 用户调用的是runtime-dom => runtime-core

// runtime-core 提供核心方法，用来处理渲染
export function createApp(rootComponent, rootProps = null) {
  const app: any = createRenderer(renderOptions).createApp(rootComponent, rootProps)

  let { mount } = app
  app.mount = function(container) {
    // 清空容器
    container = nodeOps.querySelector(container);
    container.innerHTML = ''
    mount(container)
  }

  return app
}

export {
  renderOptions
}