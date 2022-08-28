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
    Vue.options={}
    Vue.mixin=function(mixin) {
        this.options=mergeOption(this.options,mixin)
        return this
    }
}