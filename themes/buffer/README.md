# Buffer

An editor-inspired Hugo theme in the Nulifyer Gruvbox palette (light and dark), built for this site:
a profile home page with a GitHub contribution graph, posts, and GitHub projects.

No external requests: fonts (Hack, Fira Sans) are self-hosted and fingerprinted, icons are an inline
Lucide sprite, and there is one stylesheet and one deferred script. Text colour pairs meet WCAG AA.

## Site configuration

```toml
theme = "buffer"
enableRobotsTXT = true

[outputs]
  home = ["HTML", "RSS", "JSON"]   # JSON powers the header search

[markup.highlight]
  noClasses = false                # the theme ships Gruvbox code colours

[params]
  description = "..."              # meta description, feeds, link previews
  intro = "..."                    # line under your name on the home page
  author = "you"                   # footer, schema.org Person
  avatar = "me.png"                # asset path; cropped square automatically
  mainSections = ["posts"]         # what counts as posts (home, RSS)
  [params.github]
    user = "you"                   # contribution graph source
  [[params.social]]
    name = "github"
    label = "github.com/you"
    url = "https://github.com/you"
    icon = "github"                # any icon id from layouts/_partials/icons.html

[[menu.main]]
  name = "posts"
  url = "/posts/"
  params = { icon = "file-text" }
```

Optional site assets: `assets/og/base.png` (1200x630 background for generated link-preview cards).

## Writing

Front matter: `title`, `date`, `description` (shown as the lead and used for previews), `draft`,
and optionally `images: [cover.png]` to override the generated preview card.

Markdown extras:

- GitHub alerts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`
- Code blocks become editor panes with a copy button; multi-line blocks get line numbers.
  Name the tab with a title: ```` ```go {title="main.go"} ````
- Headings get a `#` link on hover.

## Projects

`layouts/projects/` renders the project pages a content adapter creates (see this site's
`content/projects/_content.gotmpl`). Expected page params: `description`, `repo_url`, `full_name`,
`default_branch`, `homepage`, `language`, `stars`, `topics`, `icon_url`, `pinned_rank` (0 = not pinned).
`data/languages.yaml` maps GitHub languages to palette hues for the language mark and monograms.

## Licences

Fonts: Hack (MIT/Bitstream Vera), Fira Sans (SIL OFL 1.1); licence files are in `assets/fonts/`.
Icons: Lucide (ISC).
