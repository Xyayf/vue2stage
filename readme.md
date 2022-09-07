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

let newElm=createElment(nextVnode)
el.parentNode.replaceChild(newElm,el)


```

现在第一次渲染时我们产生虚拟节点，第二次更新我们会调用render方法产生新的虚拟节点，对比需要更新的内容更新部分
```js
//1.比较父级 父亲不相同直接替换
function isSameVnode(vnode1,vnod2){
    return vnode1.tage===vnode2.tage && vnode1.key===vnode2.key
}


function patchVnode(oldVNode,vnode){
    if(isSameVnode(oldVNode,vnode)){
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



function updateChildren(el,oldChilred,newChilred){
    // vue2中采用双指针优化
    
}
```