# Single O 全站岗位：差距分析与补齐计划

对照 JD 逐条看，把"已有可迁移"和"确实缺失"分开写，最后给一份按优先级排的行动计划。

## 一、总判断

这份 JD 的本质不是"Java 后端 + Vue 前端"，而是 **Shopify Plus 生态里的集成工程师**：一半工作量在 Shopify ↔ NetSuite 这条数据链路上，另一半在 B2B 商店的前端改造。你的背景在"数据管道、API 设计、认证、性能、上线运维"这条线是扎实的，缺的是**商务域知识（orders / inventory / fulfilment）和 Shopify + ERP 这套具体技术栈**。

好消息是：JD 里最难补的（大规模数据、跨系统字段映射、迁移校验、生产部署）你恰好都有真实经历；最容易补的（Liquid、Shopify Admin API）两三周就能到能干活的水位。

## 二、逐条对照

| JD 要求 | 你已有的 | 差距 | 严重度 |
|---|---|---|---|
| 5–7 年 Full Stack 经验 | ANU 在读硕士 + 两个独立全栈项目 | 年限明显不足 | 高，但可用"生产环境 + 亿级数据"的证据对冲 |
| Shopify Plus 前端（Liquid / HTML5 / CSS3 / JS） | Vue 3 + TS + 手写 Element Plus 主题 + 暗色玻璃拟态设计系统 | **完全无 Liquid、无 Shopify 主题开发经历** | 中高 |
| REST / SOAP / RESTlets / GraphQL | REST 做得很熟（Controller–Service–Mapper、统一分页过滤排序、CORS、401 语义） | GraphQL 没用过；SOAP/XML 没用过 | 中 |
| ERP 集成，最好 NetSuite | 6.21M 记录跨实例迁移、字段映射、多层校验、零丢失；EasyExcel 端口数据导入 | **无 ERP 经验，不懂 NetSuite 的数据模型和对象关系** | 高（这是他们的第一优先事项） |
| Shopify Plus B2B（companies、price lists、账户、下单流程） | 复杂层级领域建模（每船 20+ 技术指标）、钻取式编辑界面 | 无 B2B 商务概念：批发客户、信用账期、分级定价、起订量 | 中 |
| Greenfield 电商构建 / 大型平台项目 | 两个平台都是从 0 到 1 独立完成，NEXMAR 有公网生产地址 | 无电商项目（购物车、结账、支付、退款、履约一个都没碰过） | 中 |
| Git、版本控制、测试、CI/CD | Git 日常使用，Docker + Compose + Nginx + SSL + EC2 亲自搭建 | **几乎没有自动化测试**（只有一个 Spring Boot 默认 contextLoads），没有 GitHub Actions / 流水线经验 | 中高 |
| GA4、Klaviyo、埋点归因 | 无 | **完全空白** | 中（学习成本低，但面试会被问） |
| 向非技术同事解释技术方案 | 项目 README 双语、文档习惯好；航海工程出身转码，本身就在跨语境沟通 | 缺真实跨部门协作（都是独立项目，没和 Marketing / Sales 打过交道） | 低 |
| 组织、主动、时间与项目管理 | 独立交付两个大项目本身就是证据 | 无 | 低 |

## 三、两个必须提前想清楚的现实问题

1. **签证工时上限**。Student visa 500 学期内 48 小时/两周，而这个岗位是周二到周五 4 天。面试一定会问排班，提前准备好答案：哪几周是学期、哪几周是假期（ANU 学假期通常能全脱产）、能否假期做满 4 天。不要在简历里写"open to Sydney, on-site Tue–Fri"这种容易被反问成"你学期内怎么办"的表述——我在新版简历里把它改成了只写工作地点意愿，把排班留给面试沟通。
2. **年限硬门槛**。他们要 5–7 年，你是在读硕士。策略不是假装年限，而是把叙事换成"我做的不是练习项目"：260M 行真实运行数据、6.21M 记录迁移零丢失、公网在线系统。同时主动承认电商域需要上手期，给出你已经开始的 Shopify 学习路径——这比被面试官问出来体面得多。

## 四、你的差异化优势（面试要主动打这几张牌）

- **双语产品**：Single O 有对亚洲市场的批发与零售业务，你独立做过一套完整的英中切换体系（200 个 key 的 typed 字典 + 组件级本地化）。这点直接对标他们的国际化需求，且普通澳洲候选人基本没有。
- **数据迁移与校验**：他们最痛的就是 NetSuite ↔ Shopify 双向同步。你对着这个讲 6.21M 记录的字段映射、行计数/主键/抽样三层校验、以及为什么批量导入要临时关外键约束，比讲十个"我学过 SuiteTalk"更有说服力。
- **性能工程**：批量灌数据前先删二级索引再重建、N+1 改批量加载、2s 查询优化到 200ms、EXPLAIN 验证索引。集成项目的失败模式恰恰是性能和错误处理，这是你的强项区。
- **自己写过部署**：Dockerfile 和 Nginx 配置是你手写的，不是抄模板。加上他们要 CI/CD，你补 GitHub Actions 是几小时的事。
- **定时器 + 事件驱动的模拟引擎**：虽然没用过 webhook，但生产者-消费者、事件窗口、状态机转换这套并发模型你已经实操过，讲清楚"webhook 只是把进程内队列换成跨系统的 HTTP 回调"，迁移逻辑非常自然。

## 五、学习清单（按优先级）

### P0 — 本周就动，两周内要有产出

**Shopify 主题与 Liquid**
- 开一个 Shopify Partner 账号（免费），建 development store，这是唯一合法且免费的练手环境。
- 装 Dawn 主题，读它的 `.liquid` 文件。Liquid 本身很小：`{% %}` 逻辑、`{{ }}` 输出、`section` / `block` / `schema` 三个概念、`{% form %}` 结账表单。你 CSS/JS 底子够，卡点只在 Shopify 的对象模型（product / variant / line item / cart）。
- 用 Shopify CLI + Theme Kit 本地开发，改一个 section 并提交。
- 产出目标：**一个自己改过的主题 + 一段说明你改了什么、为什么这么改的记录**，面试能直接打开给人看。

**Shopify Admin GraphQL API + webhook**
- 官方 Admin API 文档 → 学会 `ordersCreate`、`productUpdate`、`fulfillmentCreate` 这类 mutation，学会游标分页。
- 起一个最小服务接收 webhook：验证 HMAC 签名 → 幂等去重（同一 `webhook_id` 重复推送）→ 失败重试队列。**这一条就是那个岗位核心工作的微缩版**，做出来含金量最高。

### P1 — 3–4 周内

**商务域知识（补概念，不是补技术）**
- 读懂订单生命周期：authorization → capture → fulfilment → refund，以及 inventory item / level / location 三者的关系。NetSuite ↔ Shopify 同步 90% 的坑都在这里。
- Shopify B2B：Companies、Company Locations、Price Lists、net payment terms、quantity rules、`sets`。用 development store 的 B2B 功能开一个演示店，亲手建一套分级定价。
- 履约与多仓：Single O 有批发和零售两套，理解 fulfillment location 的路由逻辑。

**NetSuite 基础**
- 不求会开发，求"知道它是什么、对象长什么样"：SuiteTalk REST 与 SOAP 的区别、RESTlet 是什么、custom record vs standard record、customer / item / sales order / invoice / cash sale 这条单据链、SuiteCloud 的鉴权（TBA OAuth 1.0a 与 KEYPAGE 方式）。
- 看一段 Celigo / Boomi / Farapp 的 Shopify-NetSuite connector 文档，理解现成方案覆盖什么、为什么还需要定制。JD 明确写了"评估并实施 connector 或 iPaaS 方案"，说明他们不排斥买方案——你能说出买与自建的取舍，比背 API 更加分。

**测试与 CI/CD**
- 给 NAUTIX 补真正的测试：Spring Boot 侧用 Testcontainers 起 MySQL 测两三个核心 Service，前端用 Vitest 测 i18n 字典完整性和一个 store。
- 加一个 GitHub Actions：push 时跑 `mvn test` + `vue-tsc` + `npm run build`。这直接补上 JD 那句" familiarity with Git, version control, testing and CI/CD practices"，而且是可见的仓库证据。

### P2 — 加分项，有余力再做

- **GraphQL 客户端**：把 NAUTIX 的某一个查询接口做成 GraphQL（Spring for GraphQL），这样面试能说"我用过 GraphQL 两端"。
- **GA4 + GTM**：官方免费课程（GA4 IQ），在 NEXMAR 站点上真装一个 GA4 并配事件；再理解一下 Klaviyo 怎么吃 Shopify 的订单事件。半天能懂原理，一天能装好。
- **支付与结账**：Stripe 测试账号跑一遍 payment intent + webhook，理解 3DS 和支付失败回滚。
- **可访问性与性能指标**：Lighthouse、Core Web Vitals、aria 属性。JD 单独提了 accessibility 和 performance，你的 Vue 项目里做一轮 a11y 整改（焦点管理、对比度、键盘可达）成本很低，效果明显。

## 六、求职策略建议

1. **先做一个"最小可信证据"**。与其在简历上写"了解 Shopify"，不如花两周做一个 demo：Shopify development store + 一个自定义 section + 一个 Java/Node 小服务接收 webhook 把订单写进 MySQL，README 写清数据流和幂等设计。这东西直接对应他们的核心痛点，能把"没有电商经验"这一条从硬伤变成"已在自驱补齐"。
2. **求职信里点名业务**。Single O 是精品咖啡，B2B 面向咖啡馆和餐饮客户，D2C 面向零售。信里说明白你理解"批发客户要的是价格表和账期，零售客户要的是复购和订阅"，然后接上你补这块知识的具体动作。
3. **补一段真实协作经历**。哪怕给开源项目提两三个 PR，或者帮朋友的小店改一次主题。JD 反复强调跨部门沟通，你现在所有项目都是单人作战，这是面试官会挖的地方。
4. **投前想清楚一句话定位**：不写"Java 后端 + Vue 前端的全栈求职者"，而是"能把两个系统的数据可靠地连起来、并保证它跑得快跑得稳的人"。这个岗位的实质就是这句话。
