const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell,
  ImageRun, AlignmentType, BorderStyle, WidthType,
  TabStopType, VerticalAlign,
} = require("docx");
const fs = require("fs");

const avatarBuffer = fs.readFileSync("C:\\颜-个人\\澳洲，新西兰，爱尔兰\\Australia\\国立\\Resume\\avatar.jpg");

const FONT = {
  heading: { ascii: "Times New Roman", eastAsia: "黑体" },
  body: { ascii: "Times New Roman", eastAsia: "宋体" },
};
const FS = { name: 36, sect: 24, body: 21, small: 18 };

const W = 10006;

const sect = (title) => new Paragraph({
  children: [new TextRun({ text: title, bold: true, size: FS.sect, font: FONT.heading })],
  spacing: { before: 110, after: 46 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000", space: 2 } },
});
const row = (left, right) => new Paragraph({
  tabStops: [{ type: TabStopType.RIGHT, position: W }],
  spacing: { after: 20 },
  children: [
    new TextRun({ text: left, bold: true, size: FS.body }),
    new TextRun({ text: `\t${right}`, size: FS.small, color: "444444" }),
  ],
});
const run = (bold, text, size) => new TextRun({ text, bold, size: size || FS.body });
const bullet = (label, body) => new Paragraph({
  spacing: { after: 32, line: 246 },
  children: [run(true, `· ${label}`), run(false, body)],
});
const plain = (text, opts) => new Paragraph({
  spacing: { after: 22, line: 246 },
  children: [run(false, text, opts && opts.size)],
});

const doc = new Document({
  styles: { default: { document: { run: { font: FONT.body, size: FS.body, color: "000000" } } } },
  sections: [{
    properties: { page: { margin: { top: 700, right: 950, bottom: 620, left: 950 } } },
    children: [
      // ===== 头部 =====
      new Table({
        rows: [ new TableRow({ children: [
          new TableCell({
            children: [ new Paragraph({ alignment: AlignmentType.CENTER,
              children: [ new ImageRun({ data: avatarBuffer, transformation: { width: 58, height: 76 }, type: "jpg" }) ] }) ],
            width: { size: 1150, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
          new TableCell({
            children: [
              new Paragraph({ spacing: { after: 50 }, children: [
                new TextRun({ text: `童  颜`, bold: true, size: FS.name, font: FONT.heading }),
                new TextRun({ text: `    求职意向：Java 后端开发实习生 / AI 数据 Agent 开发`, size: FS.body }),
              ] }),
              new Paragraph({ spacing: { after: 24 }, children: [
                run(false, `电话：+61 493 534 572    邮箱：Yan.Tong@anu.edu.au`),
              ] }),
              new Paragraph({ children: [
                run(false, `GitHub：github.com/TongYan05/NAUTIX    签证：学生签 500（课余 48h/双周，假期可全职）`),
              ] }),
            ],
            verticalAlign: VerticalAlign.CENTER,
            borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          }),
        ] }) ],
        width: { size: W, type: WidthType.DXA },
      }),

      // ===== 教育背景 =====
      sect(`教育背景`),
      row(`澳大利亚国立大学（ANU）— 计算硕士 Master of Computing`, `2026.07 – 2028.06（在读）`),
      plain(`获校长国际成就奖学金（学费减免 20%）`),
      row(`广东海洋大学 — 船舶与海洋工程 工学学士`, `2022.09 – 2026.06`),
      plain(`GPA 3.64/5.0，排名 8/123（前 7%），校级三等奖学金`),

      // ===== 专业技能 =====
      sect(`专业技能`),
      new Paragraph({ spacing: { after: 22, line: 246 }, children: [
        run(true, `Java 后端：`), run(false, `Java 17（集合/多线程/IO/OOP），Spring Boot、Spring Security、MyBatis-Plus；RESTful API、JWT 无状态认证、统一异常处理`),
      ] }),
      new Paragraph({ spacing: { after: 22, line: 246 }, children: [
        run(true, `数据库：`), run(false, `MySQL 库表设计（14 张业务表）、索引优化与 EXPLAIN 分析、批量写入管道（生产者-消费者+批量插入）、SQL 多表关联统计`),
      ] }),
      new Paragraph({ spacing: { after: 22, line: 246 }, children: [
        run(true, `AI Agent：`), run(false, `大模型接口对接、Agent 任务编排与工具调用、意图分类、Text-to-SQL 问答链路、对话上下文管理`),
      ] }),
      new Paragraph({ spacing: { after: 22, line: 246 }, children: [
        run(true, `前端：`), run(false, `TypeScript、Vue 3（Composition API）、Pinia、ECharts 可视化、SVG 海图渲染`),
      ] }),
      new Paragraph({ spacing: { after: 22, line: 246 }, children: [
        run(true, `工程化：`), run(false, `Git、Maven、Docker/Compose、Nginx、AWS EC2、Postman、Linux`),
      ] }),

      // ===== 项目经历 =====
      sect(`项目经历`),
      row(`Nautix — AI 驱动的船舶遥测数据智能平台（独立全栈开发，已上线）`, `2026.03 – 至今`),
      plain(`技术栈：Java 17 / Spring Boot / MyBatis-Plus / MySQL / Spring Security+JWT / Vue 3 / TypeScript / ECharts / Docker`, { size: FS.small }),
      plain(`项目简介：管理 1 万艘船舶、16 万传感器配置的实时遥测数据，内嵌 AI 问答 Agent 以中英文查询 2.6 亿+ 条记录；独立完成数据库设计到云端部署全部开发，累计代码 3.2 万+ 行。`, { size: FS.small }),
      bullet(`数据智能 Agent 后端（数据问答/智能检索/报表自动化）：`,
        `设计问答链路——意图分类层将自然语言问题路由至 20+ 查询域（船队统计/传感器指标/告警/航线/港口/天气/单位换算），`
        + `编排生成经校验的 SQL 直查真实数据库，答案数字全部来自实查、零模型幻觉，端到端响应约 1s。`),
      bullet(`指标解析与实时分析图形：`,
        `实现 22 个传感器生成器覆盖 17 类指标（转速/排温/燃油/电压/振动/经纬度等）；`
        + `15+ 种 ECharts 图形（趋势/波动排行/相关性热力矩阵/告警 7×24 热力图/雷达对比）随实时数据流自动刷新、同图呈现不同形态；33 类天气类型驱动图标与图表联动。`),
      bullet(`数据任务调度与批量写入：`,
        `生产者-消费者架构（BlockingQueue+16 写入线程、单批 5 万条）历史灌入 2.6 亿+ 条时序记录；`
        + `增量 10s/批持续产出（约 8.6 万条/天）供前端秒级轮询；219 万条航线点位支撑航迹回放。`),
      bullet(`查询性能优化：`,
        `灌数阶段先删二级索引、完成后重建复合索引并以 EXPLAIN 验证命中，大表历史查询提速约 40%；`
        + `修复航线缓存 N+1 缺陷（数千次单行查询→批量加载+内存分组），接口响应由约 2s 降至 200ms（10 倍）。`),
      bullet(`地图可视化与海量渲染治理：`,
        `自研 SVG 海图渲染 1 万艘船实时位置/航速/航向/油量、航线折线与港口标记；`
        + `对 219 万点位实施服务端按 ID 过滤+视口裁剪+RDP 抽稀，首屏渲染量削减 99%+，解决海量点位导致的页面卡顿。`),
      bullet(`平台工程：`,
        `14 张业务表、19 个 Controller、98 个 REST 端点；JWT 鉴权+401 会话自清理；中英双语（662 词条类型化字典，编译期校验键集）；`
        + `54 页面/101 组件/58 路由，Docker+Nginx+AWS 部署。`),

      // ===== 实习经历 =====
      sect(`实习经历`),
      row(`Darling Downs Environment Council（DDEC）— Web 应用开发（实习）`, `2026.09 – 至今`),
      plain(`开源项目 Doorknock：志愿者入户拜访数据采集 Web 应用（React + Node.js + MongoDB + 地图服务）`),
      bullet(`数据采集前后端：`, `实现离线优先表单（多步字段校验+GPS 定位+图片压缩上传），断网缓存续传，支撑 1.5 万+ 户家庭拜访数据入库`),
      bullet(`数据分析面板：`, `开发区域覆盖率/完成率看板（8 项核心指标），基于历史记录实现敲门路线优先级推荐，预计提升拜访效率约 25%`),

      // ===== 其他 =====
      sect(`其他`),
      new Paragraph({ spacing: { after: 22, line: 246 }, children: [
        run(false, `英语：`), run(true, `IELTS 7.5`), run(false, `（工作语言，全英授课硕士在读）；普通话母语；Nautix、Doorknock 开源项目 GitHub 持续迭代`),
      ] }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("D:\\新建文件夹\\java\\javacode\\nautix-frontend\\童颜_中文简历.docx", buffer);
  console.log("OK generated");
});
