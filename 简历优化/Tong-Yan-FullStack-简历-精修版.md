# Tong Yan

**Full-Stack Developer (Java / Vue / API Integration)**

linkedin.com/in/yan-tong-1760ba381 | Yan.Tong@anu.edu.au | +61 493534572 | Canberra, Australia (willing to relocate to Sydney)

Work rights: Student visa (subclass 500) — 48 hours per fortnight during term, unrestricted during breaks

## Summary

Full-stack developer. I've taken two web platforms from database schema to live production on my own, the larger one running over 260M records. Both ship with an embedded AI assistant that answers questions about operational data by running vetted SQL against the live database, in English or Chinese. Core strengths: API architecture, authentication, data transformation and query performance. Day-to-day stack is Java and Spring Boot on the backend, TypeScript and Vue on the frontend, with Docker, Nginx and AWS handling deployment.

## Projects

### NAUTIX — AI-Powered Maritime Telemetry Platform (full-stack, solo)

06/2026 – Present
Tech: Java 17, Spring Boot, MyBatis-Plus, MySQL, Spring Security/JWT; Vue 3, TypeScript, Vite, Pinia, ECharts, CesiumJS
Repo: TongYan05/NAUTIX

- **Embedded AI assistant.** A Q&A layer on every page: it classifies the intent of a natural-language question, maps it to one of roughly 20 query domains (fleet stats, sensors, alerts, routes, ports, weather, unit conversion), runs vetted SQL against the live database and answers in the language asked. Numbers always come from real queries, not generated text.
- **Frontend architecture and theming.** Built the entire Vue 3 + TypeScript interface on a custom design system: hand-styled components over Element Plus, glassmorphism layout, page transitions, and ECharts dashboards that re-render per language. No off-the-shelf admin template.
- **Bilingual localisation.** Shipped a one-click English/Chinese switch using a typed dictionary of ~200 keys covering every page, table header, dialog, form and pagination control, with the choice persisting across sessions. The AI assistant and 30+ weather categories answer in the active language.
- **API design and security.** Designed the REST surface (ships, sensors, alerts, routes, ports, weather, logs) behind stateless JWT auth. Built the axios layer that expires sessions cleanly: 401 from the API clears local state and re-guides to login instead of leaving blank pages; CORS and exception handling centralised in one place.
- **Data engineering at scale.** Ingests 260M+ time-series rows for 10,000 vessels and 160k sensor configs through a producer–consumer pipeline (BlockingQueue, worker pools, batch insert). Improved historical query performance by dropping secondary indexes during bulk generation and rebuilding composite indexes afterwards; validated the indexing strategy with EXPLAIN.
- **Performance fixes.** Resolved an N+1 pattern in the route cache by replacing thousands of per-row database calls with batch loading and in-memory grouping.

### NEXMAR — Maritime Operations Management Platform (full-stack, solo, in production)

03/2026 – 07/2026
Tech: Spring Boot, MyBatis-Plus, MySQL, Druid; Vue 3, Vite; Docker, Nginx, AWS EC2
Repo: TongYan05/Nexmar | Live: http://8.134.113.34

- **Large-scale data migration.** Moved 6.21 million records between database instances with zero data loss: designed the field mapping and a multi-layer validation pass (row counts, key integrity, sampled content), and disabled foreign-key checks during batch import to keep the migration window short.
- **Query performance.** Tuned SQL execution plans and Druid connection pooling to bring the slowest dashboard queries from roughly 2 seconds to 200 ms. Standardised pagination, filtering and sorting patterns across all modules so the frontend consumes every endpoint the same way.
- **Complex domain modelling on the frontend.** Modelled 20+ technical specifications per vessel in a hierarchical schema, and built a drill-down editor with the Vue 3 Composition API so users move between fleet-level overview and single-item detail while keeping data consistent.
- **Production deployment.** Dockerised frontend, backend and database; ran the stack on AWS EC2 behind Nginx as a reverse proxy with SSL termination, so dev and production environments stay identical. Wrote the Docker Compose and Nginx configs myself.
- **Stress-testing tooling.** A multi-threaded bulk data generator (ExecutorService + CountDownLatch) that splits large datasets into chunks and fills tables in parallel, used to test pagination and reporting under realistic volume.

## Education

**Master of Computing**, Australian National University
07/2026 – Present | Canberra, Australia | Expected completion: Jun 2028

**B.Eng. in Naval Architecture & Ocean Engineering**, Guangdong Ocean University
09/2022 – 06/2026 | Zhanjiang, China | GPA 3.64/5.0, rank 8/123 (top 7%)

## Skills

- **Languages:** Java, TypeScript / JavaScript, SQL, HTML5, CSS3
- **Frameworks:** Spring Boot, Spring Security, MyBatis-Plus, Vue 3, Pinia, Vue Router, Element Plus, ECharts, CesiumJS
- **Data & integration:** MySQL (schema design, indexing, bulk ingestion, cross-instance migration), REST API design, JWT authentication, Excel import pipelines (EasyExcel/POI)
- **DevOps & tooling:** Git, Docker, Docker Compose, Nginx, AWS EC2, Linux, Maven, Postman

## Awards

- **Vice-Chancellor's International Achievement Scholarship**, ANU, 03/2026 — 20% tuition waiver for outstanding international postgraduates
- **Third-Class Academic Scholarship**, Guangdong Ocean University, 09/2023 — top 7% of cohort

## Languages

English: IELTS 7.5 (fluent) | Mandarin: native
