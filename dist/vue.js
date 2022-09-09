(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    let oldArrayProto=Array.prototype;

     let newArrayProto=Object.create(oldArrayProto);
    let methods=[
        "push",
        "pop",
        "shift",
        "unshift",
        "reverse",
        "sort",
        "splice"
    ];

    methods.forEach(methods=>{
        newArrayProto[methods]=function(...args){
          const result=  oldArrayProto[methods].call(this,...args);
          // 对新增的对象劫持
          let inserted;
           switch (methods){
               case "push":
                case "unshift":
                    inserted=args;
                    break;
                case "splice":
                    inserted=args[2];
                    break
           }
           if(inserted){
               //对新增的内容再次进行观测
               this.__ob__.observeArray(inserted);
           }
           this.__ob__.dep.notify();
           
          return result
        };
    });

    let id$1=0;
    class Dep{//dep手机watcher
        constructor(){
            this.id=id$1++;
            this.subs=[];//这里存放当前属性对于的watcher有哪些
        }
        depend(){
            //这里我们不希望放重复的watcher。而且刚才只有一个单向的关系 dep-> watcher
            // watcher 记录 dep
            // this.subs.push(Dep.target)
           
            Dep.target.addDep(this);
            
        }
        addSub(watcher){
            this.subs.push(watcher);
           
           
        }
        notify(){
           
            this.subs.forEach(watcher=>{
                
                watcher.update();
            });
        }
    }
    Dep.target=null;

    let id=0;



    class Watcher{

        constructor(vm,fn,option,cb){
            this.vm=vm;
            this.id=id++;
            this.renderWatcher=option;
            if(typeof fn==='string'){
               this.getter=function(){
                   return vm[fn]//获取vm属性
               };
            }else {
                this.getter=fn; //getter意味着调用这个函数 读取vm的属性
            }
            
            this.deps=[]; //记录watch->dep
            this.depsId=new Set();
            this.cb=cb;
            this.lazy= option.lazy; 
           this.dirty=this.lazy;
           this.user=option.user;   //标识是否用户自己的watcher watched
          this.value=  this.lazy?undefined : this.get();
            
        }

        evaluate(){
            
            this.value=this.get();
            this.dirty=true; //标示计算属性是脏值
        }
        get(){
           
            pushTarget(this);//1)当我们创建渲染watcher的时候我们会把当前的渲染watcher放到Dep.targer上
           let value= this.getter.call(this.vm); //2）调用_render()会取值模版{{变量}} 
            //vm.$date的值 触发observe 的get() 模版有多少个{{变量}}就会触发多少个
            
            popTarget();
            //使在只在创建节点调用_render取值时 才会存dep 和watcher 
            //dom创建后读取值不会再存储dep watcher
           
            return value
        }
        addDep(dep){   
            let id=dep.id;
            if(!this.depsId.has(id)){
                this.deps.push(dep); //watcher->dep 
                this.depsId.add(id);
             
                dep.addSub(this); // //  dep->watcher
               
                
            }
        }
        update(){

            if(this.lazy){
                this.dirty=true;  //计算watcher不存入队列
            }else {
                //把当前的watcher暂存起来
            queueWatcher(this); 
            // this.get() //更新渲染
            }
            
        }
        depend(){
            let i =this.deps.length;
           
            while(i--){
                
                this.deps[i].depend();
            }
        }
        run(){
            let oldValue=this.value;
            let newValue=this.get();
            if(this.user){
                this.cb.call(this.vm,newValue,oldValue);
            }
        }
    }

    let queue=[];
    let has={};
    let pending=false;
    function queueWatcher(watcher) {
        console.log(watcher);
        const id=watcher.id;
       if(!has[id]){
        has[id]=true;
        queue.push(watcher);

       }
       //不管我们的update执行多少次，但是最终只执行一次 而且是第一次
       if(!pending){
        nextTick(flushSchedulerQueue); //所以同步任务完成后才会执行
        pending=true;
       }

    }
    function flushSchedulerQueue() {
        let flushQueue= queue.slice(0);//拷贝一份队列 
       
        queue=[];
        has={};
        pending=false;
        for (let i=0; i<flushQueue.length ;i++){
            
            flushQueue[i].run();
            
        }
       
        
    }



    let callbacks=[];
    let waiting=false;
    function flushCallbacks() {
        let cbs=callbacks.slice(0);
        callbacks=[];
        waiting=false;
        cbs.forEach(cb=>cb()
        );
        
       
    }
    //nextTick 根据兼容性写法
    let timerFunc;
    if(Promise){
        timerFunc=()=>{
            Promise.resolve().then(flushCallbacks);
        };
    }else {

        timerFunc=()=>{
            setTimeout(flushCallbacks,0);
        };

    }
    function nextTick(fn) {
       callbacks.push(fn);
       if(!waiting){
           waiting=true;
           timerFunc();
        
       }
    }

    let stack=[];
    function pushTarget(watcher){
       
        stack.push(watcher);
        Dep.target=watcher;
    }

    function popTarget(watcher){
        stack.pop();
        Dep.target=stack[stack.length-1];
    }

    function initState(vm){
        const opts=vm.$option;
        if(opts.date){
            initDate(vm);
        }
        if(opts.computed){
            initComputed(vm);
        }
        if(opts.watch){
            initWatch(vm);
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
                vm[target][key]=val;
            }
        });

    }



    /**-----------------------------------initDate------------------------------------------------ */
    class Observer{
        constructor(date){
            this.dep=new Dep();//给每个对象 包括数组对象增加一个dep
            Object.defineProperty(date,"__ob__",{
                value:this,
                enumerable:false //将__ob__变成不可枚举
            });
            //object.defineProperty 只能劫持已经存在的属性（vue里面会为此单独写一些api $set $delete)
            if(Array.isArray(date)){
                //劫持数组
                date.__proto__=newArrayProto; //改写原型
                
                this.observeArray(date);//拦截数组中的对象，包括数组对象。其他数据不拦截没有响应式 vm.a[0]=1不会触发set
            }else {
                this.walk(date);//劫持对象
            }
        }
        walk(date){
            Object.keys(date).forEach(key=>{
                defineReactive(date,key);
            });
        }
        observeArray(date){
            
            date.forEach(item=>{
                observe(item);
            });
        }
    }
    function defineReactive(target,key){
        
        let oldValue=target[key];
      let observer=  observe(oldValue); //拦截属性为对象的
      
        let dep=new Dep(); //每一个属性都有一个dep
        Object.defineProperty(target,key,{
            get(){
                if(Dep.target){
                    
                    dep.depend(); //让这个属性的收集器记住当前watcher
                    if(observer){// 给每个对象 包括数组对象记住当前的watcher
                        observer.dep.depend(); 
                    if(Array.isArray(oldValue)){
                        //给数组对象中嵌套的数组对象记住当前的watcher
                         //arr:[1,2,3,{a:1},["a","b",[1,2]]]]
                        dependArray(oldValue); 
                    }
                    }
                }
                console.log("获取get："+oldValue);
                return oldValue
            },
            set(newValue){
                if(newValue==oldValue) return
                oldValue=newValue;
                observe(oldValue); //拦截修改后的对象
                dep.notify(); //通知更新
                console.log("set"+oldValue);
            }
        });

    }
    function dependArray(value){//深层次嵌套会递归，递归多了性能差
        for(let i=0;i<value.length;i++){
            let current=value[i];
            if(Array.isArray(current)){
                current.__ob__.dep.depend();
                dependArray(current);
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
        let date=vm.$option.date;
        date =typeof date==="function"?date.call(vm):date;
        //对数据进行劫持   vue2里采用一个API defineProperty
        
         vm._date=date;
         //vm._date 代理vm
         for(let key in date){
             proxy(vm,"_date",key);
         }
        observe(date); //对数据对象进行劫持

    }


     
    /**-------------------------------------initComputed---------------------------------------------- */
     function initComputed(vm){
            const computed=vm.$option.computed;
            for(let key in computed){
                let userDef=computed[key];
                const watcher=vm._computedWatchers={}; //将计算属性watcher保存到vm上
               
                const setter=userDef.set || (()=>{});
                


                const getter =typeof userDef ==='function'? userDef :userDef.gets;
              watcher[key]=  new Watcher(vm,getter.bind(vm),{lazy:true});
            
                defineComputed(vm,key,getter,setter);
            }


     }
     function defineComputed(vm,key,getter,setter){
         Object.defineProperty(vm,key,{
             get:createComputedGetter(key),
             set:setter
         });
     }
     function createComputedGetter(key){
        
            return function(){
              const watcher=  this._computedWatchers[key];
              if(watcher.dirty){
                  watcher.evaluate(); //弹出了计算watcher 
              }
              
              if(Dep.target){
                    watcher.depend(); //watcher 在get时会把依赖的dep放在watcher实例的this.deps上 把渲染watcher放入队列中
              }
              return watcher.value
            }
     }


     /**--------------------------------------initWathch------------------------------------------------ */
    function initWatch(vm){
        let watch=vm.$option.watch;
        
        for(let key in watch){
            const handler=watch[key];  //handler数据类型可能为 string array function
            if(Array.isArray(handler)){
                for (let i=0;i<handler.length;i++){
                    createWatcher(vm,key,handler[i]);
                }
            }else {
                createWatcher(vm,key,handler);
            }
        }
    }
    function createWatcher(vm,key,handler){//handler的数据类型可能是 string,function.object
        if(typeof handler ==='string'){
            handler=vm[handler];
        }
        return vm.$watch(key,handler)
        // vm.$watch()
        
    }

    const ncname= `[a-zA-Z_][\-\.0-9_a-zA-Z]*`;
    const startTagOpen=new RegExp(`^<((?:${ncname}\:)?${ncname})`);//匹配的分组为一个标签吗 <div
    const startTagClose=/^\s*(\/?)>/; //  结束标志/>
    const attribute=/^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>]+)))?/; 
    //第一个分组就是属性的key 而value就是分组3/4/5
    const endTag=new RegExp(`^<\/<?((?:${ncname}\:)?${ncname})[^>]*>`); //</div>

    //语法树结构
    //{
    // tag:'div',
    // type:1,
    // attrs:[{name,value}],
    // parent:null,
    // children:[
    //     {
    //          tag:'div',
    //          type:1,
    //          attrs:[{name,value}],
    //          parent:null,
    //          children:[
    //                 {
    //                      }
    //              ]
    //     }
    //  ]
    //}





    //将template转化为ast语法树
    function parseHTML(template){

        const ELEMENT_TYPE=1;
        const TEXT_TYPE=3;
        const stack=[];//栈用于存放元素
        let currentParent; // 指向栈中的最后一个
        let root; //根结点

        function createASTElement(tag,attrs) {
            return {
                tag,
                attrs,
                type:ELEMENT_TYPE,
                children:[],
                parent:null

            }
            
        }
        function start(tagName,atrrs){
            
            let node=createASTElement(tagName,atrrs);
            if(!root){
                root=node;
            }
            stack.push(node);
          
            
            if(currentParent){
                node.parent=currentParent;
                currentParent.children.push(node);
            }
            currentParent=node; //currentParent指向栈中最后一个
            

        }
        function ended(tagName){
        stack.pop(); 
         currentParent=stack[stack.length-1];
       


        }
        function charse(text){
            text=text.replace(/\s/g,""); //去掉文本中空格
           text&& currentParent.children.push({
                type:TEXT_TYPE,
                text
            });
        }
        function advance(len){
            template=template.substring(len);
        }
        function parStartTage(){
            //开始标签 名称
           const start= template.match(startTagOpen);
           if(start){
               
               const match={
                   tagName:start[1],
                   attrs:[]
               };
               advance(start[0].length);
            //如果不是开始标签结束，就一直匹配atrrs
           let atrrs,end;
           while(!(end=template.match(startTagClose))&& (atrrs=template.match(attribute))){
               match.attrs.push({
                   name:atrrs[1],
                   value:atrrs[3]||atrrs[4]||attrs[5]
               });
                advance(atrrs[0].length);
           }
           if(end){
               advance(end[0].length);
           }
           return match
           }
          return false
        }
        while(template){
            //如果textEnd为0说明是一个开始标签或者结束标签 <div  </div
            // textEnd > 0 说明就是文本的结束位置 hhhhh<
           let textEnd=template.indexOf('<');
           if(textEnd==0){
             const startTahMatch=  parStartTage();
             
             if(startTahMatch){
                 start(startTahMatch.tagName,startTahMatch.attrs);
                
                 continue // 当是开始标签
             }

             //当是结束标签时跳过循环
             let endTagMatch=template.match(endTag);
             
             if(endTagMatch){
                 ended(endTagMatch[0]);
                 advance(endTagMatch[0].length);
                 continue
             }
           }
           if(textEnd>0){
               let text =template.substring(0,textEnd);//文本内容
               if(text){
                charse(text);
                advance(text.length);
               }
           }
        }
        return root
        
    }

    function compileToFunction(template){

        // 1.将template转化成ast语法树
       
            let ast=parseHTML(template); 
            
        // 2.生产render方法（render方法返回结果就是虚拟DOM
        let code=codegen(ast);
        console.log(code);
        code=`with(this){return ${code}}`;
        let render=new Function(code); //根据代码生成render函数
       return render
       
        
    }

    function genProps(attrs) {
        console.log(attrs);
        let str='';
        for(let i=0;i<attrs.length;i++){
            let attr=attrs[i];
           
            if(attr.name==='style'){
                let obj={};
                attr.value.split(';').forEach(item=>{
                    let [key,value]=item.split(":");
                    obj[key]=value;
                });
                attr.value=obj;
            }
            str+=`${attr.name}:${JSON.stringify(attr.value)},`;
            
        }

        return `{${str.slice(0,-1)}}`
        
    }
    function genChildren(ast) {
        const children=ast.children;
        if(children){
            return children.map(child=>gen(child)).join(",")
        }

    }
    const defauleTagRE=/\{\{((?:.|\r?\n)+?)\}\}/g;
    function gen(node) {
        if(node.type===1){
            return codegen(node)
        }else {
            let text=node.text;
            if(!defauleTagRE.test(text)){
                return `_v(${JSON.stringify(text)})`
            }else {
                let token =[];
                let match;
                defauleTagRE.lastIndex=0;
                let lastIndex=0;
                while(match=defauleTagRE.exec(text)){
                   
                    let index=match.index;
                   
                    if(lastIndex<index){
                        
                        token.push(JSON.stringify(text.slice(lastIndex,index)));
                    }
                    token.push(`_s(${match[1].trim()})`);
                    lastIndex=index+match[0].length; 
                }
                if(lastIndex<text.length){
                    token.push(text.slice(lastIndex));
                }
                return `_v(${token.join('+')})`
            }
        }
        
    }
    function codegen(ast) {
        let children=genChildren(ast);
        let code=`_c('${ast.tag}',${ast.attrs.length>0?genProps(ast.attrs):'null'}
    ,${ast.children.length>0? children:''})`;
        return code
    }

    //_c()创建元素节点
    function createElementVNode(vm,tag,props={},...children) {//prop为attr
        if(props==null){
            props={};
           
        }
        let key =props.key;
        if(key){
            delete props.key;
        }
        return VNode(vm,tag,key,props,children)
    }

    //_v()创建文本节点
    function createTextVNode(vm,text) {
        return VNode(vm,undefined,undefined,undefined,undefined,text)
    }

    function VNode(vm,tag,key=undefined,props,children=[],text) {
        return {
            vm,
            tag,
            props,
            key,
            text, 
            children
        }
    }
    function createElement(VNnode) {
        let {tag,props,children,text}=VNnode;
        if(typeof tag ==='string'){
          VNnode.el=  document.createElement(tag);
          patchProps(VNnode.el,{},props);
         
          children.forEach(child=>{
             VNnode.el.appendChild(createElement(child)); 
          });
        }else {
            VNnode.el=  document.createTextNode(text);
        }
        return VNnode.el
    }

    function patch(oldVNode,VNode) {
        const isRealElement=oldVNode.nodeType;
        if(isRealElement){
            const elm=oldVNode;
            const parentElm=elm.parentNode;
           let newElm= createElement(VNode);
           
           parentElm.insertBefore(newElm,elm.nextSibiling);
           parentElm.removeChild(elm);
           return newElm
           
        }else {
            ///diff算法
            //1.两个节点不是同一个节点，直接删除老的换上新的（没有对比）
            // 2.两个节点是同一个节点（判断节点的tag，节点key，节点属性是否有差异）
           return (patchVnode(oldVNode,VNode))
        }
        
    }
    //1.比较父级 父亲不相同直接替换
    function isSameVnode(vnode1,vnod2){
        return vnode1.tage===vnod2.tage && vnode1.key===vnod2.key
    }


    function patchVnode(oldVNode,vnode){
        if(!isSameVnode(oldVNode,vnode)){
            let el =createElment(vnode);
            oldVNode.el.parentNode.replaceChild(el,oldNode.el);
            return el
        }
        //2.两个节点是同一个节点（判断节点的tag和节点的key）比较两个节点的属性是否有差异（复用老的节点，将差异属性改变）；是文本的话复用文本节点

        //文本的情况，文本我们期望比较一下文本的内容
        let el=vnode.el=oldVNode.el; //复用老节点的元素
        
            if(!oldVNode.tag){ //是文本
                if(oldVNode.text!==vnode.text){
                    el.textContent=vnode.text;  //innerHTMl和textContent区别
                }
            
            }
        //标签相同情况比较属性

        patchProps(el,oldVNode.data,vnode.data);

        

        //3.节点比较完毕就比较两个人的儿子
            // 1方有儿子一方没有儿子
            // 两方都有儿子
            let oldChildren=oldVNode.children || [];
            let newChildren=vnode.children || [];

            if(oldChildren.length>0 && newChildren.length>0){//两方都有儿子
                    updateChildren(el,oldChildren,newChildren) ;  //diff算法核心区域
            }else if(oldChildren.length>0){//老的有 新的没有
                unmountChidren(el);
            }else if(newChildren.length>0){//老的没有 新的有
                mountChildren(el,newChildren);
            }

        return el 
       
       
    }

    function mountChildren(el,newChildren){
        for(let i=0;i<newChildren.length;i++){
            let child=newChildren[i];
            el.appendChildren(creatElement(child));

        }
    }
    function unmountChidren(el){
        el.innerHTML="";//也可以循环删除子节点这样处理容易出问题
    }
    function patchProps(el,oldProps={},props={}){
        
       let oldStyle=oldProps.style;
       let newStyle=props.style; 
       //老的属性中有新的没有删除老的
       for(let key in oldStyle){
           if(!newStyle[key]){
               el.style[key]="";
           }
       }
       for(let key in oldProps){
           if(!props[key]){
               el.removeAttribute(key);
           }
       }
         for(let key in props){
            if(key==='style'){
               
                for(let styleName in props[key]){
                    
                    
                    el.style[styleName]=props.style[styleName];
                   
                }
            }else {
                el.setAttribute(key,props[key]);
            }
            
        }
       //添加新的所有

    }



    function updateChildren(el,oldChildren,newChildren){
        // vue2中采用双指针优化

        let oldStartIndex=0;
        let oldEndIndex=oldChildren.length-1;
        let newStartIndex=0;
        let newEndIndex=newChildren.length-1;
        
        let oldStartVnode=oldChildren[0];
        let newStarVnode=newChildren[0];

        let oldEndVnode=oldChildren[oldEndIndex];
        let newEndVnode=newChildren[newEndIndex];

        function makeIndexByKey(children){
            let map={};
            children.forEach((child,index)=>{
                map[child.key]=index;
            });
            return map
        }
        let map=makeIndexByKey(oldChildren);
        while(oldStartIndex<=oldEndIndex&&newStartIndex<=newEndIndex){ //双方有一个大于尾部指针则停止循环

            if(!oldStartVnode){
                oldStartVnode=oldChildren[++oldStartIndex];
            }else if(!oldEndVnode){
                oldSEndVnode=oldChildren[--oldEndIndex];
            }else if(isSameVnode(oldStartVnode,newStarVnode)){  //以开头children节点开始  如果开头节点相同执行这个逻辑
            patchVnode(oldStartVnode,newStarVnode);  
            oldStartVnode=oldChildren[++oldStartIndex];
            newStarVnode=newChildren[++newStartIndex];

        }else if(isSameVnode(oldEndtVnode,newEndVnode)){  //以结尾children节点开始  如果结尾节点相同执着这个逻辑
            patchVnode(oldEndtVnode,newEndVnode);  
            oldSEndVnode=oldChildren[--oldEndIndex];
            newEndVnode=newChildren[--newEndIndex];

        }else if(isSameVnode(oldEndVnode,newStarVnode)){ //交叉比对 abcd -> dabc
                patchVnode(oldEndtVnode,newEndVnode); 
                 el.insertBefore(oldEndVnode.el,oldStartVnode.el);  //将老的的尾巴移到前面去
                oldSEndVnode=oldChildren[--oldEndIndex];
                newStarVnode=newChildren[++newStartIndex];

          }else if(isSameVnode(oldSartVnode,newEndVnode) ){ //交叉比对 abcd -> dcba
              patchVnode(oldEndtVnode,newEndVnode); 
               el.insertBefore(oldStartVnode.el,oldEndVnode.el.nextSibling);//将老头插到尾巴 
                oldStartVnode=oldChildren[++oldStartIndex];
                newEndVnode=newChildren[--newEndIndex];

          } else {
              //乱序比对 
            // 根据老的列表做一个映射关系，用新的去找，找到移动，找不到添加到，多于的删除到循环结束时检查会删掉
                let moveIndex=map[newStareVnode.key];
                if(moveIndex!==undefined){
                    let moveVnode=oldChildren[moveIndex];
                    el.insertBefore(moveVnode.el,oldStartVnode.el); //找到了移动到开始
                    oldChildren[moveIndex]=undefined; //表示这个节点已经移走了
                    patchVnode(moveVnode,oldStartVnode); 
                }else {
                        el.insertBefore(createElment(newStareVnode),oldStartVnode.el); //找不到添加
                }

                newStarVnode=newChildren[++newStartIndex];

          }


        
           
          
          
        
          


        }
        if(newStartIndex<=newEndIndex){ //新的多余的插入进去
            for(let i=newStartIndex;i<=newEndIndex;i++){
                let childElm=creatElement(newChildren[i]);
               
                let anchor=newChildren[newEndIndex+1]? newChildren[newEndIndex+1].el:null; 
                el.insertBefore(childElm,anchor); //anchor 为null时会被认为是appendChild
            }
        }
        if(oldStartIndex<=oldEndIndex){//老的多了删除
            for (let i=oldStarIndex;i<=oldEndIndex;i++){
               if(oldChildren[i]){
                    let childElm=oldChildren[i].el;
                el.removeChild(childElm);
               }
            }
        }

    }

    // function anonymous(
    function initLifeCycle(Vue){

        Vue.prototype._update=function(VNode){//产生真实dom
            const vm=this;
            const el=vm.$el;
            
            //patch()既有初始化的功能，又有更新的逻辑
          
          const preVnode=vm._vnode;
          if(preVnode){
             
              vm.$el=  patch(preVnode,VNode);
          }else {
              vm.$el=  patch(el,VNode);
          }
          vm._vnode=VNode;
          
        };
        Vue.prototype._render=function(){//产生虚拟dom
            const vm=this;
           
            return vm.$option.render.call(vm)//让with中的this指向vm
        };
        //创建节点
        Vue.prototype._c=function () {
           return createElementVNode(this,...arguments)
        };

        //创建文本节点
        Vue.prototype._v=function () {
            
            return createTextVNode(this,...arguments)
        };
        Vue.prototype._s=function (value) {
            if(typeof value!=='object') return value
            return JSON.stringify(value)
        };
    }

    function mountComponent(vm,el){
        vm.$el=el;
        //调用render方法产生虚拟节点 虚拟dom
        const updateComponent=()=>{
            vm._update(vm._render());
        };
        
        //根据虚拟dom 转为真实dom
       new Watcher(vm,updateComponent,{});
    }

    const LIFECYCLE=[
        'beforeCreate',
        'created'
    ];
    const strats={};

    LIFECYCLE.forEach(hook=>{
        strats[hook]=function (p,c) {
           if(c){
               if(p){
                   return p.concat(c)
               }else {
                   return [c]
               }
           } else {
               return p
           }
        };
    });
    function mergeOption(parent,child) {
        const options={};

        for(let key in parent){
            mergeField(key);
        }
        for (let key in child){
            if(!parent.hasOwnProperty(key)){
                mergeField(key);
            }
        }
        function mergeField(key) {
            
            if(strats[key]){
               options[key]= strats[key](parent[key],child[key]);
            }else {
                options[key]=child[key] || parent[key];
            }
        }
        return options
    }




    function initGolbalAPI(Vue){
        //静态方法
        Vue.options={};
        Vue.mixin=function(mixin) {
            this.options=mergeOption(this.options,mixin);
            return this
        };
    }

    function initMixin(Vue){//就是给Vue增加init方法
        Vue.prototype._init=function(options){//用于初始化操作
            const vm=this;
           vm.$option=mergeOption(this.constructor.options,options);
           //beforeCreate
           callHook(vm,'beforeCreate');
           //初始化状态

           initState(vm);
           
           callHook(vm,'created');
           
           

           //实现数据的挂载
           if(options.el){//options没有写el选项时需要手动调用vm.$mount() 在vm.$el挂载上生成的真实dom
               vm.$mount(options.el);
           }
           
        };
        Vue.prototype.$mount=function(el){//编译模版生成虚拟节点再变成真实节点挂载
            //el template render
       
            const vm=this;
           el=  document.querySelector(el);
           let opt=vm.$option;
           if(!opt.render){//先进行查找有没有render函数
            
            let template;
               if(!opt.template&&el){
                template=el.outerHTML;
                
               }else {
                 template=opt.template;
               }
               
               if(template){
                //这里需要对模版进行编译
                   const render =compileToFunction(template); //jsx 最终会被编译成h("xxx")
                   opt.render=render;//jsx最终会被编译成h（"XXX"）
               }
           }
           mountComponent(vm,el); //组件的挂载
        };
    }

    function callHook(vm,hook){
        
        const hookes=vm.$option[hook];
        
        if(hookes){
            hookes.forEach(hoo=>hoo.call(vm));
        }
    }

    function Vue(options){
    //option就是用户的选项
    this._init(options);
    }

    Vue.prototype.$nextTick=nextTick; //nextTick 维护的是一个同步队列异步调用

    initMixin(Vue);
    initLifeCycle(Vue);
    initGolbalAPI(Vue);

    Vue.prototype.$watch=function(expOrFn,callback,options={}){

        new Watcher(this,expOrFn,{user:true},callback);

        return function(){

        }
    };

    return Vue;

}));
//# sourceMappingURL=vue.js.map
