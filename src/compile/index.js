import {parseHTML} from './parseHTML'
export function compileToFunction(template){

    // 1.将template转化成ast语法树
   
        let ast=parseHTML(template) 
        
    // 2.生产render方法（render方法返回结果就是虚拟DOM
    let code=codegen(ast)
    console.log(code)
    code=`with(this){return ${code}}`
    let render=new Function(code) //根据代码生成render函数
   return render
   
    
}

function genProps(attrs) {
    console.log(attrs)
    let str=''
    for(let i=0;i<attrs.length;i++){
        let attr=attrs[i]
       
        if(attr.name==='style'){
            let obj={}
            attr.value.split(';').forEach(item=>{
                let [key,value]=item.split(":")
                obj[key]=value
            })
            attr.value=obj
        }
        str+=`${attr.name}:${JSON.stringify(attr.value)},`
        
    }

    return `{${str.slice(0,-1)}}`
    
}
function genChildren(ast) {
    const children=ast.children
    if(children){
        return children.map(child=>gen(child)).join(",")
    }

}
const defauleTagRE=/\{\{((?:.|\r?\n)+?)\}\}/g
function gen(node) {
    if(node.type===1){
        return codegen(node)
    }else{
        let text=node.text
        if(!defauleTagRE.test(text)){
            return `_v(${JSON.stringify(text)})`
        }else {
            let token =[]
            let match
            defauleTagRE.lastIndex=0
            let lastIndex=0
            while(match=defauleTagRE.exec(text)){
               
                let index=match.index
               
                if(lastIndex<index){
                    
                    token.push(JSON.stringify(text.slice(lastIndex,index)))
                }
                token.push(`_s(${match[1].trim()})`)
                lastIndex=index+match[0].length 
            }
            if(lastIndex<text.length){
                token.push(text.slice(lastIndex))
            }
            return`_v(${token.join('+')})`
        }
    }
    
}
function codegen(ast) {
    let children=genChildren(ast)
    let code=`_c('${ast.tag}',${ast.attrs.length>0?genProps(ast.attrs):'null'}
    ,${ast.children.length>0? children:''})`
    return code
}



