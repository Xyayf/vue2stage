
//rollup默认可以导出一个对象 作为打包的配置文件
export default {
    input:'./src/index.js',//入口
    output:{
        file:'./dist/vue.js',
        name:'Vue',//globel.Vue
        format:'umd',//esm es6模块 commonj模块 cjs，umd兼容cjs adm iife
        sourcemap:true,//希望可以在浏览器调试源代码
    },
    plugins:[
        // babel({
        //     exclude:'node_modules/**'//排除node_modules下所有文件
        // }) 
    ]
}