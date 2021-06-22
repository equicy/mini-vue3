import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";


export function isVnode(vnode) {
  return vnode.__v_isVnode
}

export const createVNode = (type, props, children = null) => {
  // 通过type区分组件or普通元素

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;

  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    el: null, // 对应虚拟节点和真实节点
    key: props && props.key, // diff算法会用到,
    component: null,
    shapeFlag,
  };

  normalizeChildren(vnode, children)

  return vnode;
};

function normalizeChildren(vnode, children) {
  let type = 0
  if (children == null) {
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else {
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.shapeFlag = vnode.shapeFlag | type
}

export const Text = Symbol('Text')

export function normalizeVNode(child) {
  if (isObject(child)) return child

  return createVNode(Text, null, String(child))
}