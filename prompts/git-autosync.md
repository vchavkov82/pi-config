---
description: Enable systemd git auto-sync for the current repo and verify with a manual sync
---
Enable the current repository for the portable systemd-based git auto-commit/auto-sync solution, then run a manual verification sync.

## What this prompt configures

The automation is defined in the brain repo and should be portable to other Linux systems:

- Units: `~/.config/brain/scripts/systemd/git-sync.service`, `git-sync.timer`, `git-submodule-sync.service`, `git-submodule-sync.timer`
- Installer: `~/.config/brain/scripts/systemd/install-git-sync.sh`
- Repo list: `~/.config/brain/scripts/git/auto-commit-repos.txt`
- Scripts: `~/.config/brain/scripts/git/git-sync.sh`, `git-submodule-sync.sh`, `git-sync-register.sh`

## Steps

1. Detect the repo:
   ```bash
   REPO=$(git rev-parse --show-toplevel)
   cd "$REPO"
   echo "REPO=$REPO"
   ```

2. Ensure the systemd user units are installed from the version-controlled brain files:
   ```bash
   ~/.config/brain/scripts/systemd/install-git-sync.sh
   ```

3. Register the current repo with the auto-sync repo list:
   ```bash
   ~/.config/brain/scripts/git/git-sync-register.sh add
   ```

4. Show the current repos list:
   ```bash
   REPOS_FILE=~/.config/brain/scripts/git/auto-commit-repos.txt
   cat "$REPOS_FILE"
   ```

5. Verify timers are enabled and active:
   ```bash
   systemctl --user daemon-reload
   systemctl --user enable --now git-sync.timer git-submodule-sync.timer
   systemctl --user list-timers 'git-*' --no-pager
   systemctl --user status git-sync.service git-sync.timer --no-pager
   systemctl --user status git-submodule-sync.service git-submodule-sync.timer --no-pager
   ```

6. Run manual verification through systemd, not by bypassing the units:
   ```bash
   systemctl --user start git-submodule-sync.service
   systemctl --user start git-sync.service
   ```

7. Inspect recent logs:
   ```bash
   journalctl --user -u git-submodule-sync.service -u git-sync.service -n 120 --no-pager
   ```

8. Confirm the repository is clean, including submodule state:
   ```bash
   cd "$REPO"
   git status --short --ignore-submodules=none
   ```

9. If verification fails because user services do not run after logout on this machine, report that and suggest enabling lingering if permitted:
   ```bash
   loginctl enable-linger "$USER"
   ```

10. Report:
   - whether the repo was registered
   - whether both timers are enabled/active
   - the next scheduled timer runs
   - whether manual systemd-triggered sync completed
   - final `git status --short --ignore-submodules=none`
