import {newArrayProto} from './array'
import Watcher from './watcher/watcher';
import Dep from './watcher/dep';
export function initState(vm){
    const opts=vm.$option
    if(opts.date){
        initDate(vm);
    }
    if(opts.computed){
        initComputed(vm)
    }
    if(opts.watch){
        initWatch(vm)
    }
    }

/**-----------------------------------属性代理------------------------------------------------ */
function proxy(vm,target,key){

    Object.defineProperty(vm,key,{
        get(){
            return vm[target][key]
        },
        set(val){
            if(vm[target][key]==val) return
            vm[target][key]=val
        }
    })

}



/**-----------------------------------initDate------------------------------------------------ */
class Observer{
    constructor(date){
        this.dep=new Dep()//给每个对象 包括数组对象增加一个dep
        Object.defineProperty(date,"__ob__",{
            value:this,
            enumerable:false //将__ob__变成不可枚举
        })
        //object.defineProperty 只能劫持已经存在的属性（vue里面会为此单独写一些api $set $delete)
        if(Array.isArray(date)){
            //劫持数组
            date.__proto__=newArrayProto //改写原型
            
            this.observeArray(date)//拦截数组中的对象，包括数组对象。其他数据不拦截没有响应式 vm.a[0]=1不会触发set
        }else{
            this.walk(date)//劫持对象
        }
    }
    walk(date){
        Object.keys(date).forEach(key=>{
            defineReactive(date,key)
        })
    }
    observeArray(date){
        
        date.forEach(item=>{
            observe(item)
        })
    }
}
function defineReactive(target,key){
    
    let oldValue=target[key]
  let observer=  observe(oldValue) //拦截属性为对象的
  
    let dep=new Dep() //每一个属性都有一个dep
    Object.defineProperty(target,key,{
        get(){
            if(Dep.target){
                
                dep.depend() //让这个属性的收集器记住当前watcher
                if(observer){// 给每个对象 包括数组对象记住当前的watcher
                    observer.dep.depend() 
                if(Array.isArray(oldValue)){
                    //给数组对象中嵌套的数组对象记住当前的watcher
                     //arr:[1,2,3,{a:1},["a","b",[1,2]]]]
                    dependArray(oldValue) 
                }
                }
            }
            console.log("获取get："+oldValue)
            return oldValue
        },
        set(newValue){
            if(newValue==oldValue) return
            oldValue=newValue
            observe(oldValue) //拦截修改后的对象
            dep.notify() //通知更新
            console.log("set"+oldValue)
        }
    })

}
function dependArray(value){//深层次嵌套会递归，递归多了性能差
    for(let i=0;i<value.length;i++){
        let current=value[i]
        if(Array.isArray(current)){
            current.__ob__.dep.depend()
            dependArray(current)
        }
    }
}
function observe(date){
        //对这个对象进行劫持
        if (date==null||typeof date!=='object' ) return

        //如果一个对象被劫持过了，那么就不需要再被劫持（要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过
     return   new Observer(date)
}
function initDate(vm){
    let date=vm.$option.date
    date =typeof date==="function"?date.call(vm):date
    //对数据进行劫持   vue2里采用一个API defineProperty
    
     vm._date=date
     //vm._date 代理vm
     for(let key in date){
         proxy(vm,"_date",key)
     }
    observe(date) //对数据对象进行劫持

}


 
/**-------------------------------------initComputed---------------------------------------------- */
 function initComputed(vm){
        const computed=vm.$option.computed
        for(let key in computed){
            let userDef=computed[key]
            const watcher=vm._computedWatchers={} //将计算属性watcher保存到vm上
           
            const setter=userDef.set || (()=>{})
            


            const getter =typeof userDef ==='function'? userDef :userDef.gets
          watcher[key]=  new Watcher(vm,getter.bind(vm),{lazy:true})
        
            defineComputed(vm,key,getter,setter)
        }


 }
 function defineComputed(vm,key,getter,setter){
     Object.defineProperty(vm,key,{
         get:createComputedGetter(key),
         set:setter
     })
 }
 function createComputedGetter(key){
    
        return function(){
          const watcher=  this._computedWatchers[key]
          if(watcher.dirty){
              watcher.evaluate() //弹出了计算watcher 
          }
          
          if(Dep.target){
                watcher.depend() //watcher 在get时会把依赖的dep放在watcher实例的this.deps上 把渲染watcher放入队列中
          }
          return watcher.value
        }
 }


 /**--------------------------------------initWathch------------------------------------------------ */
function initWatch(vm){
    let watch=vm.$option.watch
    
    for(let key in watch){
        const handler=watch[key]  //handler数据类型可能为 string array function
        if(Array.isArray(handler)){
            for (let i=0;i<handler.length;i++){
                createWatcher(vm,key,handler[i])
            }
        }else{
            createWatcher(vm,key,handler)
        }
    }
}
function createWatcher(vm,key,handler){//handler的数据类型可能是 string,function.object
    if(typeof handler ==='string'){
        handler=vm[handler]
    }
    return vm.$watch(key,handler)
    // vm.$watch()
    
}