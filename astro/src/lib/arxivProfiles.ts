export interface ArxivProfile {
  label: string;
  labelZh: string;
  summary: string;
  summaryZh: string;
  categories: string[];
  must_include: string[];
  boost_keywords: string[];
}

export const ARXIV_PROFILES: Record<string, ArxivProfile> = {
  ai_ml: {
    label: 'AI / ML / LLM',
    labelZh: 'AI / 机器学习 / LLM',
    summary: 'General machine learning, deep learning, and LLM research.',
    summaryZh: '通用机器学习、深度学习与 LLM 研究。',
    categories: ['cs.AI', 'cs.LG', 'cs.CL', 'stat.ML'],
    must_include: ['large language model', 'foundation model', 'diffusion model', 'agent', 'alignment', 'RLHF'],
    boost_keywords: ['GPT', 'LLaMA', 'Gemini', 'Claude', 'LoRA', 'RAG', 'chain-of-thought'],
  },
  cv: {
    label: 'Computer Vision',
    labelZh: '计算机视觉',
    summary: 'Image recognition, object detection, generative image models.',
    summaryZh: '图像识别、目标检测与图像生成模型。',
    categories: ['cs.CV', 'eess.IV'],
    must_include: ['computer vision', 'vision language model', 'multimodal', 'image generation', 'object detection'],
    boost_keywords: ['ViT', 'CLIP', 'SAM', 'DINO', 'diffusion', 'zero-shot'],
  },
  nlp: {
    label: 'NLP',
    labelZh: 'NLP / 自然语言处理',
    summary: 'Language understanding, generation, and reasoning.',
    summaryZh: '语言理解、生成与推理。',
    categories: ['cs.CL'],
    must_include: ['natural language processing', 'language model', 'text generation', 'summarization', 'reasoning'],
    boost_keywords: ['BERT', 'T5', 'instruction tuning', 'hallucination', 'benchmark'],
  },
  robotics: {
    label: 'Robotics',
    labelZh: '机器人学',
    summary: 'Robot learning, manipulation, and embodied autonomy.',
    summaryZh: '机器人学习、操作与具身自主。',
    categories: ['cs.RO'],
    must_include: ['robot', 'manipulation', 'reinforcement learning', 'autonomy', 'embodied'],
    boost_keywords: ['sim-to-real', 'policy learning', 'imitation learning', 'dexterous'],
  },
  medical_ai: {
    label: 'Medical AI',
    labelZh: '医疗 AI',
    summary: 'AI in medical imaging, clinical decision support, and healthcare.',
    summaryZh: 'AI 在医学影像、临床决策支持和医疗中的应用。',
    categories: ['cs.AI', 'q-bio.QM', 'eess.IV'],
    must_include: ['medical imaging', 'clinical', 'radiology', 'diagnosis', 'healthcare'],
    boost_keywords: ['MRI', 'CT', 'chest X-ray', 'histology', 'segmentation'],
  },
  hci: {
    label: 'HCI',
    labelZh: '人机交互',
    summary: 'Human-computer interaction and user experience research.',
    summaryZh: '人机交互与用户体验研究。',
    categories: ['cs.HC'],
    must_include: ['human-computer interaction', 'user interface', 'usability', 'interaction design'],
    boost_keywords: ['UX', 'accessibility', 'AR', 'VR', 'gesture'],
  },
  systems: {
    label: 'Systems',
    labelZh: '系统',
    summary: 'Operating systems, distributed systems, and networking.',
    summaryZh: '操作系统、分布式系统与网络。',
    categories: ['cs.OS', 'cs.DC', 'cs.NI'],
    must_include: ['distributed', 'operating system', 'scheduling', 'fault tolerance', 'concurrency'],
    boost_keywords: ['cloud', 'kubernetes', 'consensus', 'replication', 'microservice'],
  },
  theory: {
    label: 'Theory',
    labelZh: '理论计算机',
    summary: 'Algorithms, complexity, and discrete mathematics.',
    summaryZh: '算法、复杂性与离散数学。',
    categories: ['cs.CC', 'cs.DS', 'math.CO'],
    must_include: ['algorithm', 'complexity', 'approximation', 'graph theory', 'combinatorics'],
    boost_keywords: ['NP-hard', 'polynomial time', 'lower bound', 'online algorithm'],
  },
};
