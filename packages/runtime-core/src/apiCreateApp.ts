import { createVNode } from "./vnode"

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,

      mount(container) {


        // 根据组件创建虚拟节点
        // 虚拟节点后调用render渲染
        const vnode = createVNode(rootComponent, rootProps)

        render(vnode, container)

        app._container = container
      }
    }

    return app
  }
}