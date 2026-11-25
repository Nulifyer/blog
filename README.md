# blog

Source for my profile site and blog: a [Hugo](https://gohugo.io) site with the
[PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.

## How publishing works

The site builds itself; there is no CI. [`deploy/compose.yaml`](deploy/compose.yaml) is a
self-contained Docker Compose stack:

- **builder** (official Hugo image) clones this repo, checks the branch every minute and
  rebuilds when it changes. It also rebuilds every hour so GitHub stars, pins and the
  contribution graph stay current. A failed build is logged and the previous build keeps serving.
- **web** (nginx) serves the latest successful build behind Traefik.

Push to `main` and the change is live within a minute or two. The stack only needs a git URL,
so it works the same with GitHub, Forgejo or any other host. Stack settings
(`GIT_REPO`, `SITE_HOST`, and optional ones) are documented at the top of the compose file.

## Writing a post

Create a folder under `content/posts/` with an `index.md`, and put any images next to it:

```text
content/posts/my-new-post/
  index.md
  screenshot.png      -> ![Screenshot](screenshot.png)
```

```markdown
---
title: "My new post"
date: 2026-11-25
description: "One line shown in lists and link previews."
draft: false
---

Post body in Markdown.
```

Posts with `draft: true` aren't published. A post dated in the future appears once a
build runs after that date.

## GitHub data

The Projects page and the contribution graph read public GitHub data at build time, with no
token: the public API for repos, stars and READMEs, and the public profile and contributions
pages for pinned repos and the graph. GitHub allows 60 unauthenticated API requests an hour;
a build uses about eight, and responses are cached for ten minutes.

## Projects page

`content/projects/_content.gotmpl` creates one page per repo you own that is pinned on your
GitHub profile or starred by you, using the repo's README as the page body. Pinned repos come first. Stars on other people's repos are ignored. To add or remove a
project, pin, unpin, star or unstar it on GitHub; the hourly rebuild picks it up.
To keep a pinned or starred repo off the site, list it under `hide` in
[`data/projects.yaml`](data/projects.yaml).

A project's icon is the first README image whose alt text or path mentions "logo" or "icon".
For a repo without one, set `icons` in the same file; otherwise the card shows the name's first letter.

## Home page

The home page shows the GitHub contribution graph for the last year, the three newest posts and
the pinned projects.

## Local preview

```sh
git submodule update --init
podman run --rm -it -p 1313:1313 -v "$PWD:/project:z" -e HUGO_GITHUB_TOKEN="$(gh auth token)" \
  ghcr.io/gohugoio/hugo:v0.170.1 server --bind 0.0.0.0
```

Then open http://localhost:1313. The token is optional.

## Changing the domain

Set `SITE_HOST` in the stack environment and redeploy. Links, the sitemap, feeds and
link-preview cards all follow it.
