---
description: Manually run canonical git sync — auto-commit, pull/rebase, push, and refresh submodules
---
Run a full manual git sync through the maintained canonical brain entrypoint. Do not reimplement the sync steps in the prompt.

The canonical flow is responsible for resolving merge/rebase conflicts, auto-committing local changes, pulling/rebasing, pushing, refreshing writable submodules, updating parent submodule pointers, and leaving `git status --short --ignore-submodules=none` clean. The agent should invoke and verify that maintained flow, not spell out direct `git add`, `git commit`, `git pull`, or `git push` command sequences.

## Steps

1. Detect the repo root for reporting:
   ```bash
   REPO=$(git rev-parse --show-toplevel)
   cd "$REPO"
   echo "REPO=$REPO"
   ```

2. Ensure the repo is registered for auto-commit/autosync:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh register "$REPO"
   ```

3. Run the manual sync. This invokes the same maintained flow used by the timers, including conflict resolution, auto-commit, pull/rebase, push, writable submodule ordering, and parent submodule pointer handling:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh now
   ```

4. Inspect recent logs:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh logs 120
   ```

5. Verify the maintained flow left the repo clean, including submodules:
   ```bash
   git status --short --ignore-submodules=none
   ```

6. If sync fails, run the health check and report the specific failure before attempting repairs:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh check
   ```

Useful shortcuts when installed:

```bash
gas-register "$REPO"
gas-now
gas-logs 120
```
