# Contributing to transit-access-webapp

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Production. Only receives merges from `dev` (releases) or `hotfix/*` branches. Never commit directly. |
| `dev` | Integration branch. All feature and bugfix PRs target this branch. Merged to `main` to cut a release. |
| `feature/<name>` | New features. Branch off `dev`, PR back to `dev`. |
| `bugfix/<name` | Non-urgent bug fixes. Branch off `dev`, PR back to `dev`. |
| `hotfix/<name>` | Urgent production fixes. Branch off `main`, merged to **both** `main` and `dev`. |
| `dataset-update-<date>` | MTA data updates (e.g. `dataset-update-05.2025`). Branch off `dev`, PR back to `dev`. |

## Typical Workflow

### Feature or bug fix
```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature   # or bugfix/my-fix

# ... do work ...

git push origin feature/my-feature
# Open PR targeting `dev`
```

### Releasing to production
```bash
# Once dev is stable and ready to ship:
git checkout main
git merge dev
git tag v1.x.0
git push origin main --tags
```

### Hotfix (urgent production issue)
```bash
git checkout main
git pull origin main
git checkout -b hotfix/fix-description

# ... fix ...

git push origin hotfix/fix-description
# Open PR targeting `main`
# After merging, also merge main back into dev:
git checkout dev
git merge main
git push origin dev
```

## Branch Naming

- Use lowercase and hyphens: `feature/search-bar-fuzzy`, not `feature/SearchBarFuzzy`
- Be descriptive but concise
- For dataset updates, include the month and year: `dataset-update-05.2025`

## Pull Requests

- All PRs require at least one review before merging (when working with collaborators)
- Keep PRs focused — one feature or fix per PR
- Delete the branch after merging
