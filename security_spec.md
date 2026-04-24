# Security Spec for SmartWealth

## Data Invariants
1. All documents must belong to the authenticated user (`userId == request.auth.uid`).
2. Users can only read and write their own documents.
3. Timestamps should be server-generated where possible.
4. Amounts and numbers must be valid (non-negative where appropriate).

## The Dirty Dozen Payloads
1. Trying to read another user's profile.
2. Trying to update another user's transactions.
3. Creating a transaction with someone else's `userId`.
4. Creating a stock holding with a negative share count.
5. Updating a savings goal current amount to be more than the target (Wait, that might be allowed, but we should check types).
6. Injecting extra fields into a Reminder.
7. Deleting a transaction that belongs to another user.
8. Listing all transactions without filtering by `userId`.
9. Updating `userId` on an existing document (Immutability).
10. Creating a document with a junk-character ID.
11. Setting `isPaid` on a reminder belonging to someone else.
12. Updating `balance` directly on the user profile without being the owner.

## The Test Runner (firestore.rules)
I will implement validation helpers for each entity.
