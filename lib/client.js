window.__ModuleLoader__.load({
  id: "dsh-studygo",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var h = react.createElement;
    var useState = react.useState;
    var useEffect = react.useEffect;
    var useMemo = react.useMemo;

    var PANEL_ID = "studygo";

    function api(path, opts) {
      return fetch(path, Object.assign({ credentials: "same-origin" }, opts)).then(function (r) {
        return r.json().then(function (d) {
          if (!r.ok) throw new Error((d && d.error) || ("HTTP " + r.status));
          return d;
        });
      });
    }

    var C = {
      root: { height: "100%", display: "flex", flexDirection: "column", background: "var(--dsh-bg,#fff)", color: "var(--dsh-fg,#1f2328)" },
      top: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: "1px solid var(--dsh-border,#ececec)" },
      search: { flex: 1, height: 30, padding: "0 10px", borderRadius: 8, border: "1px solid var(--dsh-border,#e3e3e6)", background: "transparent", color: "inherit", fontSize: 13, outline: "none" },
      btn: { height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--dsh-border,#e3e3e6)", background: "transparent", color: "inherit", fontSize: 13, cursor: "pointer" },
      btnPrimary: { height: 30, padding: "0 12px", borderRadius: 8, border: "none", background: "#3b6cf6", color: "#fff", fontSize: 13, cursor: "pointer" },
      body: { flex: 1, display: "flex", minHeight: 0 },
      rail: { width: 56, borderRight: "1px solid var(--dsh-border,#ececec)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0" },
      railBtn: { width: 40, height: 40, borderRadius: 10, border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 18 },
      main: { flex: 1, minWidth: 0, overflowY: "auto", padding: "18px 24px" },
      right: { width: 220, borderLeft: "1px solid var(--dsh-border,#ececec)", padding: "14px 12px", overflowY: "auto", fontSize: 12 },
      overlay: { position: "absolute", left: 56, top: 47, bottom: 0, width: 260, background: "var(--dsh-bg,#fff)", borderRight: "1px solid var(--dsh-border,#e3e3e6)", boxShadow: "4px 0 16px rgba(0,0,0,.08)", padding: 8, overflowY: "auto", zIndex: 20 },
      libRow: { padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 },
      muted: { color: "var(--dsh-muted,#8a8f98)", fontSize: 12 },
      title: { fontSize: 17, fontWeight: 600, margin: "0 0 8px" },
      chip: { display: "inline-block", padding: "1px 8px", borderRadius: 999, background: "var(--dsh-chip,#f1f2f4)", fontSize: 11, color: "var(--dsh-muted,#6b7280)", marginRight: 6 },
      layerBar: { display: "flex", gap: 6, margin: "12px 0" },
      tab: { padding: "4px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: "1px solid var(--dsh-border,#e3e3e6)", background: "transparent", color: "inherit" },
      tabOn: { padding: "4px 12px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: "1px solid transparent", background: "var(--dsh-active,#eef1f6)", color: "inherit", fontWeight: 600 },
      step: { borderLeft: "2px solid var(--dsh-border,#e6e7ea)", padding: "2px 0 2px 16px", margin: "16px 0", position: "relative" },
      stepNo: { position: "absolute", left: -14, top: 0, width: 26, height: 26, lineHeight: "24px", textAlign: "center", borderRadius: 999, background: "var(--dsh-chip,#eef0f3)", fontSize: 11, color: "var(--dsh-muted,#555)", cursor: "pointer" },
      stepTitle: { fontWeight: 600, fontSize: 14, marginBottom: 3 },
      small: { fontSize: 12, color: "var(--dsh-muted,#6b7280)", marginBottom: 6 },
      text: { fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" },
      drawer: { borderTop: "1px solid var(--dsh-border,#e3e3e6)", background: "var(--dsh-bg,#fff)", overflowY: "auto", padding: "12px 24px" },
      modalBg: { position: "fixed", inset: 0, background: "rgba(0,0,0,.28)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 },
      modal: { width: 920, maxHeight: "86vh", overflowY: "auto", background: "var(--dsh-bg,#fff)", borderRadius: 14, padding: 20, color: "inherit" },
      field: { width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--dsh-border,#e3e3e6)", background: "transparent", color: "inherit", fontSize: 13, marginBottom: 10 },
      textarea: { width: "100%", boxSizing: "border-box", minHeight: 170, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--dsh-border,#e3e3e6)", background: "transparent", color: "inherit", fontSize: 13, marginBottom: 10 },
      row: { display: "flex", gap: 8, marginBottom: 10 },
      sel: { padding: "6px 8px", borderRadius: 8, border: "1px solid var(--dsh-border,#e3e3e6)", background: "transparent", color: "inherit", fontSize: 13 },
      badge: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#e8f5ec", color: "#1a7f37" },
      badgeWarn: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fdecea", color: "#b3261e" },
      badgeHalf: { fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "#fff4e5", color: "#a05a00" },
    };

    /* ---------- 轻量公式美化（KaTeX 之前的最小可用版本） ---------- */
    function prettyMath(src) {
      if (!src) return src;
      var s = String(src);
      s = s.replace(/\$\$([\s\S]*?)\$\$/g, function (_m, x) { return '\n' + plain(x) + '\n'; });
      s = s.replace(/\$([^$\n]+)\$/g, function (_m, x) { return plain(x); });
      return s;
    }
    /* ---------- 追问树面板（可拖动，节点相连） ---------- */
    function ThreadTreePanel(props) {
      var roots = props.roots || []
      var [pos, setPos] = useState({ x: Math.max(16, (window.innerWidth || 1440) - 420), y: Math.max(16, (window.innerHeight || 900) - 380) })
      var drag = react.useRef(null)
      if (!roots.length) return null

      var nodes = []
      var links = []
      var cursor = 0
      function walk(node, depth, parentId, id, rootAnchor, path) {
        var anchor = node.anchor || rootAnchor || ""
        var me = { id: id, path: path, label: (depth === 0 ? anchor + " " : "") + String(node.text || "").slice(0, depth === 0 ? 7 : 9), anchor: anchor, depth: depth }
        nodes.push(me)
        if (parentId != null) links.push([parentId, id])
        var kids = node.children || []
        if (!kids.length) { me.y = cursor * 46 + 26; cursor++ }
        else {
          var ys = kids.map(function (k, j) { return walk(k, depth + 1, id, id + "-" + j, anchor, path + "-" + j) })
          me.y = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2
        }
        me.x = 16 + depth * 152
        return me.y
      }
      roots.forEach(function (t, i) { walk(t, 0, null, "r" + i, t.anchor, t.anchor + "-" + i) })

      var byId = {}
      nodes.forEach(function (n) { byId[n.id] = n })
      var W = Math.max(260, Math.max.apply(null, nodes.map(function (n) { return n.x })) + 140)
      var H = Math.max(64, cursor * 46 + 20)

      function startDrag(e) {
        drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
        e.preventDefault()
      }
      useEffect(function () {
        function move(e) {
          if (!drag.current) return
          setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) })
        }
        function up() { drag.current = null }
        window.addEventListener("mousemove", move)
        window.addEventListener("mouseup", up)
        return function () { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up) }
      }, [])

      function jump(n) {
        if (!n.anchor) return
        if (props.onJump) props.onJump(n.anchor, n.path)
      }

      return h("div", {
        style: { position: "fixed", left: pos.x, top: pos.y, width: Math.min(W + 20, 560), background: "var(--dsh-bg,#fff)", border: "1px solid var(--dsh-border,#e3e3e6)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 40, overflow: "hidden" }
      },
        h("div", {
          style: { padding: "6px 10px", cursor: "move", background: "var(--dsh-chip,#f4f5f7)", fontSize: 12, fontWeight: 600, display: "flex", justifyContent: "space-between", userSelect: "none" },
          onMouseDown: startDrag
        },
          h("span", null, "追问树 · " + nodes.length + " 节点"),
          h("span", { style: { color: "var(--dsh-muted,#8a8f98)", fontWeight: 400 } }, "拖动 / 点击节点跳转")
        ),
        h("div", { style: { maxHeight: 280, overflow: "auto", padding: "6px 2px 6px 6px" } },
          h("svg", { width: W, height: H, style: { display: "block" } },
            links.map(function (l, i) {
              var a = byId[l[0]], b = byId[l[1]]
              if (!a || !b) return null
              var x1 = a.x + 122, y1 = a.y, x2 = b.x, y2 = b.y
              var mx = (x1 + x2) / 2
              return h("path", { key: "l" + i, d: "M" + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2, fill: "none", stroke: "var(--dsh-border,#d6d8dd)", strokeWidth: 1.4 })
            }),
            nodes.map(function (n) {
              return h("g", {
                key: n.id,
                style: { cursor: n.anchor ? "pointer" : "default" },
                onClick: function () { jump(n) }
              },
                h("rect", { x: n.x, y: n.y - 14, width: 122, height: 28, rx: 7, fill: n.depth === 0 ? "#eef1ff" : "var(--dsh-chip,#f4f5f7)", stroke: n.depth === 0 ? "#c9d6ff" : "var(--dsh-border,#d6d8dd)" }),
                h("text", { x: n.x + 8, y: n.y + 4, fontSize: 10.5, fill: "currentColor", style: { userSelect: "none" } }, n.label)
              )
            })
          )
        )
      )
    }

    function ThreadNode(props) {
      var t = props.node
      var depth = props.depth || 0
      return h("div", { style: { marginLeft: depth * 14, borderLeft: depth ? "2px solid var(--dsh-border,#e6e7ea)" : "none", paddingLeft: depth ? 10 : 0, marginTop: 6 } },
        h("div", { style: { fontSize: 13, fontWeight: 500 } }, "Q：" + t.text),
        t.answer ? h(MathText, { text: t.answer, style: { fontSize: 13, lineHeight: 1.7, padding: "4px 0 2px", color: "var(--dsh-muted,#333)" } }) : null,
        (t.children || []).map(function (c, i) { return h(ThreadNode, { key: i, node: c, depth: depth + 1 }) })
      )
    }

    /* ---------- KaTeX 渲染 ---------- */
    var katexReady = false
    function loadKatex() {
      if (window.katex) { katexReady = true; return }
      var link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "/study/static/katex.min.css"
      document.head.appendChild(link)
      var s = document.createElement("script")
      s.src = "/study/static/katex.min.js"
      s.onload = function () { katexReady = true; window.dispatchEvent(new Event("study-katex-ready")) }
      s.onerror = function () { katexReady = false }
      document.head.appendChild(s)
    }

    function katexHtml(tex, display) {
      try {
        if (window.katex && window.katex.renderToString) {
          return window.katex.renderToString(tex, { throwOnError: false, displayMode: !!display })
        }
      } catch (e) {}
      return null
    }

    function splitMath(text) {
      const out = []
      let buf = ''
      let i = 0
      const pushText = () => { if (buf) { out.push({ k: 'text', v: buf }); buf = '' } }
      while (i < text.length) {
        const ch = text[i]
        if (ch === '\\' && text[i + 1] === '(') {
          const j = text.indexOf('\\)', i + 2)
          if (j > 0) { pushText(); out.push({ k: 'inline', v: text.slice(i + 2, j) }); i = j + 2; continue }
        }
        if (ch === '\\' && text[i + 1] === '[') {
          const j = text.indexOf('\\]', i + 2)
          if (j > 0) { pushText(); out.push({ k: 'block', v: text.slice(i + 2, j) }); i = j + 2; continue }
        }
        if (ch === '$' && text[i + 1] === '$') {
          const j = text.indexOf('$$', i + 2)
          if (j > 0) { pushText(); out.push({ k: 'block', v: text.slice(i + 2, j) }); i = j + 2; continue }
        }
        if (ch === '$') {
          const j = text.indexOf('$', i + 1)
          const inner = j > 0 ? text.slice(i + 1, j) : ''
          if (j > 0 && inner.indexOf('\n') < 0 && inner.length < 400) { pushText(); out.push({ k: 'inline', v: inner }); i = j + 1; continue }
        }
        buf += ch
        i++
      }
      pushText()
      return out
    }

    function MathText(props) {
      const text = String(props.text == null ? "" : props.text)
      const style = props.style || C.text
      const parts = splitMath(text)
      return h("div", { style: style }, parts.map(function (p, i) {
        if (p.k === 'text') {
          const v = p.v
          const looksMath = /\\[a-zA-Z]{2,}|[a-zA-Z0-9]\^|_\{/.test(v) && v.length < 220 && /[\\^_]/.test(v)
          if (looksMath) {
            const mh = katexHtml(v.replace(/[。；]$/, ""), false)
            if (mh) return h("span", { key: i, dangerouslySetInnerHTML: { __html: mh } })
          }
          return h("span", { key: i, style: { whiteSpace: "pre-wrap" } }, p.v)
        }
        const html = katexHtml(p.v, p.k === 'block')
        if (html) {
          return p.k === 'block'
            ? h("div", { key: i, dangerouslySetInnerHTML: { __html: html } })
            : h("span", { key: i, dangerouslySetInnerHTML: { __html: html } })
        }
        return h("span", { key: i, style: { fontFamily: "ui-monospace,monospace" } }, p.v)
      }))
    }

    function plain(x) {
      var t = String(x);
      t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
      t = t.replace(/\\dfrac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)');
      t = t.replace(/\\left|\\right/g, '');
      t = t.replace(/\\quad|\\qquad|\\,/g, '  ');
      t = t.replace(/\\cdot/g, '·');
      t = t.replace(/\\times/g, '×');
      t = t.replace(/\\pm/g, '±');
      t = t.replace(/\\max/g, 'max');
      t = t.replace(/\\min/g, 'min');
      t = t.replace(/\\sum_\{?([^{}]*)\}?/g, 'Σ$1');
      t = t.replace(/\\text\{([^{}]*)\}/g, '$1');
      t = t.replace(/\\mathrm\{([^{}]*)\}/g, '$1');
      t = t.replace(/\^\{([^{}]*)\}/g, '$1');
      t = t.replace(/_\{([^{}]*)\}/g, '$1');
      t = t.replace(/\{([^{}]*)\}/g, '$1');
      t = t.replace(/\\/g, '');
      return t;
    }

    /* ---------- T1 图渲染 ---------- */
    function Figure(props) {
      var fig = props.fig || {};
      var nodes = fig.nodes || [];
      var edges = fig.edges || [];
      if (!nodes.length) return h("div", { style: C.muted }, "（图数据为空）");
      var W = 520, H = 190;
      var n = nodes.length;
      var pad = 56;
      var step = n > 1 ? (W - pad * 2) / (n - 1) : 0;
      var pos = {};
      nodes.forEach(function (nd, i) {
        pos[nd.id] = { x: pad + step * i, y: H / 2 - 10, i: i };
      });
      function box(nd) {
        var p = pos[nd.id];
        var label = h("text", { x: p.x, y: p.y + 4, textAnchor: "middle", fontSize: 11, fill: "currentColor" }, nd.label || nd.id);
        if (nd.shape === "circle") return h("g", { key: nd.id }, h("circle", { cx: p.x, cy: p.y, r: 17, fill: "var(--dsh-bg,#fff)", stroke: "currentColor" }), label);
        if (nd.shape === "diamond") return h("g", { key: nd.id }, h("polygon", { points: p.x + "," + (p.y - 20) + " " + (p.x + 46) + "," + p.y + " " + p.x + "," + (p.y + 20) + " " + (p.x - 46) + "," + p.y, fill: "var(--dsh-bg,#fff)", stroke: "currentColor" }), label);
        return h("g", { key: nd.id }, h("rect", { x: p.x - 44, y: p.y - 16, width: 88, height: 32, rx: 6, fill: "var(--dsh-bg,#fff)", stroke: "currentColor" }), label);
      }
      return h("svg", { width: "100%", viewBox: "0 0 " + W + " " + H, style: { maxWidth: W, display: "block", margin: "10px 0", border: "1px dashed var(--dsh-border,#e3e3e6)", borderRadius: 8 } },
        h("defs", null, h("marker", { id: "arw", markerWidth: 8, markerHeight: 8, refX: 7, refY: 3, orient: "auto" }, h("path", { d: "M0,0 L7,3 L0,6 Z", fill: "currentColor" }))),
        edges.map(function (e, i) {
          var a = pos[e.from], b = pos[e.to];
          if (!a || !b) return null;
          if (b.i > a.i) {
            return h("g", { key: "e" + i },
              h("line", { x1: a.x + 44, y1: a.y, x2: b.x - 44, y2: b.y, stroke: "currentColor", strokeWidth: 1.2, markerEnd: "url(#arw)" }),
              e.label ? h("text", { x: (a.x + b.x) / 2, y: a.y - 8, fontSize: 10, textAnchor: "middle", fill: "currentColor" }, e.label) : null
            );
          }
          var cy = a.y + 52;
          return h("g", { key: "e" + i },
            h("path", { d: "M" + a.x + "," + (a.y + 16) + " C" + a.x + "," + cy + " " + b.x + "," + cy + " " + b.x + "," + (b.y + 16), fill: "none", stroke: "currentColor", strokeWidth: 1.2, markerEnd: "url(#arw)" }),
            e.label ? h("text", { x: (a.x + b.x) / 2, y: cy + 12, fontSize: 10, textAnchor: "middle", fill: "currentColor" }, e.label) : null
          );
        }),
        nodes.map(box)
      );
    }

    function Badge(props) {
      var b = props.badge || {};
      var st = b.status;
      if (st === "ok") return h("span", { style: C.badge }, "已验算");
      if (st === "warn") return h("span", { style: C.badgeWarn }, "存疑");
      if (st === "half") return h("span", { style: C.badgeHalf }, "部分已验算");
      return h("span", { style: C.badge }, "未验算");
    }

    /* ---------- 题目卡 ---------- */
    function Card(props) {
      var q = props.q;
      var layer = props.layer;
      var setLayer = props.setLayer;
      var onAsk = props.onAsk || function () {};
      var [sel, setSel] = useState("");
      var [replyTo, setReplyTo] = useState(null);
      var [ask, setAsk] = useState("");
      var [busy, setBusy] = useState(false);

      if (!q) return h("div", { style: { padding: 60, textAlign: "center", color: "#9aa0a6", fontSize: 13 } }, "从左边选个库，或点「+ 新建」录入一道题");

      var blocks = q.steps || [];
      var tag = q.form === "analysis" ? "P" : "S";
      var threads = q.threads || [];

      function pick(anchor) {
        setSel(anchor); setReplyTo(null);
        var el = document.getElementById("study-ask");
        if (el) el.focus();
      }

      function reply(node, anchor) {
        setReplyTo({ text: node.text, anchor: anchor }); setSel(anchor);
        var el = document.getElementById("study-ask");
        if (el) el.focus();
      }

      function submit() {
        var txt = ask.trim();
        if (!txt || busy) return;
        var anchor = sel || (replyTo && replyTo.anchor) || (tag + "1");
        setBusy(true);
        onAsk(anchor, txt, replyTo ? replyTo.text : null).then(function () {
          setAsk(""); setReplyTo(null);
        }).catch(function () {}).then(function () { setBusy(false); });
      }

      function stepRow(s, i, withExplain) {
        var anchor = tag + (i + 1);
        var isSel = sel === anchor;
        return h("div", {
          key: i, id: "step-" + anchor,
          style: Object.assign({}, C.step, isSel ? { background: "var(--dsh-active,#eef1f6)", borderRadius: 8, paddingRight: 10 } : null)
        },
          h("div", { style: Object.assign({}, C.stepNo, { cursor: "pointer", border: isSel ? "1px solid #3b6cf6" : "none" }), onClick: function () { pick(anchor); } }, anchor),
          h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            h("div", { style: C.stepTitle }, s.title),
            h("span", { style: { fontSize: 11, color: "var(--dsh-muted,#9aa0a6)", cursor: "pointer" }, onClick: function () { pick(anchor); } }, "点此追问")
          ),
          h(MathText, { text: withExplain ? (s.explain || s.body) : s.body })
        );
      }

      var exam = h("div", null, blocks.map(function (s, i) { return stepRow(s, i, false); }));
      var explain = h("div", null, blocks.map(function (s, i) {
        var anchor = tag + (i + 1);
        return h("div", { key: i, style: C.step, id: "explain-" + anchor },
          h("div", { style: C.stepNo }, anchor),
          h("div", { style: C.stepTitle }, s.title),
          s.intent ? h("div", { style: C.small }, "意图：" + s.intent) : null,
          h(MathText, { text: s.explain || s.body })
        );
      }));
      var one = h("div", { style: { fontSize: 15, lineHeight: 1.9, padding: "10px 0" } }, q.gist || "（没有一句话摘要）");

      function nodeView(node, depth, anchor, path) {
        return h("div", { key: path, id: "thread-" + path, style: { marginLeft: depth ? 18 : 0, paddingLeft: depth ? 12 : 0, borderLeft: depth ? "2px solid var(--dsh-border,#e6e7ea)" : "none", marginTop: 10 } },
          h("div", { style: { display: "flex", gap: 8, alignItems: "baseline" } },
            h("span", { style: { fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "#eef1ff", color: "#3b6cf6", flexShrink: 0 } }, depth ? "追问" : anchor),
            h("div", { style: { fontSize: 13, fontWeight: 500 } }, node.text),
            h("span", { style: { fontSize: 11, color: "#3b6cf6", cursor: "pointer", flexShrink: 0 }, onClick: function () { reply(node, anchor); } }, "回复")
          ),
          node.answer ? h("div", { style: { marginTop: 4 } }, h(MathText, { text: node.answer, style: { fontSize: 13, lineHeight: 1.75, color: "var(--dsh-muted,#333)" } })) : null,
          (node.children || []).map(function (c, j) { return nodeView(c, depth + 1, anchor, path + "-" + j); })
        );
      }

      var threadSection = threads.length ? h("div", { style: { marginTop: 26, borderTop: "1px solid var(--dsh-border,#ececec)", paddingTop: 14 } },
        h("div", { style: { fontSize: 13, fontWeight: 600, marginBottom: 4 } }, "追问 · " + threads.length + " 处"),
        threads.map(function (t, i) { return nodeView(t, 0, t.anchor, t.anchor + "-" + i); })
      ) : null;

      var composer = h("div", { style: { position: "sticky", bottom: 0, marginTop: 22, padding: "10px 0 12px", background: "var(--dsh-bg,#fff)", borderTop: "1px solid var(--dsh-border,#ececec)" } },
        replyTo ? h("div", { style: Object.assign({}, C.muted, { marginBottom: 4 }) }, "回复：" + String(replyTo.text).slice(0, 30) + "（点右边的 × 取消）",
          h("span", { style: { cursor: "pointer", marginLeft: 6 }, onClick: function () { setReplyTo(null); } }, "×")) : h("div", { style: Object.assign({}, C.muted, { marginBottom: 4 }) }, sel ? "对 " + sel + " 提问" : "先点某一步，再在这里提问"),
        h("div", { style: { display: "flex", gap: 8 } },
          h("input", {
            id: "study-ask", style: Object.assign({}, C.search, { height: 34 }),
            placeholder: sel || replyTo ? "这一步哪里没懂？" : "先点步骤再提问…",
            value: ask, onChange: function (e) { setAsk(e.target.value); },
            onKeyDown: function (e) { if (e.key === "Enter") submit(); }
          }),
          h("button", { style: C.btnPrimary, onClick: submit, disabled: busy || !ask.trim() || (!sel && !replyTo) }, busy ? "…" : "发送")
        )
      );

      return h("div", null,
        h("h2", { style: C.title }, q.title || q.id),
        h("div", { style: { marginBottom: 10 } },
          h("span", { style: C.chip }, q.id),
          q.course ? h("span", { style: C.chip }, q.course) : null,
          q.form ? h("span", { style: C.chip }, q.form) : null,
          q.style ? h("span", { style: C.chip }, q.style) : null,
          h(Badge, { badge: { status: q.badge ? q.badge.status : q.verify } }),
          h("span", { style: { float: "right" } },
            h("button", { style: C.btn, disabled: !props.onPrev, onClick: props.onPrev, title: "上一题" }, "‹"), " ",
            h("button", { style: C.btn, disabled: !props.onNext, onClick: props.onNext, title: "下一题" }, "›")
          )
        ),
        h(MathText, { text: q.stem, style: { fontSize: 14, lineHeight: 1.8, padding: "10px 12px", background: "var(--dsh-chip,#f7f8fa)", borderRadius: 10 } }),
        (q.figures || []).map(function (f, i) { return h(Figure, { key: i, fig: f }); }),
        h("div", { style: C.layerBar },
          h("button", { style: layer === "exam" ? C.tabOn : C.tab, onClick: function () { setLayer("exam"); } }, "卷面"),
          h("button", { style: layer === "explain" ? C.tabOn : C.tab, onClick: function () { setLayer("explain"); } }, "讲解"),
          h("button", { style: layer === "one" ? C.tabOn : C.tab, onClick: function () { setLayer("one"); } }, "一句话")
        ),
        layer === "exam" ? exam : layer === "explain" ? explain : one,
        threadSection,
        composer
      );
    }

    /* ---------- 对比视图 ---------- */
    function CompareModal(props) {
      var a = props.a, b = props.b
      var [q, setQ] = useState("")
      var [ans, setAns] = useState("")
      var [busy, setBusy] = useState(false)
      var kindText = { 'same-method': '同套路', 'same-topic': '同考点', 'false-friend': '形似神不似' }
      function run() {
        setBusy(true); setAns("")
        api("/study/api/compare", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lib: a.library || b.library, a: a.id, b: b.id, question: q }) })
          .then(function (d) { setAns(d.answer || "") }).catch(function (e) { setAns("出错：" + e.message) }).then(function () { setBusy(false) })
      }
      function col(x) {
        return h("div", { style: { flex: 1, minWidth: 0, padding: "0 10px" } },
          h("div", { style: { fontSize: 12, fontWeight: 600, marginBottom: 6 } }, (x.title || x.id)),
          h("div", { style: { fontSize: 11, color: "var(--dsh-muted,#8a8f98)", marginBottom: 8 } }, x.id),
          (x.steps || []).map(function (s, i) {
            return h("div", { key: i, style: { borderLeft: "2px solid var(--dsh-border,#e6e7ea)", paddingLeft: 10, marginBottom: 10 } },
              h("div", { style: { fontSize: 12, fontWeight: 600 } }, (i + 1) + ". " + s.title),
              h("div", { style: { fontSize: 10.5, color: "var(--dsh-muted,#8a8f98)" } }, s.method)
            )
          })
        )
      }
      return h("div", { style: C.modalBg, onClick: function (e) { if (e.target === e.currentTarget) props.onClose() } },
        h("div", { style: Object.assign({}, C.modal, { width: 980 }) },
          h("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 6 } }, "对比 · " + (kindText[props.kind] || "关联")),
          h("div", { style: { display: "flex", gap: 8, marginBottom: 10 } }, col(a), col(b)),
          h("div", { style: { display: "flex", gap: 8 } },
            h("input", { style: Object.assign({}, C.search, { height: 32 }), placeholder: "想问什么？例如：为什么这题要代端点那题不用", value: q, onChange: function (e) { setQ(e.target.value); }, onKeyDown: function (e) { if (e.key === "Enter") run(); } }),
            h("button", { style: C.btnPrimary, onClick: run, disabled: busy }, busy ? "分析中…" : "对比")
          ),
          ans ? h("div", { style: { marginTop: 12, padding: 10, background: "var(--dsh-chip,#f7f8fa)", borderRadius: 8 } }, h(MathText, { text: ans, style: { fontSize: 13, lineHeight: 1.75 } })) : null
        )
      )
    }

    /* ---------- 新建 ---------- */
    /* ---------- 新建页（主区整页，不再是弹窗） ---------- */
    function NewPage(props) {
      var libs = props.libs || []
      var [stem, setStem] = useState("")
      var [library, setLibrary] = useState("")
      var [autoLib, setAutoLib] = useState(true)
      var [autoNote, setAutoNote] = useState("")
      var [imgMsg, setImgMsg] = useState("")
      var [draft, setDraft] = useState(null)
      var [busy, setBusy] = useState(false)
      var [err, setErr] = useState("")

      function upload(files) {
        var f = files && files[0]
        if (!f) return
        var reader = new FileReader()
        reader.onload = function () {
          api("/study/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.name, data: String(reader.result) }) })
            .then(function (d) {
              setImgMsg("已存为附件，正在识别文字…")
              return api("/study/api/ocr", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: d.path }) })
                .then(function (o) {
                  var txt = String(o.text || "").replace(/\s+/g, " ").replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, "$1").trim()
                  if (txt) { setStem(function (prev) { return prev ? prev + "\n" + txt : txt }); setImgMsg("已识别 " + txt.length + " 字，请校对") }
                  else setImgMsg("没识别出文字，请手动输入")
                })
            })
            .catch(function () { setImgMsg("上传或识别失败，请手动输入") })
        }
        reader.readAsDataURL(f)
      }

      function createLib() {
        var name = window.prompt("新建库名（例如 数学-导数）", "")
        if (!name) return
        api("/study/api/library/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name }) })
          .then(function (d) { setLibrary(d.library); setAutoNote(""); if (props.onLibsChanged) props.onLibsChanged() })
          .catch(function (e) { setErr("建库失败：" + e.message) })
      }

      function run() {
        setBusy(true); setErr(""); setDraft(null); setAutoNote("")
        var pre = Promise.resolve({ library: library })
        if (autoLib && !library) {
          pre = api("/study/api/suggest-library", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stem: stem }) })
            .then(function (s) {
              if (s.library) { setIsNewLib(false); setAutoNote("自动归库：" + s.library + "（" + (s.reason || "") + "）") }
              else { setIsNewLib(true); setAutoNote("没有合适的库，将新建一个（名字可改）") }
              return { library: s.library || s.newName }
            })
        }
        pre.then(function (p) {
          var target = p.library || "收件箱"
          setLibrary(target)
          return api("/study/api/solve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stem: stem, library: target }) })
        }).then(function (d) {
          setDraft(d.card)
        }).catch(function (e) { setErr(e.message) }).then(function () { setBusy(false) })
      }

      function commit() {
        setBusy(true)
        var target = library || "收件箱"
        var ensure = libs.some(function (l) { return l.name === target })
          ? Promise.resolve()
          : api("/study/api/library/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: target }) }).catch(function () {})
        ensure.then(function () {
          return api("/study/api/commit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ library: target, card: draft }) })
        }).then(function (d) {
          if (props.onLibsChanged) props.onLibsChanged()
          props.onSaved(d)
        }).catch(function (e) { setErr(e.message); setBusy(false) })
      }

      var detected = draft ? (draft.course + " · " + draft.form) : ""

      return h("div", { style: { maxWidth: 860 } },
        h("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } },
          h("div", { style: { fontSize: 17, fontWeight: 600 } }, draft ? "确认入库" : "新建题目"),
          h("div", { style: { flex: 1 } }),
          h("button", { style: C.btn, onClick: props.onBack }, "返回")
        ),
        draft ? h("div", null,
          h("div", { style: { fontSize: 15, fontWeight: 600, marginBottom: 6 } }, draft.title),
          h("div", { style: { marginBottom: 10 } },
            h("span", { style: C.chip }, draft.course), h("span", { style: C.chip }, draft.form), h("span", { style: C.chip }, "自动判定"),
            h(Badge, { badge: draft.badge || {} })
          ),
          h(MathText, { text: draft.stem, style: { fontSize: 14, lineHeight: 1.8, padding: "10px 12px", background: "var(--dsh-chip,#f7f8fa)", borderRadius: 10, marginBottom: 10 } }),
          (draft.steps || []).map(function (s, i) {
            return h("div", { key: i, style: { borderLeft: "2px solid var(--dsh-border,#e6e7ea)", paddingLeft: 12, marginBottom: 10 } },
              h("div", { style: { fontSize: 13, fontWeight: 600 } }, (i + 1) + ". " + s.title),
              h(MathText, { text: s.body, style: { fontSize: 13, lineHeight: 1.7 } })
            )
          }),
          h("div", { style: { display: "flex", gap: 8, alignItems: "center", marginTop: 12 } },
            h("span", { style: C.muted }, "将放入：" + (library || "收件箱")),
            h("button", { style: C.btnPrimary, onClick: commit, disabled: busy }, busy ? "写入中…" : "确认入库"),
            h("button", { style: C.btn, onClick: function () { setDraft(null) } }, "重写")
          )
        ) : h("div", null,
          h("textarea", { style: Object.assign({}, C.textarea, { minHeight: 220, fontSize: 14 }), placeholder: "把题干贴进来，或上传图片自动识别…", value: stem, onChange: function (e) { setStem(e.target.value) } }),
          h("div", { style: { display: "flex", gap: 10, alignItems: "center", marginBottom: 10 } },
            h("label", { style: C.btn }, "上传图片", h("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: function (e) { upload(e.target.files) } })),
            h("select", { style: C.sel, value: library, onChange: function (e) { setLibrary(e.target.value); setAutoNote("") } },
              h("option", { value: "" }, "（自动选择库）"),
              libs.map(function (l) { return h("option", { key: l.name, value: l.name }, l.name) })
            ),
            h("button", { style: C.btn, title: "新建库", onClick: createLib }, "＋ 库"),
            h("label", { style: Object.assign({}, C.sel, { display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }) },
              h("input", { type: "checkbox", checked: autoLib, onChange: function (e) { setAutoLib(e.target.checked) } }), "自动归库"
            )
          ),
          autoNote ? h("div", { style: C.muted }, autoNote) : null,
          isNewLib ? h("div", { style: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 } },
            h("span", { style: C.muted }, "新库名"),
            h("input", { style: Object.assign({}, C.search, { height: 30, width: 260 }), value: library, onChange: function (e) { setLibrary(e.target.value) } })
          ) : null,
          imgMsg ? h("div", { style: C.muted }, imgMsg) : null,
          err ? h("div", { style: { color: "#b3261e", fontSize: 12, margin: "8px 0" } }, err) : null,
          h("div", { style: { display: "flex", gap: 8, marginTop: 12 } },
            h("button", { style: C.btnPrimary, onClick: run, disabled: busy || !stem.trim() }, busy ? "生成中…（约 30 秒）" : "生成"),
            h("button", { style: C.btn, onClick: props.onBack }, "取消")
          )
        )
      )
    }

    function StudyPanel() {
      var [libs, setLibs] = useState([]);
      var [courses, setCourses] = useState([]);
      var [lib, setLib] = useState("");
      var [items, setItems] = useState([]);
      var [q, setQ] = useState(null);
      var [layer, setLayer] = useState("exam");
      var [err, setErr] = useState("");
      var [query, setQuery] = useState("");
      var [hits, setHits] = useState(null);
      var [showLibs, setShowLibs] = useState(false);
      var [mode, setMode] = useState("view");
      var [drawer, setDrawer] = useState(null);
      var [ask, setAsk] = useState("");
      var [answer, setAnswer] = useState("");
      var [busy, setBusy] = useState(false);
      var [related, setRelated] = useState([]);
      var [cmp, setCmp] = useState(null);
      var [know, setKnow] = useState({ cards: [], topics: [] });
      var [hidden, setHidden] = useState([]);

      function onAsk(anchor, question, parent) {
        if (!q) return Promise.reject(new Error("no question"))
        return api("/study/api/followup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ library: lib || q.library, id: q.id, anchor, question, parent }) })
          .then(function () {
            return api("/study/api/question?lib=" + encodeURIComponent(lib || q.library) + "&id=" + encodeURIComponent(q.id))
          })
          .then(function (d) { if (d && d.question) setQ(d.question); })
      }

      function loadLibs(selectFirst) {
        api("/study/api/libraries").then(function (d) {
          var list = d.libs || [];
          setLibs(list);
          if (selectFirst) setLib(function (cur) { return cur || (list[0] ? list[0].name : ""); });
        }).catch(function () { setErr("数据接口未就绪：刷新一次（Ctrl+R）；仍不行就重启 DSH。"); });
      }
      function loadItems(name) {
        if (!name) { setItems([]); return; }
        api("/study/api/questions?lib=" + encodeURIComponent(name)).then(function (d) {
          var list = d.items || [];
          setItems(list);
          if (list.length) openItem(name, list[0].id);
        }).catch(function () {});
      }
      function openItem(libName, id) {
        setMode("view")
        api("/study/api/question?lib=" + encodeURIComponent(libName) + "&id=" + encodeURIComponent(id))
          .then(function (d) { setQ(d.question); setLayer("exam"); api("/study/api/related?lib=" + encodeURIComponent(libName) + "&id=" + encodeURIComponent(id)).then(function (r) { setRelated(r.items || []); setHidden(r.hidden || []); }).catch(function () {}); }).catch(function () {});
      }

      useEffect(function () {
        loadKatex();
        var onReady = function () { setKatexTick(function (x) { return x + 1 }); };
        window.addEventListener("study-katex-ready", onReady);
        loadLibs(true);
        api("/study/api/courses").then(function (d) { setCourses(d.courses || []); }).catch(function () {});
      }, []);
      useEffect(function () { loadItems(lib); }, [lib]);
      useEffect(function () {
        if (!lib) { setKnow({ cards: [], topics: [] }); return; }
        api("/study/api/knowledge?lib=" + encodeURIComponent(lib)).then(function (d) { setKnow({ cards: d.cards || [], topics: d.topics || [] }); }).catch(function () {});
      }, [lib]);

      function doSearch(v) {
        setQuery(v);
        if (!v.trim()) { setHits(null); return; }
        api("/study/api/search?q=" + encodeURIComponent(v)).then(function (d) { setHits(d.items || []); }).catch(function () {});
      }

      var rail = h("div", { style: C.rail },
        h("button", { style: C.railBtn, title: "库", onClick: function () { setShowLibs(!showLibs); } }, "📚"),
        h("button", { style: C.railBtn, title: "新建", onClick: function () { setMode("new"); } }, "＋"),
        h("button", { style: C.railBtn, title: "刷新", onClick: function () { loadLibs(false); loadItems(lib); } }, "⟳")
      );

      var overlay = showLibs ? h("div", { style: C.overlay },
        h("div", { style: Object.assign({}, C.muted, { padding: "6px 10px" }) }, "题库"),
        libs.map(function (l) {
          return h("div", {
            key: l.name,
            style: Object.assign({}, C.libRow, l.name === lib ? { background: "var(--dsh-active,#eef1f6)", fontWeight: 600 } : null),
            onClick: function () { setMode("view"); setLib(l.name); setShowLibs(false); if (l.name === lib) loadItems(l.name); }
          }, h("span", null, l.name), h("span", { style: C.muted }, l.count));
        }),
        h("div", { style: Object.assign({}, C.muted, { padding: "10px 10px 4px", borderTop: "1px solid var(--dsh-border,#ececec)", marginTop: 6 }) }, "本库题目 · " + items.length),
        items.map(function (it) {
          return h("div", { key: it.id, style: Object.assign({}, C.libRow, q && q.id === it.id ? { background: "var(--dsh-active,#eef1f6)" } : null), onClick: function () { openItem(lib, it.id); setShowLibs(false); } },
            h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, it.title),
            h("span", { style: C.muted }, it.id.slice(-4))
          );
        }),
        hits !== null ? h("div", null, h("div", { style: Object.assign({}, C.muted, { padding: "10px 10px 4px" }) }, "搜索：" + query), hits.map(function (r) {
          return h("div", { key: r.id, style: C.libRow, onClick: function () { openItem(r.lib, r.id); setShowLibs(false); } }, r.title);
        })) : null
      ) : null;

      var right = h("div", { style: C.right },
        h("div", { style: { fontWeight: 600, marginBottom: 8 } }, "相关题"),
        related.map(function (r, i) {
          var kindText = { "same-method": "同套路", "same-topic": "同考点", "false-friend": "形似" }
          return h("div", { key: i, style: { padding: "5px 0", borderBottom: "1px solid var(--dsh-border,#f2f2f4)" } },
            h("div", { style: { cursor: "pointer", fontSize: 12 } }, h("span", { style: { color: "#3b6cf6", marginRight: 4 } }, "[" + (kindText[r.kind] || r.kind) + "]"), r.title),
            h("div", { style: { fontSize: 10.5, color: "var(--dsh-muted,#8a8f98)", marginTop: 2 } }, r.reason || ""),
            h("div", { style: { marginTop: 3, display: "flex", gap: 8, fontSize: 11, color: "#3b6cf6" } },
              h("span", { style: { cursor: "pointer" }, onClick: function () { setCmp({ a: q, b: r, kind: r.kind, other: r }); } }, "对比"),
              h("span", { style: { cursor: "pointer" }, onClick: function () { api("/study/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: q.id, other: r.id, action: "up" }) }); } }, "👍"),
              h("span", { style: { cursor: "pointer" }, onClick: function () { setRelated(function (list) { return list.filter(function (x) { return x.id !== r.id; }); }); api("/study/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: q.id, other: r.id, action: "deny" }) }); } }, "✕")
            )
          );
        }),
        related.length ? null : h("div", { style: C.muted }, "暂无关联"),
        hidden.length ? h("div", { style: { marginTop: 8, fontSize: 11, color: "var(--dsh-muted,#8a8f98)" } },
          "已隐藏 " + hidden.length + " 条 · ",
          h("span", { style: { color: "#3b6cf6", cursor: "pointer" }, onClick: function () {
            Promise.all(hidden.map(function (x) {
              return api("/study/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: q.id, other: x.id, action: "allow" }) });
            })).then(function () {
              return api("/study/api/related?lib=" + encodeURIComponent(lib) + "&id=" + encodeURIComponent(q.id));
            }).then(function (d) { setRelated(d.items || []); setHidden(d.hidden || []); }).catch(function () {});
          } }, "恢复")
        ) : null,
        h("div", { style: { marginTop: 16, fontWeight: 600, marginBottom: 6 } }, "知识卡"),
        know.cards.length ? know.cards.map(function (c, i) {
          return h("div", { key: i, style: { padding: "5px 0", borderBottom: "1px solid var(--dsh-border,#f2f2f4)" } },
            h("div", { style: { fontSize: 12, fontWeight: 500 } }, c.name),
            h("div", { style: { fontSize: 10.5, color: "var(--dsh-muted,#8a8f98)", whiteSpace: "pre-wrap", marginTop: 2 } }, String(c.body || "").slice(0, 80))
          );
        }) : h("div", { style: C.muted }, "还没有知识卡"),
        h("div", { style: { marginTop: 6 } },
          h("button", { style: Object.assign({}, C.btn, { height: 24, fontSize: 11 }), onClick: function () {
            api("/study/api/knowledge/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ lib: lib }) })
              .then(function () { return api("/study/api/knowledge?lib=" + encodeURIComponent(lib)); })
              .then(function (d) { setKnow({ cards: d.cards || [], topics: d.topics || [] }); })
              .catch(function () {});
          } }, "从知识点生成草稿")
        )
      );

      var drawerBox = false ? h("div", { style: Object.assign({}, C.drawer, { height: 260 }) },
        h("div", { style: C.row },
          h("div", { style: { fontWeight: 600, fontSize: 13 } }, "追问 · 挂在 " + drawer),
          h("button", { style: C.btn, onClick: function () { setDrawer(null); } }, "收起")
        ),
        h("div", { style: Object.assign({}, C.muted, { marginBottom: 6 }) },
          "针对这一步提问，答案会存进这道题里。"
        ),
        h("div", { style: { maxHeight: 110, overflowY: "auto", marginBottom: 6 } },
          ((q && q.threads) || []).filter(function (t) { return t.anchor === drawer; }).map(function (t, i) { return h(ThreadNode, { key: i, node: t, depth: 0 }); }),
          ((q && q.threads) || []).some(function (t) { return t.anchor === drawer; }) ? null : h("div", { style: C.muted }, "还没有针对这一步的追问")
        ),
        answer ? h("div", { style: { fontSize: 13, lineHeight: 1.7, background: "var(--dsh-chip,#f7f8fa)", borderRadius: 8, padding: 10, marginBottom: 8 } }, h(MathText, { text: answer, style: { fontSize: 13, lineHeight: 1.7 } })) : null,
        h("div", { style: C.row },
          h("input", { style: Object.assign({}, C.search, { height: 32 }), placeholder: "这一步哪里没懂？", value: ask, onChange: function (e) { setAsk(e.target.value); }, onKeyDown: function (e) { if (e.key === "Enter" && ask.trim() && !busy) send(); } }),
          h("button", { style: C.btnPrimary, onClick: send, disabled: busy || !ask.trim() }, busy ? "回答中…" : "发送")
        )
      ) : null;

      var treeRoots = ((q && q.threads) || []).filter(function (t) { return t.anchor; })
      var treeBox = (mode === "view" && treeRoots.length) ? h(ThreadTreePanel, { roots: treeRoots, onJump: function (a, path) { var el = document.getElementById("thread-" + path) || document.getElementById("step-" + a); if (!el) return; el.scrollIntoView({ behavior: "smooth", block: "center" }); el.style.transition = "background .35s"; el.style.background = "#fffbeb"; el.style.borderRadius = "8px"; setTimeout(function () { el.style.background = "transparent" }, 1400) } }) : null

      return h("div", { style: Object.assign({}, C.root, { position: "relative" }) },
        h("div", { style: C.top },
          h("input", { style: C.search, placeholder: "搜索题目 / 知识点…", value: query, onChange: function (e) { doSearch(e.target.value); } }),
          h("button", { style: C.btnPrimary, onClick: function () { setMode("new"); } }, "＋ 新建"),
          h("span", { style: C.muted }, (libs.reduce(function (a, b) { return a + (b.count || 0); }, 0)) + " 题")
        ),
        err ? h("div", { style: { padding: "6px 12px", color: "#b3261e", fontSize: 12 } }, err) : null,
        h("div", { style: C.body },
          rail,
          h("div", { style: Object.assign({}, C.main, mode === "new" ? { maxWidth: 980, margin: "0 auto" } : null) },
            mode === "new" ? h(NewPage, { libs: libs, lib: lib, onBack: function () { setMode("view") }, onSaved: function () { setMode("view"); }, onLibsChanged: function () { loadLibs(false); } }) : h(Card, { q: q, layer: layer, setLayer: setLayer, onAsk: onAsk, onAnchor: function (a) { var el = document.getElementById("step-" + a); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, onPrev: items.length > 1 ? function () { var i = items.findIndex(function (x) { return x.id === (q && q.id); }); if (i > 0) openItem(lib, items[i - 1].id); } : null, onNext: items.length > 1 ? function () { var i = items.findIndex(function (x) { return x.id === (q && q.id); }); if (i >= 0 && i < items.length - 1) openItem(lib, items[i + 1].id); } : null })
          ),
          mode === "new" ? null : right
        ),
        drawerBox,
        overlay,
        treeBox,
        cmp ? h(CompareModal, { a: cmp.a, b: cmp.other, kind: cmp.kind, onClose: function () { setCmp(null); } }) : null,
      );
    }

    function StudyIcon() {
      return h("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        h("path", { d: "M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16.5H6.5A2.5 2.5 0 0 0 4 22z" }),
        h("path", { d: "M4 5.5V19" }),
        h("path", { d: "M9 8h6M9 12h4" })
      );
    }

    var inject = ["slots"];
    function apply(ctx) {
      ctx.slots.inject("sidebar.panellist", function () {
        return ctx.slots.register({ name: "sidebar.panellist", id: PANEL_ID, order: 10, label: "题库" }, StudyIcon);
      });
      ctx.slots.inject("main", function () {
        return ctx.slots.register({ name: "main", key: PANEL_ID }, StudyPanel);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});