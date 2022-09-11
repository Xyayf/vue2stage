const isReservedTag=(tag)=>{
    return ['a','div','p','li','button','ul','span'].includes(tag)
}







//_c()创建元素节点
export function createElementVNode(vm,tag,props={},...children) {//prop为attr
    if(props==null){
        props={}
       
    }
    let key =props.key
    if(key){
        delete props.key
    }
    if(isReservedTag(tag)){
        return VNode(vm,tag,key,props,children)
    }else{
        //创建子节点的虚拟的节点my-button 拿到组件构造函数
       
        console.log(vm.$option.components)
        let Constuctor=vm.$option.components[tag]

        //得到的Constructor可能是一Sub类也可能是选项对象
        return createComponentVnode(vm,tag,key,props,children,Constuctor)
    }
}

function createComponentVnode(vm,tag,key,props,children,Constuctor){
        if(typeof Constuctor==='object'){
            Constuctor=vm.$option._base.extend(Constuctor)
        }
        props.hook={
            init(vnode){ //稍后创建真实节点的时候，如果是组件则调用此init方法
             let instance=  vnode.ComponentInstance=new vnode.componentOptions.Constuctor
             
             instance.$mount()
             console.log(instance)
             vnode.el=instance.$el
             
             return vnode.el
            }
        }
        return VNode(vm,tag,key,props,children,null,{Constuctor})
}


function createComponent(vnode){
  
    let init=vnode.props
    if((init=init.hook)&&(init=init.init)){
        init(vnode)//初始化组件
    }
    if(vnode.el){
        return true
    }
    
}
//_v()创建文本节点
export function createTextVNode(vm,text) {
    return VNode(vm,undefined,undefined,undefined,undefined,text)
}

function VNode(vm,tag,key=undefined,props,children=[],text,componentOptions) {
    return {
        vm,
        tag,
        props,
        key,
        text, 
        children,
        componentOptions//组件构造函数
    }
}
function createElement(VNnode) {
    let {tag,props,children,text}=VNnode
    if(typeof tag ==='string'){


        if(createComponent(VNnode)){
            return VNnode.el
        }



      VNnode.el=  document.createElement(tag)
      patchProps(VNnode.el,{},props)
    
      children.forEach(child=>{
         VNnode.el.appendChild(createElement(child)) 
      })
    }else{
        VNnode.el=  document.createTextNode(text)
    }
    return VNnode.el
}

export function patch(oldVNode,VNode) {
    if(!oldVNode){
        let newElm= createElement(VNode)
        return newElm
    }
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
       return (patchVnode(oldVNode,VNode))
    }
    
}
//1.比较父级 父亲不相同直接替换
function isSameVnode(vnode1,vnod2){
    return vnode1.tage===vnod2.tage && vnode1.key===vnod2.key
}


function patchVnode(oldVNode,vnode){
    if(!isSameVnode(oldVNode,vnode)){
        let el =createElment(vnode)
        oldVNode.el.parentNode.replaceChild(el,oldNode.el)
        return el
    }
    //2.两个节点是同一个节点（判断节点的tag和节点的key）比较两个节点的属性是否有差异（复用老的节点，将差异属性改变）；是文本的话复用文本节点

    //文本的情况，文本我们期望比较一下文本的内容
    let el=vnode.el=oldVNode.el //复用老节点的元素
    
        if(!oldVNode.tag){ //是文本
            if(oldVNode.text!==vnode.text){
                el.textContent=vnode.text  //innerHTMl和textContent区别
            }
        
        }
    //标签相同情况比较属性

    patchProps(el,oldVNode.data,vnode.data)

    

    //3.节点比较完毕就比较两个人的儿子
        // 1方有儿子一方没有儿子
        // 两方都有儿子
        let oldChildren=oldVNode.children || []
        let newChildren=vnode.children || []

        if(oldChildren.length>0 && newChildren.length>0){//两方都有儿子
                updateChildren(el,oldChildren,newChildren) ;  //diff算法核心区域
        }else if(oldChildren.length>0){//老的有 新的没有
            unmountChidren(el,oldChildren )
        }else if(newChildren.length>0){//老的没有 新的有
            mountChildren(el,newChildren)
        }

    return el 
   
   
}

function mountChildren(el,newChildren){
    for(let i=0;i<newChildren.length;i++){
        let child=newChildren[i]
        el.appendChildren(creatElement(child))

    }
}
function unmountChidren(el){
    el.innerHTML=""//也可以循环删除子节点这样处理容易出问题
}
function patchProps(el,oldProps={},props={}){
    
   let oldStyle=oldProps.style
   let newStyle=props.style 
   //老的属性中有新的没有删除老的
   for(let key in oldStyle){
       if(!newStyle[key]){
           el.style[key]=""
       }
   }
   for(let key in oldProps){
       if(!props[key]){
           el.removeAttribute(key)
       }
   }
     for(let key in props){
        if(key==='style'){
           
            for(let styleName in props[key]){
                
                
                el.style[styleName]=props.style[styleName]
               
            }
        }else{
            el.setAttribute(key,props[key])
        }
        
    }
   //添加新的所有

}



function updateChildren(el,oldChildren,newChildren){
    // vue2中采用双指针优化

    let oldStartIndex=0
    let oldEndIndex=oldChildren.length-1
    let newStartIndex=0
    let newEndIndex=newChildren.length-1
    
    let oldStartVnode=oldChildren[0]
    let newStarVnode=newChildren[0]

    let oldEndVnode=oldChildren[oldEndIndex]
    let newEndVnode=newChildren[newEndIndex]

    function makeIndexByKey(children){
        let map={}
        children.forEach((child,index)=>{
            map[child.key]=index
        })
        return map
    }
    let map=makeIndexByKey(oldChildren)
    while(oldStartIndex<=oldEndIndex&&newStartIndex<=newEndIndex){ //双方有一个大于尾部指针则停止循环

        if(!oldStartVnode){
            oldStartVnode=oldChildren[++oldStartIndex]
        }else if(!oldEndVnode){
            oldSEndVnode=oldChildren[--oldEndIndex]
        }else if(isSameVnode(oldStartVnode,newStarVnode)){  //以开头children节点开始  如果开头节点相同执行这个逻辑
        patchVnode(oldStartVnode,newStarVnode)  
        oldStartVnode=oldChildren[++oldStartIndex]
        newStarVnode=newChildren[++newStartIndex]

    }else if(isSameVnode(oldEndtVnode,newEndVnode)){  //以结尾children节点开始  如果结尾节点相同执着这个逻辑
        patchVnode(oldEndtVnode,newEndVnode)  
        oldSEndVnode=oldChildren[--oldEndIndex]
        newEndVnode=newChildren[--newEndIndex]

    }else if(isSameVnode(oldEndVnode,newStarVnode)){ //交叉比对 abcd -> dabc
            patchVnode(oldEndtVnode,newEndVnode) 
             el.insertBefore(oldEndVnode.el,oldStartVnode.el)  //将老的的尾巴移到前面去
            oldSEndVnode=oldChildren[--oldEndIndex]
            newStarVnode=newChildren[++newStartIndex]

      }else if(isSameVnode(oldSartVnode,newEndVnode) ){ //交叉比对 abcd -> dcba
          patchVnode(oldEndtVnode,newEndVnode) 
           el.insertBefore(oldStartVnode.el,oldEndVnode.el.nextSibling)//将老头插到尾巴 
            oldStartVnode=oldChildren[++oldStartIndex]
            newEndVnode=newChildren[--newEndIndex]

      } else{
          //乱序比对 
        // 根据老的列表做一个映射关系，用新的去找，找到移动，找不到添加到，多于的删除到循环结束时检查会删掉
            let moveIndex=map[newStareVnode.key]
            if(moveIndex!==undefined){
                let moveVnode=oldChildren[moveIndex]
                el.insertBefore(moveVnode.el,oldStartVnode.el) //找到了移动到开始
                oldChildren[moveIndex]=undefined; //表示这个节点已经移走了
                patchVnode(moveVnode,oldStartVnode) 
            }else{
                    el.insertBefore(createElment(newStareVnode),oldStartVnode.el) //找不到添加
            }

            newStarVnode=newChildren[++newStartIndex]

      }


    
       
      
      
    
      


    }
    if(newStartIndex<=newEndIndex){ //新的多余的插入进去
        for(let i=newStartIndex;i<=newEndIndex;i++){
            let childElm=creatElement(newChildren[i])
           
            let anchor=newChildren[newEndIndex+1]? newChildren[newEndIndex+1].el:null 
            el.insertBefore(childElm,anchor) //anchor 为null时会被认为是appendChild
        }
    }
    if(oldStartIndex<=oldEndIndex){//老的多了删除
        for (let i=oldStarIndex;i<=oldEndIndex;i++){
           if(oldChildren[i]){
                let childElm=oldChildren[i].el
            el.removeChild(childElm)
           }
        }
    }

}
