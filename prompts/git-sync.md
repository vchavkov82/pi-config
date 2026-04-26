---
description: Manually run git sync — commit, pull, push the current repo (and submodules if any)
---
Run a full manual git sync for the current repository:

1. Detect the repo root: `REPO=$(git rev-parse --show-toplevel)`
2. Determine the sync branch: `BRANCH=$(git branch --show-current)`
3. Remove stale submodule gitlinks that no longer have `.gitmodules` mappings, then auto-commit uncommitted changes if any:
   ```bash
   cd "$REPO"
   while IFS= read -r path; do
     [ -z "$path" ] && continue
     if [ -f .gitmodules ] && git config -f .gitmodules --get-regexp '^submodule\..*\.path$' 2>/dev/null | awk '{print $2}' | grep -Fxq -- "$path"; then
       continue
     fi
     git rm --cached -q -- "$path"
     rmdir "$path" 2>/dev/null || true
   done < <(git ls-files --stage | awk '$1 == "160000" {print $4}')
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
   - Before updating, remove stale gitlinks missing from `.gitmodules` with the cleanup command from step 3 to prevent `fatal: no submodule mapping found...`
   - Update submodules: `git submodule update --init --recursive`
   - For each writable submodule, commit + push changes inside it first
   - Commit any updated submodule pointers: `git add . && git -c commit.gpgsign=false commit -m "auto: sync submodule pointers $(date '+%Y-%m-%d %H:%M')" || true`
   - Push again if submodule pointers changed
8. Show final status: `git status --short`
