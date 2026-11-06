window.__ModuleLoader__.load({
  id: "dsh-studygo",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var h = react.createElement;

    var PANEL_ID = "studygo";

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
      return h("div", {
        style: {
          height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 8,
          color: "var(--dsh-text-secondary, #888)", fontFamily: "system-ui, sans-serif"
        }
      },
        h("div", { style: { fontSize: 20, fontWeight: 600, color: "var(--dsh-text-primary, #222)" } }, "题库"),
        h("div", { style: { fontSize: 13 } }, "G0 空面板 · dsh-studygo")
      );
    }

    var inject = ["slots"];

    function apply(ctx) {
      ctx.slots.inject("sidebar.panellist", function () {
        return ctx.slots.register({
          name: "sidebar.panellist",
          id: PANEL_ID,
          order: 10,
          label: "题库"
        }, StudyIcon);
      });
      ctx.slots.inject("main", function () {
        return ctx.slots.register({
          name: "main",
          key: PANEL_ID
        }, StudyPanel);
      });
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
