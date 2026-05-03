---
description: Enable canonical git auto-sync for the current repo and verify with a manual sync
---
Enable the current repository for the portable systemd-based git auto-commit/auto-sync solution, then run a manual verification sync.

## What this prompt configures

The automation is defined in the brain repo and should be portable to other Linux systems:

- Units: `~/.config/brain/scripts/systemd/git-sync.service`, `git-sync.timer`, `git-submodule-sync.service`, `git-submodule-sync.timer`
- Canonical entrypoint: `~/.config/brain/scripts/git/git-autosync.sh`
- Repo list: `~/.config/brain/scripts/git/auto-commit-repos.txt`
- Sync scripts called by the wrapper/units: `git-sync.sh`, `git-submodule-sync.sh`
- Shortcuts when installed: `gas`, `gas-now`, `gas-register`, `gas-status`, `gas-logs`, `gs`, `gss`

## Steps

1. Detect the repo:
   ```bash
   REPO=$(git rev-parse --show-toplevel)
   cd "$REPO"
   echo "REPO=$REPO"
   ```

2. Install/refresh the systemd user units and enable both timers:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh install
   ~/.config/brain/scripts/git/git-autosync.sh enable
   ```

3. Register the current repo with the auto-sync repo list:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh register "$REPO"
   ```

4. Show the current repos list and health:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh list
   ~/.config/brain/scripts/git/git-autosync.sh check
   ```

5. Verify timers are enabled and active:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh status
   systemctl --user status git-sync.timer git-submodule-sync.timer --no-pager
   ```

6. Run manual verification through the canonical wrapper:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh now
   ```

7. Inspect recent logs:
   ```bash
   ~/.config/brain/scripts/git/git-autosync.sh logs 120
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
   - whether manual sync completed through `git-autosync.sh now`
   - final `git status --short --ignore-submodules=none`
