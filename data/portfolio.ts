export type Experience = {
  period: string;
  organization: string;
  role: string;
  location: string;
  contributions: string[];
  link?: { label: string; href: string };
};

export type Project = {
  name: string;
  status?: string;
  context?: string;
  description: string;
  detail: string;
  stack: string[];
  href?: string;
  featured: boolean;
};

export type Research = {
  period: string;
  status?: string;
  role?: string;
  title: string;
  description: string;
  detail?: string;
  link?: { label: string; href: string };
};

export const experience: Experience[] = [
  {
    period: "Jan — Aug 2026",
    organization: "MDA Space",
    role: "Software Engineering Intern, Co-op",
    location: "Halifax, NS",
    contributions: [
      "Contributed Python features, tests, and fixes to public SKAO software for the Square Kilometre Array’s SKA-Mid MID-CBF distributed Monitor & Control stack.",
      "Developed gRPC- and PyTango-based components across approximately 10 repositories, including application-level thread-safety and software bridging higher-level commands toward firmware-controlled functionality.",
      "Built approximately 10 end-to-end pytest tests for a project milestone, exposing defects that I then diagnosed and fixed across application, configuration, and deployment layers.",
      "Debugged containerized components using Kubernetes logs and Prometheus metrics, working with Docker, Helm, YAML manifests, and GitLab CI/CD.",
      "Completed approximately 35 JIRA tickets and contributed 30+ merge requests alongside code review and technical documentation.",
    ],
    link: { label: "View public contributions", href: "https://gitlab.com/jitansh" },
  },
  {
    period: "Jan — Dec 2025",
    organization: "Canadian Space Agency",
    role: "Software Development Intern, Co-op",
    location: "Longueuil, QC · hybrid",
    contributions: [
      "Created a Sentinel-2 dataset from NOAA harmful-algal-bloom records and trained PyTorch CNN classifiers for Earth-observation research.",
      "Built an automated Jetson Orin Nano benchmark pipeline using PyTorch, ONNX, TensorRT, and CUDA to evaluate inference, memory, power, and thermal behaviour for CubeSat feasibility.",
      "Developed reproducible Python tooling to validate GNSS receivers over TCP/IP against GB-scale, flight-derived data using a Spirent simulator, NovAtel OEM729, and MicroStrain GQ7.",
      "Prototyped OpenC3 COSMOS telemetry workflows with real, non-publicly-identifiable mission data and presented the technical evaluation to the team.",
      "Built an air-gapped Flask RAG pilot with authentication, SQLite persistence, PDF ingestion, BM25 and sentence-transformer retrieval, LangChain, and LLM-as-a-judge evaluation.",
    ],
  },
  {
    period: "May — Aug 2024",
    organization: "Nova Scotia Health",
    role: "Student Analyst, Co-op",
    location: "Halifax, NS",
    contributions: [
      "Reimplemented a nightly regression-testing microservice from Go to C# for the OPOR testing environment while preserving its existing behaviour.",
      "Developed and debugged Ranorex UI automation across unit, integration, acceptance, functional, and regression-testing workflows.",
      "Supported testing infrastructure with GitLab CI/CD, Docker, Bash, SQL queries, TestRail reporting, logs, and technical documentation.",
    ],
  },
];

export const projects: Project[] = [
  {
    name: "BenchmarkLab",
    status: "Open source",
    description: "Local ML-inference benchmarking and evaluation toolkit with a CLI and browser dashboard.",
    detail: "Supports multiple runtimes, reproducible comparisons, resource sampling, artifact verification, resumable jobs, and security-conscious local execution.",
    stack: ["Python", "ONNX Runtime", "PyTorch", "TensorFlow", "Docker"],
    href: "https://github.com/JitanshA/BenchmarkLab",
    featured: true,
  },
  {
    name: "MicroRPC",
    status: "In development",
    description: "A lightweight C++ remote-procedure-call framework for client-server communication.",
    detail: "Implements message framing, serialization, request dispatch, connection management, concurrent processing, UUID-based request metadata, and structured errors.",
    stack: ["C++", "Networking", "Concurrency", "Protocol design"],
    featured: true,
  },
  {
    name: "LRUCacheC",
    status: "Open source",
    description: "A low-level LRU cache library built around a custom hash table and doubly linked list.",
    detail: "Provides average O(1) lookup, insertion, and eviction with resizing, TTL expiry, statistics, sanitizer-backed tests, and 1M+ operation benchmarks.",
    stack: ["C", "Data structures", "Memory management", "Testing"],
    href: "https://github.com/JitanshA/LRUCacheC",
    featured: true,
  },
  {
    name: "Embedded Systems Language Compiler",
    status: "In development",
    description: "A compiler for a custom embedded-systems programming language.",
    detail: "Includes tokenization, parsing, AST construction, semantic analysis, scoped symbol resolution, type checking, explicit memory management, and compile-time diagnostics.",
    stack: ["C", "Compilers", "Parsing", "Systems programming"],
    featured: true,
  },
  {
    name: "Quick Cash",
    context: "Group project",
    description: "Android job-posting and payment application.",
    detail: "Contributed job-posting functionality, PayPal payments, GPS/location features, Google Maps integration, and unit and functional testing.",
    stack: ["Java", "Android", "PayPal API", "Google Maps"],
    featured: false,
  },
  {
    name: "InvestInsight",
    description: "Stock-price prediction pipeline combining financial-news sentiment with time-series modelling.",
    detail: "Covered model validation, performance evaluation, and dashboard-based result visualization without making trading or profitability claims.",
    stack: ["Sentiment analysis", "Time series", "Model evaluation", "Visualization"],
    featured: false,
  },
  {
    name: "SonarSea",
    context: "Hackathon",
    description: "Sea-animal classification from acoustic signals.",
    detail: "Used a Random Forest classifier with noise reduction, data augmentation, and robustness evaluation.",
    stack: ["Random Forest", "Signal classification", "Data augmentation"],
    featured: false,
  },
];

export const research: Research[] = [
  {
    period: "2026 · ongoing",
    status: "Honours thesis",
    title: "Evidence-aware RAG evaluation",
    description: "Developing structured RAG methods with Qwen3-14B, vLLM, JSON-schema constrained decoding, and reproducible experiments on Compute Canada infrastructure.",
  },
  {
    period: "May — Aug 2025",
    status: "NSERC USRA · TREC 2025",
    role: "Machine Learning Research Assistant · MALNIS Lab",
    title: "Biomedical retrieval & citation grounding",
    description: "Built multi-stage lexical and dense retrieval, RRF fusion, MonoT5 reranking, adaptive evidence retrieval, and citation-validation pipelines for biomedical question answering.",
    detail: "TREC 2025 proceedings paper: “Dal@TREC25: Improving Biomedical QA with Adaptive Retrieval and Multi-Stage RAG” — Jitansh Arora, Aman Jaiswal, Dr. Juan Ramirez-Orta, and Dr. Evangelos Milios.",
    link: { label: "Read paper", href: "https://trec.nist.gov/pubs/trec34/papers/dal.biogen.pdf" },
  },
  {
    period: "August — December 2024",
    role: "Research Assistant · RAISE Lab",
    title: "AI-assisted software engineering",
    description: "Explored generative-AI applications in software engineering, including AI-assisted code review and related literature.",
  },
  {
    period: "Sep 2023 — Dec 2025",
    status: "Team lead",
    role: "On-Board Computing · MANTIS CubeSat / CUBICS",
    title: "Onboard computing & AI",
    description: "Progressed from developer to team lead for embedded image analysis, hardware integration, fault handling, command integration, and subsystem testing on a Galaxia Raven / Jetson Nano platform.",
    detail: "Mentored five junior developers, coordinated with C&DH, ADCS, and payload teams, and contributed technical material across two Critical Design Reviews.",
  },
];

export const skillGroups = [
  { label: "Languages", items: ["Python", "C++", "C", "C#", "Go", "Java", "TypeScript", "JavaScript", "SQL", "Bash", "Ruby"] },
  { label: "Backend & distributed", items: ["gRPC", "RPC", "Flask", "Node.js", "Express", "REST", "TCP/IP", "SQLite", "MongoDB"] },
  { label: "Infrastructure", items: ["Linux", "Kubernetes", "Docker", "Helm", "GitLab CI/CD", "Prometheus", "HPC", "GitHub Actions"] },
  { label: "Testing & quality", items: ["pytest", "E2E testing", "Integration testing", "Test automation", "TDD", "Ranorex", "TestRail", "Sanitizers"] },
  { label: "ML, data & retrieval", items: ["PyTorch", "TensorFlow", "TensorRT", "ONNX", "CUDA", "NumPy", "pandas", "RAG", "BM25", "FAISS", "vLLM", "LangChain"] },
  { label: "Embedded & space", items: ["Jetson", "Embedded Linux", "OpenC3", "GNSS", "GPIO", "UART", "Telemetry", "Computer vision"] },
] as const;
