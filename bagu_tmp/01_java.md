### 七、Java 基础与并发/JVM/异常高频补全（承接第五章 J1~J10）

#### 多线程与并发

##### T1. 创建线程有哪几种方式？Runnable 和 Callable 的区别？

【面试回答】本质只有一种：new Thread().start()。写法上有四种口径：继承 Thread、实现 Runnable、实现 Callable 配合 FutureTask、线程池提交。Runnable 的 run() 无返回值不能抛受检异常；Callable 的 call() 有返回值、可抛异常，通过 Future.get() 拿结果——get() 会阻塞直到任务完成，也可用超时版本避免死等。工程里优先线程池 + Callable，不手工 new Thread：线程创建有内核开销，池化才能复用与限流。

【一句话背诵】写法四种、本质一种；Callable = 有返回值 + 可抛异常的 Runnable，用 Future 收结果。

##### T2. 线程的六种状态及流转？

【面试回答】NEW（创建未 start）、RUNNABLE（就绪+运行，Java 不区分这两者）、BLOCKED（等待 synchronized 监视器锁）、WAITING（无限等待：Object.wait、Thread.join、LockSupport.park）、TIMED_WAITING（限时等待：sleep、带超时的 wait/join）、TERMINATED。RUNNABLE 调 wait/park/join 进 WAITING，被 notify/超时/锁竞争失败分别回到 RUNNABLE 或 BLOCKED。面试延伸：BLOCKED 是"抢锁"，WAITING 是"协作等待"，两者在 jstack 里区分排查很关键。

【一句话背诵】NEW/RUNNABLE/BLOCKED/WAITING/TIMED_WAITING/TERMINATED；抢锁进 BLOCKED，协作等待进 WAITING。

##### T3. 线程池 7 个核心参数与执行流程？

【面试回答】核心数 corePoolSize、最大数 maximumPoolSize、存活时间 keepAliveTime + 单位、工作队列 workQueue、线程工厂 threadFactory、拒绝策略 handler。提交流程：核心线程未满→建核心线程；满了→入队列；队列满→建非核心线程到 max；再满→拒绝。四种内置拒绝：Abort（默认抛异常）、CallerRuns（调用者线程自己跑，天然降速反压）、Discard（丢任务）、DiscardOldest（丢队头）。生产必须自定义线程池（Executors 快捷方法要么无界队列 OOM，要么线程数无上限），命名线程便于排查。

【一句话背诵】核心→队列→非核心→拒绝；无界队列让 max 失效，所以禁用 Executors 默认池。

##### T4. synchronized 的底层原理与锁升级？

【面试回答】同步块编译为 monitorenter/monitorexit，同步方法靠 ACC_SYNCHRONIZED 标志，底层都是对象关联的 monitor（HotSpot 里是 ObjectMonitor，基于系统互斥量）。锁升级（偏向→轻量级→重量级）：新对象先偏向最后一个获取线程（无竞争 CAS 改线程 ID 即可）；出现两线程交替竞争升级为轻量级锁（栈里复制 Mark Word 做锁记录，CAS 自旋）；自旋超过阈值或竞争激烈膨胀为重量级锁，未抢到线程进 EntryList 阻塞。JDK 15 起偏向锁默认关闭、后续版本移除，面试按"现在主要是轻量→重量"表述更稳。

【一句话背诵】monitor + Mark Word；无竞争偏向、CAS 自旋轻量、阻塞重量，偏向锁已退役。

##### T5. synchronized 和 ReentrantLock 怎么选？

【面试回答】两者都可重入、都保证互斥。差异在功能面：ReentrantLock 支持 tryLock 超时（防死锁）、可中断加锁、多个 Condition 队列（精确唤醒，ArrayBlockingQueue 的 notEmpty/notFull 就是它）、公平锁；synchronized 由 JVM 管理、异常自动释放、无需手动 unlock，且 JDK 6 锁优化后低争用性能接近。选型：简单同步用 synchronized（不易写错），需要超时/轮询/多条件/公平性用 ReentrantLock，用 ReentrantLock 必须 finally 里 unlock。

【一句话背诵】synchronized 省心，ReentrantLock 省力更多功能：tryLock、多 Condition、公平锁。

##### T6. volatile 的两层语义？为什么不保证原子性？

【面试回答】一是可见性：写 volatile 变量立即刷主存并让其他 CPU 缓存行失效（MESI 协议 invalidate），读时强制从主存取，杜绝工作内存旧值。二是禁止指令重排：编译器插内存屏障（写前 StoreStore、写后 StoreLoad 等），happens-before 链成立。它不保证原子性：i++ 是读-改-写三步，两个线程同时读到旧值各自加一再写回，仍然丢失。适用场景是"一写多读的状态标志"（如我项目里 WriterWorker 的 running 标志位）和双重检查锁的单例实例引用。复合原子性要靠 synchronized 或 Atomic 类的 CAS。

【一句话背诵】volatile = 可见 + 有序，不原子；适合状态标志和 DCL 单例，计数交给 Atomic。

##### T7. CAS 是什么？ABA 问题怎么解决？

【面试回答】CAS 是比较并交换：传入内存位置、预期旧值、新值，只有当前值等于预期才写入，是 CPU 原子指令（x86 cmpxchg）实现的无锁乐观并发，Atomic 类和 AQS 状态修改都靠它。缺点三个：一是自旋消耗 CPU（高争用下不如直接阻塞）；二是只能保证单变量原子；三是 ABA——值从 A 改到 B 又改回 A，CAS 感知不到中间变化。解法：带版本号的原子引用 AtomicStampedReference（把 version 和值一起比较），链表的 ABA 用 AtomicMarkableReference。无锁队列里 ABA 靠节点回收时机规避（危险在于把已释放节点重新分配回原位置）。

【一句话背诵】CAS = 期望值相符才换，无锁乐观；ABA 用版本号 AtomicStampedReference 破。

##### T8. AQS 的原理？

【面试回答】AQS 是 JUC 锁与同步器的框架基座：一个 volatile int state 表示资源状态（ReentrantLock 里是重入次数，Semaphore 里是许可数，CountDownLatch 里是计数），一个 CLH 变体的双向等待队列存放抢锁失败的线程节点。核心模板：acquire 先调子类 tryAcquire（CAS 改 state），失败则入队 park 挂起，前驱释放时 unpark 唤醒再抢。独占模式实现 tryAcquire/tryRelease（ReentrantLock），共享模式 tryAcquireShared/tryReleaseShared（Semaphore/CountDownLatch），Condition 队列则在 signal 时把节点转移到 AQS 主队列。子类只需重写 tryXxx，排队、挂起、唤醒全由框架完成。

【一句话背诵】state + CLH 队列 + park/unpark，模板方法留 tryAcquire 给子类。

##### T9. ThreadLocal 原理与内存泄漏？

【面试回答】每个 Thread 内部持有 ThreadLocalMap，key 是 ThreadLocal 对象的弱引用，value 是值本身（强引用）。get/set 都以当前线程的 map 为存储，天然线程隔离。泄漏点在 value：ThreadLocal 外部强引用消失后 key 被 GC 回收成 null，但 value 仍被 Entry→map→thread 链引用着；线程池线程不死，这些脏 value 会长期堆积。虽然 set/get 时会顺带清理 expungeStaleEntry，但不能指望。规范做法：用完必须 remove()（try-finally），这也是"线程池场景 ThreadLocal 必须 remove"的原因。

【一句话背诵】数据存在线程自己的 map 里；key 弱引用 value 强引用，不 remove 就是池化下的泄漏。

##### T10. 怎么优雅地停止一个线程？

【面试回答】stop() 已废弃——它在任意点强行释放锁，数据处于半修改状态。协作式停止两种：一是 volatile boolean 标志位，线程在循环里自查（我项目 WriterWorker 就是这么做的：running 置 false，工作线程把队列剩余批写完再退出，配合"生产者结束后消费者仍消费到队列空"的收尾条件，保证不丢数据）；二是 interrupt()：把中断标志置位，线程若在阻塞（wait/sleep/阻塞队列 take）会抛 InterruptedException，catch 后恢复标志并退出。两者可叠加：正常运行查标志，阻塞依赖 interrupt 唤醒。

【一句话背诵】标志位管循环自查，interrupt 管唤醒阻塞，收尾要"排干队列再退出"。

##### T11. wait/notify 为什么要配合循环判断条件？

【面试回答】因为存在虚假唤醒（spurious wakeup，OS 层面允许 wait 无通知返回）和条件失效（多线程抢通知：两个线程都在等 notEmpty，notifyAll 后一起醒，先醒的把元素取走，后醒的条件已不成立）。所以规范写法是 while(!condition) wait() 而不是 if——醒来重新检查条件，不成立就继续等。另外 wait 必须在 synchronized 块内调用（它要先释放当前 monitor、挂到对应 waitSet），notify 只唤醒一个且被唤醒线程还要重新抢 monitor，不保证立即执行。标准生产者-消费者就用 while + 两个 Condition，或直接 BlockingQueue（内部已实现这套逻辑）。

【一句话背诵】wait 醒来可能"被骗"或条件已被抢走，必须 while 复查；BlockingQueue 已内置。

##### T12. 线程池提交 execute 和 submit 的区别？任务抛异常会怎样？

【面试回答】execute 提交 Runnable，无返回，任务抛出的异常没人接就沿线程默认 handler 走（打印到 stderr，线程销毁并由池补充新线程，任务本身"无声失败"）。submit 返回 Future，异常被捕获进 FutureTask 的 outcome，只有调 get() 时才以 ExecutionException 重新抛出——如果不检查 Future，异常等于被吞。实践：任务体内部自行 try-catch 记录日志，或重写 afterThrowing/设置线程池的 ThreadFactory 命名便于告警定位；核心批处理管线（如写库线程）必须显式捕获异常并保留失败批次数据，否则整批静默丢失。

【一句话背诵】execute 异常炸到线程默认 handler，submit 异常锁进 Future——不 get 就没人知道。

##### T13. CompletableFuture 常用编排方式？

【面试回答】相比 Future 的阻塞 get，CompletableFuture 支持回调式编排：thenApply（转换结果）、thenCompose（串联下一个异步任务，扁平化嵌套）、thenCombine（两个都完成后合并）、allOf / anyOf（批量汇聚/取先）、exceptionally/handle（异常分支兜底）。默认异步方法用 ForkJoinPool.commonPool()，IO 密集任务应传入自定义线程池避免拖垮公共池。典型用法：并行调多个下游再 allOf 汇总，把 N 倍串行延迟压成一次最慢调用。它本质是状态机 + 回调栈，完成时触发依赖链。

【一句话背诵】thenApply 转换、thenCompose 串联、thenCombine/allOf 聚合、exceptionally 兜底，别用默认池跑 IO。

##### T14. Java 异常体系与最佳实践？

【面试回答】Throwable 下分 Error（JVM 级，如 OOM/StackOverflow，应用不捕获）和 Exception；Exception 里编译期强制处理的叫受检异常（IOException 等，try-catch 或 throws），运行时异常（RuntimeException 子类：NPE、数组越界、ClassCastException）不强制。实践：能预检查的不抛异常（如判空），但并发下 check-then-act 有窗口仍需捕获；异常不做流程控制（栈展开成本高）；catch 必须处理或转译带 cause 重抛，禁止空 catch；资源用 try-with-resources（编译为 finally 调 close，且 suppress 次生异常）；对外接口统一异常转译成错误码/JSON（我在后端用 @RestControllerAdvice 全局兜底，把 JWT 过期转成标准 401）。

【一句话背诵】Error 不接、受检必处理、空 catch 禁止、close 交给 try-with-resources、出口统一转译。

#### JVM（续 J6~J8）

##### J11. 类加载过程与双亲委派模型？

【面试回答】加载→验证→准备（静态变量分配内存给零值，final 常量在准备阶段直接赋常数）→解析（符号引用转直接引用）→初始化（执行 <clinit>，静态变量赋值和静态块）。加载器分层：启动（C 实现，rt/java.base）→平台/JDK9 前的扩展→应用（classpath）→自定义。双亲委派：收到加载请求先委托父层，父层没有才自己加载。意义是安全与唯一性——防止用户自定义 java.lang.String 替换核心类，且同一类在 JVM 中由「加载器+类名」共同确定身份。打破场景：SPI（JDBC Driver 由启动层接口调用应用层实现，用线程上下文类加载器）、Tomcat 每应用独立加载器隔离依赖、JDK9 模块化后的定制。

【一句话背诵】五步初始化最后执行；先问爹、爹不行自己来，防核心类被篡改，SPI/Tomcat 反着来。

##### J12. new 一个对象在内存里经历什么？对象内存布局？

【面试回答】JVM 先做类加载检查，再分配内存（指针碰撞：堆规整时移动指针；空闲列表：有碎片时记账），并发用 CAS+重试或本地线程缓冲 TLAB 保证分配原子；然后零值初始化、设置对象头、执行 <init>。布局三部分：Mark Word（哈希、GC 年龄、锁标志位——synchronized 锁升级就改这里）、类型指针 Klass Pointer、实例数据；对齐填充到 8 字节。逃逸分析充分的热点代码里对象可能不进堆：标量替换拆成寄存器局部变量、栈上分配随栈帧消失，这是"JIT 下 new 不一定产生堆对象"的由来。

【一句话背诵】检查-分配-零值-设头-init；Mark Word+Klass+数据+对齐；不逃逸的對象可能被拆到栈上。

##### J13. 新生代为什么分 Eden 和两个 Survivor？

【面试回答】基于弱分代假说：绝大多数对象朝生夕灭。新生代采用复制算法：对象先分配在 Eden，minor GC 时存活对象复制到一个空的 Survivor（S0/S1 互换角色），年龄 +1，达到阈值（默认 15，与 GC 日志年龄位有关）晋升老年代，避免长期存活对象每次 GC 被反复复制。设计依据是 IBM 研究：复制到存活区只需 1:8 比例，Eden:S0:S1 默认 8:1:1 空间利用率 90%。Survivor 装不下时提前晋升（担保机制）。这也是"新生代 GC 快、老年代 GC 慢"的原因——复制只搬运存活对象，成本与存活数成正比而非堆大小。

【一句话背诵】Eden 出生、Survivor 挨打攒年龄、攒够去老年代；复制算法成本只看活人数量。

##### J14. CMS 与 G1 的核心区别？为什么 G1 能预测停顿？

【面试回答】CMS 标记-清除老年代收集器：并发标记（初始标记 STW→并发标记→重新标记短 STW→并发清除），目标是低停顿，缺点是浮动垃圾（并发期新垃圾下轮收）、内存碎片（清除不整理，碎片多退化为串行预分配失败 Full GC）、吃 CPU。G1 把堆划分成大小相等的 Region，逻辑分代不物理隔离，每个 Region 独立记 GC 年龄，通过 Remembered Set（卡表）跟踪跨 Region 引用，GC 时优先回收垃圾最多的 Region（Garbage First 名字来源）。它维护停顿预测模型（历史回收速度），在给定 -XX:MaxGCPauseMillis 目标下挑选"回收价值最高且能在预算内完成"的 Region 集合，所以能预测停顿；Young GC、混合 GC、Full GC 三档，整体标记-整理+复制，不产碎片。JDK9 起 G1 是默认收集器；超大堆低延迟场景用 ZGC（着色指针+读屏障，停顿 <10ms 与堆大小无关）。

【一句话背诵】CMS 并发清除但浮动垃圾+碎片；G1 Region+停顿预算挑肥拣瘦，默认选它；ZGC 堆再大也不卡。

##### J15. 线上 CPU 飙高 / OOM 怎么排查？

【面试回答】CPU 高：top 找进程 → top -Hp 找线程 → printf '%x' 转十六进制 → jstack 抓栈定位方法；区分是业务死循环（自己代码栈）、GC 线程占用（jstat -gcutil 看 Old 区回收是否徒劳）还是 JIT。内存 OOM：jmap -histo 或 -dump 导出堆（生产建议 -XX:+HeapDumpOnOutOfMemoryError 自动落盘），MAT 看支配树找大对象与 GC Roots 引用链；配合 jstat 看老年代增长斜率判断泄漏形态。常见结论三型：缓存无上限增长、ThreadLocal/监听器未清理（对应线程池泄漏）、大结果集一次加载（我在亿级表项目里用 LIMIT 强制行数上限 + 估算行数代替 COUNT，就是防这一类）。答题强调"先监控定位，再 dump 取证，最后最小复现验证修复"。

【一句话背诵】CPU 走 top→jstack，内存走 dump→MAT；结论归三型：缓存、没清理、一次读太多。

#### 集合补全（续）

##### C1. fail-fast 与 fail-safe 是什么？

【面试回答】fail-fast：迭代期间结构性修改（add/remove 改变 modCount）触发 ConcurrentModificationException，HashMap/ArrayList 迭代器即如此——它是尽力检测而非并发保护，单线程 foreach 里删元素同样抛，规范做法用迭代器 remove 或 removeIf。fail-safe：遍历副本或弱一致视图，不抛 CME 但可能读到旧数据，如 CopyOnWriteArrayList（写时复制整个数组，读零锁，适合读多写极少的监听器列表）、ConcurrentHashMap（迭代器容忍并发修改）。面试点：CopyOnWrite 的写放大和瞬时不一致（写后立刻读可能读到旧快照），高并发计数场景不适用。

【一句话背诵】fail-fast 见改动就抛 CME，fail-safe 拿快照/弱一致；foreach 删元素用迭代器或 removeIf。

##### C2. 怎么用 LinkedHashMap 实现 LRU 缓存？

【面试回答】LinkedHashMap 维护一条贯穿 entry 的双向链表，accessOrder=true 时 get 命中会把节点移到队尾，队头恒为最久未用。重写 removeEldestEntry(size() > capacity) 即可在插入后自动淘汰队头。这就是 Redis/LVS 乃至浏览器缓存淘汰的标准教学实现。并发场景需要加锁或换 Caffeine（分段环 + Window-TinyLFU 近似 LRU，性能远高于锁住 LinkedHashMap）。面试延伸：LFU 比 LRU 抗偶发批量扫描污染，TinyLFU 用计数草图省内存——能讲到这层属于加分。

【一句话背诵】accessOrder + 重写 removeEldestEntry；生产用 Caffeine 的 Window-TinyLFU。

##### C3. ArrayList 的扩容机制与"并发写会丢数据"的原因？

【面试回答】默认空数组，首次 add 扩到 10；满时扩 1.5 倍（oldCapacity + (oldCapacity >> 1)），再 Arrays.copyOf 搬迁。add 的三步——读 size、写 elementData[size]、size+1——非原子，两个线程同下标写前者被覆盖、size 也只 +1，表现为"数据丢失/越界/大小错乱"。替代：读多写少 CopyOnWriteArrayList，高并发写直接用锁保护或 Collections.synchronizedList（方法级粗粒度锁）。面试点： Arrays.asList 返回的是定长视图不是 ArrayList，add 抛 UnsupportedOperationException，转集合要 new ArrayList<>(list)。

【一句话背诵】10 起步 1.5 倍扩；add 三步不原子所以并发丢数据；asList 是定长视图别 add。
