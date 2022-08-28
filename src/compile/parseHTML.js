const ncname= `[a-zA-Z_][\-\.0-9_a-zA-Z]*`
const startTagOpen=new RegExp(`^<((?:${ncname}\:)?${ncname})`)//匹配的分组为一个标签吗 <div
const startTagClose=/^\s*(\/?)>/ //  结束标志/>
const attribute=/^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>]+)))?/ 
//第一个分组就是属性的key 而value就是分组3/4/5
const endTag=new RegExp(`^<\/<?((?:${ncname}\:)?${ncname})[^>]*>`) //</div>

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
export function parseHTML(template){

    const ELEMENT_TYPE=1
    const TEXT_TYPE=3
    const stack=[]//栈用于存放元素
    let currentParent // 指向栈中的最后一个
    let root //根结点

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
        
        let node=createASTElement(tagName,atrrs)
        if(!root){
            root=node
        }
        stack.push(node)
      
        
        if(currentParent){
            node.parent=currentParent
            currentParent.children.push(node)
        }
        currentParent=node //currentParent指向栈中最后一个
        

    }
    function ended(tagName){
    let children= stack.pop() 
     currentParent=stack[stack.length-1]
   


    }
    function charse(text){
        text=text.replace(/\s/g,"") //去掉文本中空格
       text&& currentParent.children.push({
            type:TEXT_TYPE,
            text
        })
    }
    function advance(len){
        template=template.substring(len)
    }
    function parStartTage(){
        //开始标签 名称
       const start= template.match(startTagOpen)
       if(start){
           
           const match={
               tagName:start[1],
               attrs:[]
           }
           advance(start[0].length)
        //如果不是开始标签结束，就一直匹配atrrs
       let atrrs,end
       while(!(end=template.match(startTagClose))&& (atrrs=template.match(attribute))){
           match.attrs.push({
               name:atrrs[1],
               value:atrrs[3]||atrrs[4]||attrs[5]
           })
            advance(atrrs[0].length)
       }
       if(end){
           advance(end[0].length)
       }
       return match
       }
      return false
    }
    while(template){
        //如果textEnd为0说明是一个开始标签或者结束标签 <div  </div
        // textEnd > 0 说明就是文本的结束位置 hhhhh<
       let textEnd=template.indexOf('<')
       if(textEnd==0){
         const startTahMatch=  parStartTage()
         
         if(startTahMatch){
             start(startTahMatch.tagName,startTahMatch.attrs)
            
             continue // 当是开始标签
         }

         //当是结束标签时跳过循环
         let endTagMatch=template.match(endTag)
         
         if(endTagMatch){
             ended(endTagMatch[0])
             advance(endTagMatch[0].length)
             continue
         }
       }
       if(textEnd>0){
           let text =template.substring(0,textEnd)//文本内容
           if(text){
            charse(text)
            advance(text.length)
           }
       }
    }
    return root
    
}