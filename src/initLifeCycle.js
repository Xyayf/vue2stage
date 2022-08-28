// function anonymous(
//     ) {
//     with(this){return _c('div',{id:"hhhh"}
//         ,_v("fdfaf"+_s(name)+"fdfgsaf"+_s(age)),_c('span',null
//         ,_c('span',null
//         ,_v("ffff"))),_c('span',null
//         ,_v("fesaf")))}cfde
//     }
// _c('div',{},children)
import {createElementVNode,createTextVNode,patch} from './vdom/index'
import Watcher from './watcher/watcher'
export  function initLifeCycle(Vue){

    Vue.prototype._update=function(VNode){//产生真实dom
        const vm=this
        const el=vm.$el
        //patch()既有初始化的功能，又有更新的逻辑
      vm.$el=  patch(el,VNode)
    }
    Vue.prototype._render=function(){//产生虚拟dom
        const vm=this
        console.log(vm.$option.render.toString())
        return vm.$option.render.call(vm)//让with中的this指向vm
    }
    //创建节点
    Vue.prototype._c=function () {
       return createElementVNode(this,...arguments)
    }

    //创建文本节点
    Vue.prototype._v=function () {
        
        return createTextVNode(this,...arguments)
    }
    Vue.prototype._s=function (value) {
        if(typeof value!=='object') return value
        return JSON.stringify(value)
    }
}

export function mountComponent(vm,el){
    vm.$el=el
    //调用render方法产生虚拟节点 虚拟dom
    const updateComponent=()=>{
        vm._update(vm._render())
    }
    
    //根据虚拟dom 转为真实dom
   new Watcher(vm,updateComponent,{})
}
