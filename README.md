# Where Hallucinations Live: project page

Source for the project page of *Where Hallucinations Live: A Cross-Architecture Circuit
in VQ-Tokenized Vision-Language Models*.

Content tracks the camera-ready. Gate values come from its Table 5 (structural gates),
Table 6 (behavior under L0 ablation) and Table 7 (sigma tiers).

## Local preview

`fetch()` is blocked on `file://` URLs, so the interactive panels need an HTTP server:

```bash
python -m http.server 8000
# open http://localhost:8000
```

## Layout

```
index.html                     the page
static/css/demo.css            styling for the two interactive panels
static/js/demo.js              gate explorer and CHAIR caption browser (vanilla JS)
static/data/gates.json         per-model gate values, A1 curves, L0 routing maps
static/data/chair.json         500 COCO images x 4 conditions, captions and object spans
static/images/coco/*.jpg       downscaled COCO val2014 images (512 px, ~19 MB)
static/images/*.png            paper figures
```

## Regenerating the demo data

Both JSON files and the COCO image set are built from the experiment artifacts in the
research repo. Only the cohort metadata (class, backbone, sigma, A2, A3, verdicts,
behavior) is transcribed from the paper; the A1 initiation and propagation values are
recomputed from the per-layer arrays and checked against Table 5 at build time.

```bash
cd /scratch/shegde23/unified_mech
source activate sae
export LD_LIBRARY_PATH=/scratch/shegde23/.conda/envs/sae/lib:$LD_LIBRARY_PATH
python -m scripts.gen_project_page_data          # PAGE_DIR overrides the output dir
```

The build fails loudly if a recomputed A1 value disagrees with Table 5. It also prints
how often the inline object-span highlighter agrees with the official CHAIR scorer
(currently 1987/2000 caption-conditions).

The matched-compute figure is generated separately:

```bash
python -m scripts.gen_matched_compute_figure
```

## Before publishing

- [ ] Fill in the arXiv id in `index.html` (marked `TODO`).
- [ ] Confirm the GitHub URL resolves once the repo is public.
- [ ] Set the venue in the BibTeX entry.
- [ ] Delete the unused nerfies template assets if you want a smaller repo:
      `static/videos/` (51 MB), `static/interpolation/` (30 MB),
      `static/images/{steve.webm,interpolate_start.jpg,interpolate_end.jpg}`.

## Template license

Built on the [Nerfies](https://github.com/nerfies/nerfies.github.io) project page
template, released under a
[Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).
