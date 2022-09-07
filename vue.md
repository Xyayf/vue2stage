# with的作用
改变标识符的查找优先级，优先从with指定对象的属性中查找
```js
var a=1;
varobj={
    a:2
};

with(obj){
    console.log(a);//2
}

```

```js
var fn=new Function('obj','with(obj){return prop.value;}');
var data={
    prop:{
        value:1
    }
};
fn(data);    //1
```

```js
function evalPropChain(data,propChainStr){
    return new Function('obj','with(obj){return '+propChainStr+';}')(data);
}
var data={
    prop:{
        value:1
    }
};
evalPropChain(data,'prop.value');    //1
```

```js
console.log(1);Promise.resolve().then(()=>console.log(2));console.log(3)
//1,3,2
console.log(1);new Promise((resolve,reject)=>{console.log(2);resolve()}).then(()=>console.log(3));console.log(4)
//1,2,4,3

```