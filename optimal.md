# 优化
1.使用vue的时候如果data层级过深（考虑优化），如果数据不是响应式的就不要放入data中了，我们属性取值的时候尽量避免多次取值。如果有些对象是放在data中的但是不是响应式的考虑采用Object.freeze()来冻结对象

2.vue2中检测数据的变化并没有采用defineProperty因为修改的索引的情况不多（如果直接使用defineProperty会浪费大量性能）。而是采用重写数组的变异方法来实现。arr[1]="fdfa"是无效的。

3.依赖收集，被观察者指代数据data，观测者watcher（渲染watcher，计算属性，用户watcher（用户用的监听器）） 在调用this.get()是给被观察者添加watcher

4.beforCreate没有实现下响应式数据，create时已经初始化响应式数据了
initLifecycle(vm)初始化$parent $children
initEvents(vm)初始化$on $off $emit
intiRender(vm) 声明一些变量
callhook(vm,'beforcreate')
initInjections(vm) 初始化inject方法
initState(vm)
initProvide(vm)
callhooke(vm,'created')

5.请求是异步任务 等同步代码执行以后才会做所以不纠结是放在created还是mounted上