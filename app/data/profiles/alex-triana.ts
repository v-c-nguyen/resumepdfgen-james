import { BaseResumeProfile } from '../baseResumes';

export const profile: BaseResumeProfile = {
  name: "Alex Triana",
  resumeText: `
Staff Full-Stack Engineer | AI/ML Systems | Cloud-Native Applications
Alex Triana
alex.triana1028@outlook.com

+1 (430) 247 2975
Alvin, TX

Summary:
Staff Full-Stack Engineer with 12+ years of experience architecting distributed systems, AI-powered applications, and high-performance cloud services. Proficient in React, Node.js, Python, AWS, microservices, and event-driven architectures. Experienced in ML model integration, API performance optimization, and building real-time data platforms. Known for driving architectural decisions, enhancing system resilience, and leading cross-functional teams through complex technical challenges. 

Experience:
Staff Full-Stack Engineer at Cargo Express Freight, Remote: 01/2025 – Present
• Architected a fully custom, AI-enabled CRM platform using Node.js, TypeScript, PostgreSQL, AWS, and a modern React front end, modeled after SalesdashCRM but redesigned for scale.
• Built distributed backend systems with AWS Lambda, SQS/SNS, and event-driven pipelines supporting high-volume CRM operations.
• Developed end-to-end CRM modules (Accounts, Deals, Quotes, Activities) with granular RBAC, real-time timelines, reminders, and activity intelligence.
• Engineered fault-tolerant CRM ↔ TMS integrations using REST APIs plus fallback ETL pipelines syncing shipments, revenue, invoices, and margins.
• Designed analytics dashboards, reporting engines, sales leaderboards, and real-time insights powered by Redis caching and AWS RDS read replicas achieving sub-500ms performance.
• Delivered AI-driven features including automated email draft generation, lead-scoring ML models, and next-best-action intelligence integrated into workflows.
• Implemented LLM-powered summarization for notes, activity logs, and client communication, improving rep productivity and CRM data quality.
• Partnered with product and operations leadership to translate business logic into scalable architecture, defining technical roadmap and engineering standards.

Senior Software Engineer at Plaid, Remote: 03/2019 – 11/2024
• Architected and delivered large-scale, AI-powered financial intelligence APIs serving over 1 million end users across partner banks and fintech clients.
• Integrated Python ML pipelines with Node.js microservices to detect anomalies and fraud in transaction data using predictive scoring models and Kafka event streams.
• Enhanced backend performance by introducing asynchronous processing with Redis and AWS Lambda, boosting API throughput by 40% and cutting latency 25%.
• Collaborated with data science teams to productize ML models (fraud detection, customer segmentation) into RESTful APIs for real-time consumption.
• Developed full-stack dashboards in React + TypeScript for operational analytics, leveraging D3.js visualizations for insight into model performance and system health.
• Spearheaded DevOps modernization with GitHub Actions, Terraform, and AWS CDK, enabling automated environment provisioning and zero-downtime deployments.
• Mentored six engineers fostering adoption of full-stack, AI, and observability best practices across teams.
• Led architectural redesign toward a serverless-first platform, improving resilience and reducing AWS costs by 18% annually.

Senior Software Engineer at DoorDash, San Francisco, CA: 06/2016 – 02/2019
• Led full-stack development using React, Node.js, and GraphQL, supporting 500K+ daily active users with 99.99% uptime.
• Integrated AI-based route optimization using Python + TensorFlow, reducing delivery times by 20% and boosting logistical efficiency.
• Modernized backend to event-driven microservices with Kafka and AWS EKS, and introduced real-time data streaming for order tracking and notifications.

Software Engineer at Brex, Remote: 06/2013 – 05/2014
• Contributed to cloud infrastructure scaling containerizing legacy workloads to Kubernetes clusters, reducing deployment times from hours to minutes.
• Partnered with AI and analytics teams to integrate predictive insights into the consumer app, increasing customer retention by 15% through personalized offers.
• Mentored junior engineers led code reviews, and drove cross-functional initiatives in system design and performance optimization

Technical Skills:
• Frontend: React, Next.js, TypeScript, Redux, Tailwind CSS, Material UI, D3.js
• Backend : Node.js (Express, NestJS), Python (Django, FastAPI), .NET Core
• Cloud & DevOps: AWS (Lambda, S3, RDS, EKS, EC2), Docker, Kubernetes, GitHub Actions, Terraform
• AI/ML Integration: Python (scikit-learn, TensorFlow, PyTorch), REST/GraphQL APIs, Model Deployment on AWS Sagemaker
• Data & Messaging: PostgreSQL, MySQL, MongoDB, Redis, Kafka, Elasticsearch 
• Architecture: Microservices, Event-Driven Systems, Serverless, Domain-Driven Design, API Gateway
• Testing: Jest, React Testing Library, Cypress, PyTest

Education:
Bachelor of Science in Computer Science | ITT Technical Institute, Carmel, Indiana, USA | 2013
    `,
  pdfTemplate: 3
};
