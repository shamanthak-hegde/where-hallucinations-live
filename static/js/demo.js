/* Interactive panels. All data is precomputed by
   unified_mech/scripts/gen_project_page_data.py from the experiment artifacts;
   nothing here re-derives a number. */

(function () {
  'use strict';

  var SVG = 'http://www.w3.org/2000/svg';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVG, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function statusClass(v, prefix) {
    if (v === true) return prefix + 'pass';
    if (v === false) return prefix + 'fail';
    return prefix + 'unk';
  }

  function statusWord(v) {
    if (v === true) return 'pass';
    if (v === false) return 'fail';
    if (v === 'waived') return 'waived';
    return 'not measured';
  }

  /* =================================================== gate explorer ==== */

  var GROUPS = [
    ['pass_natural', 'Natural VQ models that pass'],
    ['pass_induced', 'Induced models that pass'],
    ['fail', 'Rejected by the chain']
  ];

  /* Per-layer A1 divergence, with the two scored ranges shaded. */
  function a1Chart(curve, t) {
    var vals = curve.values;
    var W = 540, H = 215, ML = 42, MR = 10, MT = 14, MB = 32;
    var iw = W - ML - MR, ih = H - MT - MB;
    /* Anole and Chameleon run to 34 and 7.3 late in the stack; clip so the
       scored ranges stay readable and say so in the caption. */
    var raw = Math.max.apply(null, vals);
    var top = Math.max(t.a1 * 1.6, Math.min(raw * 1.12, 3.2));
    var x = function (i) { return ML + (vals.length < 2 ? 0 : (i / (vals.length - 1)) * iw); };
    var y = function (v) { return MT + ih - Math.min(v, top) / top * ih; };

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });

    var iEnd = Math.min(t.a1_init_window - 1, vals.length - 1);
    var pStart = Math.min(t.a1_prop_start, vals.length - 1);
    svg.appendChild(svgEl('rect', { x: ML, y: MT, width: x(iEnd) - ML, height: ih,
                                    fill: '#dfe9e0' }));
    svg.appendChild(svgEl('rect', { x: x(pStart), y: MT, width: x(vals.length - 1) - x(pStart),
                                    height: ih, fill: '#eef3ee' }));

    [0, t.a1, top].forEach(function (v) {
      svg.appendChild(svgEl('line', {
        x1: ML, x2: W - MR, y1: y(v), y2: y(v),
        stroke: v === t.a1 ? '#444' : '#e6e6e6', 'stroke-width': v === t.a1 ? 1.4 : 1,
        'stroke-dasharray': v === t.a1 ? '5 4' : ''
      }));
      var lab = svgEl('text', { x: ML - 6, y: y(v) + 3.5, 'text-anchor': 'end',
                                'font-size': 10, fill: '#8a8a8a' });
      lab.textContent = v.toFixed(1);
      svg.appendChild(lab);
    });

    var d = vals.map(function (v, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(v); }).join(' ');
    svg.appendChild(svgEl('path', { d: d, fill: 'none', stroke: '#2b6cb0', 'stroke-width': 2.1,
                                    'stroke-linejoin': 'round' }));

    [[curve.init_i, '#1f7a4d'], [curve.prop_i, '#1f7a4d']].forEach(function (p) {
      if (p[0] == null) return;
      svg.appendChild(svgEl('circle', { cx: x(p[0]), cy: y(vals[p[0]]), r: 4,
                                        fill: 'none', stroke: p[1], 'stroke-width': 2 }));
    });

    [0, iEnd, pStart, vals.length - 1].forEach(function (i) {
      var lab = svgEl('text', { x: x(i), y: H - 12, 'text-anchor': 'middle',
                                'font-size': 10, fill: '#8a8a8a' });
      lab.textContent = 'L' + i;
      svg.appendChild(lab);
    });
    [[ML + 4, 'initiation'], [x(pStart) + 4, 'propagation']].forEach(function (p) {
      var lab = svgEl('text', { x: p[0], y: MT + 12, 'font-size': 10, fill: '#5d7a63' });
      lab.textContent = p[1];
      svg.appendChild(lab);
    });

    return { svg: svg, clipped: raw > top, max: raw };
  }

  /* Head x layer visual-to-prompt-last attention mass. */
  function a2Heatmap(hm) {
    var rows = hm.matrix, nL = rows.length, nH = rows[0].length;
    var cw = Math.max(6, Math.min(16, Math.floor(470 / nH)));
    var ch = 11, ML = 26, MT = 4, MB = 16;
    var W = ML + nH * cw + 4, H = MT + nL * ch + MB;
    var max = 0;
    rows.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });

    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    rows.forEach(function (row, li) {
      row.forEach(function (v, hi) {
        var t = max > 0 ? Math.pow(v / max, 0.6) : 0;
        var r = Math.round(20 + 235 * Math.min(1, t * 1.35));
        var g = Math.round(12 + 225 * Math.max(0, t - 0.28) / 0.72);
        var b = Math.round(60 + 150 * Math.max(0, t - 0.72) / 0.28 - 40 * t);
        svg.appendChild(svgEl('rect', {
          x: ML + hi * cw, y: MT + li * ch, width: cw - 0.5, height: ch - 0.5,
          fill: 'rgb(' + r + ',' + Math.max(0, g) + ',' + Math.max(0, b) + ')'
        }));
      });
      if (li % 4 === 0) {
        var lab = svgEl('text', { x: ML - 5, y: MT + li * ch + 8.5, 'text-anchor': 'end',
                                  'font-size': 9, fill: '#8a8a8a' });
        lab.textContent = 'L' + li;
        svg.appendChild(lab);
      }
    });
    /* Box the layers the model is actually scored over: L0 alone for
       projector-amplified and decoupled models, [0,8) for unified-vocab. */
    svg.appendChild(svgEl('rect', {
      x: ML - 1, y: MT - 1, width: nH * cw + 1, height: hm.score_window * ch + 1,
      fill: 'none', stroke: '#2b6cb0', 'stroke-width': 1.5
    }));
    var foot = svgEl('text', { x: ML, y: H - 4, 'font-size': 9, fill: '#8a8a8a' });
    foot.textContent = nH + ' heads';
    svg.appendChild(foot);
    return svg;
  }

  function behaviorLine(b, name) {
    if (!b) return null;
    return name + ' ' + b.base.toFixed(1) + '% base, accuracy ' + b.d_acc +
      ' pp, yes-rate ' + b.d_yr + ' pp';
  }

  function renderGateDetail(m, t, host) {
    host.innerHTML = '';

    host.appendChild(el('h3', null, m.name));
    var meta = el('div', 'gate-meta');
    [m.cls, m.backbone, 'sigma ' + m.sigma + ' (cos ' + m.cos + ')', m.tier].forEach(function (s) {
      meta.appendChild(el('span', null, s));
    });
    host.appendChild(meta);

    var verdict = el('div', 'gate-verdict');
    verdict.appendChild(el('span', 'pill ' + (m.passes ? 'pill-pass' : 'pill-fail'), m.verdict));
    host.appendChild(verdict);

    var cards = el('div', 'gate-cards');

    var a1 = el('div', 'gate-card ' + statusClass(m.status.a1, 'c-'));
    a1.appendChild(el('div', 'gate-card-label', 'A1 residual divergence'));
    if (m.a1) {
      var pair = el('div', 'gate-card-pair');
      [['init', m.a1.init, m.a1.init_layer, 'initiation, [0,' + t.a1_init_window + ')'],
       ['prop', m.a1.prop, m.a1.prop_layer, 'propagation, L' + t.a1_prop_start + ' and up']
      ].forEach(function (h) {
        var box = el('div');
        box.appendChild(el('div', 'gate-card-value ' +
          (h[1] >= t.a1 ? 'v-pass' : 'v-fail'), h[1].toFixed(3)));
        box.appendChild(el('div', 'gate-card-sub', h[3] + ', max at L' + h[2]));
        pair.appendChild(box);
      });
      a1.appendChild(pair);
      a1.appendChild(el('div', 'gate-card-sub',
        'both halves must reach ' + t.a1.toFixed(2) + ': ' + statusWord(m.status.a1)));
    } else {
      a1.appendChild(el('div', 'gate-card-value', 'not measured'));
      a1.appendChild(el('div', 'gate-card-sub',
        'no early routing pathway to instrument; rejected at A2'));
    }
    cards.appendChild(a1);

    var a2 = el('div', 'gate-card ' + statusClass(m.status.a2, 'c-'));
    a2.appendChild(el('div', 'gate-card-label', 'A2 attention concentration'));
    a2.appendChild(el('div', 'gate-card-value ' + (m.status.a2 === true ? 'v-pass' :
                      (m.status.a2 === false ? 'v-fail' : '')),
                      m.a2 == null ? 'not measured' : m.a2.toFixed(2)));
    a2.appendChild(el('div', 'gate-card-sub',
      m.a2_kind + ', tier ' + m.a2_tier + ', threshold ' + t.a2 + ': ' + statusWord(m.status.a2)));
    cards.appendChild(a2);

    var a3 = el('div', 'gate-card ' + statusClass(m.status.a3 === 'waived' ? null : m.status.a3, 'c-'));
    a3.appendChild(el('div', 'gate-card-label', 'A3 off-manifold rate'));
    a3.appendChild(el('div', 'gate-card-value ' + (m.status.a3 === true ? 'v-pass' :
                      (m.status.a3 === false ? 'v-fail' : '')), m.a3));
    a3.appendChild(el('div', 'gate-card-sub',
      'threshold ' + t.a3 + '%: ' + statusWord(m.status.a3)));
    cards.appendChild(a3);

    host.appendChild(cards);

    var viz = el('div', 'gate-viz');

    var left = el('div');
    left.appendChild(el('div', 'viz-title', 'A1: relative residual divergence per layer'));
    if (m.a1_curve) {
      var c = Object.assign({}, m.a1_curve,
        { init_i: m.a1.init_layer, prop_i: m.a1.prop_layer });
      var ch = a1Chart(c, t);
      left.appendChild(ch.svg);
      left.appendChild(el('div', 'viz-caption',
        'sigma ' + m.a1_curve.sigma + ', n = ' + m.a1_curve.n_records + ' records. ' +
        'Circles mark the two scored maxima; the dashed line is the 0.40 threshold.' +
        (ch.clipped ? ' Y-axis clipped: the curve reaches ' + ch.max.toFixed(1) +
                      ' late in the stack.' : '')));
    } else {
      left.appendChild(el('div', 'demo-note',
        'Not instrumented. Continuous-projector controls have no early routing ' +
        'concentration to begin with, so A2 settles the verdict without A1.'));
    }
    viz.appendChild(left);

    var right = el('div');
    right.appendChild(el('div', 'viz-title', 'A2: visual to prompt-last attention mass'));
    if (m.heatmap) {
      right.appendChild(a2Heatmap(m.heatmap));
      right.appendChild(el('div', 'viz-caption',
        'Head by layer, first 16 layers, mean over n = ' + m.heatmap.n_records +
        ' records. Brighter is more mass. The box marks the layers this model is ' +
        'scored over (' + (m.heatmap.score_window === 1 ? 'L0 sink' : '[0,8) window') + ').'));
    } else {
      right.appendChild(el('div', 'demo-note', 'No head-level map on disk for this model.'));
    }
    viz.appendChild(right);
    host.appendChild(viz);

    var beh = el('dl', 'gate-behavior');
    var lines = [behaviorLine(m.pope, 'POPE'), behaviorLine(m.amber, 'AMBER')]
      .filter(function (s) { return s; });
    if (lines.length) {
      beh.appendChild(el('dt', null, 'Under L0 ablation'));
      var dd = el('dd');
      lines.forEach(function (s, i) {
        if (i) dd.appendChild(el('br'));
        dd.appendChild(document.createTextNode(s));
      });
      if (m.ci) {
        dd.appendChild(el('br'));
        dd.appendChild(el('span', 'mono', m.ci));
      }
      if (m.degen) {
        dd.appendChild(el('br'));
        dd.appendChild(el('span', 'pill pill-warn', 'degenerate emitter'));
      }
      if (m.catas) {
        dd.appendChild(el('br'));
        dd.appendChild(el('span', 'pill pill-warn', 'catastrophic collapse'));
      }
      beh.appendChild(dd);
    }
    if (m.sanity) {
      beh.appendChild(el('dt', null, 'Sanity criterion'));
      beh.appendChild(el('dd', null, m.sanity));
    }
    if (m.note) {
      beh.appendChild(el('dt', null, 'Notes'));
      beh.appendChild(el('dd', null, m.note));
    }
    host.appendChild(beh);
  }

  function initGates(data) {
    var list = document.getElementById('gate-list');
    var detail = document.getElementById('gate-detail');
    if (!list || !detail) return;

    var counts = document.getElementById('gate-counts');
    if (counts) {
      counts.textContent = data.counts.total + ' models, ' + data.counts.passing +
        ' pass the chain, ' + data.counts.rejected + ' rejected.';
    }

    var buttons = [];
    GROUPS.forEach(function (g) {
      var models = data.models.filter(function (m) { return m.group === g[0]; });
      if (!models.length) return;
      list.appendChild(el('div', 'gate-group', g[1] + ' (' + models.length + ')'));
      models.forEach(function (m) {
        var b = el('button', 'gate-row');
        b.type = 'button';
        b.appendChild(el('span', 'gate-row-name', m.name));
        var dots = el('span', 'gate-dots');
        [m.status.a1, m.status.a2, m.status.a3].forEach(function (s, i) {
          var d = el('span', 'gate-dot ' +
            statusClass(s === 'waived' ? null : s, 'd-'));
          d.title = 'A' + (i + 1) + ': ' + statusWord(s);
          dots.appendChild(d);
        });
        b.appendChild(dots);
        b.addEventListener('click', function () {
          buttons.forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          renderGateDetail(m, data.thresholds, detail);
        });
        buttons.push(b);
        list.appendChild(b);
      });
    });

    if (buttons.length) buttons[0].click();
  }

  /* =================================================== CHAIR browser ==== */

  var COND_LABEL = {
    baseline: 'Baseline',
    l0: 'L0 ablation (ours)',
    dola: 'Tuned DoLA',
    vcd: 'Tuned VCD'
  };

  var FILTERS = [
    ['all', 'All 500 images'],
    ['l0_fixes', 'L0 removes every hallucination the baseline made'],
    ['baseline_bad', 'Baseline hallucinates 3 or more objects'],
    ['l0_worse', 'L0 hallucinates more than the baseline'],
    ['l0_degen', 'L0 output loops'],
    ['vcd_degen', 'VCD output loops']
  ];

  function matches(im, f) {
    var b = im.caps.baseline, l = im.caps.l0;
    switch (f) {
      case 'l0_fixes': return b.n_halluc > 0 && l.n_halluc === 0;
      case 'baseline_bad': return b.n_halluc >= 3;
      case 'l0_worse': return l.n_halluc > b.n_halluc;
      case 'l0_degen': return l.degenerate;
      case 'vcd_degen': return im.caps.vcd.degenerate;
      default: return true;
    }
  }

  function highlight(cap) {
    var frag = document.createDocumentFragment();
    var pos = 0;
    cap.spans.forEach(function (s) {
      if (s[0] < pos) return;
      frag.appendChild(document.createTextNode(cap.text.slice(pos, s[0])));
      var mark = el('span', s[3] === 'halluc' ? 'tok-halluc' : 'tok-correct',
                    cap.text.slice(s[0], s[1]));
      mark.title = (s[3] === 'halluc' ? 'hallucinated: ' : 'grounded: ') + s[2];
      frag.appendChild(mark);
      pos = s[1];
    });
    frag.appendChild(document.createTextNode(cap.text.slice(pos)));
    return frag;
  }

  function initChair(data) {
    var host = document.getElementById('chair-card');
    if (!host) return;

    var summary = document.getElementById('chair-summary');
    if (summary) {
      var tb = el('tbody');
      data.conditions.forEach(function (k) {
        var a = data.aggregates[k];
        var tr = el('tr', k === 'l0' ? 'is-ours' : null);
        [COND_LABEL[k], a.chair_s.toFixed(1), a.chair_i.toFixed(1),
         a.recall.toFixed(1), a.avg_len].forEach(function (v, i) {
          tr.appendChild(el(i === 0 ? 'th' : 'td', null, v));
        });
        tb.appendChild(tr);
      });
      summary.appendChild(tb);
    }

    var filterSel = document.getElementById('chair-filter');
    FILTERS.forEach(function (f) {
      var o = el('option', null, f[1]);
      o.value = f[0];
      filterSel.appendChild(o);
    });

    var prev = document.getElementById('chair-prev');
    var next = document.getElementById('chair-next');
    var rand = document.getElementById('chair-random');
    var counter = document.getElementById('chair-counter');

    var pool = data.images, idx = 0;

    function render() {
      host.innerHTML = '';
      if (!pool.length) {
        host.appendChild(el('div', 'demo-note', 'No images match that filter.'));
        counter.textContent = '0 of 0';
        return;
      }
      var im = pool[idx];

      var col = el('div', 'chair-image');
      var img = el('img');
      img.src = './static/images/coco/' + im.id + '.jpg';
      img.alt = 'COCO val2014 image ' + im.id;
      img.loading = 'lazy';
      col.appendChild(img);
      var gt = el('div', 'chair-gt');
      gt.innerHTML = '<b>COCO_val2014_' + String(im.id).padStart(12, '0') + '</b><br>' +
        '<b>Ground-truth objects:</b> ' + im.gt.join(', ');
      col.appendChild(gt);
      host.appendChild(col);

      var grid = el('div', 'chair-grid');
      data.conditions.forEach(function (k) {
        var cap = im.caps[k];
        var box = el('div', 'cap-box' + (k === 'l0' ? ' is-ours' : ''));
        var head = el('div', 'cap-head');
        head.appendChild(el('span', 'cap-name', COND_LABEL[k]));
        var pills = el('span');
        pills.appendChild(el('span',
          'pill ' + (cap.n_halluc ? 'pill-fail' : 'pill-pass'),
          cap.n_halluc ? cap.n_halluc + ' hallucinated' : 'none hallucinated'));
        if (cap.degenerate) {
          pills.appendChild(document.createTextNode(' '));
          pills.appendChild(el('span', 'pill pill-warn', 'looping'));
        }
        head.appendChild(pills);
        box.appendChild(head);
        var txt = el('div', 'cap-text');
        txt.appendChild(highlight(cap));
        box.appendChild(txt);
        grid.appendChild(box);
      });
      host.appendChild(grid);

      counter.textContent = (idx + 1) + ' of ' + pool.length;
      prev.disabled = idx === 0;
      next.disabled = idx === pool.length - 1;
    }

    filterSel.addEventListener('change', function () {
      pool = data.images.filter(function (im) { return matches(im, filterSel.value); });
      idx = 0;
      render();
    });
    prev.addEventListener('click', function () { if (idx > 0) { idx--; render(); } });
    next.addEventListener('click', function () {
      if (idx < pool.length - 1) { idx++; render(); }
    });
    rand.addEventListener('click', function () {
      if (pool.length) { idx = Math.floor(Math.random() * pool.length); render(); }
    });

    render();
  }

  /* ========================================================== boot ===== */

  function load(url, cb, host) {
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(cb)
      .catch(function () {
        var n = document.getElementById(host);
        if (n) n.innerHTML = '<div class="demo-note">Could not load <code>' + url +
          '</code>. If you opened this file directly from disk, serve the directory ' +
          'over HTTP instead (<code>python -m http.server</code>): browsers block ' +
          'fetch() on file:// URLs.</div>';
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    load('./static/data/gates.json', initGates, 'gate-detail');
    load('./static/data/chair.json', initChair, 'chair-card');
  });
})();
