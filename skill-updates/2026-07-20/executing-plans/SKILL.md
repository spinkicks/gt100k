---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell your human partner that Superpowers works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (such as Claude Code or Codex). If subagents are available, use superpowers:subagent-driven-development instead of this skill.

## Version-Control Ownership Preflight

Before setting up a worktree or running any version-control command, determine who owns branches, commits, and
integration for this run. If the user delegates those operations to an external harness or explicitly prohibits
version-control commands:

- use only the supplied workspace boundary;
- do not create worktrees, branches, commits, merges, or pull requests;
- write any requested handoff metadata for the harness;
- retain every code-quality, test, review, and verification gate that does not require version control.

Harness-managed execution changes ownership of repository operations, not the standard of evidence required for
the implementation.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with your human partner before starting
4. If no concerns: Create TodoWrite and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Step 3: Complete Development

After all tasks complete and verified:
- If the agent owns version control, announce: "I'm using the finishing-a-development-branch skill to complete this work."
- If the agent owns version control, use the required `superpowers:finishing-a-development-branch` sub-skill.
- If an external harness owns version control, follow the operator's handoff protocol instead and leave branch,
  commit, merge, and pull-request operations to that harness.

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- Partner updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Ensures an isolated workspace when the agent owns worktree setup
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Completes development when the agent owns version-control integration

In harness-managed mode, the supplied plan and workspace satisfy the first two prerequisites when the user says
they are authoritative; use the harness handoff in place of branch finishing.
