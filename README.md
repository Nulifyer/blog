# blog

Source for https://blog.swarm.nulteck.com: a [Hugo](https://gohugo.io) site with the
[PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.

## How publishing works

1. Push to `main`.
2. [`build.yml`](.github/workflows/build.yml) builds the site and force-pushes the HTML to the `site` branch.
   It also runs daily, so the Projects page picks up new repos and README changes.
3. The homelab stack ([`deploy/compose.yaml`](deploy/compose.yaml)) runs git-sync, which checks
   the `site` branch every 60 seconds, and nginx, which serves it behind Traefik.

A push is usually live within two or three minutes. If a build fails, the `site` branch
isn't updated and the current site keeps serving.

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
tags: [homelab]
description: "One line shown in lists and link previews."
draft: false
---

Post body in Markdown.
```

Posts with `draft: true` aren't published. A post dated in the future appears once a
build runs after that date.

## Projects page

`content/projects/_content.gotmpl` creates one page per public, non-fork, non-archived
repo on GitHub, using the repo's README as the page body and its topics as tags.
Edit [`data/projects.yaml`](data/projects.yaml) to pin repos to the top or hide them.

## Local preview

```sh
git submodule update --init
podman run --rm -it -p 1313:1313 -v "$PWD:/project:z" -e HUGO_GITHUB_TOKEN="$(gh auth token)" \
  ghcr.io/gohugoio/hugo:v0.170.1 server --bind 0.0.0.0
```

Then open http://localhost:1313. The token is optional; without it, GitHub's
unauthenticated limit of 60 requests an hour covers about one build.

## Changing the domain

Set the repository variable `BASE_URL` (Settings → Secrets and variables → Actions → Variables)
and add a matching Traefik router to the stack.
