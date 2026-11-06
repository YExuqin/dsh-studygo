
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

    var PANEL_ID = "studygo";

    function getJson(path) {
      return fetch(path, { credentials: "same-origin" }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      });
    }

    var CSS = {
      root: { height: "100%", display: "flex", flexDirection: "column", background: "var(--dsh-bg, #fff)", color: "var(--dsh-fg, #1f2328)" },
      bar: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--dsh-border, #ececec)" },
      search: { flex: 1, height: 30, padding: "0 10px", borderRadius: 8, border: "1px solid var(--dsh-border, #e3e3e6)", background: "transparent", color: "inherit", fontSize: 13, outline: "none" },
      main: { flex: 1, display: "flex", minHeight: 0 },
      col: { overflowY: "auto", minHeight: 0 },
      libs: { width: 210, borderRight: "1px solid var(--dsh-border, #ececec)", padding: 8 },
      list: { width: 320, borderRight: "1px solid var(--dsh-border, #ececec)", padding: 8 },
      detail: { flex: 1, padding: "18px 22px", overflowY: "auto" },
      libRow: { padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 },
      qRow: { padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--dsh-border, #f2f2f4)" },
      muted: { color: "var(--dsh-muted, #8a8f98)", fontSize: 12 },
      title: { fontSize: 16, fontWeight: 600, margin: "0 0 6px" },
      chip: { display: "inline-block", padding: "1px 7px", borderRadius: 999, background: "var(--dsh-chip, #f1f2f4)", fontSize: 11, color: "var(--dsh-muted, #6b7280)", marginRight: 6 },
      step: { borderLeft: "2px solid var(--dsh-border, #e6e7ea)", padding: "2px 0 2px 14px", margin: "14px 0", position: "relative" },
      stepNo: { position: "absolute", left: -13, top: 0, width: 24, height: 24, lineHeight: "22px", textAlign: "center", borderRadius: 999, background: "var(--dsh-chip, #eef0f3)", fontSize: 11, color: "var(--dsh-muted, #555)" },
      stepTitle: { fontWeight: 600, fontSize: 13.5, marginBottom: 2 },
      intent: { fontSize: 12, color: "var(--dsh-muted, #6b7280)", marginBottom: 6 },
      body: { fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap" },
      thread: { marginTop: 8, paddingLeft: 12, borderLeft: "2px solid var(--dsh-accent-weak, #dbe4ff)", fontSize: 13, color: "var(--dsh-fg, #333)" },
      empty: { padding: 40, textAlign: "center", color: "var(--dsh-muted, #9aa0a6)", fontSize: 13 },
      err: { padding: 20, color: "#c0392b", fontSize: 13 },
    };

    function StudyIcon() {
      return h("svg", {
        width: 18, height: 18, viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", strokeWidth: 1.8,
        strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true"
      },
        h("path", { d: "M4 5.5A2.5 2.5 0 0 1 6.5 3H19v16.5H6.5A2.5 2.5 0 0 0 4 22z" }),
        h("path", { d: "M4 5.5V19" }),
        h("path", { d: "M9 8h6M9 12h4" })
      );
    }

    function StudyPanel() {
      var [libs, setLibs] = useState([]);
      var [lib, setLib] = useState("");
      var [items, setItems] = useState([]);
      var [q, setQ] = useState(null);
      var [err, setErr] = useState("");
      var [query, setQuery] = useState("");
      var [hits, setHits] = useState(null);

      function loadLibs() {
        getJson("/study/api/libraries").then(function (d) {
          var list = d.libs || [];
          setLibs(list);
          setErr("");
          setLib(function (cur) { return cur || (list[0] ? list[0].name : ""); });
        }).catch(function (e) { setErr("接口不可用：" + e.message); });
      }

      function loadItems(name) {
        if (!name) { setItems([]); return; }
        getJson("/study/api/questions?lib=" + encodeURIComponent(name)).then(function (d) {
          var list = d.items || [];
          setItems(list);
          if (list.length) {
            getJson("/study/api/question?lib=" + encodeURIComponent(name) + "&id=" + encodeURIComponent(list[0].id))
              .then(function (r) { setQ(r); }).catch(function () {});
          }
        }).catch(function (e) { setErr(e.message); });
      }

      useEffect(function () { loadLibs(); }, []);
      useEffect(function () { loadItems(lib); setQ(null); }, [lib]);

      function openItem(it) {
        getJson("/study/api/question?lib=" + encodeURIComponent(it.lib || lib) + "&id=" + encodeURIComponent(it.id))
          .then(function (d) { setQ(d); })
          .catch(function (e) { setErr(e.message); });
      }

      function doSearch(v) {
        setQuery(v);
        if (!v.trim()) { setHits(null); return; }
        getJson("/study/api/search?q=" + encodeURIComponent(v)).then(function (d) { setHits(d.items || []); }).catch(function (e) { setErr(e.message); });
      }

      var rows = hits !== null ? hits.map(function (r) { return { id: r.id, lib: r.lib, title: r.title, topic: [], stem: r.stem }; }) : items;

      var detail = null;
      if (q && q.question) {
        var qq = q.question;
        detail = h("div", null,
          h("h2", { style: CSS.title }, qq.title || qq.id),
          h("div", { style: { marginBottom: 14 } },
            h("span", { style: CSS.chip }, qq.id),
            (qq.topic || []).map(function (t, i) { return h("span", { key: i, style: CSS.chip }, t); }),
            qq.difficulty ? h("span", { style: CSS.chip }, qq.difficulty) : null
          ),
          h("div", { style: CSS.body }, qq.stem),
          (qq.steps || []).map(function (s, i) {
            var threads = (qq.threads || []).filter(function (t) { return t.indexOf("@S" + s.n + " ") === 0; });
            return h("div", { key: i, style: CSS.step },
              h("div", { style: CSS.stepNo }, "S" + s.n),
              h("div", { style: CSS.stepTitle }, s.title),
              s.intent ? h("div", { style: CSS.intent }, s.intent) : null,
              h("div", { style: CSS.body }, s.body),
              threads.map(function (t, j) { return h("div", { key: j, style: CSS.thread }, t); })
            );
          }),
          q.related && q.related.length ? h("div", { style: { marginTop: 26 } },
            h("div", { style: CSS.muted }, "相关题"),
            q.related.map(function (r, i) { return h("div", { key: i, style: { fontSize: 13, padding: "3px 0", cursor: "pointer" }, onClick: function () { openItem(r); } }, r.title); })
          ) : null
        );
      } else {
        detail = h("div", { style: CSS.empty }, "从中间选一道题");
      }

      return h("div", { style: CSS.root },
        h("div", { style: CSS.bar },
          h("input", {
            style: CSS.search, placeholder: "搜索题目 / 知识点…", value: query,
            onChange: function (e) { doSearch(e.target.value); }
          }),
          h("span", { style: CSS.muted }, (libs.length ? libs.reduce(function (a, b) { return a + (b.count || 0); }, 0) : 0) + " 题")
        ),
        err ? h("div", { style: CSS.err }, err) : null,
        h("div", { style: CSS.main },
          h("div", { style: Object.assign({}, CSS.col, CSS.libs) },
            libs.map(function (l) {
              var active = l.name === lib;
              return h("div", {
                key: l.name,
                style: Object.assign({}, CSS.libRow, active ? { background: "var(--dsh-active, #eef1f6)", fontWeight: 600 } : null),
                onClick: function () { setLib(l.name); }
              },
                h("span", null, l.name),
                h("span", { style: CSS.muted }, l.count)
              );
            })
          ),
          h("div", { style: Object.assign({}, CSS.col, CSS.list) },
            rows.length ? rows.map(function (it) {
              return h("div", {
                key: it.id + (it.lib || ""),
                style: CSS.qRow,
                onClick: function () { openItem(it); }
              },
                h("div", { style: { marginBottom: 3 } }, it.title || it.stem || it.id),
                h("div", { style: CSS.muted }, it.id)
              );
            }) : h("div", { style: CSS.empty }, hits !== null ? "没有匹配" : "这个库还没有题")
          ),
          h("div", { style: Object.assign({}, CSS.col, CSS.detail) }, detail)
        )
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
