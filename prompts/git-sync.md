---
description: Manually run git sync — commit, pull, push the current repo (and submodules if any)
---
Run a full manual git sync for the current repository:

1. Detect the repo root: `REPO=$(git rev-parse --show-toplevel)`
2. Determine the sync branch: `BRANCH=$(git branch --show-current)`
3. Check for uncommitted changes and auto-commit if any:
   ```bash
   cd "$REPO"
   if ! git diff --quiet --ignore-submodules=dirty || ! git diff --cached --quiet --ignore-submodules=dirty || [ -n "$(git ls-files --others --exclude-standard)" ]; then
     git add -A
     git -c commit.gpgsign=false commit -m "auto: manual sync $(date '+%Y-%m-%d %H:%M')"
   fi
   ```
4. Pull with rebase: `git -c commit.gpgsign=false pull --rebase --autostash origin "$BRANCH"`
5. If pull fails (diverged or conflict):
   - Abort rebase: `git rebase --abort`
   - Fetch: `git fetch origin`
   - Hard-reset: `git reset --hard "origin/$BRANCH"`
   - Re-commit any local changes that were lost
   - Push: `git push origin "$BRANCH"`
6. Push if ahead: `git push origin "$BRANCH"`
7. If the repo has submodules (`.gitmodules` exists):
   - Update submodules: `git submodule update --init --recursive`
   - For each writable submodule, commit + push changes inside it first
   - Commit any updated submodule pointers: `git add . && git -c commit.gpgsign=false commit -m "auto: sync submodule pointers $(date '+%Y-%m-%d %H:%M')" || true`
   - Push again if submodule pointers changed
8. Show final status: `git status --short`
