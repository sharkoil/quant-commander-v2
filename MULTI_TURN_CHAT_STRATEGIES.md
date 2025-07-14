# Strategies for Multi-Turn Chat with Data and Function Calling

## Introduction

This document outlines two distinct strategies to implement a multi-turn chat experience that integrates with a data context (loaded CSVs and documents) and utilizes function calling. The primary goal is to ensure extremely high accuracy, which is critical for a financial application. A key requirement for either strategy is a user confirmation step when the system's confidence in an action is low.

The "data context" is assumed to be composed of:
1.  **Structured Data:** A CSV file loaded into the application's memory or a temporary data store.
2.  **Unstructured Data:** Text-based documents (e.g., PDFs, DOCX) uploaded by the user.

---

## Strategy 1: Stateless with Full Context History

This approach prioritizes accuracy by providing the LLM with the most complete picture possible on every turn. It is "stateless" from the perspective of the chat application's backend; no complex state management is needed between turns.

### How It Works

1.  **Initial Load:** The CSV data is loaded and potentially pre-processed (e.g., column names, data types identified). Unstructured documents are parsed into text chunks. This data can be held in memory or a temporary vector store.
2.  **User Query:** The user submits a message.
3.  **Context Assembly:** For *every single turn*, the application assembles a complete prompt that includes:
    *   The full conversation history (all user and assistant messages).
    *   A summary or schema of the available structured data (e.g., CSV column headers, data types, and a few sample rows).
    *   Relevant chunks from the unstructured documents (retrieved via a similarity search against the current user query and recent history).
    *   A list of available functions the LLM can call.
4.  **LLM Call:** The entire payload is sent to the LLM. The LLM uses the history and data context to understand the query and either generates a natural language response or calls a function.
5.  **Function Execution:** If a function is called (e.g., `calculate_total_revenue`, `find_top_n_expenses`), the application executes it against the data source and returns the result to the LLM in a subsequent call.
6.  **Loop:** The process repeats, with the latest user query, LLM response, and function results appended to the history.

### Pros

*   **Highest Accuracy:** The LLM has access to the complete, unaltered conversation history. There is no risk of information being lost through summarization, which is critical for financial calculations where a detail from a previous turn (e.g., "exclude returns from Q2") is vital.
*   **Simple Implementation:** The backend logic is straightforward. It primarily involves concatenating strings and making API calls. There is no need to manage a complex state machine for the conversation.
*   **Easy Debugging:** Since each turn is self-contained, debugging is easier. You can inspect the exact payload sent to the LLM for any given turn to understand its behavior.

### Cons

*   **High Cost & Latency:** Sending the full history on every turn can be expensive, as the number of tokens grows with each message. This also increases the API response time (latency).
*   **Context Window Limitation:** This strategy is vulnerable to the LLM's context window limit. Long conversations will eventually exceed the maximum number of tokens, causing the process to fail.
*   **Redundant Processing:** The LLM re-processes the same historical tokens repeatedly, which is inefficient.

### Complexity

*   **Low.** This is the most direct and easiest strategy to implement reliably.

---

## Strategy 2: Stateful with Context Summarization & Management

This approach optimizes for efficiency and scalability by maintaining a "chat session state" on the backend and using summarization to manage the context sent to the LLM.

### How It Works

1.  **Initial Load:** Same as Strategy 1. A dedicated, temporary store (like a Redis cache or a simple file-based session store) is created for this chat session.
2.  **User Query:** The user submits a message.
3.  **State Management:** The application maintains a state object for the conversation. This object contains:
    *   A running summary of the conversation.
    *   Key entities extracted from the conversation (e.g., specific date ranges, client names, financial metrics mentioned).
    *   The result of the last function call.
4.  **Context Assembly:** For each new turn, the application sends a more concise prompt to the LLM, including:
    *   The *summary* of the conversation, not the full history.
    *   The extracted key entities.
    *   The last 2-3 turns of the conversation verbatim for immediate context.
    *   Relevant data chunks and function definitions, similar to Strategy 1.
5.  **LLM Call & Summarization:** After the LLM responds (or calls a function), a *separate* LLM call is made with the latest turn's transcript, asking it to update the conversation summary and list of key entities.
6.  **State Update:** The backend application receives the updated summary and entities and saves them to the session store.
7.  **Loop:** The process repeats, using the continuously updated state to inform the next turn.

### Pros

*   **Cost-Effective & Scalable:** By sending summaries instead of the full history, the token count per call remains low and predictable. This significantly reduces costs and allows for virtually infinite conversation length.
*   **Lower Latency:** Smaller payloads result in faster API response times.
*   **Structured Memory:** The explicit extraction of entities can help the LLM "remember" key pieces of information more reliably than just having them in a long, unstructured history.

### Cons

*   **Risk of Information Loss:** **This is the most significant drawback.** The summarization step is imperfect. An LLM might fail to include a subtle but critical detail in the summary (e.g., "use the *accrual* basis," "ignore transactions under $50"). In a financial context, this loss of fidelity can lead to dangerously inaccurate results.
*   **High Implementation Complexity:** This system is much harder to build. It requires robust state management, multiple LLM calls per turn (one for the answer, one for summarization), and careful prompt engineering to ensure the summary is accurate.
*   **Difficult Debugging:** If the model produces an error, it could be due to the current prompt, the summary, or the extracted entities. Tracing the root cause is more complex.

### Complexity

*   **High.** This involves a sophisticated backend architecture for state and session management.

---

## Recommendation and Confidence Safeguard

### Recommendation

For a financial application where **accuracy is the absolute highest priority**, the recommended approach is **Strategy 1: Stateless with Full Context History**.

**Justification:** The risk of information loss in Strategy 2's summarization step is too great for a domain where precision is paramount. A single misinterpreted or dropped detail can invalidate an entire analysis. While Strategy 1 is more expensive and less scalable for very long conversations, its guarantee of providing full context to the LLM on every turn makes it the only choice for ensuring maximum accuracy. The financial cost of a bad decision based on a faulty summary far outweighs the API token costs.

### Crucial Safeguard: User Confirmation for Low-Confidence Actions

Regardless of the chosen strategy, a mandatory confirmation layer must be implemented to prevent the system from executing "nonsense" or performing actions when its confidence is low.

**Implementation:**

1.  **Prompt Engineering:** The system prompt that defines the LLM's task must explicitly instruct it to evaluate its own confidence. When it is asked to perform an action (like a calculation or data filtering) but is uncertain about the user's intent or the parameters, it should not proceed.
2.  **Structured Response:** Instead of executing, the LLM should return a specific JSON object indicating low confidence.
    ```json
    {
      "action": "calculate_revenue",
      "parameters": { "period": "Q2 2024", "exclude_returns": true },
      "confidence": "low",
      "confirmation_required": true,
      "explanation": "You mentioned 'Q2' and later 'the second quarter', and you also mentioned 'ignore chargebacks'. To ensure accuracy, I am assuming 'ignore chargebacks' also means I should exclude product returns from the calculation. Is this correct?"
    }
    ```
3.  **Application Logic:** The application backend must parse the LLM's response. If `confirmation_required` is `true`, it must not execute the function call.
4.  **User Interface:** The frontend receives this structured response and displays a confirmation dialog to the user, presenting the `explanation` and asking for a "Yes/No" confirmation before proceeding with the `action` and `parameters`. This puts the user in control and serves as a final, critical check.
