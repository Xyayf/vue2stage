 
 let oldArrayProto=Array.prototype

 export let newArrayProto=Object.create(oldArrayProto)
let methods=[
    "push",
    "pop",
    "shift",
    "unshift",
    "reverse",
    "sort",
    "splice"
]

methods.forEach(methods=>{
    newArrayProto[methods]=function(...args){
      const result=  oldArrayProto[methods].call(this,...args)
      // 对新增的对象劫持
      let inserted
       switch (methods){
           case "push":
            case "unshift":
                inserted=args;
                break;
            case "splice":
                inserted=args[2]
                break
            default:
                break;
       }
       if(inserted){
           //对新增的内容再次进行观测
           this.__ob__.observeArray(inserted)
       }
       this.__ob__.dep.notify()
       
      return result
    }
})

