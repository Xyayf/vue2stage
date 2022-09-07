//_c()创建元素节点
export function createElementVNode(vm,tag,props={},...children) {//prop为attr
    if(props==null){
        props={}
       
    }
    let key =props.key
    if(key){
        delete props.key
    }
    return VNode(vm,tag,key,props,children)
}

//_v()创建文本节点
export function createTextVNode(vm,text) {
    return VNode(vm,undefined,undefined,undefined,undefined,text)
}

function VNode(vm,tag,key=undefined,props,children=[],text) {
    return {
        vm,
        tag,
        props,
        key,
        text, 
        children
    }
}
function createElement(VNnode) {
    let {tag,props,children,text}=VNnode
    if(typeof tag ==='string'){
      VNnode.el=  document.createElement(tag)
      patchProps(VNnode.el,props)
      children.forEach(child=>{
         VNnode.el.appendChild(createElement(child)) 
      })
    }else{
        VNnode.el=  document.createTextNode(text)
    }
    return VNnode.el
}
function patchProps(el,props) {
    for(let key in props){
        if(key==='style'){
            for(let styleName in props[key]){
                el.style[styleName]=props[key][styleName]
            }
        }
        el.setAttribute(key,props[key])
    }
    
}
export function patch(oldVNode,VNode) {
    const isRealElement=oldVNode.nodeType
    if(isRealElement){
        const elm=oldVNode
        const parentElm=elm.parentNode
       let newElm= createElement(VNode)
       parentElm.insertBefore(newElm,elm.nextSibiling)
       parentElm.removeChild(elm)
       return newElm
       
    }else{
        ///diff算法
        //1.两个节点不是同一个节点，直接删除老的换上新的（没有对比）
        // 2.两个节点是同一个节点（判断节点的tag，节点key，节点属性是否有差异）
    }
    
}
function isSameVnode(vnode1,vnode2){
    
}
