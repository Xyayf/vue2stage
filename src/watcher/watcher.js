import { newArrayProto } from '../array'
import Dep from './dep'
let id=0



class Watcher{

    constructor(vm,fn,option,cb){
        this.vm=vm
        this.id=id++
        this.renderWatcher=option
        if(typeof fn==='string'){
           this.getter=function(){
               return vm[fn]//获取vm属性
           }
        }else{
            this.getter=fn //getter意味着调用这个函数 读取vm的属性
        }
        
        this.deps=[] //记录watch->dep
        this.depsId=new Set()
        this.cb=cb
        this.lazy= option.lazy 
       this.dirty=this.lazy
       this.user=option.user   //标识是否用户自己的watcher
      this.value=  this.lazy?undefined : this.get()
        
    }

    evaluate(){
        
        this.value=this.get()
        this.dirty=true //标示计算属性是脏值
    }
    get(){
       
        pushTarget(this)//1)当我们创建渲染watcher的时候我们会把当前的渲染watcher放到Dep.targer上
       let value= this.getter.call(this.vm) //2）调用_render()会取值模版{{变量}} 
        //vm.$date的值 触发observe 的get() 模版有多少个{{变量}}就会触发多少个
        
        popTarget()
        //使在只在创建节点调用_render取值时 才会存dep 和watcher 
        //dom创建后读取值不会再存储dep watcher
       
        return value
    }
    addDep(dep){   
        let id=dep.id
        if(!this.depsId.has(id)){
            this.deps.push(dep) //watcher->dep 
            this.depsId.add(id)
            dep.addSub(this) // //  dep->watcher
        }
    }
    update(){

        if(this.lazy){
            this.dirty=true
        }else{
            //把当前的watcher暂存起来
        queueWatcher(this) 
        // this.get() //更新渲染
        }
        
    }
    depend(){
        let i =this.deps.length
        console.log(this.deps)
        while(i--){
            
            this.deps[i].depend()
        }
    }
    run(){
        let oldValue=this.value
        let newValue=this.get()
        if(this.user){
            this.cb.call(this.vm,newValue,oldValue)
        }
    }
}

let queue=[]
let has={}
let pending=false
function queueWatcher(watcher) {
    
    const id=watcher.id
   if(!has[id]){
    has[id]=true
    queue.push(watcher)

   }
   //不管我们的update执行多少次，但是最终只执行一次 而且是第一次
   if(!pending){
    nextTick(flushSchedulerQueue) //所以同步任务完成后才会执行
    pending=true
   }

}
function flushSchedulerQueue() {
    let flushQueue= queue.slice(0)//拷贝一份队列 
   
    queue=[]
    has={}
    pending=false
    for (let i=0; i<flushQueue.length ;i++){
        
        flushQueue[i].run()
        
    }
   
    
}



let callbacks=[]
let waiting=false
function flushCallbacks() {
    let cbs=callbacks.slice(0)
    callbacks=[]
    waiting=false
    cbs.forEach(cb=>cb()
    )
    
   
}
//nextTick 根据兼容性写法
let timerFunc
if(Promise){
    timerFunc=()=>{
        Promise.resolve().then(flushCallbacks)
    }
}else {

    timerFunc=()=>{
        setTimeout(flushCallbacks,0)
    }

}
export function nextTick(fn) {
   callbacks.push(fn)
   if(!waiting){
       waiting=true
       timerFunc()
    
   }
}

let stack=[]
export function pushTarget(watcher){
   
    stack.push(watcher)
    Dep.target=watcher
}

export function popTarget(watcher){
    stack.pop()
    Dep.target=stack[stack.length-1]
}

//需要给每个属性增加一个dep，目的就是收集watcher
//一个组件中有多少个属性（n个属性会对应一个视图），n个dep对应一个watcher
//一个属性 对应着多个组件 1个dep对应多个watcher
//多对多的关系
export default Watcher