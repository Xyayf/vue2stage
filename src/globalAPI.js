const LIFECYCLE=[
    'beforeCreate',
    'created'
]
const strats={}

LIFECYCLE.forEach(hook=>{
    strats[hook]=function (p,c) {
       if(c){
           if(p){
               return p.concat(c)
           }else{
               return [c]
           }
       } else{
           return p
       }
    }
})
strats.components=function(p,c={}){
    const res = Object.create(p)
    console.log(p,c)
    
    if(c){
        for(let key in c){
            res[key]=c[key] //复制儿子的所有 把父亲放在原型上
        }
    }
   
    return res
}
export function mergeOption(parent,child) {
    const options={}

    for(let key in parent){
        mergeField(key)
    }
    for (let key in child){
        if(!parent.hasOwnProperty(key)){
            mergeField(key)
        }
    }
    function mergeField(key) {
        
        if(strats[key]){
           options[key]= strats[key](parent[key],child[key])
        }else{
            
            options[key]=child[key] || parent[key]
        }
    }
   
    return options
}




export function initGolbalAPI(Vue){
    //静态方法
    Vue.options={
        _base:Vue
    }
    Vue.mixin=function(mixin) {
        this.options=mergeOption(this.options,mixin)
        return this
    }
    Vue.extend=function(options){//根据用户的参数 返回一个构造函数
        function Sub(options={}){
            this._init(options)
        }
    
     
        Sub.prototype=Object.create(Vue.prototype) //Sub.prototype===Vue.prototype
        Sub.prototype.constructor=Sub
        Sub.options=mergeOption(Vue.options,options) 
    //    Sub.__proto__=Vue
    //    Sub.options=options 这个可以继承Vue的静态但是当我们使用this.constructior只是拿到Sub.options=options来进行合并，继承的和自身的不在同一原型链上
        
        return Sub
    
    }
    Vue.options.components={}//维护全局组件
    Vue.component=function(id,definition){
    
        //如果definition已经是一个函数了说明用户自己调用了Vue.extend
        definition=typeof definition==="function"?definition:Vue.extend(definition)
        
        Vue.options.components[id]=definition
        
        
    }
    
}