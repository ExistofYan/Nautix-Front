# 童颜

**后端开发｜2027 届校招 & 实习均可投**　电话：19892432281｜邮箱：Yan.Tong@anu.edu.au｜GitHub：TongYan05

## 教育背景

**澳洲国立大学（ANU·QS50）**　软件工程·硕士　2026.08–至今
**广东海洋大学**　船舶与海洋工程·本科　2022.09–2026.06　绩点 3.64/5.0｜排名 8/123（前7%）

## 实习经历

**DDEC（澳大利亚本地团队）· 后端开发实习生**　2026.07–2026.09

- **租户隔离**：落地 6 级 RBAC + organization_id 行级隔离，身份经 Filter→ThreadLocal 注入、MyBatis 层强制租户过滤，另写自定义 lint 拦截裸查询；覆盖 45 个 REST 端点，跨租户泄漏用例 11→0。
- **数据管线**：CSV 流式解析 + 攒批 bulk insert + 组合唯一键幂等去重，1.5 万地址导入 22 分钟→4 分钟、重复率 13%→0.1%；MongoDB 2dsphere 自动划分责任区 3 天→6 分钟，本地 2-opt + 单次 API 校正使外部调用 O(n²)→O(1)，人均日拜访 +25%。
- **并发与合规**：唯一约束 + version 乐观锁 + 幂等键消除并发重复派单（50 并发 0 重复、重复率 4.6%→0），敏感号码接口默认脱敏、全量审计。

## 项目经历

**NAUTIX — 海事物联网实时数据流与态势感知平台**（GitHub: TongYan05/NAUTIX）　2026.06–2026.09
技术栈：Java 17 · Spring Boot · MyBatis-Plus · MySQL · Vue 3 · TypeScript · ECharts · CesiumJS

- **亿级时序写入**：有界队列背压 + 16 写线程（4/8/16/32 压测定容）× 5 万行/批多值 INSERT 短事务，回填 2.6 亿行、支撑 8.6 万行/天增量；(ship_id, recorded_at) 索引先灌数后建，单次构建 6.5 分钟。
- **查询治理**：EXPLAIN 定位 N+1，10 万+ 次逐行查询→2 次全量加载 + IN/groupingBy 内存分组（弃 JOIN 防结果集膨胀），2s→200ms；information_schema 估算替代亿级表 COUNT(*)，主键倒序把时间窗换算为主键下界。
- **零模型依赖 AI 问答**：词边界正则路由 9 个业务查询域，命中参数化 SQL 强制 LIMIT，2.6 亿行上端到端约 1s、零幻觉；另完成 LLM 版 Text-to-SQL 升级方案设计（Schema Linking、SQL 白名单、只读账号）。
- **告警与仿真**：阈值 + 持续时长判定、事件开合聚合，80 条种子规则；22 个传感器生成器含 14 组跨传感器物理耦合，端到端验证告警链路。
- **全栈交付**：独立实现 54 视图/101 组件/29 个图表模块，自研 SVG 航海图以视口裁剪 + 单帧 800 船上限降首屏数据量约两个数量级；19 个 Controller/119 个端点无状态 JWT + 定制 401/403，361 组 i18n 键编译期类型对齐实现全站中英切换。

**NEXMAR — 船队调度与资源管理系统**（GitHub: TongYan05/Nexmar）　2026.03–2026.06
技术栈：Spring Boot · MyBatis-Plus · MySQL · Druid · Docker · Nginx

- **跨实例数据迁移**：映射配置化 + checkpoint 断点续传，行数/主键集合比对 + checksum + 抽样四重验证，百万级记录零丢失。
- **性能与建模**：Druid 监控定位慢 SQL，仪表盘最慢查询 2s→200ms；JacksonTypeHandler 将一对多证书落为 JSON 列免 JOIN，Vue 3 实现技术规格逐级钻取编辑器。
- **云上交付**：前后端 Docker 化 + Nginx 反向代理/SSL 终止，独立排查 proxy_pass 路径截断致 404 的线上故障。

## 专业技能

Java（并发/JVM）· SQL · TypeScript · Python｜Spring Boot / Spring Security(JWT) / MyBatis-Plus｜MySQL（InnoDB 索引·事务·MVCC，EXPLAIN 与大表写入优化）· Redis · MongoDB｜Docker · Nginx · Linux · Git｜Vue 3 · ECharts · CesiumJS

## 荣誉资质

IELTS 7.5（听力8/口语7）｜ANU 校长国际成就奖学金｜ANU 计算机学院学生代表｜广东海洋大学三等奖学金
