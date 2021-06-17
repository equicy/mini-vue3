import { ShapeFlags } from "@vue/shared";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";

export function createRenderer(renderOptions) {
  const mountComponent = (initialVnode, container) => {
    console.log(initialVnode, container);
    // 组件渲染流程，setup拿到返回值， 获取render函数返回结果

    const setupRenderEffect = () => {}

    // 创建实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode));

    // 需要的数据解析到实例上
    setupComponent(instance)

    // 创建一个effect 让render函数执行
    setupRenderEffect()
  };

  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      mountComponent(n2, container);
    } else {
      // 组件更新
    }
  };

  const patch = (n1, n2, container) => {
    const { shapeFlag } = n2;

    console.log(shapeFlag);
    if (shapeFlag & ShapeFlags.ELEMENT) {
      console.log("ele");
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      console.log("com");
      processComponent(n1, n2, container);
    }
  };

  const render = (vnode, container) => {
    // 默认调用render， 可能是初始化流程
    patch(null, vnode, container);
  };

  return {
    createApp: createAppAPI(render),
  };
}
