import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.resource import LearningResource, ResourceChunk
from app.models.learning_path import TopicMastery, LearningRecommendation
from app.models.quiz import Quiz, QuizQuestion
from app.services.chunker import create_chunks_from_sections

DEMO_RESOURCES = [
    {
        "title": "Operating Systems: Virtual Memory & Paging",
        "original_filename": "CS301_Virtual_Memory_Architecture.pdf",
        "file_type": "pdf",
        "file_size_bytes": 142800,
        "page_count": 4,
        "sections": [
            {
                "page_or_slide_num": 1,
                "section_title": "Virtual Memory Overview & Paging",
                "text": (
                    "Virtual memory is a memory management capability of an operating system that uses hardware and software to allow a computer "
                    "to compensate for physical memory shortages by temporarily transferring data from random access memory (RAM) to disk storage. "
                    "Paging divides virtual memory into fixed-size blocks called pages, typically 4 Kilobytes in modern x86-64 architectures. "
                    "Physical memory is similarly divided into matching fixed-size blocks called page frames. "
                    "When a process references a virtual memory address, the Memory Management Unit (MMU) translates the virtual address into a physical frame address."
                )
            },
            {
                "page_or_slide_num": 2,
                "section_title": "Page Tables and TLB Translation",
                "text": (
                    "Every process maintains its own Page Table, which maps virtual page numbers (VPN) to physical page frame numbers (PFN). "
                    "Because accessing memory twice for every reference (once for the page table, once for data) incurs significant overhead, "
                    "modern CPUs utilize a Translation Lookaside Buffer (TLB). The TLB is an on-chip, highly associative hardware cache of recent page translations. "
                    "A TLB hit yields address translation in a single clock cycle, whereas a TLB miss forces a page table walk in main memory."
                )
            },
            {
                "page_or_slide_num": 3,
                "section_title": "Page Fault Handling & Demand Paging",
                "text": (
                    "In demand paging, pages are only loaded into physical memory when referenced by an executing instruction. "
                    "If a process attempts to access a page marked invalid or not present in physical RAM, the CPU hardware generates a page fault interrupt. "
                    "The operating system trap handler suspends the offending process, locates the requested page on secondary swap space, "
                    "allocates a free physical frame, initiates disk I/O, updates the process page table to valid, and restarts the instruction."
                )
            },
            {
                "page_or_slide_num": 4,
                "section_title": "Thrashing & Page Replacement Algorithms",
                "text": (
                    "When physical memory is completely occupied, the operating system must evict an existing page to accommodate a new one. "
                    "Common page replacement algorithms include Least Recently Used (LRU), First-In First-Out (FIFO), and the Second-Chance Clock algorithm. "
                    "Thrashing occurs when an operating system spends more time servicing page faults and swapping pages back and forth between disk and RAM "
                    "than executing actual user processes. Thrashing is mitigated by tracking the process working set size and adjusting multiprogramming degree."
                )
            }
        ]
    },
    {
        "title": "Machine Learning Fundamentals & Neural Networks",
        "original_filename": "AI101_Lecture_Slides_Neural_Nets.pptx",
        "file_type": "pptx",
        "file_size_bytes": 284500,
        "page_count": 3,
        "sections": [
            {
                "page_or_slide_num": 1,
                "section_title": "Supervised Learning & Loss Optimization",
                "text": (
                    "Supervised machine learning algorithms learn an approximation function f(X) -> y from labeled training datasets. "
                    "The model measures discrepancy between predicted outputs and ground truth targets using a loss function, such as Mean Squared Error (MSE) "
                    "for continuous regression or Categorical Cross-Entropy for multi-class classification. "
                    "Parameters are iteratively updated in the direction of steepest negative gradient using Stochastic Gradient Descent (SGD) and Adam optimizers."
                )
            },
            {
                "page_or_slide_num": 2,
                "section_title": "Overfitting, Underfitting & Regularization",
                "text": (
                    "A fundamental challenge in machine learning is generalization to unseen test data. "
                    "Overfitting occurs when a model memorizes random noise in the training set, exhibiting low training error but high test error. "
                    "Underfitting occurs when a model is too simplistic to capture underlying patterns. "
                    "Standard regularization techniques include L1 Lasso regularization (inducing sparsity), L2 Ridge weight decay (penalizing large coefficients), "
                    "and Dropout in deep neural networks (randomly deactivating neurons during forward passes)."
                )
            },
            {
                "page_or_slide_num": 3,
                "section_title": "Backpropagation & Non-Linear Activations",
                "text": (
                    "Multilayer perceptrons require non-linear activation functions to approximate complex non-linear decision boundaries. "
                    "The Rectified Linear Unit (ReLU), defined as max(0, x), is the standard choice for hidden layers because it avoids the vanishing gradient problem. "
                    "Backpropagation computes the partial derivative of the scalar loss with respect to every weight parameter by systematically applying the calculus chain rule "
                    "from the output layer backward toward the input layer."
                )
            }
        ]
    },
    {
        "title": "Distributed Systems: Concurrency & Deadlocks",
        "original_filename": "CS402_Lecture_Transcript.srt",
        "file_type": "srt",
        "file_size_bytes": 65000,
        "page_count": 2,
        "sections": [
            {
                "page_or_slide_num": 1,
                "section_title": "The Four Coffman Conditions for Deadlock",
                "timestamp_mark": "00:02:15 - 00:06:40",
                "text": (
                    "In concurrent programming and operating systems, a deadlock is a permanent state where two or more threads are unable to proceed "
                    "because each is waiting for a resource locked by another. A deadlock can only arise if all four Coffman conditions hold simultaneously: "
                    "1) Mutual Exclusion: resources cannot be shared; 2) Hold and Wait: threads hold assigned resources while requesting new ones; "
                    "3) No Preemption: resources cannot be forcibly seized; and 4) Circular Wait: a closed loop of threads exists where each waits for the next."
                )
            },
            {
                "page_or_slide_num": 2,
                "section_title": "Deadlock Avoidance & Banker's Algorithm",
                "timestamp_mark": "00:07:10 - 00:12:30",
                "text": (
                    "Edsger Dijkstra developed the Banker's Algorithm for deadlock avoidance in multi-resource environments. "
                    "Before allocating any requested resource, the operating system simulates whether granting the request leaves the system in a safe state. "
                    "A state is considered safe if there exists an execution sequence of processes where all processes can finish without triggering circular wait. "
                    "If granting the request leads to an unsafe state, the requesting thread is forced to wait."
                )
            }
        ]
    }
]

def seed_demo_data(db: Session, user_id: int):
    """Populates initial learning resources, chunks, topic mastery, and quizzes for demo user."""
    # Check if already seeded
    existing = db.query(LearningResource).filter(LearningResource.user_id == user_id).first()
    if existing:
        return

    seeded_resources = []
    for r_data in DEMO_RESOURCES:
        resource = LearningResource(
            user_id=user_id,
            title=r_data["title"],
            original_filename=r_data["original_filename"],
            file_type=r_data["file_type"],
            file_size_bytes=r_data["file_size_bytes"],
            page_or_slide_count=r_data["page_count"],
            status="processed"
        )
        db.add(resource)
        db.flush()

        chunks = create_chunks_from_sections(r_data["sections"])
        for idx, ch in enumerate(chunks):
            chunk = ResourceChunk(
                resource_id=resource.id,
                chunk_index=idx,
                text_content=ch["text_content"],
                page_or_slide_num=ch.get("page_or_slide_num", 1),
                section_title=ch.get("section_title", "General"),
                timestamp_mark=ch.get("timestamp_mark")
            )
            db.add(chunk)

        resource.total_chunks = len(chunks)
        seeded_resources.append(resource)

    # Seed Initial Topic Masteries for rich dashboard analytics
    topics_seed = [
        ("Virtual Memory Architecture", "Computer Science", "Mastered", 88.0, 5, 4),
        ("TLB and Page Table Walk", "Computer Science", "In Progress", 66.7, 3, 2),
        ("Page Replacement & Thrashing", "Computer Science", "In Progress", 40.0, 5, 2),
        ("Supervised Learning & Loss", "Artificial Intelligence", "Mastered", 100.0, 4, 4),
        ("Backpropagation & Gradients", "Artificial Intelligence", "In Progress", 60.0, 5, 3),
        ("Deadlock Prevention & Banker's Algorithm", "Operating Systems", "Not Started", 0.0, 0, 0),
    ]

    for t_name, subj, level, score, total_att, corr_att in topics_seed:
        mastery = TopicMastery(
            user_id=user_id,
            subject=subj,
            topic_name=t_name,
            mastery_level=level,
            mastery_score=score,
            total_attempts=total_att,
            correct_attempts=corr_att,
            last_practiced_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(mastery)

    # Seed Initial Prioritized Recommendations
    recs_seed = [
        ("Page Replacement & Thrashing", "Reinforce Weak Topic: Page Replacement Algorithms", "Your accuracy on Thrashing & LRU is currently 40%. Practice an adaptive quiz to master page faults and working set sizes.", "high", "quiz"),
        ("Backpropagation & Gradients", "Master Backpropagation Chain Rule", "You are at 60% mastery on gradient computation. Review non-linear activation functions.", "medium", "quiz"),
        ("Virtual Memory Architecture", "Spaced Review: Virtual Memory", "Maintain your 88% mastery with a quick refresher drill.", "low", "revision"),
        ("Deadlock Prevention & Banker's Algorithm", "Explore New Topic: Deadlock Coffman Conditions", "Start practicing Banker's Algorithm and Coffman conditions from your video lecture transcript.", "medium", "read"),
    ]

    for t_name, title, desc, prio, act in recs_seed:
        rec = LearningRecommendation(
            user_id=user_id,
            topic_name=t_name,
            title=title,
            description=desc,
            priority=prio,
            action_type=act,
            resource_id=seeded_resources[0].id if seeded_resources else None
        )
        db.add(rec)

    # Seed a Completed Quiz with questions and scores for immediate dashboard charts
    first_res = seeded_resources[0] if seeded_resources else None
    demo_quiz = Quiz(
        user_id=user_id,
        resource_id=first_res.id if first_res else None,
        title="Virtual Memory Adaptive Assessment",
        topic="Virtual Memory Architecture",
        initial_difficulty="Medium",
        current_difficulty="Hard",
        status="completed",
        score=80.0,
        total_questions=5,
        correct_count=4,
        time_spent_seconds=145,
        consecutive_correct=3,
        consecutive_wrong=0,
        weak_topics_json=json.dumps(["Page Replacement & Thrashing"]),
        created_at=datetime.utcnow() - timedelta(hours=2),
        completed_at=datetime.utcnow() - timedelta(hours=1, minutes=50)
    )
    db.add(demo_quiz)
    db.flush()

    # Seed demo quiz questions
    q_data = [
        ("What hardware component translates virtual addresses to physical frame addresses?", ["Memory Management Unit (MMU)", "ALU", "Cache Controller", "Bus Controller"], 0, "MMU translates virtual page numbers to physical page frame numbers.", True, "Medium"),
        ("What is the typical page size in modern x86-64 operating systems?", ["4 Kilobytes", "64 Megabytes", "128 Bytes", "1 Gigabyte"], 0, "Modern x86-64 uses standard 4KB pages.", True, "Medium"),
        ("What occurs when a referenced page is marked not present in physical RAM?", ["Page Fault Interrupt", "Kernel Panic", "CPU Halt", "Silent Cache Eviction"], 0, "A page fault trap is triggered, initiating disk I/O.", True, "Hard"),
        ("Why does the CPU use a Translation Lookaside Buffer (TLB)?", ["To cache virtual-to-physical address mappings for single-cycle lookup", "To compress disk images", "To replace RAM", "To manage network queues"], 0, "TLB caches address translations, avoiding page table walks in RAM.", True, "Hard"),
        ("Which algorithm provides theoretically optimal page replacement?", ["Belady's Optimal (evicting page used furthest in the future)", "FIFO", "Random", "Clock"], 0, "Belady's optimal evicts the page that will not be used for the longest time.", False, "Hard")
    ]

    for idx, (q_txt, opts, c_idx, exp, is_corr, diff) in enumerate(q_data):
        qq = QuizQuestion(
            quiz_id=demo_quiz.id,
            question_order=idx + 1,
            topic="Virtual Memory Architecture",
            difficulty=diff,
            question_text=q_txt,
            options_json=json.dumps(opts),
            correct_option_index=c_idx,
            explanation=exp,
            citation_json=json.dumps({"filename": first_res.original_filename if first_res else "CS301.pdf", "page_or_slide": idx + 1, "excerpt": exp}),
            user_selected_index=c_idx if is_corr else 1,
            is_correct=is_corr,
            time_taken_seconds=25
        )
        db.add(qq)

    db.commit()
