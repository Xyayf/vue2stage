``` 解决方案```

1.模版引擎 性能差 需要正则匹配替换 1.0的时候 没有引入虚拟DOM的改变

2.采用虚拟DOM 数据变化后比较虚拟DOM的差异 

3.语法转化我们需要先变成语法树再重新组装代码成为新的语法
    
 vue 核心流程 
    
1）创造了响应式数据 
2）模版转化成ast语法树  
3）将ast语法树转换成render函数  
4）后续每次数据更新可以只执行render函数 无需要在此执行ast转化的过程
render函数会去产生虚拟节点（使用响应式
update函数根据生成的虚拟节点创造真实的DOM

实现diff算法
平级比较过程

在之前的更新中是每次产生新的虚拟节点，通过新的虚拟节点生成真实节点，生成后替换老的节点

如果用户自己操作dom，可能会有性能问题
```js
let render1= compileToFunction('<li>{{name}}</li>')
let vm1 =new Vue({data:{name:'zf'}})
let preVnode=render.call(vm1)

let el= createElment(preVnode)
document.body.appendChild(el)


let render1= compileToFunction('<span>{{name}}</span>')
let vm2=new Vue ({data:{name:'zf'}})
let nextVnode=render2.call(vm2);

let newElm=createElment(nextVnode)  //普通算法要写这一步，diff算法不写这一步

//普通方法
el.parentNode.replaceChild(newElm,el)
//diff算法
patchVnode(preVnode,nextVnode)


```

现在第一次渲染时我们产生虚拟节点，第二次更新我们会调用render方法产生新的虚拟节点，对比需要更新的内容更新部分
```js
//1.比较父级 父亲不相同直接替换
function isSameVnode(vnode1,vnod2){
    return vnode1.tage===vnode2.tage && vnode1.key===vnode2.key
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

    return el

    //3.节点比较完毕就比较两个人的儿子
        // 1方有儿子一方没有儿子
        // 两方都有儿子
        let oldChildren=oldVNode.children || []
        let newChildren=vnode.children || []

        if(oldChildren.length>0 && newChildren.length>0){//两方都有儿子
                updateChildren(el，oldChildren，newChildren) ;  //diff算法核心区域
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
function patchProps(el,oldProps,props){
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
                el.style[styleName]=props[key][styleName]
            }
        }
        el.setAttribute(key,props[key])
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
        }else if(isSameVnode(oldStartVnode,newStartVnode)){  //以开头children节点开始  如果开头节点相同执行这个逻辑
        patchVnode(oldStartVnode,newStartVnode)  
        oldStartVnode=oldChildren[++oldStartIndex]
        newStartVnode=newChildren[++newStartIndex]

    }else if(isSameVnode(oldEndtVnode,newEndVnode)){  //以结尾children节点开始  如果结尾节点相同执着这个逻辑
        patchVnode(oldEndtVnode,newEndVnode)  
        oldSEndVnode=oldChildren[--oldEndIndex]
        newEndVnode=newChildren[--newEndIndex]

    }else if(isSameVnode(oldEndVnode,newStartVnode)){ //交叉比对 abcd -> dabc
            patchVnode(oldEndtVnode,newEndVnode) 
             el.insertBefore(oldEndVnode.el,oldStartVnode.el)  //将老的的尾巴移到前面去
            oldSEndVnode=oldChildren[--oldEndIndex]
            newStartVnode=newChildren[++newStartIndex]

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

            newStartVnode=newChildren[++newStartIndex]

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
        for (let i=oldStarIndex;i<=oldEndIndex,i++){
           if(oldChildren[i]){
                let childElm=oldChildren[i].el
            el.removeChild(childElm)
           }
        }
    }

}

```
[动态列表不使用索引](./img/动态列表key值问题.png)