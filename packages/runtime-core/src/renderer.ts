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
    nextSibling: hostNextSibling,
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
          const prevTree = instance.subTree
          let proxyToUse = instance.proxy
          const nextTree = instance.render.call(proxyToUse, proxyToUse)

          patch(prevTree, nextTree, container)
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

  const mountElement = (vnode, container, anchor = null) => {
    const { props, shapeFlag, type, children } = vnode

    let el = (vnode.el = hostCreateElement(type))

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

    hostInsert(el, container, anchor)
  }

  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {

      for(let key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]
        if (prev !== next) {
          hostPatchProp(el, key, prev, next)
        }
      }

      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
  }

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }


  const patchKeyedChildren = (c1, c2, el) => {

    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    // sync from start 从头开始比，遇到不同的就停止

    while(i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }

    // 从后往前比
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }

    // 如果完成后，最终i的值大于e1，说明老的少

    if (i > e1) { // 老的少 新的多
      if(i <= e2) { // 表示新增的部分

        // 想知道是向前插入 还是向后插入
        const nextPos = e2 + 1

        const anchor = nextPos < c2.length ? c2[nextPos].el : null

        while(i <= e2) {

          patch(null, c2[i], el, anchor)
          i++
        }
      }

    } else if (i > e2) { // 老的多 新的少
      while(i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      // 乱序比较，需要尽可能复用，用新的做一个映射表，去老的里面去找,一样的复用，不一样的插入或者删除

      let s1=i
      let s2= i

      // vue3 用的新的做的映射表，vue2用的老的

      const keyToNewIndexMap = new Map()

      for (let i = s2; i<=e2; i++) {
        const childVNode = c2[i]
        keyToNewIndexMap.set(childVNode.key, i)
      }

      // 去老的里面查找 看看是否有可复用的
      for(let i = s1; i<=e2; i++) {
        const oldVnode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVnode.key)

        if (newIndex === undefined) {
          unmount(oldVnode)
        } else {
          patch(oldVnode, c2[newIndex], el)
        }
      }

      // 最后就是移动节点，并且将新增的节点插入
      // 最长递增子序列
    }

  }
  
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children

    const preShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) { // case1 现在是文本，之前是数组


      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      
      if (c2 !== c1) { // 两个都是文本
        hostSetElementText(el, c2)
      }
    } else {
      // 现在是元素 或者上一次是文本或者数组
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) { // 两个都是数组

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是元素，之前是数组
          // 两个数组的比对， diff算法
          patchKeyedChildren(c1, c2, el)

        } else {
          // 没有孩子
          unmountChildren(c1) // 删除老的
        }
      } else {
        // 上一次是文本
        if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) { // 之前是文本 现在是数组
          hostSetElementText(el, '')
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }

    }
  }

  const patchElement = (n1, n2, container) => {
    let el = (n2.el = n1.el)

    // 更新属性， 更新儿子

    const oldProps = n1.props || {}
    const newProps = n2.props || {}

    patchProps(oldProps, newProps, el)

    patchChildren(n1, n2, el)
  }


  const processElement = (n1,n2,container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container, anchor)
    } else {
      // 元素更新
      patchElement(n1, n2, container)
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }

  const unmount = (n1) => { // 如果是组件，需要调用组件的生命周期
    hostRemove(n1.el)
  }

  const patch = (n1, n2, container, anchor=null) => {
    const { shapeFlag, type } = n2;

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 删除n1,添加n2
      anchor = hostNextSibling(n1.el)
      unmount(n1)
      n1 = null
    }


    switch (type) {
      case Text:
        processText(n1, n2, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2,container, anchor)
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
