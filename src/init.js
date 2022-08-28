
import { initState } from "./initState"

import { compileToFunction } from "./compile/index"
import { mountComponent } from "./initLifeCycle"
import {mergeOption} from './globalAPI'
export function initMixin(Vue){//就是给Vue增加init方法
    Vue.prototype._init=function(options){//用于初始化操作
        const vm=this
       vm.$option=mergeOption(this.constructor.options,options)
       //beforeCreate
       callHook(vm,'beforeCreate')
       //初始化状态

       initState(vm)
       
       callHook(vm,'created')
       
       

       //实现数据的挂载
       if(options.el){//options没有写el选项时需要手动调用vm.$mount()
           vm.$mount(options.el)
       }
       
    }
    Vue.prototype.$mount=function(el){//编译模版生成虚拟节点再变成真实节点挂载
        //el template render
   
        const vm=this
       el=  document.querySelector(el)
       let opt=vm.$option
       if(!opt.render){//先进行查找有没有render函数
        
        let template
           if(!opt.template&&el){
            template=el.outerHTML
            
           }else{
             template=opt.template
           }
           
           if(template){
            //这里需要对模版进行编译
               const render =compileToFunction(template) //jsx 最终会被编译成h("xxx")
               opt.render=render;//jsx最终会被编译成h（"XXX"）
           }
       }
       mountComponent(vm,el) //组件的挂载
    }
}

function callHook(vm,hook){
    
    const hookes=vm.$option[hook]
    
    if(hookes){
        hookes.forEach(hoo=>hoo.call(vm))
    }
}
