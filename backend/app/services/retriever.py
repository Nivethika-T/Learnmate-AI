import math
import re
from typing import List, Dict, Any, Optional
import numpy as np

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
    "to", "was", "were", "will", "with", "which", "who", "whom", "this"
}

def tokenize(text: str) -> List[str]:
    """Tokenize, lowercase, and filter common stopwords."""
    words = re.findall(r'\b[a-zA-Z0-9_]{3,}\b', text.lower())
    return [w for w in words if w not in STOP_WORDS]

class BM25Retriever:
    """
    In-memory BM25 Okapi and TF-IDF retriever for deterministic, high-accuracy keyword search.
    Provides fast, reliable RAG retrieval without requiring paid API keys or heavy vector indexes.
    """
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_len = []
        self.avg_doc_len = 0.0
        self.corpus_size = 0
        self.doc_freqs = []
        self.idf = {}
        self.documents = []

    def fit(self, documents: List[Dict[str, Any]]):
        """Fit the retriever with a list of chunk dicts having 'text_content'."""
        self.documents = documents
        self.corpus_size = len(documents)
        if self.corpus_size == 0:
            return

        self.doc_len = []
        self.doc_freqs = []
        df = {}

        for doc in documents:
            text = doc.get("text_content", "")
            tokens = tokenize(text)
            self.doc_len.append(len(tokens))
            frequencies = {}
            for token in tokens:
                frequencies[token] = frequencies.get(token, 0) + 1
            self.doc_freqs.append(frequencies)
            for token in set(tokens):
                df[token] = df.get(token, 0) + 1

        self.avg_doc_len = sum(self.doc_len) / max(1, self.corpus_size)

        self.idf = {}
        for token, freq in df.items():
            # BM25 IDF formulation
            self.idf[token] = math.log(1 + (self.corpus_size - freq + 0.5) / (freq + 0.5))

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Searches documents and returns top_k most relevant chunks with citations."""
        if self.corpus_size == 0:
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            # Fallback to returning top chunks
            return [
                {
                    **doc,
                    "relevance_score": 0.5
                } for doc in self.documents[:top_k]
            ]

        scores = []
        for idx in range(self.corpus_size):
            score = 0.0
            doc_freq = self.doc_freqs[idx]
            d_len = self.doc_len[idx]

            for q_tok in query_tokens:
                if q_tok in doc_freq:
                    f = doc_freq[q_tok]
                    idf_val = self.idf.get(q_tok, 0.1)
                    denom = f + self.k1 * (1 - self.b + self.b * (d_len / max(1, self.avg_doc_len)))
                    score += idf_val * (f * (self.k1 + 1)) / max(0.001, denom)

            # Bonus for exact substring match
            doc_text = self.documents[idx].get("text_content", "").lower()
            if query.lower() in doc_text:
                score += 3.0

            scores.append((idx, score))

        # Sort by score descending
        scores.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in scores[:top_k]:
            if score > 0.01:
                doc = dict(self.documents[idx])
                # Normalize relevance score between 0.0 and 1.0
                norm_score = round(min(0.99, max(0.0, 1.0 - math.exp(-score / 4.0))), 3)
                doc["relevance_score"] = norm_score
                results.append(doc)

        return results

def search_chunks(
    chunks: List[Dict[str, Any]], 
    query: str, 
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """Convenience helper to search a collection of chunk dicts."""
    if not chunks:
        return []
    retriever = BM25Retriever()
    retriever.fit(chunks)
    return retriever.search(query, top_k=top_k)
