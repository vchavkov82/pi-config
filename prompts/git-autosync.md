---
description: Add the current repo to auto-sync and verify the git automation timers
---
Add the current repository to the automated git sync system and verify timers:

1. Detect the repo: `REPO=$(git rev-parse --show-toplevel)`
2. Check if the repo is already in the auto-commit list:
   ```bash
   REPOS_FILE=~/.config/brain/scripts/git/auto-commit-repos.txt
   if grep -qF "$REPO" "$REPOS_FILE" 2>/dev/null; then
     echo "Already registered: $REPO"
   else
     echo "$REPO" >> "$REPOS_FILE"
     echo "Added: $REPO"
   fi
   ```
3. Show the current repos list: `cat "$REPOS_FILE"`
4. Check timer status: `systemctl --user list-timers 'git-*'`
5. For each of `git-sync.timer` and `git-submodule-sync.timer`:
   - If not enabled: `systemctl --user enable <timer>`
   - If not active: `systemctl --user start <timer>`
6. Verify the service unit files exist:
   ```bash
   systemctl --user status git-sync.service git-sync.timer --no-pager
   systemctl --user status git-submodule-sync.service git-submodule-sync.timer --no-pager
   ```
7. If unit files are missing, re-link from brain:
   ```bash
   systemctl --user link ~/.config/brain/scripts/systemd/git-sync.service
   systemctl --user link ~/.config/brain/scripts/systemd/git-sync.timer
   systemctl --user link ~/.config/brain/scripts/systemd/git-submodule-sync.service
   systemctl --user link ~/.config/brain/scripts/systemd/git-submodule-sync.timer
   systemctl --user daemon-reload
   systemctl --user enable --now git-sync.timer git-submodule-sync.timer
   ```
8. Run one manual sync to verify: trigger `/git-sync`
9. Show final timer status
