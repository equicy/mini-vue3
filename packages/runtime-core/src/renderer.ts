import { effect } from "@vue/reactivity";
import { ShapeFlags } from "@vue/shared";
import { createAppAPI } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, Text } from "./vnode";

export function createRenderer(renderOptions) {

  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = renderOptions

  const mountComponent = (initialVnode, container) => {
    // 组件渲染流程，setup拿到返回值， 获取render函数返回结果

    const setupRenderEffect = (instance, container) => {
      // 需要创建一个effect 在effect中调用render方法，这样render方法会收集这个effect，属性更新
      // effect会重新执行

      effect(function componentEffect() { // 每个组件都有一个effect， vue3是组件级更新，数据变化会重新执行对应组件的effect
        if (!instance.isMounted) {

          let proxyToUse = instance.proxy
          let subTree = instance.subTree = instance.render.call(proxyToUse, proxyToUse);

          patch(null, subTree, container)
          instance.isMounted = true
          
        } else {
          console.log('更新了')
          // 更新逻辑
        }
      }, {
        scheduler: queueJob
      })
    }

    // 创建实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode));

    // 需要的数据解析到实例上
    setupComponent(instance)

    // 创建一个effect 让render函数执行
    setupRenderEffect(instance, container)
  };

  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      mountComponent(n2, container);
    } else {
      // 组件更新
    }
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVNode(children[i])

      patch(null, child, container)
    }
  }

  const mountElement = (vnode, container) => {
    const { props, shapeFlag, type, children } = vnode

    let el = (vnode.ele = hostCreateElement(type))

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }

    hostInsert(el, container)
  }


  const processElement = (n1,n2,container) => {
    if (n1 == null) {
      mountElement(n2, container)
    } else {
      // 元素更新
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }

  const patch = (n1, n2, container) => {
    const { shapeFlag, type } = n2;

    switch (type) {
      case Text:
        processText(n1, n2, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2,container)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container);
        }
        break;
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
