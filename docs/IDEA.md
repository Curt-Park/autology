# 배경
## 현재 상황
- 2024-2026년: Claude Code, GitHub Copilot 등 AI 코딩 에이전트가 개발 워크플로우에 전면 투입
- 개발자 역할 변화: 직접 코딩 → 여러 AI 에이전트를 동시에 관리하는 "매니저"로 전환
- 조직 구조 변화: 팀장은 개발자들의 에이전트 활용을 감독하는 "메타 매니저" 역할로 상승

# 핵심 문제 (역설적 현상)
생산성 ↑  +  정보 투명성 ↓  +  지식 축적 ↓  =  조직적 앎의 위기

**구체적 증상**:
- 개발자: "AI가 생성한 코드를 전부 이해하기 어렵다" (산출물 불투명)
- 팀장: "팀원들이 실제로 무엇을 하는지 파악하기 힘들다" (진행도 불가시)
- 조직: "같은 실수를 반복하고, 노하우가 휘발된다" (지식 미축적)
- 개발자: "AI에 의존할수록 실제 역량이 감소한다" (skill atrophy)

# 목표
"AI 에이전트의 생산성을 유지하면서도, 사람의 앎의 영역을 축소하지 않는 최적 균형점 확보"

# 핵심 아이디어
- 모든 지식을 온톨로지로 통합: 스펙, Way of Working(컨벤션, CI/CD), 도메인 지식, 의사결정 기록
- Living Ontology: 문서가 아닌 추론 가능한 실행 가능 지식 베이스
- Transparent Decision Chain: AI의 모든 행동이 근거와 함께 기록됨
- Knowledge Compounding: 프로젝트마다 온톨로지가 성장하며 조직 자산화

# 참고 자료
- Claude Code Plugin System (2026)
- MCP (Model Context Protocol) Architecture (2025)
- Plugin Development Toolkit
- Code Digital Twin (arXiv 2025-12-29)
- SemanticForge: Repository-Level Code Generation with Knowledge Graphs (arXiv 2025-11)
- Ontology-driven Software Requirements Auto-Update (2025)
- iReDev: Knowledge-Driven Multi-Agent Framework for RE (2025)

# 실무 사례
- 컬리 OMS팀 - Claude AI 업무 방식 (2025-12)
- Living Ontology: Refactor Intelligence at the Speed of Thought (2025-11)
- JSON-LD + RDFLib (Python/JS)
- Neo4j / FalkorDB (Graph DB)
- TopBraid Composer (상용)