---
title: "How this blog works"
date: 2026-11-25
tags: [homelab, hugo]
description: "Markdown in a GitHub repo, built by GitHub Actions, served from my homelab."
---

This site is a folder of Markdown files in a GitHub repository. Publishing a post is a `git push`.

1. A push to `main` starts a GitHub Actions workflow that builds the site with [Hugo](https://gohugo.io).
2. The workflow publishes the generated HTML to the repo's `site` branch.
3. In my homelab, a [git-sync](https://github.com/kubernetes/git-sync) container checks that branch every minute and swaps in the new version.
4. nginx serves the files, and Traefik handles the domain and HTTPS.

The [projects](/projects/) page isn't written by hand. Each build reads my public GitHub repositories and turns every README into a page. The workflow also runs once a day, so new repos and stars show up without a post.
