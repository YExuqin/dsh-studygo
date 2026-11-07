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
      var [pos, setPos] = useState({ x: Math.max(16, (window.innerWidth || 1440) - 348), y: Math.max(16, (window.innerHeight || 900) - 360) })
      var drag = react.useRef(null)
      if (!roots.length) return null

      var nodes = []
      var links = []
      var cursor = 0
      function walk(node, depth, parentId, id) {
        var me = { id: id, label: (node.anchor ? node.anchor + " " : "") + String(node.text || "").slice(0, node.anchor ? 9 : 11), anchor: node.anchor, depth: depth }
        nodes.push(me)
        if (parentId != null) links.push([parentId, id])
        var kids = node.children || []
        if (!kids.length) { me.y = cursor * 44 + 26; cursor++ }
        else {
          var ys = kids.map(function (k, i) { return walk(k, depth + 1, id, id + "-" + i) })
          me.y = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2
        }
        me.x = 18 + depth * 132
        return me.y
      }
      roots.forEach(function (t, i) { walk(t, 0, null, "r" + i) })

      var byId = {}
      nodes.forEach(function (n) { byId[n.id] = n })
      var W = Math.max(220, Math.max.apply(null, nodes.map(function (n) { return n.x })) + 130)
      var H = Math.max(60, cursor * 44 + 20)

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

      return h("div", {
        style: { position: "fixed", left: pos.x, top: pos.y, width: Math.min(W + 24, 360), background: "var(--dsh-bg,#fff)", border: "1px solid var(--dsh-border,#e3e3e6)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 40, overflow: "hidden" }
      },
        h("div", {
          style: { padding: "6px 10px", cursor: "move", background: "var(--dsh-chip,#f4f5f7)", fontSize: 12, fontWeight: 600, display: "flex", justifyContent: "space-between", userSelect: "none" },
          onMouseDown: startDrag
        },
          h("span", null, "追问树 · " + nodes.length + " 节点"),
          h("span", { style: { color: "var(--dsh-muted,#8a8f98)", fontWeight: 400 } }, "拖动")
        ),
        h("div", { style: { maxHeight: 260, overflow: "auto", padding: 6 } },
          h("svg", { width: W, height: H, style: { display: "block" } },
            links.map(function (l, i) {
              var a = byId[l[0]], b = byId[l[1]]
              if (!a || !b) return null
              var x1 = a.x + 104, y1 = a.y, x2 = b.x, y2 = b.y
              var mx = (x1 + x2) / 2
              return h("path", { key: "l" + i, d: "M" + x1 + "," + y1 + " C" + mx + "," + y1 + " " + mx + "," + y2 + " " + x2 + "," + y2, fill: "none", stroke: "var(--dsh-border,#d6d8dd)", strokeWidth: 1.4 })
            }),
            nodes.map(function (n) {
              return h("g", { key: n.id, style: { cursor: n.anchor ? "pointer" : "default" }, onClick: function () {
                if (n.anchor) props.onJump(n.anchor)
              } },
                h("rect", { x: n.x, y: n.y - 13, width: 104, height: 26, rx: 6, fill: n.anchor ? "#eef1ff" : "var(--dsh-chip,#f4f5f7)", stroke: "var(--dsh-border,#d6d8dd)" }),
                h("text", { x: n.x + 8, y: n.y + 4, fontSize: 10.5, fill: "currentColor" }, n.label)
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

    function MathText(props) {
      var text = String(props.text == null ? "" : props.text)
        .replace(/\\\[([\s\S]+?)\\\]/g, "$$$1$$")
        .replace(/\\\(([\s\S]+?)\\\)/g, "$$1$")
      var style = props.style || C.text
      var parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g)
      return h("div", { style: style }, parts.map(function (p, i) {
        if (!p) return null
        if (p.length > 4 && p.slice(0, 2) === "$$" && p.slice(-2) === "$$") {
          var dh = katexHtml(p.slice(2, -2), true)
          if (dh) return h("div", { key: i, dangerouslySetInnerHTML: { __html: dh } })
          return h("div", { key: i, style: { fontFamily: "ui-monospace,monospace" } }, p.slice(2, -2))
        }
        if (p.length > 2 && p[0] === "$" && p.slice(-1) === "$") {
          var ih = katexHtml(p.slice(1, -1), false)
          if (ih) return h("span", { key: i, dangerouslySetInnerHTML: { __html: ih } })
          return h("span", { key: i, style: { fontFamily: "ui-monospace,monospace" } }, p.slice(1, -1))
        }
        return h("span", { key: i, style: { whiteSpace: "pre-wrap" } }, p)
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
      var onAnchor = props.onAnchor;
      var onAsk = props.onAsk || function () {};
      var [askMap, setAskMap] = useState({});
      var [busyAnchor, setBusyAnchor] = useState("");
      if (!q) return h("div", { style: { padding: 60, textAlign: "center", color: "#9aa0a6", fontSize: 13 } }, "从左边选个库，或点「+ 新建」录入一道题");

      var blocks = (q.form === "analysis" ? q.steps : q.steps) || [];
      var tag = q.form === "analysis" ? "P" : "S";

      var exam = h("div", null, blocks.map(function (s, i) {
        var anchor = tag + (i + 1)
        var list = ((q.threads || [])).filter(function (t) { return t.anchor === anchor; })
        var txt = askMap[anchor] || ""
        return h("div", { key: i, id: "step-" + anchor, style: C.step },
          h("div", { style: C.stepNo }, anchor),
          h("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
            h("div", { style: C.stepTitle }, s.title)
          ),
          h(MathText, { text: s.body }),
          list.length ? h("div", { style: { marginTop: 10, padding: "8px 10px", background: "var(--dsh-chip,#f7f8fa)", borderRadius: 10 } },
            list.map(function (t, j) { return h(ThreadNode, { key: j, node: t, depth: 0 }); })
          ) : null,
          h("div", { style: { display: "flex", gap: 6, marginTop: 8 } },
            h("input", {
              style: Object.assign({}, C.search, { height: 30, fontSize: 12.5 }),
              placeholder: "对这一步提问…",
              value: txt,
              onChange: function (e) { setAskMap(function (m) { var n2 = Object.assign({}, m); n2[anchor] = e.target.value; return n2; }); },
              onKeyDown: function (e) { if (e.key === "Enter") sendInline(anchor); }
            }),
            h("button", { style: C.btnPrimary, disabled: busyAnchor === anchor || !txt.trim(), onClick: function () { sendInline(anchor); } }, busyAnchor === anchor ? "…" : "发送")
          )
        )
      }));

      function sendInline(anchor) {
        var txt = (askMap[anchor] || "").trim()
        if (!txt) return
        setBusyAnchor(anchor)
        onAsk(anchor, txt, null).then(function () {
          setAskMap(function (m) { var n2 = Object.assign({}, m); n2[anchor] = ""; return n2; })
        }).catch(function () {}).then(function () { setBusyAnchor(""); })
      }

      var explain = h("div", null, blocks.map(function (s, i) {
        return h("div", { key: i, style: C.step },
          h("div", { style: C.stepNo, onClick: function () { onAnchor(tag + (i + 1)); } }, tag + (i + 1)),
          h("div", { style: C.stepTitle }, s.title),
          s.intent ? h("div", { style: C.small }, "意图：" + s.intent) : null,
          s.explain ? h("div", { style: C.text }, s.explain) : h("div", { style: C.small }, "（这一步没有额外讲解）")
        );
      }));

      var one = h("div", { style: { fontSize: 15, lineHeight: 1.9, padding: "10px 0" } }, q.gist || "（没有一句话摘要）");

      return h("div", null,
        h("h2", { style: C.title }, q.title || q.id),
        h("div", { style: { marginBottom: 10 } },
          h("span", { style: C.chip }, q.id),
          q.course ? h("span", { style: C.chip }, q.course) : null,
          q.form ? h("span", { style: C.chip }, q.form) : null,
          q.style ? h("span", { style: C.chip }, q.style) : null,
          h(Badge, { badge: { status: q.badge ? q.badge.status : q.verify } }),
          h("span", { style: { float: "right" } },
            h("button", { style: C.btn, disabled: !props.onPrev, onClick: props.onPrev, title: "上一题" }, "‹"),
            " ",
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
        layer === "exam" ? exam : layer === "explain" ? explain : one
      );
    }

    /* ---------- 新建 ---------- */
    function NewModal(props) {
      var libs = props.libs;
      var courses = props.courses;
      var onClose = props.onClose;
      var onSaved = props.onSaved;
      var [stem, setStem] = useState("");
      var [library, setLibrary] = useState(props.lib || (libs[0] && libs[0].name) || "收件箱");
      var [course, setCourse] = useState("math");
      var [form, setForm] = useState("proof");
      var [style, setStyle] = useState("guided");
      var [busy, setBusy] = useState(false);
      var [katexTick, setKatexTick] = useState(0);
      var [err, setErr] = useState("");
      var [draft, setDraft] = useState(null);
      var [img, setImg] = useState("");
      var [auto, setAuto] = useState(true);
      var [imgMsg, setImgMsg] = useState("");

      function upload(files) {
        var f = files && files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          api("/study/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.name, data: String(reader.result) }) })
            .then(function (d) {
              setImg(d.path); setImgMsg("已存为附件，正在识别文字…");
              return api("/study/api/ocr", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: d.path }) })
                .then(function (o) {
                  var txt = String(o.text || "").replace(/\s+/g, " ").replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g, "$1").trim();
                  if (txt) { setStem(function (prev) { return prev ? prev + "\n" + txt : txt; }); setImgMsg("已识别 " + txt.length + " 字，请校对后再生成"); }
                  else { setImgMsg("已存为附件，但没识别出文字，请手动输入"); }
                })
                .catch(function () { setImgMsg("已存为附件，识别失败，请手动输入"); });
            })
            .catch(function (e) { setImgMsg("上传失败：" + e.message); });
        };
        reader.readAsDataURL(f);
      }

      function solve() {
        setBusy(true); setErr("");
        api("/study/api/solve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stem, library, course: auto ? undefined : course, form: auto ? undefined : form, style: auto ? undefined : style }) })
          .then(function (d) { setDraft(d.card); })
          .catch(function (e) { setErr(e.message); })
          .then(function () { setBusy(false); });
      }
      function commit() {
        setBusy(true);
        api("/study/api/commit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ library, card: draft }) })
          .then(function (d) { onSaved(d); onClose(); })
          .catch(function (e) { setErr(e.message); setBusy(false); });
      }

      return h("div", { style: C.modalBg, onClick: function (e) { if (e.target === e.currentTarget) onClose(); } },
        h("div", { style: C.modal },
          h("div", { style: { fontSize: 16, fontWeight: 600, marginBottom: 12 } }, draft ? "校对并入库" : "新建题目"),
          draft ? h("div", null,
            h("div", { style: { fontSize: 13, marginBottom: 8 } }, draft.title),
            h("div", { style: { fontSize: 12, color: "#6b7280", marginBottom: 8 } }, "科目：" + draft.course + " · 形态：" + draft.form + " · 档位：" + draft.style + " · " + ((draft.steps || []).length) + " 步"),
            h("div", { style: { fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", background: "#f7f8fa", padding: 10, borderRadius: 8, marginBottom: 10 } }, (draft.steps || []).map(function (s) { return s.title + "：" + String(s.body).slice(0, 80); }).join("\n")),
            h("div", { style: C.row },
              h("button", { style: C.btnPrimary, onClick: commit, disabled: busy }, busy ? "写入中…" : "确认入库"),
              h("button", { style: C.btn, onClick: function () { setDraft(null); } }, "重新生成")
            )
          ) : h("div", null,
            h("textarea", { style: C.textarea, placeholder: "把题干粘进来（公式用 ^ 表示幂，如 x^3-3x）", value: stem, onChange: function (e) { setStem(e.target.value); } }),
            h("div", { style: C.row },
              h("label", { style: C.btn },
                "上传图片",
                h("input", { type: "file", accept: "image/*", style: { display: "none" }, onChange: function (e) { upload(e.target.files); } })
              ),
              imgMsg ? h("span", { style: C.muted }, imgMsg) : null
            ),
            h("div", { style: C.row },
              h("select", { style: C.sel, value: library, onChange: function (e) { setLibrary(e.target.value); } }, libs.map(function (l) { return h("option", { key: l.name, value: l.name }, l.name); })),
              h("label", { style: Object.assign({}, C.sel, { display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }) },
                h("input", { type: "checkbox", checked: auto, onChange: function (e) { setAuto(e.target.checked); } }),
                "自动判断科目与题型"
              ),
              auto ? null : h("select", { style: C.sel, value: course, onChange: function (e) { setCourse(e.target.value); } }, (courses || []).map(function (c) { return h("option", { key: c.id, value: c.id }, c.name || c.id); })),
              auto ? null : h("select", { style: C.sel, value: form, onChange: function (e) { setForm(e.target.value); } }, ["proof", "analysis"].map(function (f) { return h("option", { key: f, value: f }, f); })),
              auto ? null : h("select", { style: C.sel, value: style, onChange: function (e) { setStyle(e.target.value); } }, ["strict", "guided", "free"].map(function (s) { return h("option", { key: s, value: s }, s); }))
            ),
            err ? h("div", { style: { color: "#b3261e", fontSize: 12, marginBottom: 8 } }, err) : null,
            h("div", { style: C.row },
              h("button", { style: C.btnPrimary, onClick: solve, disabled: busy || !stem.trim() }, busy ? "生成中…（约 30 秒）" : "生成"),
              h("button", { style: C.btn, onClick: onClose }, "取消")
            )
          )
        )
      );
    }

    /* ---------- 主面板 ---------- */
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
      var [newOpen, setNewOpen] = useState(false);
      var [drawer, setDrawer] = useState(null);
      var [ask, setAsk] = useState("");
      var [answer, setAnswer] = useState("");
      var [busy, setBusy] = useState(false);
      var [related, setRelated] = useState([]);

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
        api("/study/api/question?lib=" + encodeURIComponent(libName) + "&id=" + encodeURIComponent(id))
          .then(function (d) { setQ(d.question); setRelated(d.related || []); setLayer("exam"); }).catch(function () {});
      }

      useEffect(function () {
        loadKatex();
        var onReady = function () { setKatexTick(function (x) { return x + 1 }); };
        window.addEventListener("study-katex-ready", onReady);
        loadLibs(true);
        api("/study/api/courses").then(function (d) { setCourses(d.courses || []); }).catch(function () {});
      }, []);
      useEffect(function () { loadItems(lib); }, [lib]);

      function doSearch(v) {
        setQuery(v);
        if (!v.trim()) { setHits(null); return; }
        api("/study/api/search?q=" + encodeURIComponent(v)).then(function (d) { setHits(d.items || []); }).catch(function () {});
      }

      var rail = h("div", { style: C.rail },
        h("button", { style: C.railBtn, title: "库", onClick: function () { setShowLibs(!showLibs); } }, "📚"),
        h("button", { style: C.railBtn, title: "新建", onClick: function () { setNewOpen(true); } }, "＋"),
        h("button", { style: C.railBtn, title: "刷新", onClick: function () { loadLibs(false); loadItems(lib); } }, "⟳")
      );

      var overlay = showLibs ? h("div", { style: C.overlay },
        h("div", { style: Object.assign({}, C.muted, { padding: "6px 10px" }) }, "题库"),
        libs.map(function (l) {
          return h("div", {
            key: l.name,
            style: Object.assign({}, C.libRow, l.name === lib ? { background: "var(--dsh-active,#eef1f6)", fontWeight: 600 } : null),
            onClick: function () { setLib(l.name); setShowLibs(false); }
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
        related.map(function (r, i) { return h("div", { key: i, style: { padding: "4px 0", cursor: "pointer" }, onClick: function () { openItem(r.lib, r.id); } }, r.title); }),
        related.length ? null : h("div", { style: C.muted }, "暂无关联")
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
      var treeBox = treeRoots.length ? h(ThreadTreePanel, { roots: treeRoots, onJump: function (a) { var el = document.getElementById("step-" + a); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" }) } }) : null

      return h("div", { style: Object.assign({}, C.root, { position: "relative" }) },
        h("div", { style: C.top },
          h("input", { style: C.search, placeholder: "搜索题目 / 知识点…", value: query, onChange: function (e) { doSearch(e.target.value); } }),
          h("button", { style: C.btnPrimary, onClick: function () { setNewOpen(true); } }, "＋ 新建"),
          h("span", { style: C.muted }, (libs.reduce(function (a, b) { return a + (b.count || 0); }, 0)) + " 题")
        ),
        err ? h("div", { style: { padding: "6px 12px", color: "#b3261e", fontSize: 12 } }, err) : null,
        h("div", { style: C.body },
          rail,
          h("div", { style: C.main },
            h(Card, { q: q, layer: layer, setLayer: setLayer, onAsk: onAsk, onAnchor: function (a) { var el = document.getElementById("step-" + a); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, onPrev: items.length > 1 ? function () { var i = items.findIndex(function (x) { return x.id === (q && q.id); }); if (i > 0) openItem(lib, items[i - 1].id); } : null, onNext: items.length > 1 ? function () { var i = items.findIndex(function (x) { return x.id === (q && q.id); }); if (i >= 0 && i < items.length - 1) openItem(lib, items[i + 1].id); } : null })
          ),
          right
        ),
        drawerBox,
        overlay,
        treeBox,
        newOpen ? h(NewModal, { libs: libs, courses: courses, lib: lib, onClose: function () { setNewOpen(false); }, onSaved: function (d) { loadItems(lib); } }) : null
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