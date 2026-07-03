---
name: add-learning-card
description: Add or update a project card on the /learning/ page (featured hero cards or the smaller project grid). Use when asked to add a project, hero card, "view live" link, or source link to the learning page.
---

# Add a card to the /learning/ page

All cards live in one file: `src/pages/learning/index.astro`. Data is hardcoded
in the frontmatter; markup is in the template below it. Match the existing
patterns exactly — read the file first and copy an existing card as the template.

## Featured hero cards

Each featured project is a frontmatter object:

```js
const tatu = {
  title: 'Tatu Artists Around the World',
  blurb: 'A searchable directory of blackwork tattoo artists...',
  stack: ['Rails 8', 'Ruby 3.3', 'PostgreSQL'],
  live: 'https://tatu-repo1.netlify.app/',
  source: 'https://github.com/acordivari/tatu-repo',
};
```

rendered as an `<article class="featured">` block:

```astro
<article class="featured">
  <div class="featured-body">
    <span class="badge">Recent work</span>
    <h3>{tatu.title}</h3>
    <p>{tatu.blurb}</p>
    <ul class="stack">
      {tatu.stack.map((tech) => <li>{tech}</li>)}
    </ul>
    <div class="links">
      <a href={tatu.live} target="_blank" rel="noopener noreferrer" class="link-primary">
        View live &rarr;
      </a>
      <a href={tatu.source} target="_blank" rel="noopener noreferrer" class="link-muted">
        Source
      </a>
    </div>
  </div>
</article>
```

Link conventions:
- Project has a live URL → `live` link is `link-primary` ("View live &rarr;"), `source` is `link-muted` ("Source").
- Source-only project → single `link-primary` with "Source &rarr;".
- Extra links (e.g. a spec) → additional `link-muted` anchors (see the x402 card).
- All external links: `target="_blank" rel="noopener noreferrer"`.

## Smaller past projects

Minor projects go in the `projects` array in the same frontmatter, rendered as
`<a class="project-card">` items inside `.project-grid` — not as featured cards.

## Checklist

1. Read `src/pages/learning/index.astro`; pick the closest existing card as a template.
2. Add the frontmatter object + template block (featured) or `projects` entry (minor).
3. Keep blurbs to 1–2 sentences, stack lists to the main technologies only.
4. Verify with `npm run dev` and check `/learning/` renders; no other files should change.
