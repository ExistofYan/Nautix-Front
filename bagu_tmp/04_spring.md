### 十二、Spring 高频必考（IOC / AOP / Bean 生命周期 / 事务）

#### IOC 与依赖注入

##### S1. 什么是 IOC？和依赖倒置原则什么关系？

【面试回答】IOC 控制反转：对象的创建、装配、生命周期管理从业务代码里抽走，交给容器；对象不再 new 依赖，而是被动接收（DI 依赖注入是 IOC 的具体实现手段）。好处三点：解耦（依赖接口，便于替换与单测 mock）、复用（容器管单例）、配置集中。与 DIP 的关系：DIP 要求"高层不依赖低层实现，都依赖抽象"，IOC 是落地 DIP 的机制。Spring 容器本质是大工厂 + 注册表：启动解析配置（注解/XML）生成 BeanDefinition 注册表，运行时按定义实例化并注入。

【一句话背诵】创建权交给容器（IOC），靠注入落地（DI），服务的是依赖倒置。

##### S2. BeanFactory 和 ApplicationContext 的区别？

【面试回答】BeanFactory 是顶层接口，只管延迟加载和获取；ApplicationContext 在其上扩展了企业能力：事件发布（ApplicationEventPublisher）、国际化、资源加载（ResourceLoader）、环境抽象、且默认启动时预实例化所有单例（非懒加载）——好处是启动即暴露配置错误，代价是启动慢一点。还自动注册 BeanPostProcessor 等基础设施，AOP、@Autowired 都靠它。面试落点：实际项目都用 ApplicationContext（Spring Boot 里各种 xxxApplicationContext），说"BeanFactory 是内核、Context 是完整产品"。

【一句话背诵】BF 管拿 bean，AC 管全家：预实例化 + 事件 + i18n + 后置处理器自动注册。

##### S3. @Autowired 和 @Resource 的注入规则？Spring 怎么解决循环依赖？

【面试回答】@Autowired 是 Spring 注解，默认按类型匹配，多个候选再按参数名/byQualifier 收敛，required=false 可缺省；@Resource 是 JSR-250 标准注解，默认先按名字再按类型。构造器注入是官方推荐：依赖不可变（final）、空依赖直接失败、便于单测——我项目全部走构造器注入 + Lombok @RequiredArgsConstructor。循环依赖（A 依赖 B、B 依赖 A）用三级缓存在属性填充阶段解：singletonObjects（成品）、earlySingletonObjects（半成品，可能被代理）、singletonFactories（ObjectFactory，能提前产出引用/代理）。A 创建时把自己的工厂放进三级，注入 B 时 B 反过来要 A，从三级拿到 A 的早期引用。约束：字段/setter 注入可解，构造器注入解不了（实例都造不出），@Scope prototype 也解不了，这就是"构造器注入会把循环依赖变成显式启动失败"的原因——通常被视作好事，逼你拆设计。

【一句话背诵】Autowired 按类型、Resource 先名字；三级缓存暴露半成品引用解字段级循环依赖，构造器循环直接报错。

#### AOP

##### S4. AOP 的核心概念与实现原理？JDK 动态代理和 CGLIB 怎么选？

【面试回答】概念五件套：切面（横切逻辑的模块）、关注点（要抽的逻辑，如日志事务）、连接点（可织入的方法执行点）、切入点（表达式筛哪些连接点生效）、通知（Before/After/Around/AfterReturning/AfterThrowing），织入是组装过程。Spring AOP 是运行时动态代理：BeanPostProcessor 在 bean 初始化后包一层代理对象，容器里存的就是代理。两种代理：JDK Proxy 基于接口反射生成 $Proxy 类，只能代理接口方法；CGLIB 继承目标类重写方法（final 类/方法不行），Spring Boot 2.x 默认 proxyTargetClass=true 即全用 CGLIB（Boot 里即便有接口也代理类，避免"只能注入接口"的坑）。限制：Spring AOP 是方法级、只作用于容器管理的 bean、且只对"外部调用"生效——类内自调用绕过代理（见 S7）。AspectJ 则是编译时/加载时织入，能做字段和构造器拦截，性能与能力都更强，重量级场景用它。

【一句话背诵】运行时织入 = BPP 包代理；JDK 走接口、CGLIB 走继承，Boot 默认 CGLIB；自调用失效是命门。

#### Bean 生命周期

##### S5. Spring Bean 的完整生命周期？

【面试回答】以单例注解 Bean 为主线：①实例化（推断构造器、反射 new）→②属性填充（populateBean，@Autowired 注入在这步）→③Aware 接口回调（BeanName/BeanFactory/ApplicationContextAware）→④初始化：先 BeanPostProcessor.postProcessBeforeInitialization，再 @PostConstruct，再 InitializingBean.afterPropertiesSet，再自定义 initMethod（@PostConstruct 来自 JSR-250，靠 CommonAnnotationBPP 触发，顺序是规范定死的）→⑤postProcessAfterInitialization（AOP 代理通常在这里生成）→⑥就绪使用→⑦销毁：@PreDestroy→DisposableBean.destroy→destroyMethod（容器关闭时按依赖逆序）。我项目里缓存与写线程就是靠 @PostConstruct 在启动时加载全量航线数据、预热状态机，销毁钩子负责优雅停止线程池并排干队列。

【一句话背诵】实例化→注属性→Aware→前置BPP→PostConstruct→afterPropertiesSet→init→后置BPP（出代理）→用→PreDestroy 逆着拆。

##### S6. 单例 Bean 线程安全吗？@Scope 有哪些？

【面试回答】prototype 每次 getBean 新建（容器不管销毁，需自管或配 CleanupCallback）。单例 Bean 本身无状态所以安全——不安全来自往里塞可变成员变量（有状态 Service/Controller 是多线程共享实例，成员变量会被并发踩踏）。解法：状态外置（存方法参数/Redis/DB）、或把 bean 设成 prototype/ObjectProvider 延迟取、或 ThreadLocal 隔离（记得 remove，见 T9）。Controller/Service 写成无状态是默认姿势：我后端所有 ServiceImpl 只注入 mapper 与缓存组件，请求状态全走局部变量，16 个写线程共享组件才能不加锁地跑。

【一句话背诵】singleton 共享实例，无状态则安全；有状态就 prototype/ThreadLocal/外置存储三选一。

#### 事务

##### S7. Spring 事务的实现原理与传播行为？

【面试回答】声明式事务 @Transactional 是 AOP：事务拦截器环绕目标方法，进入前从事务管理器拿连接、按传播行为决定是否挂起/新建、设 autoCommit=false，正常返回提交、RuntimeException/Error 回滚（默认不回滚受检异常，要 rollbackFor 显式指定），最后释放连接。传播七种，高频五种：REQUIRED（默认，有则加入无则新建）、REQUIRES_NEW（挂起当前，新开独立事务——外层回滚不影响内层已提交，记日志常用）、NESTED（同一物理事务里的保存点，内层回滚到 savepoint 外层可继续）、SUPPORTS、NOT_SUPPORTED（强制非事务跑）。事务同步靠 ThreadLocal 存 ConnectionHolder，这也是"异步线程里事务丢失"的根因（子线程拿不到 ThreadLocal）。

【一句话背诵】@Transactional = AOP 环绕 + ThreadLocal 持连接；REQUIRED 同船，REQUIRES_NEW 各活各的，NESTED 用保存点。

##### S8. 事务失效的常见场景？

【面试回答】七类：①方法非 public（代理只拦 public）；②类内自调用（this.method() 不走代理，注入自身或拆类或 AopContext 解决）；③异常被 try-catch 吞掉没重抛（拦截器看不到异常）；④抛受检异常但没配 rollbackFor（默认只回滚运行时异常）；⑤propagation 设成 NOT_SUPPORTED/SUPPORTS 等外层无事务场景；⑥数据源/事务管理器没配对（多数据源时要显式 @Transactional(transactionManager=...)）；⑦底层引擎不支持（MyISAM 无事务）。批量写入的实践点：@Transactional 包住"一次多值 INSERT"是合适的（我项目 BatchWriter 就是 5 万行一批开一个事务），但千万别把"从队列取数+循环写多批"整个塞进一个事务——长事务占连接、undo 膨胀、锁持有时间长，正确形态是每批一个短事务。

【一句话背诵】非 public、自调用、吞异常、没 rollbackFor、传播不对、管理器没配对、引擎不支持——六加一场景逐条排。

##### S9. @Transactional 与分布式事务、以及和消息/缓存的最终一致方案？

【面试回答】@Transactional 只管本地单库连接，跨服务/跨库要靠分布式事务：强一致方案 2PC/XA（协调者两阶段准备+提交，阻塞且协调者单点，性能差，传统中间件库用）；柔性方案 TCC（Try-Confirm-Cancel 业务层两阶段，资源锁定在业务语义里）、Saga（长事务拆串子事务 + 逆操作补偿，适合编排型流程）、本地消息表（业务和消息同库同事务落表，异步投递+重试，消费方幂等）与事务消息（RocketDB 半消息+回查，本质同解决"DB 与 MQ 原子性"），再加最大公约数方案——基于"唯一约束/幂等键 + 重试"的最终一致：我实习项目里提交侧幂等键 + 唯一索引保证重复派单 0 条，就是最朴素的分布式一致性手段。面试加分句："选型看一致性要求与性能预算，绝大多数业务应该选最终一致 + 幂等，而不是上重型框架。"

【一句话背诵】本地事务归 Spring，跨库选 TCC/Saga/消息表/事务消息，兜底靠幂等键 + 唯一约束。
