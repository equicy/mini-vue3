import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";

export const patchProp = (el, key, preValue, nextValue) => {
  switch (key) {
    case 'class':
      patchClass(el, nextValue)
      break;
    case 'style':
      patchStyle(el, preValue, nextValue)
      break;
    default:
      // 如果不是事件，才是属性

      if(/^on[^a-z]/.test(key)) {
        patchEvent(el, key, nextValue)
      } else {
        patchAttr(el, key, nextValue)
      }

      break;
  }
}