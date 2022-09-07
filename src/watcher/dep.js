let id=0
class Dep{//dep手机watcher
    constructor(){
        this.id=id++
        this.subs=[]//这里存放当前属性对于的watcher有哪些
    }
    depend(){
        //这里我们不希望放重复的watcher。而且刚才只有一个单向的关系 dep-> watcher
        // watcher 记录 dep
        // this.subs.push(Dep.target)
       
        Dep.target.addDep(this)
        
    }
    addSub(watcher){
        this.subs.push(watcher)
       
       
    }
    notify(){
       
        this.subs.forEach(watcher=>{
            
            watcher.update()
        })
    }
}
Dep.target=null



export default Dep