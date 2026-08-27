# Where Hallucinations Live

Project page for *Where Hallucinations Live: A Cross-Architecture Circuit in
VQ-Tokenized Vision-Language Models*.

Live at https://shamanthak-hegde.github.io/where-hallucinations-live/

Content tracks the camera-ready. Gate values come from its Table 5 (structural gates),
Table 6 (behavior under L0 ablation) and Table 7 (sigma tiers).

## Viewing it locally

`fetch()` is blocked on `file://` URLs, so the two interactive panels need an HTTP
server. Opening `index.html` directly shows the prose and figures but leaves the panels
with a "could not load" message.

```bash
git clone https://github.com/shamanthak-hegde/where-hallucinations-live.git
cd where-hallucinations-live
python -m http.server 8000
# open http://localhost:8000
```

## Layout

```
index.html                     the page
static/css/demo.css            styling for the two interactive panels
static/js/demo.js              gate explorer and caption browser (vanilla JS, no deps)
static/data/gates.json         per-model gate values, A1 curves, L0 routing maps
static/data/chair.json         500 COCO images x 4 conditions, captions and object spans
static/images/coco/*.jpg       downscaled COCO val2014 images (512 px, ~19 MB)
static/images/*.png            paper figures
static/css/bulma.min.css       Nerfies template dependency
static/js/fontawesome.all.min.js   icon set for the header buttons
```

## Regenerating the data

Both JSON files and the COCO image set are built from the experiment artifacts in the
research repo. Only the cohort metadata (class, backbone, sigma, A2, A3, verdicts,
behavior) is transcribed from the paper. The A1 initiation and propagation values are
recomputed from the per-layer arrays and checked against Table 5 at build time, so the
numbers printed on the page and the curves drawn beneath them cannot drift apart. The
build fails if any recomputed value disagrees with the paper.

```bash
cd /path/to/unified_mech
source activate sae
export LD_LIBRARY_PATH="$CONDA_PREFIX/lib:$LD_LIBRARY_PATH"     # nltk needs this
PAGE_DIR=/path/to/where-hallucinations-live python -m scripts.gen_project_page_data
python -m scripts.gen_matched_compute_figure                     # figures only
```

The build also prints how often the inline object-span highlighter agrees with the
official CHAIR scorer (currently 1987 of 2000 caption-conditions). Displayed counts come
from the official scorer, so the remainder can only show as a highlight that does not
match its badge.

## Deploying

GitHub Pages, from the repository settings: Pages, Source = "Deploy from a branch",
branch `main`, folder `/ (root)`. `.nojekyll` is committed so that paths beginning with
an underscore are served as-is. Every asset path in `index.html` is relative, so the
site works unchanged at a project-page subpath.

## Still to fill in

- The arXiv id in `index.html` (marked `TODO`).
- The venue in the BibTeX entry.

## Template license

Built on the [Nerfies](https://github.com/nerfies/nerfies.github.io) project page
template by Keunhong Park et al., released under a
[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).
This page is released under the same license.
