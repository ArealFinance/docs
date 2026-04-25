# Futarchy V1 — Design Decisions & Open Questions

> This document captures deliberate design decisions made during Layer 2 implementation,
> known limitations of V1, and questions that must be revisited before mainnet.
>
> Created: 2026-04-11 (after 6 rounds of architect/security/tester/PM review)

---

## Deliberate V1 Design Decisions

### 1. Irrevocable Approved Proposals

**Decision:** Once a proposal reaches `Approved` status, it cannot be cancelled. Only `Active` proposals can be cancelled.

**Rationale:** In V1, the same authority both creates and approves proposals. Approval is an explicit, intentional action by a single trusted signer. Allowing revocation of approved proposals would add complexity without clear V1 benefit.

**Risk:** If the authority approves a proposal and then transfers authority to a new party (e.g., multisig), the old approved proposals remain executable by anyone, forever. The new authority has no mechanism to revoke them.

**Attack scenario:**
1. Malicious authority creates + approves MintOt proposal (large amount, destination = attacker wallet)
2. Authority is transferred to a legitimate new party
3. Attacker (or anyone) calls `execute_proposal` — tokens minted to attacker

**Current mitigation (V1):** The team controls both authority and approval. Authority transfer only happens after all approved proposals have been executed or accounted for. This is an operational procedure, not a technical safeguard.

**⚠️ OPEN QUESTION: What mechanism should V2 introduce?**
- Option A: `revoke_proposal` instruction — current authority can cancel Approved proposals
- Option B: Timelock — approved proposals become executable only after N hours
- Option C: Authority era nonce — proposals carry a `config_version`; authority transfer increments version, invalidating all prior proposals
- Option D: Expiry timestamp — proposals have `valid_until` field, rejected after expiry

---

### 2. Approved Proposals Execute Even When Governance Is Paused

**Decision:** `execute_proposal` does NOT check `is_active`. Approved proposals are always executable regardless of governance state.

**Rationale:** If governance pause could block execution of already-approved proposals, a malicious authority could:
1. Approve a self-serving proposal
2. Immediately pause governance
3. Only they know the proposal exists; they execute it later when convenient

By making execution unstoppable once approved, we ensure that approvals are genuine commitments, not reversible promises.

**Risk:** If the authority discovers a vulnerability in an approved proposal, they cannot halt execution by pausing governance. They would need to either:
- Execute it themselves before an attacker does (race)
- Upgrade the program via Squads multisig (emergency)

**⚠️ OPEN QUESTION: Should there be an emergency halt for execution?**
- The `is_active` field exists but cannot be toggled (no pause/unpause instruction)
- Adding pause would require adding toggle instructions gated by authority
- But see Decision #1 — if we add revoke, pause may be unnecessary

---

### 3. No Proposal Expiry

**Decision:** Proposals have no `valid_until` timestamp. An approved proposal can be executed years after approval.

**Rationale:** V1 simplicity. The authority approves with current context; execution is immediate in practice.

**Risk:** Stale approved proposals. Market conditions, team composition, or token economics may change, making an old proposal harmful.

**⚠️ OPEN QUESTION: Should V2 add expiry?**
- Simple: add `valid_until: i64` field to Proposal, reject in `execute_proposal` if `Clock::unix_timestamp > valid_until`
- Default: authority sets expiry at creation time (e.g., 7 days, 30 days)
- Zero = no expiry (backwards compatible)

---

### 4. No Max Supply Enforcement on OT Minting

**Decision:** The OT contract has no `max_supply` field. The governance authority (via Futarchy) can mint unlimited tokens up to `u64::MAX` across multiple proposals.

**Rationale:** Different OT projects may have different supply models. Some may want fixed supply, others elastic. The contract doesn't enforce a model.

**Risk:** Compromised governance = unlimited dilution. Combined with Decision #1, a malicious authority could pre-approve multiple large MintOt proposals before transferring authority.

**⚠️ OPEN QUESTION: Should OT have a configurable max_supply?**
- Set at `initialize_ot` time (immutable)
- `mint_ot` checks `total_minted + amount <= max_supply`
- Zero = unlimited (backwards compatible)

---

### 5. No Pause/Unpause Instruction

**Decision:** `is_active` field exists in FutarchyConfig but no instruction modifies it. Governance cannot be paused.

**Rationale:** V1 has no emergency scenario that pausing would solve (see Decision #2 — execution can't be paused anyway). Adding pause without revoke would create false security.

**⚠️ OPEN QUESTION: Should V2 add pause?**
- Only useful if combined with revoke (Decision #1)
- Without revoke, pause only blocks new proposals — approved ones still execute
- With revoke + pause: authority can halt all new activity AND cancel pending proposals

---

### 6. Cancel Only Works on Active Proposals

**Decision:** `cancel_proposal` requires `status == Active`. Cannot cancel Approved proposals.

**Rationale:** Direct consequence of Decision #1. State machine: `Active → Approved → Executed` or `Active → Cancelled`. No other transitions.

**Spec reference:** futarchy.mdx: "Cannot cancel already approved or executed proposals."

---

### 7. Authority Transfer Does Not Invalidate Existing Proposals

**Decision:** When authority is transferred (propose + accept), all existing proposals retain their current status. Active proposals can be approved by the new authority. Approved proposals can be executed by anyone.

**Rationale:** Proposals are governance decisions, not personal actions of a specific authority. A proposal approved by Authority A is still a valid governance decision even after Authority B takes over.

**⚠️ OPEN QUESTION: Should authority transfer invalidate Active proposals?**
- Pro: clean slate for new authority
- Con: legitimate proposals in progress would need to be recreated
- Option: add `authority_era: u64` to config, increment on transfer, check in approve/execute

---

## V2 Upgrade Considerations

When upgrading to V2 (prediction markets), the following changes are recommended based on the findings above:

### Priority 1: Proposal Lifecycle Safety
- Add `revoke_proposal` instruction (authority can cancel Approved proposals)
- Add `valid_until` expiry field to Proposal
- Add `authority_era` to invalidate stale proposals on authority transfer

### Priority 2: Supply Controls
- Add `max_supply` to OtConfig (set at init, enforced at mint)

### Priority 3: Emergency Controls
- Add `pause_governance` / `unpause_governance` instructions
- Pause should block new proposals AND execution (unlike V1 where execution is always allowed)

### Priority 4: Decentralized Governance
- Replace authority-based approval with prediction market resolution
- Add `min_proposal_ot_balance` threshold for proposal creation
- Add proposal deposit (refundable on execution/cancel) to prevent spam
- Add per-proposer cooldown

---

## Review History

| Date | Round | Participants | Outcome |
|------|-------|-------------|---------|
| 2026-04-10 | Round 2 | Architect, Security, Tester, PM | CRITICAL fixed (cross-config replay) |
| 2026-04-10 | Round 3 | Architect, Security, Tester, PM | All PASS, MEDIUM fixed (ot_mint validation) |
| 2026-04-10 | Round 4 | Architect, Security, Tester, PM | PDA squatting MEDIUM found + fixed |
| 2026-04-10 | Round 5 | Architect, Security, Tester, PM | E2E context P1 found + fixed |
| 2026-04-11 | Round 6 | Architect, Security, Tester, PM | All PASS. Design decisions documented here |

Total: 6 rounds, 24 agent reviewers, 0 remaining exploitable vulnerabilities.
