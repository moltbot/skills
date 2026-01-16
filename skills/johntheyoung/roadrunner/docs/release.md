# Release

This project uses GoReleaser (see `.goreleaser.yml`) and GitHub Actions
(`.github/workflows/release.yml`). Tag pushes create GitHub releases and
update the Homebrew tap automatically.

## Prereqs

- Clean working tree on `main`.
- CI is green for the commit you are tagging.
- `TAP_GITHUB_TOKEN` secret set on the repo (for Homebrew tap updates).

## Release Steps

1) Update `CHANGELOG.md` (add the new version section).

2) Tag and push:

```bash
git checkout main
git pull

git commit -am "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

3) Verify GitHub release artifacts:

```bash
gh run list -L 5 --workflow release.yml

gh release view vX.Y.Z
```

4) Verify Homebrew tap updated:

```bash
gh api repos/johntheyoung/homebrew-tap/contents/Formula/roadrunner.rb?ref=main --jq '.sha'
```

## Homebrew Install Test (optional)

```bash
brew untap johntheyoung/tap || true
brew tap johntheyoung/tap
brew install johntheyoung/tap/roadrunner
rr version
```

## Rerun a Release

If the workflow needs a rerun:

```bash
gh workflow run release.yml -f tag=vX.Y.Z
```
