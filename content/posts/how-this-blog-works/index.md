---
title: "How this blog works"
date: 2026-11-25
description: "Markdown in a git repo, built and served by one small Docker stack in my homelab."
---

This site is a folder of Markdown files in a git repository. Publishing a post is a `git push`.

1. A builder container in my homelab checks the repository every minute. When `main` changes, it builds the site with [Hugo](https://gohugo.io).
2. Each build goes into its own folder, and a symlink switches to it once the build succeeds. A broken build never replaces the live site.
3. nginx serves the current build, and Traefik handles the domain and HTTPS.

Nothing depends on CI or on where the repository is hosted. The stack only needs a git URL, so moving to self-hosted git is a one-line change.

The [projects](/projects/) page isn't written by hand. Each build reads the repos I've pinned or starred on GitHub and turns their READMEs into pages. The site also rebuilds every hour, so pinning or starring a repo is enough to add it.
