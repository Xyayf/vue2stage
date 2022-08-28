import Watcher, { nextTick } from './watcher/watcher'
import {initMixin} from './init'
import {initLifeCycle} from './initLifeCycle'
import {initGolbalAPI} from './globalAPI'
function Vue(options){
//option就是用户的选项
this._init(options)
}

Vue.prototype.$nextTick=nextTick //nextTick 维护的是一个同步队列异步调用

initMixin(Vue)
initLifeCycle(Vue)
initGolbalAPI(Vue)

Vue.prototype.$watch=function(expOrFn,callback,options={}){

    new Watcher(this,expOrFn,{user:true},callback)

    return function(){

    }
}



export default Vue