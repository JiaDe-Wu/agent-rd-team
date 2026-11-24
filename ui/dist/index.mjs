import { createContext as e, useCallback as t, useContext as n, useEffect as r, useMemo as i, useRef as a, useState as o, useSyncExternalStore as s } from "react";
import { useAppApi as c, useChatLauncher as l, useNavigate as u } from "@kirocrew/app-sdk";
import { Fragment as d, jsx as f, jsxs as p } from "react/jsx-runtime";
import { MarkdownRenderer as m } from "@kirocrew/app-sdk/ui";
//#region src/board/format.ts
var h = "/api/apps/agent-rd-team", g = 2e3, _ = encodeURIComponent, v = {
	board: (e) => `${h}/board${e ? `?run=${_(e)}` : ""}`,
	runs: () => `${h}/runs`,
	stop: (e) => `${h}/runs/${_(e)}/stop`,
	role: (e, t) => `${h}/runs/${_(e)}/roles/${_(t)}`,
	file: (e, t, n, r) => `${h}/runs/${_(e)}/roles/${_(t)}/file?path=${_(n)}&view=${r}`,
	site: (e) => `${h}/runs/${_(e)}/site`,
	siteStop: (e) => `${h}/runs/${_(e)}/site/stop`,
	retry: (e) => `${h}/runs/${_(e)}/retry`,
	gate: (e) => `${h}/runs/${_(e)}/gate`,
	open: (e) => `${h}/runs/${_(e)}/open`,
	route: () => `${h}/route`,
	models: () => `${h}/models`,
	cleanup: () => `${h}/sessions/cleanup`,
	signoff: (e) => `${h}/runs/${_(e)}/signoff`,
	hide: (e) => `${h}/runs/${_(e)}/hide`,
	events: (e) => `${h}/runs/${_(e)}/events`,
	cto: () => `${h}/cto`,
	ctoOffline: () => `${h}/cto/offline`,
	ctoFlow: (e) => `${h}/cto/flow?run=${encodeURIComponent(e)}`
}, y = {
	waiting: {
		label: "Waiting",
		tone: "idle",
		icon: "⏳",
		hint: "Upstream is not merged yet, so it cannot start"
	},
	queued: {
		label: "Queued",
		tone: "queue",
		icon: "⏸",
		hint: "Dispatched; KiroCrew has not started it yet"
	},
	running: {
		label: "Running",
		tone: "run",
		icon: "●",
		hint: "The agent is working"
	},
	stalled: {
		label: "Stalled",
		tone: "warn",
		icon: "⚠",
		hint: "KiroCrew marked it as stalled"
	},
	awaiting_approval: {
		label: "Needs your approval",
		tone: "approve",
		icon: "✋",
		hint: "A tool call is waiting for your approval"
	},
	done: {
		label: "Done · waiting to merge",
		tone: "done",
		icon: "✓",
		hint: "The agent is finished; its branch is not merged into the run branch yet"
	},
	merged: {
		label: "Merged",
		tone: "ok",
		icon: "✔",
		hint: "Its branch is merged into the run branch"
	},
	fixing: {
		label: "Fixing",
		tone: "fix",
		icon: "↻",
		hint: "Sent back because tests failed; fixing now"
	},
	failed: {
		label: "Failed",
		tone: "bad",
		icon: "✕",
		hint: "This role failed"
	},
	skipped: {
		label: "Skipped",
		tone: "idle",
		icon: "–",
		hint: "Not in this run: not on Crew, or the approved split leaves it out (the reason is on its card)"
	}
}, b = {
	starting: {
		label: "Starting",
		tone: "run",
		active: !0
	},
	running: {
		label: "In progress",
		tone: "run",
		active: !0
	},
	fixing: {
		label: "Fixing",
		tone: "fix",
		active: !0
	},
	reviewing: {
		label: "In review",
		tone: "run",
		active: !0
	},
	gating: {
		label: "Needs your approval",
		tone: "approve",
		active: !0
	},
	done: {
		label: "Completed",
		tone: "ok",
		active: !1
	},
	failed: {
		label: "Failed",
		tone: "bad",
		active: !1
	},
	stopped: {
		label: "Stopped",
		tone: "idle",
		active: !1
	}
}, x = {
	run: {
		icon: "🏁",
		label: "Run",
		tone: "info"
	},
	handoff: {
		icon: "📨",
		label: "Handoff",
		tone: "handoff"
	},
	spawned: {
		icon: "▶️",
		label: "Start",
		tone: "run"
	},
	tool: {
		icon: "🔧",
		label: "Tool",
		tone: "idle"
	},
	committed: {
		icon: "📝",
		label: "Commit",
		tone: "info"
	},
	merged: {
		icon: "⤵️",
		label: "Merge",
		tone: "ok"
	},
	conflict: {
		icon: "⚡",
		label: "Conflict",
		tone: "bad"
	},
	tests: {
		icon: "🧪",
		label: "Tests",
		tone: "info"
	},
	bounce: {
		icon: "↩️",
		label: "Sent back",
		tone: "bad"
	},
	violation: {
		icon: "🚫",
		label: "Out of bounds",
		tone: "bad"
	},
	done: {
		icon: "✅",
		label: "Done",
		tone: "ok"
	},
	failed: {
		icon: "❌",
		label: "Failed",
		tone: "bad"
	},
	review: {
		icon: "🔍",
		label: "Review",
		tone: "info"
	},
	ownership: {
		icon: "🧭",
		label: "Assign",
		tone: "info"
	},
	skipped: {
		icon: "–",
		label: "Skipped",
		tone: "idle"
	},
	gate: {
		icon: "✋",
		label: "Awaiting approval",
		tone: "approve"
	},
	approved: {
		icon: "👍",
		label: "Approved",
		tone: "ok"
	},
	deployed: {
		icon: "🚀",
		label: "Deploy",
		tone: "ok"
	},
	standards: {
		icon: "📚",
		label: "Matched standards",
		tone: "info"
	},
	signoff: {
		icon: "✍️",
		label: "Signed off",
		tone: "approve"
	},
	plan: {
		icon: "🗂️",
		label: "Work split proposal",
		tone: "handoff"
	},
	member: {
		icon: "⏸",
		label: "Missing member",
		tone: "warn"
	},
	talk: {
		icon: "💬",
		label: "Discuss",
		tone: "approve"
	}
}, S = {
	pass: {
		label: "Passed",
		glyph: "✓"
	},
	fail: {
		label: "Failed",
		glyph: "✕"
	},
	skip: {
		label: "Skipped",
		glyph: "–"
	}
};
function C(e) {
	return e.status === "done" && e.writable.length === 0 ? {
		label: "Done",
		tone: "ok",
		icon: "✔",
		hint: "It only reads and writes nothing, so it is finished when it is done"
	} : y[e.status] ?? {
		label: String(e.status),
		tone: "idle",
		icon: "•",
		hint: ""
	};
}
function w(e) {
	return S[e] ?? {
		label: e,
		glyph: "?"
	};
}
function T(e) {
	return b[e] ?? {
		label: e,
		tone: "idle",
		active: !1
	};
}
var E = (e) => e.status === "merged" || e.status === "done" && e.writable.length === 0, D = JSON.parse(String.raw`{"\u65b0\u5e94\u7528": "New app", "\u65b0\u529f\u80fd": "New feature", "\u4fee\u590d": "Fix", "\u5c0f": "Small", "\u4e2d": "Medium", "\u5927": "Large", "\u7535\u5546": "E-commerce", "\u79fb\u52a8\u5e94\u7528": "Mobile app", "\u5ba2\u6237\u5173\u7cfb\u7ba1\u7406": "CRM", "\u4f9b\u5e94\u94fe": "Supply chain", "\u5185\u90e8\u7cfb\u7edf": "Internal systems", "\u8fd0\u8425\u90e8": "Operations", "\u7528\u6237\u4f53\u9a8c\u7ec4": "UX group", "\u4f1a\u5458\u8fd0\u8425\u90e8": "Membership operations", "\u4f9b\u5e94\u94fe\u7ba1\u7406\u90e8": "Supply chain management", "\u884c\u653f\u90e8": "Administration", "\u4eba\u529b\u8d44\u6e90\u90e8": "HR", "\u5546\u54c1\u90e8": "Merchandising", "\u5e02\u573a\u90e8": "Marketing", "\u5ba2\u670d\u4e2d\u5fc3": "Customer care", "\u7ebf\u4e0a\u76d1\u63a7": "Online monitoring"}`), O = JSON.parse(String.raw`{"\u9700\u6c42": "Requirement", "\u7f3a\u9677": "Defect"}`), k = (e) => O[e] ?? e, A = (e) => D[e] ?? e, j = [
	{
		key: "ideation",
		n: "1",
		title: "Ideation",
		en: "Ideation"
	},
	{
		key: "inception",
		n: "2",
		title: "Inception",
		en: "Inception"
	},
	{
		key: "construction",
		n: "3",
		title: "Construction",
		en: "Construction"
	},
	{
		key: "review",
		n: "✓",
		title: "Review gate",
		en: "Review gate"
	},
	{
		key: "operation",
		n: "4",
		title: "Operation",
		en: "Operation"
	}
], M = /* @__PURE__ */ new Set([
	"running",
	"fixing",
	"stalled",
	"awaiting_approval"
]), N = /* @__PURE__ */ new Set(["running", "fixing"]), P = /* @__PURE__ */ new Set(["done", "merged"]), F = (e) => b[e]?.active ?? !1;
function I(e) {
	let t = Math.max(0, Math.floor(e)), n = Math.floor(t / 3600), r = Math.floor(t % 3600 / 60), i = t % 60;
	return `${n ? `${n}:${String(r).padStart(2, "0")}` : r}:${String(i).padStart(2, "0")}`;
}
function ee(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 60) return `${t} s`;
	let n = Math.round(t / 60);
	if (n < 60) return `${n} min`;
	let r = Math.floor(n / 60), i = n % 60;
	return i ? `${r} h ${i} min` : `${r} h`;
}
function L(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 5) return "just now";
	if (t < 60) return `${t}s ago`;
	let n = Math.floor(t / 60);
	if (n < 60) return `${n}m ago`;
	let r = Math.floor(n / 60);
	return r < 24 ? `${r}h ago` : `${Math.floor(r / 24)}d ago`;
}
function R(e) {
	return e == null || !Number.isFinite(e) ? "—" : e >= 100 ? String(Math.round(e)) : (Math.round(e * 10) / 10).toFixed(1);
}
function z(e) {
	return {
		saved_s: Math.max(0, e.serial_s - e.wall_s),
		speedup: e.wall_s > 0 && e.serial_s > 0 ? e.serial_s / e.wall_s : null
	};
}
function B(e, t) {
	let n = new Map(t.map((e) => [e.key, e]));
	return e.depends_on.map((e) => n.get(e)).filter((e) => !!e && e.status !== "merged");
}
function te(e, t) {
	let n = B(e, t);
	return n.length ? `Waiting for ${n.map((e) => e.title).join(", ")}` : e.depends_on.length ? "Upstream is all merged; starting soon" : "Starting soon";
}
var ne = [
	{
		prefix: "AC",
		label: "Functional"
	},
	{
		prefix: "RULE",
		label: "Business rules"
	},
	{
		prefix: "ACC",
		label: "Account security"
	},
	{
		prefix: "PII",
		label: "Personal data"
	},
	{
		prefix: "SEC",
		label: "Security"
	},
	{
		prefix: "FE",
		label: "Frontend engineering"
	},
	{
		prefix: "UX",
		label: "Experience"
	},
	{
		prefix: "BR",
		label: "Brand"
	},
	{
		prefix: "COMP",
		label: "Compliance"
	},
	{
		prefix: "STORE",
		label: "Store listing"
	},
	{
		prefix: "PRC",
		label: "Price compliance"
	},
	{
		prefix: "MGN",
		label: "Gross margin"
	},
	{
		prefix: "PP",
		label: "Price protection"
	},
	{
		prefix: "DATA",
		label: "Data"
	}
];
function re(e) {
	let t = e ? e.split("-")[0] : "", n = ne.findIndex((e) => e.prefix === t);
	return n < 0 ? ne.length : n;
}
function ie(e) {
	let t = e ? /(\d+)/.exec(e) : null;
	return t ? re(e) * 1e6 + Number(t[1]) : 1e9;
}
var ae = (e) => e.replace(/\/+$/, "").split("/").pop() || e;
function oe(e) {
	let t = 0;
	for (let n of e) t += V(n);
	return t;
}
function V(e) {
	let t = e.codePointAt(0) ?? 0;
	return t === 32 ? .3 : t > 126976 ? 1.2 : t >= 11904 && t <= 40959 || t >= 65280 && t <= 65519 || t >= 12288 && t <= 12351 ? 1 : .58;
}
function H(e, t) {
	if (oe(e) <= t) return e;
	let n = "", r = 0;
	for (let i of e) {
		let e = V(i);
		if (r + e > t - .8) break;
		n += i, r += e;
	}
	return `${n.trimEnd()}…`;
}
function se(e, t) {
	let n = (e ?? "").toLowerCase(), r = t.toLowerCase();
	return n === "read" || /read|cat\b|view/.test(r) ? "📖" : n === "write" || n === "edit" || /write|edit|patch|replace/.test(r) ? "✏️" : n === "search" || /grep|glob|search|find/.test(r) ? "🔎" : n === "shell" || /bash|shell|exec|command/.test(r) ? "⌘" : /web|fetch|http/.test(r) ? "🌐" : "🔧";
}
function ce(e) {
	let t = /(\d+)\s*\/\s*(\d+)/.exec(e);
	if (!t) return null;
	let n = Number(t[1]), r = Number(t[2]);
	return r > 0 && n <= r ? {
		passed: n,
		total: r
	} : null;
}
function le(e, t) {
	return e.role === t || e.from === t || e.to === t;
}
var ue = [
	{
		key: "aidlc-product-agent",
		name: "Product"
	},
	{
		key: "aidlc-architect-agent",
		name: "Architecture"
	},
	{
		key: "aidlc-design-agent",
		name: "Design"
	},
	{
		key: "aidlc-developer-agent",
		name: "Development"
	},
	{
		key: "aidlc-quality-agent",
		name: "Quality"
	},
	{
		key: "aidlc-devsecops-agent",
		name: "Security"
	},
	{
		key: "aidlc-compliance-agent",
		name: "Compliance"
	},
	{
		key: "aidlc-pipeline-deploy-agent",
		name: "Pipeline deploy"
	},
	{
		key: "aidlc-aws-platform-agent",
		name: "AWS platform"
	},
	{
		key: "aidlc-operations-agent",
		name: "Operations"
	},
	{
		key: "aidlc-delivery-agent",
		name: "Delivery"
	},
	{
		key: "aidlc-architecture-reviewer-agent",
		name: "Architecture review"
	},
	{
		key: "aidlc-product-lead-agent",
		name: "Product lead"
	},
	{
		key: "aidlc-composer-agent",
		name: "Team selection Composer"
	}
], de = { "larkspur-motion-agent": "Brand motion" }, U = (e) => ue.find((t) => t.key === e)?.name ?? de[e] ?? e;
function fe(e) {
	let t = e.replace(/^[a-z0-9]+-(.+-agent)$/, "aidlc-$1");
	return ue.some((e) => e.key === t) ? t : "";
}
function pe(e) {
	let t = new Set(ue.map((e) => e.key)), n = [...new Set(e.flatMap((e) => e.aidlc_agent.split(",").map((e) => e.trim())).filter((e) => e && !t.has(e)))];
	return [...ue.map((e) => ({
		...e,
		custom: !1
	})), ...n.map((e) => ({
		key: e,
		name: U(e),
		custom: !0
	}))];
}
function me(e) {
	let t = (e) => e.split(",").map((e) => e.trim()).filter(Boolean);
	return {
		team: new Set(e.filter((e) => e.status !== "skipped").flatMap((e) => t(e.aidlc_agent))),
		used: new Set(e.filter((e) => e.status !== "skipped" && e.status !== "waiting").flatMap((e) => t(e.aidlc_agent))),
		busy: new Set(e.filter((e) => M.has(e.status) || e.status === "queued").flatMap((e) => t(e.aidlc_agent)))
	};
}
//#endregion
//#region src/board/layout.ts
var he = 1320, W = 86, G = 24, K = 12, q = 26, ge = (e) => e === "review" ? "construction" : e, J = {
	top: 26,
	title: 16,
	group: 17,
	row: 16,
	gap: 3
};
function _e(e, t) {
	let n = [], r = (e, t) => {
		let r = n.find((t) => t.key === e);
		r ? r.keys.push(t) : n.push({
			key: e,
			keys: [t]
		});
	}, i = (e) => (e.aidlc_agent ?? "").split(",")[0]?.trim() || e.key;
	if (t?.length) {
		for (let e of t) r(e.member || e.key, e.key);
		for (let n of e) n.status !== "skipped" && !t.some((e) => e.key === n.key) && r(i(n), n.key);
		return n;
	}
	for (let t of e) t.status !== "skipped" && r(i(t), t.key);
	return n;
}
function ve(e, t) {
	let n = new Set(e.filter((e) => e.status === "skipped").map((e) => e.key));
	if (!n.size) return {
		roles: [...e],
		edges: t.map(([e, t]) => [e, t])
	};
	let r = new Map(e.map((e) => [e.key, e])), i = (e, t) => (r.get(e)?.depends_on ?? []).flatMap((e) => t.has(e) ? [] : (t.add(e), n.has(e) ? i(e, t) : [e])), a = e.filter((e) => !n.has(e.key)).map((e) => ({
		...e,
		depends_on: [...new Set(i(e.key, /* @__PURE__ */ new Set()))]
	}));
	return {
		roles: a,
		edges: a.flatMap((e) => e.depends_on.map((t) => [t, e.key]))
	};
}
var Y = (e) => Math.round(e * 10) / 10;
function ye(e, t) {
	let n = new Set(e.map((e) => e.key)), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = (e, t) => {
		n.has(e) && n.has(t) && e !== t && (r.has(t) || r.set(t, /* @__PURE__ */ new Set()), r.get(t).add(e), i.has(e) || i.set(e, /* @__PURE__ */ new Set()), i.get(e).add(t));
	};
	for (let t of e) for (let e of t.depends_on) a(e, t.key);
	for (let [e, n] of t) a(e, n);
	let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Set(), c = (e) => {
		let t = o.get(e);
		if (t !== void 0) return t;
		if (s.has(e)) return 0;
		s.add(e);
		let n = 0;
		for (let t of r.get(e) ?? []) n = Math.max(n, c(t) + 1);
		return s.delete(e), o.set(e, n), n;
	};
	for (let t of e) c(t.key);
	let l = new Map(o), u = (e) => !(i.get(e)?.size ?? 0);
	for (let t of e) {
		let e = [...i.get(t.key) ?? []];
		if (!e.length || !e.every(u)) continue;
		let n = Math.min(...e.map((e) => o.get(e) ?? 0)) - 1;
		n > (l.get(t.key) ?? 0) && l.set(t.key, n);
	}
	let d = be(e), f = (e) => (d ? (d.get(e) ?? 0) * 1e3 : 0) + (l.get(e) ?? 0), p = [...new Set(e.map((e) => f(e.key)))].sort((e, t) => e - t), m = new Map(p.map((e, t) => [e, t]));
	return new Map(e.map((e) => [e.key, m.get(f(e.key)) ?? 0]));
}
function be(e) {
	let t = new Map(j.map((e, t) => [e.key, t]));
	return !e.length || !e.every((e) => ge(e.phase) && t.has(ge(e.phase))) ? null : new Map(e.map((e) => [e.key, t.get(ge(e.phase))]));
}
function xe(e, t) {
	let n = 1 - t, r = n * n * n, i = 3 * n * n * t, a = 3 * n * t * t, o = t * t * t;
	return {
		x: r * e[0].x + i * e[1].x + a * e[2].x + o * e[3].x,
		y: r * e[0].y + i * e[1].y + a * e[2].y + o * e[3].y
	};
}
var Se = (e, t, n) => ({
	x: e.x + (t.x - e.x) * n,
	y: e.y + (t.y - e.y) * n
}), Ce = (e, t) => [
	e,
	Se(e, t, 1 / 3),
	Se(e, t, 2 / 3),
	t
];
function we(e, t) {
	let n = (t.x - e.x) / 2;
	return [
		e,
		{
			x: e.x + n,
			y: e.y
		},
		{
			x: t.x - n,
			y: t.y
		},
		t
	];
}
var Te = (e, t) => [
	e,
	{
		x: t.x,
		y: e.y
	},
	{
		x: t.x,
		y: e.y
	},
	t
], Ee = (e, t) => [
	e,
	{
		x: e.x,
		y: t.y
	},
	{
		x: e.x,
		y: t.y
	},
	t
];
function De(e) {
	return e.slice().reverse().map((e) => [
		e[3],
		e[2],
		e[1],
		e[0]
	]);
}
function Oe(e) {
	if (!e.length) return "";
	let t = (e) => `${Y(e.x)},${Y(e.y)}`;
	return `M${t(e[0][0])}${e.map((e) => ` C${t(e[1])} ${t(e[2])} ${t(e[3])}`).join("")}`;
}
function ke(e) {
	let t = e.map((e) => {
		let t = 0, n = e[0];
		for (let r = 1; r <= 12; r++) {
			let i = xe(e, r / 12);
			t += Math.hypot(i.x - n.x, i.y - n.y), n = i;
		}
		return t;
	});
	return {
		segs: e,
		lens: t,
		total: t.reduce((e, t) => e + t, 0)
	};
}
function Ae(e, t) {
	let n = e.segs.length;
	if (!n) return {
		x: 0,
		y: 0
	};
	let r = Math.min(1, Math.max(0, t)) * e.total;
	for (let t = 0; t < n; t++) {
		let i = e.lens[t];
		if (r <= i || t === n - 1) return xe(e.segs[t], i > 0 ? Math.min(1, r / i) : 1);
		r -= i;
	}
	return e.segs[n - 1][3];
}
function je(e, t, n, r, i) {
	let a = {
		x: e.x + 92,
		y: e.y
	}, o = {
		x: t.x - 92,
		y: t.y
	};
	if (t.stage <= e.stage) {
		let n = {
			x: Math.max(a.x, t.x + 92) + 40,
			y: (e.y + t.y) / 2
		};
		return [we(a, n), we(n, {
			x: t.x + 92,
			y: t.y
		})];
	}
	let s = [a];
	for (let c = e.stage + 1; c < t.stage; c++) {
		let e = n[c], t = (e.x - a.x) / (o.x - a.x || 1), l = a.y + (o.y - a.y) * t, u = e.keys.map((e) => r.get(e)).sort((e, t) => e.y - t.y).map((e) => [e.y - 40 - K, e.y + 40 + K + q]).reduce((e, t) => {
			let n = e[e.length - 1];
			return n && t[0] <= n[1] ? n[1] = Math.max(n[1], t[1]) : e.push([...t]), e;
		}, []), d = 0;
		for (let [e, t] of u) if (l > e && l < t) {
			d = l - e < t - l ? -1 : 1, l = d < 0 ? e : t;
			break;
		}
		let f = `${c}:${Math.round(l)}`, p = i.get(f) ?? 0;
		i.set(f, p + 1), p && (l += (d || (p % 2 ? 1 : -1)) * 7 * (d ? p : Math.ceil(p / 2))), s.push({
			x: e.x - 92 - 10,
			y: l
		}, {
			x: e.x + 92 + 10,
			y: l
		});
	}
	s.push(o);
	let c = [];
	for (let e = 0; e < s.length - 1; e++) c.push(e % 2 == 1 ? Ce(s[e], s[e + 1]) : we(s[e], s[e + 1]));
	return c;
}
var X = 1640, Me = 176, Ne = 96, Pe = 92, Fe = j.filter((e) => e.key !== "review"), Ie = 212;
function Le(e, t, n) {
	let r = ye(e, t), i = be(e) !== null, a = Math.max(1, ...e.map((e) => (r.get(e.key) ?? 0) + 1)), o = Array.from({ length: a }, (e, t) => ({
		index: t,
		x: 0,
		keys: [],
		phase: ""
	}));
	for (let t of e) {
		let e = o[r.get(t.key) ?? 0];
		e.keys.push(t.key), i && (e.phase = ge(t.phase) ?? "");
	}
	let s = Math.max(1, ...o.map((e) => e.keys.length)), c = new Set(o.map((e) => e.phase)), l = Math.max(-1, ...Fe.map((e, t) => c.has(e.key) ? t : -1)), u = i ? Fe.filter((e, t) => t < l && !c.has(e.key)) : [], d = (e) => u.filter((t) => Fe.indexOf(t) < Fe.findIndex((t) => t.key === e)).length, f = 116 + (i ? Me : 0), p = 162 + (i ? Ne : 0) + u.length * Pe, m = Math.max(i ? X : he, Y(f + (a - 1) * Ie + p)), h = m - p, g = a > 1 ? (h - f) / (a - 1) : 0, _ = i ? _e(e, n) : [], v = W + Be.h - 6 + J.top + J.title + _.reduce((e, t) => e + J.group + t.keys.length * J.row + J.gap, 0), y = Math.max(W + (s - 1) * 100 + 80 + 58, i ? v + 40 : 0), b = W + (y - 58 - W) / 2, x = /* @__PURE__ */ new Map(), S = /* @__PURE__ */ new Map();
	o.forEach((e, t) => {
		e.x = Y((a > 1 ? f + t * g : he / 2 - 40) + (i ? d(e.phase) * Pe : 0));
		let n = e.keys.length;
		e.keys.forEach((r, i) => {
			x.set(r, {
				key: r,
				stage: t,
				row: i,
				x: e.x,
				y: Y(b + (i - (n - 1) / 2) * 100)
			}), S.set(r, Y(e.x + 92 + 18 + 20 * i));
		});
	});
	let C = /* @__PURE__ */ new Map(), w = [];
	for (let [e, n] of t) {
		let t = x.get(e), r = x.get(n);
		if (!t || !r || e === n) continue;
		let i = je(t, r, o, x, C);
		w.push({
			from: e,
			to: n,
			path: i,
			d: Oe(i)
		});
	}
	let T = {
		x: m - 42,
		y,
		r: 28
	}, E = [];
	if (i) {
		for (let e of j) {
			let t = o.filter((t) => t.phase === e.key);
			t.length && E.push({
				...e,
				x1: Y(t[0].x - 92 - 14),
				x2: Y(t[t.length - 1].x + 92 + 14),
				used: !0
			});
		}
		for (let e = 1; e < E.length; e++) {
			let t = (E[e - 1].x2 - 14 - 92 + 92 + (E[e].x1 + 14)) / 2, n = (E[e - 1].x2 - 14 + (E[e].x1 + 14)) / 2 || t;
			E[e - 1].x2 = Y(Math.min(E[e - 1].x2, n - 4)), E[e].x1 = Y(Math.max(E[e].x1, n + 4));
		}
		for (let e of [...u].reverse()) {
			let t = E.filter((t) => Fe.findIndex((e) => e.key === t.key) > Fe.indexOf(e)).sort((e, t) => e.x1 - t.x1)[0];
			if (!t) continue;
			let n = Y(t.x1 - 8);
			E.push({
				...e,
				x1: Y(n - 80),
				x2: n,
				used: !1
			});
		}
		E.sort((e, t) => e.x1 - t.x1);
		let e = E.length ? E[E.length - 1].x2 : f;
		if (!E.some((e) => e.key === "operation")) {
			let t = j.find((e) => e.key === "operation");
			E.push({
				...t,
				x1: Y(e + 16),
				x2: Y(m - 20),
				used: !1
			});
		}
		E.length && E.unshift({
			key: "init",
			n: "0",
			title: "Initialization",
			en: "Initialization",
			x1: 8,
			x2: Y(E[0].x1 - 8),
			used: !0
		});
	}
	let D = i ? {
		x: Y(102),
		y: W + Be.h / 2 - 6
	} : null;
	return {
		width: m,
		height: y + 44,
		nodes: x,
		stages: o,
		edges: w,
		rail: {
			x1: G,
			x2: T.x - 28,
			y
		},
		station: T,
		mergeX: S,
		phases: E,
		orch: D
	};
}
var Re = "tests", ze = "orch", Be = {
	w: 132,
	h: 76
};
function Ve(e, t, n) {
	if (t === "tests") return {
		x: e.station.x,
		y: e.station.y
	};
	if (t === "run") return {
		x: n,
		y: e.rail.y
	};
	if (t === "orch") return e.orch;
	let r = e.nodes.get(t);
	return r ? {
		x: r.x,
		y: r.y
	} : null;
}
function He(e, t, n) {
	if (t === "tests") return {
		x: e.station.x,
		y: e.station.y,
		w: e.station.r * 2,
		h: e.station.r * 2,
		rx: e.station.r
	};
	if (t === "run") return {
		x: n,
		y: e.rail.y,
		w: 22,
		h: 22,
		rx: 11
	};
	if (t === "orch") return e.orch ? {
		...e.orch,
		w: Be.w,
		h: Be.h,
		rx: 18
	} : null;
	let r = e.nodes.get(t);
	return r ? {
		x: r.x,
		y: r.y,
		w: 184,
		h: 80,
		rx: 16
	} : null;
}
var Ue = 64;
function We(e, t) {
	let n = e.orch, r = e.nodes.get(t);
	if (!n || !r) return null;
	let i = {
		x: n.x + Be.w / 2,
		y: n.y
	}, a = r.x - 92 - 18, o = {
		x: Math.min(i.x + 28, a - 18),
		y: Ue
	}, s = {
		x: a,
		y: Math.max(82, r.y - 18)
	}, c = {
		x: r.x - 92,
		y: r.y
	};
	return [
		we(i, o),
		Ce(o, {
			x: a - 18,
			y: Ue
		}),
		Te({
			x: a - 18,
			y: Ue
		}, s),
		Ee(s, c)
	];
}
function Ge(e, t) {
	let n = e.nodes.get(t), r = e.mergeX.get(t);
	if (!n || r === void 0) return null;
	let i = {
		x: n.x + 92,
		y: n.y
	}, a = {
		x: r,
		y: n.y + 24
	};
	return [Te(i, a), Ce(a, {
		x: r,
		y: e.rail.y
	})];
}
function Ke(e, t, n, r) {
	if (t === n) return null;
	let i = e.station;
	if (t === "orch" && e.orch && e.nodes.has(n)) return We(e, n);
	if (n === "run" && e.nodes.has(t)) return Ge(e, t);
	if (t === "run" && n === "tests") return [Ce({
		x: Math.min(r, i.x - i.r - 20),
		y: e.rail.y
	}, {
		x: i.x - i.r,
		y: e.rail.y
	})];
	if (t === "tests" && e.nodes.has(n)) {
		let t = Ge(e, n), r = e.mergeX.get(n);
		return !t || r === void 0 ? null : [Ce({
			x: i.x - i.r,
			y: e.rail.y
		}, {
			x: r,
			y: e.rail.y
		}), ...De(t)];
	}
	if (e.nodes.has(t) && e.nodes.has(n)) {
		let r = e.edges.find((e) => e.from === t && e.to === n);
		if (r) return r.path;
		let i = e.nodes.get(t), a = e.nodes.get(n);
		return a.x >= i.x ? [we({
			x: i.x + 92,
			y: i.y
		}, {
			x: a.x - 92,
			y: a.y
		})] : [we({
			x: i.x - 92,
			y: i.y
		}, {
			x: a.x + 92,
			y: a.y
		})];
	}
	let a = Ve(e, t, r), o = Ve(e, n, r);
	return a && o ? [we(a, o)] : null;
}
function qe(e, t) {
	for (let n = t.length - 1; n >= 0; n--) {
		if (t[n].status !== "merged") continue;
		let r = e.mergeX.get(t[n].role);
		if (r !== void 0) return r;
	}
	return e.rail.x1 + 120;
}
var Je = (e) => e.events.reduce((e, t) => Math.max(e, t.seq), 0), Ye = (e) => `${e.role}@${e.sha}@${e.status}`, Xe = (e, t) => `${e}#${t}`, Ze = JSON.parse(String.raw`"\u4ea4\u7ed9"`), Qe = JSON.parse(String.raw`"\u628a"`);
function $e(e) {
	let t = /^.+? handed (.+) to .+$/.exec(e);
	if (t) return H(t[1].trim(), 9);
	let n = e.indexOf(Ze), r = n > 0 ? e.slice(0, n) : "", i = r.indexOf(Qe);
	return i >= 0 && (r = r.slice(i + 1)), r = r.trim(), r ? H(r, 9) : null;
}
function et(e) {
	let t = e.match(/AC-\d+/g);
	return t?.length ? t.length > 2 ? `${t.slice(0, 2).join(", ")}…` : t.join(", ") : null;
}
function tt(e, t, n) {
	let r = {
		key: Xe(t, e.seq),
		t: e.at,
		kind: e.kind
	}, i = (e) => e && n.roles.has(e) ? e : null, a = (e, t, n, i) => e ? {
		...r,
		from: e,
		to: e,
		tone: t,
		shape: n,
		prio: i
	} : null;
	switch (e.kind) {
		case "handoff": {
			let t = i(e.from), n = i(e.to) ?? i(e.role), o = typeof e.data?.carry == "string" && e.data.carry ? H(e.data.carry, 9) : $e(e.text);
			return t && n && t !== n ? {
				...r,
				from: t,
				to: n,
				tone: "handoff",
				shape: "comet",
				prio: 2,
				label: o
			} : a(n ?? t, "handoff", "ring", 2);
		}
		case "merged": {
			let t = i(e.from) ?? i(e.role);
			return t ? {
				...r,
				from: t,
				to: "run",
				tone: "merge",
				shape: "comet",
				prio: 3
			} : a("run", "merge", "check", 3);
		}
		case "tests": {
			let t = (typeof e.data?.passed == "number" && typeof e.data?.total == "number" ? {
				passed: e.data.passed,
				total: e.data.total
			} : null) ?? ce(e.text) ?? (n.tests.total ? {
				passed: n.tests.passed,
				total: n.tests.total
			} : null), i = !!t && t.passed === t.total;
			return {
				...r,
				from: "run",
				to: Re,
				tone: i ? "pass" : "fail",
				shape: "comet",
				prio: 3,
				label: t ? `${t.passed}/${t.total}` : null
			};
		}
		case "bounce": {
			let t = i(e.to) ?? i(e.role), n = Array.isArray(e.data?.cases) ? e.data.cases.filter((e) => typeof e == "string") : [], o = n.length ? n.length > 2 ? `${n.slice(0, 2).join(", ")}…` : n.join(", ") : et(e.text);
			if (e.from === "person") return a(t, "bounce", "cross", 3);
			let s = i(e.from) ?? (e.from === "run" ? "run" : "tests");
			return t ? {
				...r,
				from: s,
				to: t,
				tone: "bounce",
				shape: "comet",
				prio: 3,
				label: o
			} : a(Re, "fail", "cross", 3);
		}
		case "conflict": return a(i(e.role) ?? i(e.from), "danger", "cross", 3);
		case "violation":
		case "failed": return a(i(e.role), "danger", "cross", 3);
		case "spawned": {
			let t = i(e.role);
			return t ? {
				...r,
				from: ze,
				to: t,
				tone: "run",
				shape: "comet",
				prio: 2,
				label: null
			} : null;
		}
		case "gate": return a(i(e.role), "info", "ring", 3);
		case "member": return a(i(e.role), "info", "ring", 2);
		case "talk": return a(i(e.role), "info", "ring", 2);
		case "approved": return a(i(e.role), "ok", "check", 3);
		case "ownership": return a(ze, "info", "ring", 2);
		case "skipped": return a(i(e.role), "tool", "ring", 1);
		case "done": return a(i(e.role), "ok", "check", 2);
		case "committed": return a(i(e.role), "info", "spark", 1);
		case "tool": return a(i(e.role), "tool", "spark", 0);
		case "review": return a(i(e.role) ?? i("reviewer"), "info", "ring", 1);
		case "run": return a("run", "info", "ring", 2);
		default: return null;
	}
}
function nt(e, t, n) {
	let r = Xe(t, e.seq), i = e.role && n.has(e.role) ? e.role : e.from && n.has(e.from) ? e.from : null;
	switch (e.kind) {
		case "conflict": return [...i ? [{
			key: r,
			target: i,
			tone: "bad",
			kind: e.kind
		}] : [], {
			key: r,
			target: "run",
			tone: "bad",
			kind: e.kind
		}];
		case "violation":
		case "failed": return i ? [{
			key: r,
			target: i,
			tone: "bad",
			kind: e.kind
		}] : [];
		default: return [];
	}
}
function rt(e) {
	return {
		run: e,
		first: !0,
		fresh: [],
		items: [],
		flashes: [],
		flips: [],
		merges: [],
		lanes: [],
		announce: null
	};
}
function it(e, t, n = {}) {
	let r = n.lateS ?? 30, i = n.max ?? 24;
	if (!e || e.id !== t.id || n.resync) return rt(t.id);
	let a = Je(e);
	if (Je(t) < a) return rt(t.id);
	let o = t.events.filter((e) => e.seq > a).sort((e, t) => e.seq - t.seq), s = new Set(t.roles.map((e) => e.key)), c = {
		roles: s,
		tests: t.tests
	}, l = [], u = [];
	for (let e of o) {
		if (n.at !== void 0 && n.at - e.at > r) continue;
		let i = tt(e, t.id, c);
		i && l.push(i), u.push(...nt(e, t.id, s));
	}
	if (t.tests.total > 0 && t.tests.failed === 0 && (e.tests.failed > 0 || e.tests.total !== t.tests.total) && u.push({
		key: `${t.id}#green@${t.tests.at ?? ""}`,
		target: Re,
		tone: "ok",
		kind: "tests"
	}), e.status !== "done" && t.status === "done") for (let e of t.roles) u.push({
		key: `${t.id}#done`,
		target: e.key,
		tone: "ok",
		kind: "run"
	});
	l.length > i && (l = l.slice().sort((e, t) => t.prio - e.prio || e.t - t.t).slice(0, i).sort((e, t) => e.t - t.t));
	let d = new Map(e.tests.cases.map((e) => [e.id, e.status])), f = t.tests.cases.filter((e) => d.has(e.id) && d.get(e.id) !== e.status).map((e) => ({
		id: e.id,
		from: d.get(e.id),
		to: e.status
	})), p = new Map(e.roles.map((e) => [e.key, e.status])), m = t.roles.filter((e) => p.has(e.key) && p.get(e.key) !== e.status).map((e) => ({
		key: e.key,
		from: p.get(e.key),
		to: e.status
	})), h = new Set(e.merges.map(Ye)), g = t.merges.map(Ye).filter((e) => !h.has(e));
	return {
		run: t.id,
		first: !1,
		fresh: o,
		items: l,
		flashes: u,
		flips: f,
		merges: g,
		lanes: m,
		announce: at(e, t, o)
	};
}
function at(e, t, n) {
	let r = [];
	e.status !== t.status && r.push(`Run ${T(t.status).label.toLowerCase()}`), (e.tests.passed !== t.tests.passed || e.tests.total !== t.tests.total) && r.push(`Tests ${e.tests.passed}/${e.tests.total} → ${t.tests.passed}/${t.tests.total}`);
	let i = [...n].reverse().find((e) => e.kind === "bounce" || e.kind === "conflict" || e.kind === "violation" || e.kind === "failed");
	if (i && r.push(i.text), r.length < 2) {
		let e = [...n].reverse().find((e) => e.kind === "merged" || e.kind === "handoff" || e.kind === "done");
		e && r.push(e.text);
	}
	return r.length ? r.slice(0, 2).join("; ") : null;
}
//#endregion
//#region src/board/hooks.ts
function ot(e) {
	let t = a(e);
	return t.current = e, t;
}
var st = "(prefers-reduced-motion: reduce)";
function ct() {
	try {
		return typeof window < "u" && typeof window.matchMedia == "function" && !!window.matchMedia(st)?.matches;
	} catch {
		return !1;
	}
}
function lt() {
	let [e, t] = o(ct);
	return r(() => {
		if (typeof window.matchMedia != "function") return;
		let e = window.matchMedia(st);
		if (!e) return;
		let n = () => t(!!e.matches);
		return e.addEventListener?.("change", n), () => e.removeEventListener?.("change", n);
	}, []), e;
}
var ut = /* @__PURE__ */ new Set(), dt = null, ft = Date.now();
function pt(e) {
	return ut.add(e), dt ||= (ft = Date.now(), setInterval(() => {
		if (!(typeof document < "u" && document.hidden)) {
			ft = Date.now();
			for (let e of ut) e();
		}
	}, 1e3)), () => {
		ut.delete(e), !ut.size && dt && (clearInterval(dt), dt = null);
	};
}
function mt() {
	return s(pt, () => ft, () => ft);
}
var ht = e({
	at: Date.now() / 1e3,
	receivedAt: Date.now()
});
function gt() {
	let { at: e, receivedAt: t } = n(ht), r = mt();
	return e + Math.max(0, r - t) / 1e3;
}
function _t() {
	let { at: e } = n(ht);
	return Math.max(0, gt() - e);
}
function vt(e, t = 900, n = !1) {
	let [i, s] = o(e), c = a(e), l = ot(i);
	return r(() => {
		if (n || typeof requestAnimationFrame != "function") {
			s(e);
			return;
		}
		if (c.current = l.current, c.current === e) return;
		let r = performance.now(), i = 0, a = () => {
			let n = Math.min(1, (performance.now() - r) / t), o = 1 - (1 - n) ** 3;
			s(c.current + (e - c.current) * o), n < 1 && (i = requestAnimationFrame(a));
		};
		return i = requestAnimationFrame(a), () => cancelAnimationFrame(i);
	}, [
		e,
		t,
		n,
		l
	]), i;
}
function yt(e) {
	let t = a({
		v: e,
		n: 0
	});
	return Object.is(t.current.v, e) || (t.current = {
		v: e,
		n: t.current.n + 1
	}), t.current.n;
}
function bt(e, t) {
	if (!e || !t) return null;
	if (t === e) return [t, ""];
	if (t.startsWith(e)) return [e, t.slice(e.length)];
	for (let n = Math.min(e.length, t.length) - 1; n >= 12; n--) if (t.startsWith(e.slice(e.length - n))) return [t.slice(0, n), t.slice(n)];
	return null;
}
function xt(e, t = !1) {
	let [n, i] = o({
		base: e ?? "",
		added: "",
		n: 0,
		fresh: !1
	}), s = a(e ?? "");
	r(() => {
		let n = e ?? "", r = s.current;
		if (s.current = n, n === r) return;
		let a = bt(r, n);
		if (t || !a || typeof window > "u") {
			i({
				base: n,
				added: "",
				n: 0,
				fresh: !t && !!n && !a
			});
			return;
		}
		let [o, c] = a;
		if (i({
			base: o,
			added: c,
			n: 0,
			fresh: !1
		}), !c) return;
		let l = Math.max(1, Math.ceil(c.length / 45)), u = window.setInterval(() => {
			i((e) => {
				let t = Math.min(e.added.length, e.n + l);
				return t >= e.added.length && window.clearInterval(u), {
					...e,
					n: t
				};
			});
		}, 28);
		return () => window.clearInterval(u);
	}, [e, t]);
	let c = n.n < n.added.length;
	return {
		shown: n.base + n.added.slice(0, n.n),
		typing: c,
		fresh: n.fresh
	};
}
//#endregion
//#region src/board/RoleIcon.tsx
var St = {
	intent: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("circle", {
			cx: "12",
			cy: "12",
			r: "8.5"
		}),
		/* @__PURE__ */ f("circle", {
			cx: "12",
			cy: "12",
			r: "4.5"
		}),
		/* @__PURE__ */ f("path", { d: "M12 12h.01" })
	] }),
	feasibility: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M12 4v15.5M8 19.5h8M5 7.5h14" }), /* @__PURE__ */ f("path", { d: "M5 7.5l-2.5 6a2.8 2.8 0 0 0 5 0L5 7.5zM19 7.5l-2.5 6a2.8 2.8 0 0 0 5 0L19 7.5z" })] }),
	scope: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M10 6.5h10M10 12h10M10 17.5h10" }), /* @__PURE__ */ f("path", { d: "M3.8 6.5l1.4 1.4L8 5M3.8 12l1.4 1.4L8 10.5M3.8 17.5l1.4 1.4L8 16" })] }),
	pm: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("rect", {
			x: "5.5",
			y: "4.5",
			width: "13",
			height: "16",
			rx: "2"
		}),
		/* @__PURE__ */ f("path", { d: "M9.5 4.5V3.5h5v1" }),
		/* @__PURE__ */ f("path", { d: "M9 12.5l2 2 4-4" })
	] }),
	catalog: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("rect", {
			x: "4",
			y: "4",
			width: "6.5",
			height: "6.5",
			rx: "1.2"
		}),
		/* @__PURE__ */ f("rect", {
			x: "13.5",
			y: "4",
			width: "6.5",
			height: "6.5",
			rx: "1.2"
		}),
		/* @__PURE__ */ f("rect", {
			x: "4",
			y: "13.5",
			width: "6.5",
			height: "6.5",
			rx: "1.2"
		}),
		/* @__PURE__ */ f("rect", {
			x: "13.5",
			y: "13.5",
			width: "6.5",
			height: "6.5",
			rx: "1.2"
		})
	] }),
	detail: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("rect", {
			x: "4",
			y: "3.5",
			width: "16",
			height: "17",
			rx: "2"
		}),
		/* @__PURE__ */ f("rect", {
			x: "7",
			y: "6.5",
			width: "10",
			height: "6",
			rx: "1"
		}),
		/* @__PURE__ */ f("path", { d: "M7 15.5h10M7 18h6" })
	] }),
	cart: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("path", { d: "M3 4.5h2.5l2.2 10.5h10.6l2-7.5H6.6" }),
		/* @__PURE__ */ f("circle", {
			cx: "9.5",
			cy: "19",
			r: "1.4"
		}),
		/* @__PURE__ */ f("circle", {
			cx: "17",
			cy: "19",
			r: "1.4"
		})
	] }),
	security: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M12 3.5l7.5 3v5.5c0 4.5-3.2 7.7-7.5 9-4.3-1.3-7.5-4.5-7.5-9V6.5l7.5-3z" }), /* @__PURE__ */ f("path", { d: "M9 12l2.2 2.2L15.5 10" })] }),
	architect: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("path", { d: "M12 3.5l8.5 4.5-8.5 4.5L3.5 8 12 3.5z" }),
		/* @__PURE__ */ f("path", { d: "M3.5 12.5l8.5 4.5 8.5-4.5" }),
		/* @__PURE__ */ f("path", { d: "M3.5 16.5l8.5 4 8.5-4" })
	] }),
	designer: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M4.5 19.5l1-4L15.5 5.5l3 3-10 10-4 1z" }), /* @__PURE__ */ f("path", { d: "M13.5 7.5l3 3" })] }),
	tester: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("path", { d: "M9 3.5h6" }),
		/* @__PURE__ */ f("path", { d: "M10 3.5v6l-5 8.5a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3L14 9.5v-6" }),
		/* @__PURE__ */ f("path", { d: "M7.5 15.5h9" })
	] }),
	backend: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("rect", {
			x: "3.5",
			y: "4.5",
			width: "17",
			height: "6.5",
			rx: "1.5"
		}),
		/* @__PURE__ */ f("rect", {
			x: "3.5",
			y: "13",
			width: "17",
			height: "6.5",
			rx: "1.5"
		}),
		/* @__PURE__ */ f("path", { d: "M7 7.75h.01M7 16.25h.01" })
	] }),
	frontend: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("rect", {
		x: "3.5",
		y: "4.5",
		width: "17",
		height: "11.5",
		rx: "1.5"
	}), /* @__PURE__ */ f("path", { d: "M9 20h6M12 16v4" })] }),
	mobile: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("rect", {
		x: "7",
		y: "3",
		width: "10",
		height: "18",
		rx: "2"
	}), /* @__PURE__ */ f("path", { d: "M11 18h2" })] }),
	ops: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("path", { d: "M12 3.5l8 4.5v8L12 20.5 4 16V8l8-4.5z" }),
		/* @__PURE__ */ f("path", { d: "M4 8l8 4.5L20 8" }),
		/* @__PURE__ */ f("path", { d: "M12 12.5v8" })
	] }),
	deploy: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("path", { d: "M12 3c3 2.2 4.5 5.5 4.5 9.5l-2 3h-5l-2-3C7.5 8.5 9 5.2 12 3z" }),
		/* @__PURE__ */ f("circle", {
			cx: "12",
			cy: "9.5",
			r: "1.6"
		}),
		/* @__PURE__ */ f("path", { d: "M9.5 15.5l-2 3.5M14.5 15.5l2 3.5M12 16v4.5" })
	] }),
	motion: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("path", { d: "M3.5 18.5c4-1 7-4 8.5-9" }),
		/* @__PURE__ */ f("path", { d: "M17 3.5l1.1 2.4 2.4 1.1-2.4 1.1L17 10.5l-1.1-2.4-2.4-1.1 2.4-1.1z" }),
		/* @__PURE__ */ f("path", { d: "M6.5 6.5l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" })
	] }),
	compliance: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M12 3.5l7 3v5.5c0 4.2-2.9 7.2-7 8.5-4.1-1.3-7-4.3-7-8.5V6.5l7-3z" }), /* @__PURE__ */ f("path", { d: "M9 12l2 2 4-4" })] }),
	reviewer: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("circle", {
		cx: "10.5",
		cy: "10.5",
		r: "6"
	}), /* @__PURE__ */ f("path", { d: "M15 15l5 5" })] }),
	knowledge: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M12 6.5c-2-1.6-4.6-2-8-2v13c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2v-13c-3.4 0-6 .4-8 2z" }), /* @__PURE__ */ f("path", { d: "M12 6.5v13" })] }),
	product: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("rect", {
		x: "3.5",
		y: "3.5",
		width: "17",
		height: "17",
		rx: "2"
	}), /* @__PURE__ */ f("path", { d: "M3.5 9h17M9 9v11.5" })] })
}, Ct = {
	wait: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("circle", {
		cx: "12",
		cy: "8",
		r: "3.5"
	}), /* @__PURE__ */ f("path", { d: "M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" })] }),
	approved: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("circle", {
		cx: "12",
		cy: "12",
		r: "8.5"
	}), /* @__PURE__ */ f("path", { d: "M8.5 12.2l2.4 2.4 4.6-4.8" })] }),
	bounce: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M9 14L4 9l5-5" }), /* @__PURE__ */ f("path", { d: "M20 20v-7a4 4 0 0 0-4-4H4" })] }),
	sign: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M12 20h8" }), /* @__PURE__ */ f("path", { d: "M16.5 3.6a2.1 2.1 0 0 1 3 3L7 19.1l-4 .9.9-4L16.5 3.6z" })] }),
	merge: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("circle", {
			cx: "18",
			cy: "18",
			r: "2.5"
		}),
		/* @__PURE__ */ f("circle", {
			cx: "6",
			cy: "6",
			r: "2.5"
		}),
		/* @__PURE__ */ f("path", { d: "M6 21V8.5" }),
		/* @__PURE__ */ f("path", { d: "M6 8.5c0 5 4 9.5 9.5 9.5" })
	] }),
	book: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("path", { d: "M12 6.5c-2-1.6-4.6-2-8-2v13c3.4 0 6 .4 8 2 2-1.6 4.6-2 8-2v-13c-3.4 0-6 .4-8 2z" }), /* @__PURE__ */ f("path", { d: "M12 6.5v13" })] }),
	issue: /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("circle", {
		cx: "12",
		cy: "12",
		r: "8.5"
	}), /* @__PURE__ */ f("circle", {
		cx: "12",
		cy: "12",
		r: "1.6"
	})] }),
	pr: /* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ f("circle", {
			cx: "18",
			cy: "18",
			r: "2.5"
		}),
		/* @__PURE__ */ f("circle", {
			cx: "6",
			cy: "6",
			r: "2.5"
		}),
		/* @__PURE__ */ f("path", { d: "M6 8.5V21" }),
		/* @__PURE__ */ f("path", { d: "M12.5 6H16a2 2 0 0 1 2 2v7.5" }),
		/* @__PURE__ */ f("path", { d: "M14.5 3.5L12 6l2.5 2.5" })
	] })
}, wt = /* @__PURE__ */ f("circle", {
	cx: "12",
	cy: "12",
	r: "7.5"
});
function Tt(e) {
	return e && (St[e] || St[e.replace(/\d+$/, "")] || Ct[e]) || wt;
}
function Z({ role: e, size: t = 18, className: n = "" }) {
	return /* @__PURE__ */ f("svg", {
		className: `kt-role-icon ${n}`.trim(),
		width: t,
		height: t,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.6,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		focusable: "false",
		children: Tt(e)
	});
}
function Et({ role: e, cx: t, cy: n, size: r = 22, className: i = "" }) {
	return /* @__PURE__ */ f("svg", {
		className: `kt-role-icon ${i}`.trim(),
		x: t - r / 2,
		y: n - r / 2,
		width: r,
		height: r,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.6,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: Tt(e)
	});
}
//#endregion
//#region src/board/Conveyor.tsx
function Dt({ run: e, fresh: t, focus: n, onRole: i }) {
	let s = gt(), c = new Map(e.roles.map((e) => [e.key, e])), l = e.roles.filter((e) => e.status === "done" && e.writable.length > 0), u = e.merges.filter((e) => e.status === "conflict").length, d = a(null), [m, h] = o(!1);
	return r(() => {
		let e = d.current;
		e && (e.scrollLeft = e.scrollWidth, h(e.scrollLeft > 4));
	}, [e.merges.length, l.length]), /* @__PURE__ */ p("section", {
		className: "kt-card kt-conveyor",
		"data-testid": "kt-conveyor",
		"aria-label": "Merge belt",
		children: [/* @__PURE__ */ p("header", {
			className: "kt-card-head",
			children: [/* @__PURE__ */ f("h2", { children: "Merge belt" }), /* @__PURE__ */ p("span", {
				className: "kt-dim",
				children: [
					e.merges.filter((e) => e.status === "merged").length,
					" merged",
					u ? " · " : "",
					u ? /* @__PURE__ */ p("span", {
						className: "tone-bad",
						children: [
							u,
							" conflict",
							u === 1 ? "" : "s"
						]
					}) : null
				]
			})]
		}), /* @__PURE__ */ p("ol", {
			className: `kt-belt${m ? " has-older" : ""}`,
			ref: d,
			onScroll: (e) => h(e.currentTarget.scrollLeft > 4),
			children: [
				/* @__PURE__ */ p("li", {
					className: "kt-belt-end is-base",
					title: "Every role branches from this commit",
					children: ["Base ", /* @__PURE__ */ f("code", { children: e.base })]
				}),
				e.merges.map((e) => {
					let r = c.get(e.role), a = Ye(e);
					return /* @__PURE__ */ p("li", {
						className: `kt-belt-chip is-${e.status}${t.has(a) ? " is-new" : ""}${n && n !== e.role ? " is-dim" : ""}`,
						children: [
							/* @__PURE__ */ p("button", {
								type: "button",
								className: "kt-belt-role",
								onClick: () => i(e.role),
								title: `Show only ${r?.title ?? e.role}`,
								children: [
									r && /* @__PURE__ */ f(Z, {
										role: r.icon || r.key,
										size: 14
									}),
									" ",
									r?.title ?? e.role
								]
							}),
							/* @__PURE__ */ p("span", {
								className: "kt-belt-meta",
								children: [
									/* @__PURE__ */ f("code", { children: e.sha }),
									" · ",
									e.files,
									" file",
									e.files === 1 ? "" : "s",
									" · ",
									L(s - e.at)
								]
							}),
							e.status === "conflict" && /* @__PURE__ */ p("span", {
								className: "kt-belt-note",
								children: ["⚡ Conflict: ", /* @__PURE__ */ f("code", { children: e.note ?? "no path given" })]
							})
						]
					}, a);
				}),
				l.map((e) => /* @__PURE__ */ p("li", {
					className: `kt-belt-chip is-pending${n && n !== e.key ? " is-dim" : ""}`,
					children: [/* @__PURE__ */ p("button", {
						type: "button",
						className: "kt-belt-role",
						onClick: () => i(e.key),
						children: [
							/* @__PURE__ */ f(Z, {
								role: e.icon || e.key,
								size: 14
							}),
							" ",
							e.title
						]
					}), /* @__PURE__ */ f("span", {
						className: "kt-belt-meta",
						children: "Done · waiting to merge"
					})]
				}, `pending-${e.key}`)),
				/* @__PURE__ */ f("li", {
					className: "kt-belt-end is-head",
					title: "Run branch: each role's branch is merged in turn, and the app runs its tests here",
					children: /* @__PURE__ */ f("code", { children: e.branch })
				})
			]
		})]
	});
}
//#endregion
//#region src/board/EventFeed.tsx
var Ot = /* @__PURE__ */ new Set([
	"run",
	"spawned",
	"handoff",
	"merged",
	"tests",
	"bounce",
	"review",
	"gate",
	"approved",
	"ownership",
	"skipped",
	"failed",
	"conflict"
]);
function kt({ run: e, focus: t, onRole: n, fresh: r, milestones: i = !1 }) {
	let a = gt(), [s, c] = o(!0), l = new Map(e.roles.map((e) => [e.key, e])), u = e.events.slice().reverse().filter((e) => (i ? Ot.has(e.kind) : s || e.kind !== "tool") && (!t || le(e, t))), d = t ? l.get(t) : void 0;
	return /* @__PURE__ */ p("section", {
		className: "kt-card kt-feed",
		"data-testid": "kt-feed",
		"aria-label": "Events",
		children: [/* @__PURE__ */ p("header", {
			className: "kt-card-head",
			children: [
				/* @__PURE__ */ f("h2", { children: "Events" }),
				d && /* @__PURE__ */ p("button", {
					type: "button",
					className: "kt-filter",
					onClick: () => n(d.key),
					"aria-label": `Stop showing only ${d.title}`,
					children: [
						"Only ",
						/* @__PURE__ */ f(Z, {
							role: d.icon || d.key,
							size: 14
						}),
						" ",
						d.title,
						" ✕"
					]
				}),
				/* @__PURE__ */ p("label", {
					className: "kt-check",
					children: [/* @__PURE__ */ f("input", {
						type: "checkbox",
						checked: s,
						onChange: (e) => c(e.target.checked)
					}), "Tool calls"]
				})
			]
		}), /* @__PURE__ */ p("ol", {
			className: "kt-feed-list",
			children: [u.length === 0 && /* @__PURE__ */ f("li", {
				className: "kt-dim kt-feed-empty",
				children: t ? "No events for this role yet" : "No events yet"
			}), u.map((e) => {
				let t = x[e.kind] ?? {
					icon: "•",
					label: e.kind,
					tone: "idle"
				};
				return /* @__PURE__ */ p("li", {
					className: `kt-ev is-${e.kind} tone-${t.tone}${r.has(e.seq) ? " is-new" : ""}`,
					"data-seq": e.seq,
					children: [
						/* @__PURE__ */ f("span", {
							className: "kt-ev-icon",
							"aria-hidden": "true",
							title: t.label,
							children: t.icon
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-ev-text",
							children: e.text
						}),
						/* @__PURE__ */ f(At, {
							e,
							byKey: l,
							onRole: n
						}),
						/* @__PURE__ */ f("time", {
							className: "kt-ev-time",
							dateTime: (/* @__PURE__ */ new Date(e.at * 1e3)).toISOString(),
							children: L(a - e.at)
						})
					]
				}, e.seq);
			})]
		})]
	});
}
function At({ e, byKey: t, onRole: n }) {
	let r = (e) => {
		let r = e ? t.get(e) : void 0;
		return r ? /* @__PURE__ */ f("button", {
			type: "button",
			className: "kt-ev-role",
			onClick: () => n(r.key),
			title: `Show only ${r.title}`,
			"aria-label": `Show only ${r.title}`,
			children: /* @__PURE__ */ f(Z, {
				role: r.icon || r.key,
				size: 15
			})
		}, r.key) : null;
	};
	if (e.kind === "handoff" && e.from && e.to && t.has(e.from) && t.has(e.to)) return /* @__PURE__ */ p("span", {
		className: "kt-ev-roles",
		children: [
			r(e.from),
			/* @__PURE__ */ f("span", {
				"aria-hidden": "true",
				children: "→"
			}),
			r(e.to)
		]
	});
	let i = e.role ?? (e.from && t.has(e.from) ? e.from : e.to && t.has(e.to) ? e.to : null);
	return /* @__PURE__ */ f("span", {
		className: "kt-ev-roles",
		children: r(i)
	});
}
//#endregion
//#region src/board/useBoard.ts
function jt(e) {
	let t = e instanceof Error ? e.message : String(e), n = /^API (\d{3}): ([\s\S]*)$/.exec(t);
	if (!n) return t;
	let [, r, i] = n;
	try {
		let e = JSON.parse(i);
		if (e && typeof e.error == "string" && e.error) return `${e.error} (${r})`;
	} catch {}
	return r === "401" ? "Sign in to the KiroCrew dashboard first (401)" : r === "403" ? "No permission: only requests from the dashboard owner are accepted (403)" : r === "404" ? "The backend does not have this endpoint yet (404)" : `Request failed (${r})${i.trim() ? `: ${i.trim().slice(0, 200)}` : ""}`;
}
function Mt(e) {
	let t = /^API (\d{3}):/.exec(e instanceof Error ? e.message : String(e));
	return t ? Number(t[1]) : 0;
}
function Nt(e, n) {
	let i = n.pollMs ?? 2e3, [s, c] = o({
		board: null,
		error: "",
		missing: !1,
		loading: !0,
		receivedAt: 0
	}), l = ot(e), u = ot(n.run), d = ot(n.onDiff), f = a(!1), p = a(null), m = a(!1), h = a(0), g = a(() => {}), _ = t(async () => {
		if (f.current) return;
		f.current = !0;
		let e = h.current;
		try {
			let t = await l.current.get(v.board(u.current));
			if (e !== h.current) return;
			let n = t?.run ?? null, r = typeof document > "u" || !document.hidden, i = null;
			n && (i = it(p.current, n, {
				at: t.at,
				resync: m.current
			})), p.current = n, r && (m.current = !1), c({
				board: t,
				error: "",
				missing: !1,
				loading: !1,
				receivedAt: Date.now()
			}), i && d.current?.(i, t);
		} catch (t) {
			if (e !== h.current) return;
			c((e) => ({
				...e,
				error: jt(t),
				missing: Mt(t) === 404,
				loading: !1
			}));
		} finally {
			f.current = !1, e !== h.current && g.current();
		}
	}, [
		l,
		u,
		d
	]);
	r(() => {
		let e, t = !0, n = 0, r = (t) => {
			clearTimeout(e);
			let r = ++n;
			e = setTimeout(() => void a(r), t);
		}, a = async (e) => {
			t && e === n && (document.hidden ? m.current = !0 : (await _(), t && e === n && r(i)));
		}, o = () => {
			document.hidden ? (m.current = !0, clearTimeout(e), n++) : r(0);
		};
		return g.current = () => r(0), r(0), document.addEventListener("visibilitychange", o), () => {
			t = !1, clearTimeout(e), g.current = () => {}, document.removeEventListener("visibilitychange", o);
		};
	}, [_, i]);
	let y = a(!0);
	r(() => {
		y.current ? y.current = !1 : (h.current++, p.current = null, g.current());
	}, [n.run]);
	let b = t(() => g.current(), []);
	return {
		...s,
		reload: b
	};
}
//#endregion
//#region src/board/Folder.tsx
function Pt({ api: e, run: t, role: n, path: r }) {
	let [i, a] = o(null), s = (r) => {
		a(null), e.post(v.open(t), {
			role: n,
			app: r
		}).then((e) => a({
			ok: !0,
			text: r === "kiro" ? "Opened in Kiro" : "Opened in Finder"
		})).catch((e) => a({
			ok: !1,
			text: jt(e)
		}));
	};
	return /* @__PURE__ */ p("div", {
		className: "kt-folder",
		"data-testid": "kt-folder",
		children: [r && /* @__PURE__ */ f("code", {
			className: "kt-folder-path",
			title: r,
			children: r
		}), /* @__PURE__ */ p("span", {
			className: "kt-folder-acts",
			children: [
				/* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-small",
					onClick: () => s("finder"),
					children: "📁 Open in Finder"
				}),
				/* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-small",
					onClick: () => s("kiro"),
					children: "Open in Kiro"
				}),
				r && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-small",
					onClick: () => {
						if (!r) return;
						let e = () => a({
							ok: !0,
							text: "Path copied"
						}), t = () => a({
							ok: !1,
							text: "Could not copy; select the path above by hand"
						});
						navigator.clipboard?.writeText ? navigator.clipboard.writeText(r).then(e, t) : t();
					},
					children: "Copy path"
				}),
				i && /* @__PURE__ */ f("span", {
					role: "status",
					className: i.ok ? "kt-dim" : "kt-error",
					children: i.text
				})
			]
		})]
	});
}
function Ft({ api: e, run: t, folder: n, onClose: r }) {
	return /* @__PURE__ */ p("section", {
		className: "kt-folder-panel",
		"aria-label": "Project folder",
		children: [/* @__PURE__ */ p("div", {
			className: "kt-folder-panel-head",
			children: [
				/* @__PURE__ */ f("strong", { children: "Project folder" }),
				/* @__PURE__ */ f("span", {
					className: "kt-dim",
					children: "The run branch is checked out here: all the code the team has merged. Each role's own working directory opens from Outputs."
				}),
				/* @__PURE__ */ f("span", { className: "kt-grow" }),
				/* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-small",
					onClick: r,
					"aria-label": "Collapse project folder",
					children: "✕"
				})
			]
		}), /* @__PURE__ */ f(Pt, {
			api: e,
			run: t,
			role: null,
			path: n
		})]
	});
}
var It = {
	files: "Output files",
	reply: "Its reply",
	task: "Task it got",
	calls: "What it did",
	site: "Site"
};
function Lt(e, t) {
	return e === "run" ? ["site", "files"] : t ? [
		"files",
		"reply",
		"task",
		"calls"
	] : [
		"reply",
		"task",
		"calls"
	];
}
function Rt({ api: e, run: t, target: n, onTarget: i, onClose: o }) {
	let s = a(null);
	r(() => s.current?.focus(), []);
	let c = t.roles.findIndex((e) => e.key === n.role), l = [...t.roles.map((e) => e.key), "run"], u = l.indexOf(n.role), d = (e) => {
		let t = l[u + e];
		t && i({ role: t });
	}, m = n.role === "run" ? "Whole product" : t.roles[c]?.title ?? n.role;
	return /* @__PURE__ */ f("div", {
		className: "kt-drawer-backdrop",
		onMouseDown: (e) => e.target === e.currentTarget && o(),
		children: /* @__PURE__ */ p("aside", {
			className: "kt-drawer",
			role: "dialog",
			"aria-modal": "true",
			"aria-label": `Output of ${m}`,
			"data-testid": "kt-outputs",
			children: [
				/* @__PURE__ */ p("div", {
					className: "kt-drawer-top",
					children: [
						/* @__PURE__ */ f("h2", { children: "Output of each step" }),
						/* @__PURE__ */ f("span", {
							className: "kt-dim",
							children: t.title
						}),
						/* @__PURE__ */ f("span", { className: "kt-grow" }),
						/* @__PURE__ */ f("button", {
							type: "button",
							className: "kt-btn",
							onClick: () => d(-1),
							disabled: u <= 0,
							"aria-label": "Previous step",
							children: "‹ Previous step"
						}),
						/* @__PURE__ */ f("button", {
							type: "button",
							className: "kt-btn",
							onClick: () => d(1),
							disabled: u < 0 || u >= l.length - 1,
							"aria-label": "Next step",
							children: "Next step ›"
						}),
						/* @__PURE__ */ f("button", {
							ref: s,
							type: "button",
							className: "kt-btn",
							onClick: o,
							"aria-label": "Close outputs",
							children: "✕"
						})
					]
				}),
				/* @__PURE__ */ p("nav", {
					className: "kt-steps",
					"aria-label": "Each step of the team",
					children: [t.roles.map((e, t) => /* @__PURE__ */ p("button", {
						type: "button",
						className: `kt-step tone-${C(e).tone}${e.key === n.role ? " is-on" : ""}`,
						"aria-current": e.key === n.role ? "step" : void 0,
						onClick: () => i({ role: e.key }),
						title: C(e).label,
						children: [
							/* @__PURE__ */ f("span", {
								className: "kt-step-n",
								children: t + 1
							}),
							/* @__PURE__ */ f(Z, {
								role: e.icon || e.key,
								size: 16
							}),
							/* @__PURE__ */ f("span", { children: e.title })
						]
					}, e.key)), /* @__PURE__ */ p("button", {
						type: "button",
						className: `kt-step is-product${n.role === "run" ? " is-on" : ""}`,
						"aria-current": n.role === "run" ? "step" : void 0,
						onClick: () => i({ role: "run" }),
						children: [/* @__PURE__ */ f("span", {
							"aria-hidden": "true",
							children: "📦"
						}), /* @__PURE__ */ f("span", { children: "Whole product" })]
					})]
				}),
				t.imported && /* @__PURE__ */ p("p", {
					className: "kt-banner",
					role: "note",
					children: [
						"This run was imported from \"",
						t.imported.from,
						"\" and carries only the run record: each member's task, reply and what it did are here, but which files changed and their contents can only be seen on the original Mac."
					]
				}),
				/* @__PURE__ */ f(Bt, {
					api: e,
					run: t,
					target: n
				}, n.role)
			]
		})
	});
}
function zt({ slot: e, title: t }) {
	let { openChat: n } = l();
	return /* @__PURE__ */ f("button", {
		type: "button",
		className: "kt-btn is-primary",
		onClick: () => n({
			slotKey: e,
			autoSend: !1
		}),
		title: `"${t} agent" is a session in Kiro Crew: you can see every step and type into it directly`,
		children: "Open session in Crew"
	});
}
function Bt({ api: e, run: t, target: n }) {
	let i = n.role, a = t.roles.find((e) => e.key === i) ?? null, s = i === "run", c = Lt(i, s || !!a?.writable.length), [l, u] = o(n.tab && c.includes(n.tab) ? n.tab : s && !Vt(t) ? "files" : c[0]), [d, m] = o(null), [h, g] = o(""), _ = s ? `${t.status}|${t.merges.length}` : a ? `${a.status}|${a.attempt}|${a.commits.length}|${a.done_at ?? ""}` : "", y = !!d?.attempts.some((e) => e.live), [b, x] = o(0);
	r(() => {
		if (!y) return;
		let e = setInterval(() => x((e) => e + 1), 4e3);
		return () => clearInterval(e);
	}, [y]), r(() => {
		let n = !0;
		return g(""), e.get(v.role(t.id, i)).then((e) => n && m(e)).catch((e) => n && g(jt(e))), () => {
			n = !1;
		};
	}, [
		e,
		t.id,
		i,
		_,
		b
	]);
	let S = a ? C(a) : T(t.status);
	return /* @__PURE__ */ p("section", {
		className: "kt-pane",
		"aria-label": d?.title ?? i,
		children: [/* @__PURE__ */ p("header", {
			className: "kt-pane-head",
			children: [
				/* @__PURE__ */ p("div", {
					className: "kt-pane-who",
					children: [
						/* @__PURE__ */ f("span", {
							className: "kt-pane-emoji",
							"aria-hidden": "true",
							children: /* @__PURE__ */ f(Z, {
								role: s ? "product" : a?.icon || a?.key,
								size: 26
							})
						}),
						/* @__PURE__ */ f("h3", { children: s ? "Whole product" : `Output of ${a?.title ?? i}` }),
						/* @__PURE__ */ f("span", {
							className: `kt-pill tone-${S.tone}`,
							children: S.label
						}),
						d?.branch && /* @__PURE__ */ p("code", {
							className: "kt-dim",
							title: d.base ? `Compared with ${d.base}` : void 0,
							children: [d.branch, d.head ? ` @ ${d.head}` : ""]
						})
					]
				}),
				a && /* @__PURE__ */ f("p", {
					className: "kt-dim kt-pane-scope",
					children: a.writable.length ? `May write: ${a.writable.join(", ")}` : "Read only: changes no files"
				}),
				(d?.folder || a?.session) && /* @__PURE__ */ p("div", {
					className: "kt-pane-folder",
					children: [a?.session && /* @__PURE__ */ f(zt, {
						slot: a.session,
						title: a.title
					}), d?.folder && /* @__PURE__ */ f(Pt, {
						api: e,
						run: t.id,
						role: s ? null : i,
						path: d.folder
					})]
				}),
				/* @__PURE__ */ f("div", {
					className: "kt-tabs",
					role: "tablist",
					"aria-label": "What to view",
					children: c.map((e) => /* @__PURE__ */ p("button", {
						type: "button",
						role: "tab",
						className: "kt-tab",
						"aria-selected": l === e,
						onClick: () => u(e),
						children: [e === "reply" && !a?.writable.length ? "Review report" : It[e], e === "files" && d ? /* @__PURE__ */ f("sub", { children: d.files.length }) : null]
					}, e))
				})
			]
		}), /* @__PURE__ */ p("div", {
			className: "kt-pane-body",
			role: "tabpanel",
			children: [
				h && /* @__PURE__ */ p("p", {
					className: "kt-error",
					role: "alert",
					children: ["Could not read: ", h]
				}),
				!d && !h && /* @__PURE__ */ f("p", {
					className: "kt-dim",
					children: "Reading…"
				}),
				d && l === "files" && /* @__PURE__ */ f(Ut, {
					api: e,
					run: t,
					data: d,
					initial: n.path ?? null
				}),
				d && (l === "reply" || l === "task" || l === "calls") && /* @__PURE__ */ f(qt, {
					data: d,
					tab: l
				}),
				l === "site" && /* @__PURE__ */ f(Zt, {
					api: e,
					run: t
				})
			]
		})]
	});
}
var Vt = (e) => e.status === "done" || e.status === "failed" || e.status === "stopped";
function Ht(e) {
	return e.slice().sort((e, t) => Number(t.output) - Number(e.output) || e.path.localeCompare(t.path));
}
function Ut({ api: e, run: t, data: n, initial: a }) {
	let s = i(() => Ht(n.files), [n.files]), [c, l] = o(() => a && s.some((e) => e.path === a) ? a : s[0]?.path ?? null);
	r(() => {
		!c && s[0] && l(s[0].path);
	}, [s, c]);
	let u = i(() => new Map(t.roles.map((e) => [e.key, e])), [t.roles]);
	if (!s.length) return /* @__PURE__ */ f("p", {
		className: "kt-dim",
		children: n.role === "run" ? "No changes merged into the run branch yet." : "It has not committed any files yet."
	});
	let m = s.filter((e) => e.output), h = s.filter((e) => !e.output), g = (e) => {
		let t = n.role === "run" && e.owner ? u.get(e.owner) : null, r = e.path.lastIndexOf("/");
		return /* @__PURE__ */ f("li", { children: /* @__PURE__ */ p("button", {
			type: "button",
			className: `kt-frow${c === e.path ? " is-on" : ""}`,
			"aria-current": c === e.path ? "true" : void 0,
			"aria-label": e.path,
			onClick: () => l(e.path),
			title: `${e.path}  +${e.added} −${e.removed}`,
			children: [
				/* @__PURE__ */ f("span", {
					className: `kt-file-st is-${e.status}`,
					children: e.status
				}),
				/* @__PURE__ */ p("span", {
					className: "kt-frow-path kt-mono",
					children: [r >= 0 && /* @__PURE__ */ f("span", {
						className: "kt-dim",
						children: e.path.slice(0, r + 1)
					}), e.path.slice(r + 1)]
				}),
				/* @__PURE__ */ p("span", {
					className: "kt-frow-num kt-mono",
					children: [t && /* @__PURE__ */ p("span", {
						title: t.title,
						children: [/* @__PURE__ */ f(Z, {
							role: t.icon || t.key,
							size: 13
						}), " "]
					}), /* @__PURE__ */ p("span", {
						className: "kt-add",
						children: ["+", e.added]
					})]
				})
			]
		}) }, e.path);
	};
	return /* @__PURE__ */ p("div", {
		className: "kt-files-pane",
		children: [/* @__PURE__ */ p("div", {
			className: "kt-flist",
			children: [m.length > 0 && /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("p", {
				className: "kt-flist-h",
				children: n.role === "run" ? "Agreed outputs" : "What it agreed to deliver"
			}), /* @__PURE__ */ f("ul", { children: m.map(g) })] }), h.length > 0 && /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("p", {
				className: "kt-flist-h",
				children: m.length ? "Other changes" : "Changed files"
			}), /* @__PURE__ */ f("ul", { children: h.map(g) })] })]
		}), c && /* @__PURE__ */ f(Wt, {
			api: e,
			run: t,
			role: n.role,
			path: c,
			head: n.head,
			file: s.find((e) => e.path === c) ?? null
		}, c)]
	});
}
function Wt({ api: e, run: t, role: n, path: i, head: a, file: s }) {
	let [c, l] = o(s?.status === "D" ? "diff" : "content"), [u, d] = o("rendered"), [h, g] = o(null), [_, y] = o("");
	r(() => {
		let r = !0;
		return g(null), y(""), e.get(v.file(t.id, n, i, c)).then((e) => r && g(e)).catch((e) => r && y(jt(e))), () => {
			r = !1;
		};
	}, [
		e,
		t.id,
		n,
		i,
		c,
		a
	]);
	let b = h?.lang === "markdown" && c === "content";
	return /* @__PURE__ */ p("div", {
		className: "kt-fview",
		"data-testid": "kt-file-view",
		children: [/* @__PURE__ */ p("div", {
			className: "kt-fview-bar",
			children: [
				/* @__PURE__ */ f("code", {
					className: "kt-fview-path",
					children: i
				}),
				s && /* @__PURE__ */ p("span", {
					className: "kt-mono kt-dim",
					children: [
						/* @__PURE__ */ p("span", {
							className: "kt-add",
							children: ["+", s.added]
						}),
						" ",
						/* @__PURE__ */ p("span", {
							className: "kt-del",
							children: ["−", s.removed]
						})
					]
				}),
				/* @__PURE__ */ f("span", { className: "kt-grow" }),
				b && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-small",
					"aria-pressed": u === "source",
					onClick: () => d((e) => e === "rendered" ? "source" : "rendered"),
					children: "Source"
				}),
				/* @__PURE__ */ p("div", {
					className: "kt-seg",
					role: "group",
					"aria-label": "View content or changes",
					children: [/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-small",
						"aria-pressed": c === "content",
						onClick: () => l("content"),
						disabled: s?.status === "D",
						children: "Content"
					}), /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-small",
						"aria-pressed": c === "diff",
						onClick: () => l("diff"),
						children: "Changes"
					})]
				})
			]
		}), /* @__PURE__ */ p("div", {
			className: "kt-fview-body",
			children: [
				_ && /* @__PURE__ */ f("p", {
					className: "kt-error kt-pad",
					role: "alert",
					children: _
				}),
				!h && !_ && /* @__PURE__ */ f("p", {
					className: "kt-dim kt-pad",
					children: "Reading…"
				}),
				h && h.binary && /* @__PURE__ */ f("p", {
					className: "kt-dim kt-pad",
					children: "Binary file; content not shown"
				}),
				h && !h.binary && !h.text && /* @__PURE__ */ f("p", {
					className: "kt-dim kt-pad",
					children: c === "diff" ? "No changes" : "Empty file"
				}),
				h && !h.binary && h.text && (b && u === "rendered" ? /* @__PURE__ */ f("div", {
					className: "kt-md msg-content",
					children: /* @__PURE__ */ f(m, { content: h.text })
				}) : /* @__PURE__ */ f(Kt, {
					text: h.text,
					diff: c === "diff"
				})),
				h?.truncated && /* @__PURE__ */ f("p", {
					className: "kt-dim kt-pad",
					children: "Only the first 300 KB is shown"
				})
			]
		})]
	});
}
function Gt(e) {
	return e.startsWith("@@") ? "is-hunk" : /^(diff --git|index |--- |\+\+\+ |new file mode|deleted file mode|similarity |rename )/.test(e) ? "is-meta" : e.startsWith("+") ? "is-add" : e.startsWith("-") ? "is-del" : "";
}
function Kt({ text: e, diff: t }) {
	let n = e.endsWith("\n") ? e.slice(0, -1).split("\n") : e.split("\n");
	return /* @__PURE__ */ f("ol", {
		className: `kt-code${t ? " is-diff" : ""}`,
		children: n.map((e, n) => /* @__PURE__ */ f("li", {
			className: t ? Gt(e) : void 0,
			children: /* @__PURE__ */ f("code", { children: e || " " })
		}, n))
	});
}
function qt({ data: e, tab: t }) {
	let [n, r] = o(null), i = e.attempts;
	if (!i.length) return /* @__PURE__ */ f("p", {
		className: "kt-dim",
		children: "It has not started yet."
	});
	let a = i.find((e) => e.n === n) ?? i[i.length - 1];
	return /* @__PURE__ */ p("div", {
		className: "kt-attempt",
		children: [
			i.length > 1 && /* @__PURE__ */ f("div", {
				className: "kt-rounds",
				role: "group",
				"aria-label": "Which round",
				children: i.map((e) => /* @__PURE__ */ p("button", {
					type: "button",
					className: "kt-btn is-small",
					"aria-pressed": e.n === a.n,
					onClick: () => r(e.n),
					children: [
						"Round ",
						e.n,
						e.label ? ` · ${e.label}` : e.kind === "work" ? " · start" : ""
					]
				}, e.n))
			}),
			/* @__PURE__ */ f(Jt, { att: a }),
			t === "reply" && /* @__PURE__ */ f(Yt, { att: a }),
			t === "task" && /* @__PURE__ */ f("pre", {
				className: "kt-task kt-mono",
				children: a.task
			}),
			t === "calls" && /* @__PURE__ */ f(Xt, { att: a })
		]
	});
}
function Jt({ att: e }) {
	let t = e.started && e.ended ? I(e.ended - e.started) : null;
	return /* @__PURE__ */ p("p", {
		className: "kt-dim kt-attempt-meta",
		children: [
			e.live ? "Still working" : t ? `Time ${t}` : "Did not run",
			e.calls.length > 0 && ` · ${e.calls.length} tool call${e.calls.length === 1 ? "" : "s"}`,
			e.credits !== null && ` · ${e.credits.toFixed(1)} credits`,
			e.agent && /* @__PURE__ */ p("span", {
				className: "kt-mono",
				children: [" · KiroCrew sub-agent ", e.agent]
			})
		]
	});
}
function Yt({ att: e }) {
	return e.error && !e.reply ? /* @__PURE__ */ p("p", {
		className: "kt-error",
		children: ["Did not succeed: ", e.error]
	}) : e.reply ? /* @__PURE__ */ p(d, { children: [e.error && /* @__PURE__ */ p("p", {
		className: "kt-error",
		children: ["Did not succeed: ", e.error]
	}), /* @__PURE__ */ f("div", {
		className: "kt-md kt-reply msg-content",
		"data-testid": "kt-reply",
		children: /* @__PURE__ */ f(m, { content: e.reply })
	})] }) : /* @__PURE__ */ f("p", {
		className: "kt-dim",
		children: e.live ? "It is still working; the reply is not out yet." : "No reply was left."
	});
}
function Xt({ att: e }) {
	if (!e.calls.length) return /* @__PURE__ */ f("p", {
		className: "kt-dim",
		children: e.live ? "No tool calls yet." : "No tool calls were recorded."
	});
	let t = e.started ?? e.calls[0].at;
	return /* @__PURE__ */ f("ol", {
		className: "kt-calls",
		"aria-label": "What it did",
		children: e.calls.map((e, n) => /* @__PURE__ */ p("li", { children: [
			/* @__PURE__ */ f("time", {
				className: "kt-mono kt-dim",
				children: I(Math.max(0, e.at - t))
			}),
			/* @__PURE__ */ f("span", {
				"aria-hidden": "true",
				children: se(e.kind, e.tool)
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-mono",
				children: [
					/* @__PURE__ */ f("b", { children: e.tool }),
					" ",
					e.detail
				]
			})
		] }, `${e.at}-${n}`))
	});
}
function Zt({ api: e, run: n }) {
	let i = Vt(n), [a, s] = o(null), [c, l] = o(!1), [u, m] = o(""), [h, g] = o(0), _ = t(() => {
		e.get(v.site(n.id)).then(s).catch((e) => m(jt(e)));
	}, [e, n.id]);
	r(_, [_]), r(() => {
		if (a?.state !== "running") return;
		let e = setInterval(_, 5e3);
		return () => clearInterval(e);
	}, [a?.state, _]);
	let y = (t) => {
		l(!0), m(""), e.post(t, {}).then(s).catch((e) => m(jt(e))).finally(() => l(!1));
	};
	if (!i) return /* @__PURE__ */ f("p", {
		className: "kt-dim",
		children: "The site can only be opened after the run has ended: while it runs, the app merges and runs tests in the run branch directory."
	});
	let b = a?.state === "running" && a.url;
	return /* @__PURE__ */ p("div", {
		className: "kt-site",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-site-bar",
				children: b ? /* @__PURE__ */ p(d, { children: [
					/* @__PURE__ */ f("span", {
						className: "kt-pill tone-ok",
						children: "● Running"
					}),
					/* @__PURE__ */ p("a", {
						className: "kt-mono",
						href: a.url,
						target: "_blank",
						rel: "noreferrer",
						children: [a.url, " ↗"]
					}),
					/* @__PURE__ */ f("span", {
						className: "kt-dim",
						children: a.entry
					}),
					/* @__PURE__ */ f("span", { className: "kt-grow" }),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-small",
						onClick: () => g((e) => e + 1),
						children: "Refresh"
					}),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-small is-danger",
						onClick: () => y(v.siteStop(n.id)),
						disabled: c,
						children: "Stop"
					})
				] }) : /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-primary",
					onClick: () => y(v.site(n.id)),
					disabled: c,
					children: c ? "Starting…" : "Start site"
				}), /* @__PURE__ */ f("span", {
					className: "kt-dim",
					children: "Runs the service the team wrote (the `npm start` entry) on a free local port and stops itself after half an hour."
				})] })
			}),
			u && /* @__PURE__ */ f("p", {
				className: "kt-error",
				role: "alert",
				children: u
			}),
			a?.state === "failed" && a.error && /* @__PURE__ */ f("p", {
				className: "kt-error",
				role: "alert",
				children: a.error
			}),
			b && /* @__PURE__ */ f("iframe", {
				src: a.url,
				title: "The site the team built",
				className: "kt-site-frame"
			}, h),
			a && a.log.length > 0 && /* @__PURE__ */ p("details", {
				className: "kt-site-log",
				open: a.state === "failed",
				children: [/* @__PURE__ */ p("summary", { children: [
					"Service output (",
					a.log.length,
					" line",
					a.log.length === 1 ? "" : "s",
					")"
				] }), /* @__PURE__ */ f("pre", {
					className: "kt-mono",
					children: a.log.join("\n")
				})]
			})
		]
	});
}
//#endregion
//#region src/board/TestWall.tsx
function Qt(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.ac ?? "Other", r = t.get(e);
		r ? r.push(n) : t.set(e, [n]);
	}
	return [...t.entries()].sort(([e], [t]) => ie(e === "Other" ? null : e) - ie(t === "Other" ? null : t) || e.localeCompare(t)).map(([e, t]) => ({
		ac: e,
		cases: t.slice().sort((e, t) => e.name.localeCompare(t.name))
	}));
}
function $t(e, t, n) {
	let r = re(e.ac === "Other" ? null : e.ac);
	return !n || r >= ne.length || t && re(t.ac === "Other" ? null : t.ac) === r ? null : ne[r].label;
}
function en({ tests: e, roles: t, focus: n, onRole: r, flips: i }) {
	let [a, s] = o(null), c = new Map(t.map((e) => [e.key, e])), l = Qt(e.cases), u = new Set(l.map((e) => re(e.ac === "Other" ? null : e.ac))).size > 1, m = e.cases.find((e) => e.id === a) ?? null, h = e.cases.filter((e) => e.status === "fail"), g = /* @__PURE__ */ new Map();
	for (let e of h) g.set(e.owner ?? "", (g.get(e.owner ?? "") ?? 0) + 1);
	let _ = e.total > 0 && e.failed === 0;
	return /* @__PURE__ */ p("section", {
		className: `kt-card kt-wall${_ ? " is-green" : ""}`,
		"data-testid": "kt-wall",
		"aria-label": "Test wall",
		children: [
			/* @__PURE__ */ p("header", {
				className: "kt-card-head",
				children: [
					/* @__PURE__ */ f("h2", { children: "Test wall" }),
					/* @__PURE__ */ p("span", {
						className: `kt-wall-score${_ ? " tone-ok" : e.failed ? " tone-bad" : ""}`,
						children: [
							e.passed,
							"/",
							e.total
						]
					}),
					/* @__PURE__ */ p("span", {
						className: "kt-wall-src",
						title: `The orchestrator runs this itself on the run branch after every merge: ${e.command} (it does not trust what the agents report)`,
						children: [
							"Issued by the company ",
							e.cases.filter((e) => e.file.startsWith("tests/enterprise/")).length,
							" · written by the team from the acceptance criteria ",
							e.cases.filter((e) => !e.file.startsWith("tests/enterprise/")).length
						]
					}),
					/* @__PURE__ */ f(tn, { at: e.at })
				]
			}),
			e.history.length > 0 && /* @__PURE__ */ p("div", {
				className: "kt-spark-row",
				children: [/* @__PURE__ */ f("span", {
					title: "One point each time the app runs the tests on the run branch",
					children: "Passed"
				}), /* @__PURE__ */ f(nn, {
					history: e.history,
					total: e.total
				})]
			}),
			e.cases.length === 0 ? /* @__PURE__ */ f("p", {
				className: "kt-dim kt-wall-empty",
				children: e.at ? "This test run has no cases" : "No tests yet: the testing role writes them first (they should all be red at the start), and the app runs them itself after merging"
			}) : /* @__PURE__ */ f("div", {
				className: "kt-wall-grid",
				children: l.map((e, t) => /* @__PURE__ */ p("div", {
					className: `kt-ac${e.cases.length > 1 ? " is-multi" : ""}`,
					role: "group",
					"aria-label": e.ac,
					children: [
						$t(e, l[t - 1], u) && /* @__PURE__ */ f("div", {
							className: "kt-group-label",
							children: $t(e, l[t - 1], u)
						}),
						e.cases.length > 1 && /* @__PURE__ */ f("div", {
							className: "kt-ac-label",
							children: e.ac
						}),
						/* @__PURE__ */ f("div", {
							className: "kt-ac-cells",
							children: e.cases.map((t, a) => {
								let o = t.owner ? c.get(t.owner) : void 0, l = i[t.id] ?? 0, u = w(t.status), d = `${t.name}: ${u.label}${t.message ? `, ${t.message}` : ""}${o ? ` (owned by ${o.title})` : ""}`;
								return /* @__PURE__ */ f("button", {
									type: "button",
									className: `kt-cell is-${t.status}${n ? t.owner === n ? " is-hot" : " is-dim" : ""}`,
									"data-testid": "kt-cell",
									"data-case": t.id,
									"data-status": t.status,
									"aria-label": d,
									onMouseEnter: () => s(t.id),
									onMouseLeave: () => s((e) => e === t.id ? null : e),
									onFocus: () => s(t.id),
									onBlur: () => s((e) => e === t.id ? null : e),
									onClick: () => t.owner && r(t.owner),
									children: /* @__PURE__ */ p("span", {
										className: `kt-cell-face${l ? " is-flip" : ""}`,
										children: [
											/* @__PURE__ */ f("span", {
												className: "kt-cell-ac",
												children: e.cases.length > 1 ? `${e.ac.replace(/^[A-Z]+-/, "")}·${a + 1}` : (t.ac ?? t.name).replace(/^([A-Z]+)-/, "$1 ")
											}),
											/* @__PURE__ */ f("span", {
												className: "kt-cell-glyph",
												"aria-hidden": "true",
												children: u.glyph
											}),
											o && /* @__PURE__ */ f("span", {
												className: "kt-cell-owner",
												"aria-hidden": "true",
												children: /* @__PURE__ */ f(Z, {
													role: o.icon || o.key,
													size: 12
												})
											})
										]
									}, l)
								}, t.id);
							})
						})
					]
				}, e.ac))
			}),
			e.cases.length > 0 && /* @__PURE__ */ f("div", {
				className: `kt-wall-inspect${m ? ` is-${m.status}` : ""}`,
				"data-testid": "kt-inspect",
				children: m ? /* @__PURE__ */ p(d, { children: [
					/* @__PURE__ */ p("strong", { children: [
						w(m.status).glyph,
						" ",
						m.name
					] }),
					/* @__PURE__ */ f("span", {
						className: "kt-mono kt-dim",
						children: m.file
					}),
					m.owner && c.get(m.owner) && /* @__PURE__ */ p("span", { children: [
						/* @__PURE__ */ f(Z, {
							role: c.get(m.owner)?.icon || m.owner,
							size: 13
						}),
						" Owned by ",
						c.get(m.owner).title
					] }),
					m.ms !== null && /* @__PURE__ */ p("span", {
						className: "kt-dim",
						children: [m.ms, " ms"]
					}),
					m.message && /* @__PURE__ */ f("span", {
						className: "kt-fail-msg kt-mono",
						children: m.message
					})
				] }) : h.length ? /* @__PURE__ */ p("span", { children: [
					/* @__PURE__ */ p("strong", {
						className: "tone-bad",
						children: [h.length, " failing"]
					}),
					[...g.entries()].map(([e, t]) => {
						let n = c.get(e);
						return /* @__PURE__ */ p("span", {
							className: "kt-inspect-owner",
							children: [
								n ? /* @__PURE__ */ p(d, { children: [
									/* @__PURE__ */ f(Z, {
										role: n.icon || n.key,
										size: 13
									}),
									" ",
									n.title
								] }) : "No owner",
								" ",
								t
							]
						}, e || "none");
					}),
					/* @__PURE__ */ f("span", {
						className: "kt-dim",
						children: " · hover or focus a cell to see why it failed"
					})
				] }) : /* @__PURE__ */ f("strong", {
					className: "tone-ok",
					children: "All passed ✓"
				})
			})
		]
	});
}
function tn({ at: e }) {
	let t = gt();
	return /* @__PURE__ */ f("span", {
		className: "kt-dim kt-wall-at",
		children: e ? `run ${L(t - e)}` : "Not run yet"
	});
}
function nn({ history: e, total: t }) {
	if (!e.length) return null;
	let n = e[0].at, r = e[e.length - 1].at, i = Math.max(1, t, ...e.map((e) => e.passed + e.failed)), a = (e) => r > n ? 5 + (e - n) / (r - n) * 290 : 150, o = (e) => 35 - e / i * 30, s = `M${a(e[0].at).toFixed(1)},${o(e[0].passed).toFixed(1)}`;
	for (let t = 1; t < e.length; t++) s += ` H${a(e[t].at).toFixed(1)} V${o(e[t].passed).toFixed(1)}`;
	let c = e[e.length - 1], l = `${s} V35 H${a(e[0].at).toFixed(1)} Z`;
	return /* @__PURE__ */ p("svg", {
		className: "kt-spark",
		viewBox: "0 0 300 40",
		role: "img",
		"aria-label": `Passed over time: ${e.map((e) => e.passed).join(" → ")}`,
		children: [
			/* @__PURE__ */ f("line", {
				className: "kt-spark-total",
				x1: 0,
				x2: 300,
				y1: o(i),
				y2: o(i)
			}),
			/* @__PURE__ */ f("path", {
				className: "kt-spark-area",
				d: l
			}),
			/* @__PURE__ */ f("path", {
				className: "kt-spark-line",
				d: s
			}),
			e.map((t, n) => /* @__PURE__ */ f("circle", {
				className: t.failed ? "kt-spark-pt is-fail" : "kt-spark-pt is-pass",
				cx: a(t.at),
				cy: o(t.passed),
				r: n === e.length - 1 ? 3.4 : 2.2,
				children: /* @__PURE__ */ f("title", { children: `${t.passed}/${t.passed + t.failed}` })
			}, n)),
			/* @__PURE__ */ f("text", {
				className: "kt-spark-label",
				x: Math.min(298, a(c.at)),
				y: Math.max(9, o(c.passed) - 6),
				textAnchor: "end",
				children: c.passed
			})
		]
	});
}
//#endregion
//#region src/board/Header.tsx
var rn = {
	open: "Waiting to merge",
	merged: "Merged",
	signed: "Signed off"
};
function an({ board: e, run: t, projection: n, follow: r, startOpen: i, onSelect: a, onProjection: o, onFollow: s, onStart: c, onStop: l, onOutputs: u, onRetry: m, onFolder: h, onCleanup: g, onHide: _, onReplay: v, inApp: y = !1, onItem: b, replaying: x = !1, folderOpen: S = !1 }) {
	let C = t ? t.roles.filter((e) => e.status === "failed") : [], w = t ? T(t.status) : null, E = e?.runs ?? [];
	return /* @__PURE__ */ p("header", {
		className: "kt-top",
		children: [/* @__PURE__ */ p("div", {
			className: "kt-title",
			children: [!y && /* @__PURE__ */ f("h1", { children: "Agent R&D Team" }), t && w && /* @__PURE__ */ p(d, { children: [
				b ? /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-run-title kt-run-link",
					onClick: () => b({ run: t.id }),
					title: `Delivery detail: cycle time, where the time went, cost, quality, value stream (${t.requirement || t.title})`,
					children: t.delivery?.name || t.title
				}) : /* @__PURE__ */ f("span", {
					className: "kt-run-title",
					title: t.requirement || t.title,
					children: t.delivery?.name || t.title
				}),
				t.issue && (b ? /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-pill tone-info kt-mono kt-pill-btn",
					"data-testid": "kt-issue",
					onClick: () => b({ run: t.id }),
					title: `Issue ${t.issue.id} · ${k(t.issue.kind)} · raised by ${A(t.issue.reporter)} · Delivery detail`,
					children: t.issue.id
				}) : /* @__PURE__ */ f("span", {
					className: "kt-pill tone-info kt-mono",
					"data-testid": "kt-issue",
					title: `Issue ${t.issue.id} · ${k(t.issue.kind)} · raised by ${A(t.issue.reporter)}`,
					children: t.issue.id
				})),
				/* @__PURE__ */ p("span", {
					className: `kt-pill tone-${w.tone}${w.active ? " is-live" : ""}`,
					"data-testid": "kt-run-status",
					children: [/* @__PURE__ */ f("i", {
						"aria-hidden": "true",
						children: w.active ? "●" : t.status === "done" ? "✔" : t.status === "failed" ? "✕" : "■"
					}), w.label]
				}),
				t.imported && /* @__PURE__ */ p("span", {
					className: "kt-pill tone-info",
					title: `This run was made on "${t.imported.from}" and imported here to view and replay; the code and sessions stay on that Mac`,
					children: ["Imported · ", t.imported.from]
				}),
				!n && t.pr ? /* @__PURE__ */ p("span", {
					className: "kt-run-meta kt-mono",
					"data-testid": "kt-pr",
					title: `${t.pr.files} file${t.pr.files === 1 ? "" : "s"} · +${t.pr.added} −${t.pr.removed} · checks ${t.pr.checks}${t.pr.review ? ` · ${t.pr.review}` : ""}`,
					children: [
						"PR #",
						t.pr.number,
						" · ",
						t.pr.head,
						" → ",
						t.pr.base,
						" · ",
						rn[t.pr.state]
					]
				}) : !n && !t.imported && /* @__PURE__ */ p("span", {
					className: "kt-run-meta kt-mono",
					title: t.repo,
					children: [
						t.branch,
						" ← ",
						t.base
					]
				})
			] })]
		}), /* @__PURE__ */ p("div", {
			className: "kt-actions",
			children: [
				!n && E.length > 1 && t && /* @__PURE__ */ f("select", {
					className: "kt-select",
					"aria-label": "Select run",
					value: t.id,
					onChange: (e) => a(e.target.value),
					children: E.map((e) => /* @__PURE__ */ p("option", {
						value: e.id,
						children: [
							e.name || e.title,
							e.issue ? ` (${e.issue})` : "",
							" · ",
							e.imported ? "Imported · " : "",
							T(e.status).label,
							" · Tests ",
							e.tests.passed,
							"/",
							e.tests.total
						]
					}, e.id))
				}),
				!n && !x && t && _ && !F(t.status) && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn kt-btn-icon",
					onClick: () => _(t.id),
					title: "Remove this run from the list (the record and code stay on this Mac)",
					"aria-label": "Remove this run from the list",
					children: "🗑"
				}),
				t && v && !x && !F(t.status) && t.events.length > 0 && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					onClick: v,
					title: "Replay this run from its record: who did what and when, where work was sent back, how tests went from red to green. No agent is called and no credits are spent",
					children: "▶ Replay"
				}),
				!n && !x && e && (e.runs.length > 0 || t) && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-primary",
					"aria-expanded": i,
					onClick: c,
					children: "New requirement"
				}),
				!n && !x && t && F(t.status) && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-danger",
					onClick: l,
					children: "Stop"
				}),
				!n && !x && g && e && e.runs.length > 0 && !e.runs.some((e) => F(e.status)) && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					onClick: g,
					title: "Delete the sessions that finished runs opened in the Kiro Crew sidebar (signed-off runs keep theirs, so replay can still open them); run records and code are kept",
					children: "Clean up finished sessions"
				}),
				!n && !x && !t?.imported && m && C.length > 0 && /* @__PURE__ */ p("button", {
					type: "button",
					className: "kt-btn is-danger is-solid",
					onClick: m,
					title: `Give the failed roles another round: ${C.map((e) => e.title).join(", ")}`,
					children: [
						"↻ Retry ",
						C.length,
						" failed role",
						C.length === 1 ? "" : "s"
					]
				}),
				!n && t && !t.imported && h && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					"aria-expanded": S,
					onClick: h,
					title: "Which folder on this Mac holds the project: open it in Finder or Kiro",
					children: "📁 Folder"
				}),
				t && u && t.roles.length > 0 && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					onClick: () => u({ role: t.roles[0].key }),
					title: "See what each role delivered, step by step: documents, code, replies, what it did",
					children: "Outputs"
				}),
				t && u && !t.imported && !F(t.status) && t.base && t.tests.total > 0 && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					onClick: () => u({
						role: "run",
						tab: "site"
					}),
					title: "Run the site the team built on this machine and view it here",
					children: "Open site"
				}),
				t && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					"aria-pressed": r,
					onClick: s,
					title: "Automatically scroll to and enlarge the most active lane",
					children: "Follow"
				}),
				t && o && /* @__PURE__ */ f("button", {
					type: "button",
					className: `kt-btn${n ? " is-on" : ""}`,
					onClick: o,
					title: n ? "Exit projection (Esc)" : "Full screen, large text, actions hidden",
					children: n ? "Exit projection" : "Projection"
				})
			]
		})]
	});
}
var on = (e) => (e * 47 + 200) % 360;
function sn({ run: e, reducedMotion: t, onRole: n }) {
	return /* @__PURE__ */ p("div", {
		className: "kt-kpis",
		role: "group",
		"aria-label": "Metrics",
		children: [
			/* @__PURE__ */ f(cn, {
				tests: e.tests,
				reducedMotion: t
			}),
			ln(e) ? /* @__PURE__ */ f(un, { run: e }) : /* @__PURE__ */ f(fn, {
				run: e,
				reducedMotion: t
			}),
			/* @__PURE__ */ f(pn, {
				run: e,
				onRole: n
			}),
			/* @__PURE__ */ f(dn, { run: e }),
			/* @__PURE__ */ f(mn, {
				credits: e.credits,
				reducedMotion: t
			})
		]
	});
}
function cn({ tests: e, reducedMotion: t }) {
	let n = Math.round(vt(e.passed, 900, t)), r = yt(e.passed), i = gt(), a = e.total > 0 && e.failed === 0, o = Qt(e.cases).flatMap((e) => e.cases);
	return /* @__PURE__ */ p("div", {
		className: `kt-kpi kt-kpi-tests${a ? " is-green" : ""}`,
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-label",
				children: "Tests passed"
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-kpi-value",
				"data-testid": "kt-tests-counter",
				"aria-label": `Tests passed ${e.passed}/${e.total}`,
				children: [/* @__PURE__ */ f("span", {
					className: `kt-kpi-big${r ? " is-pop" : ""}`,
					children: n
				}, r), /* @__PURE__ */ p("span", {
					className: "kt-kpi-of",
					children: ["/", e.total]
				})]
			}),
			/* @__PURE__ */ f("div", {
				className: "kt-segs",
				"aria-hidden": "true",
				children: o.map((e) => /* @__PURE__ */ f("i", {
					className: `is-${e.status}`,
					title: e.name
				}, e.id))
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-kpi-note",
				children: [e.total ? a ? /* @__PURE__ */ f("b", {
					className: "tone-ok",
					children: "All green"
				}) : /* @__PURE__ */ p("b", {
					className: "tone-bad",
					children: [e.failed, " red"]
				}) : "No tests yet", e.at ? ` · run ${L(i - e.at)}` : ""]
			})
		]
	});
}
var ln = (e) => e.roles.length > 0 && e.roles.every((e) => !!e.phase);
function un({ run: e }) {
	let t = e.tests.history[0], n = e.roles.flatMap((e) => e.kinds).filter((e) => e === "fix").length, r = e.review_rounds, i = e.roles.filter((e) => e.gate === "approved").length + e.events.filter((e) => e.kind === "bounce" && e.from === "person").length;
	return /* @__PURE__ */ p("div", {
		className: "kt-kpi kt-kpi-gates",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-label",
				children: "Gate record · rounds of changes under the constraints"
			}),
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-value",
				"data-testid": "kt-gates",
				children: t ? /* @__PURE__ */ p("span", {
					className: "kt-gates-score",
					children: [
						/* @__PURE__ */ p("span", {
							className: "kt-kpi-mid",
							children: [
								t.passed,
								"/",
								t.passed + t.failed
							]
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-gates-arrow",
							children: "→"
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-kpi-big",
							children: e.tests.passed
						}),
						/* @__PURE__ */ p("span", {
							className: "kt-kpi-of",
							children: ["/", e.tests.total]
						})
					]
				}) : /* @__PURE__ */ f("span", {
					className: "kt-kpi-mid",
					children: "Checks have not run yet"
				})
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-gates-rows",
				children: [
					/* @__PURE__ */ p("span", {
						className: n ? "is-hit" : "",
						children: [
							"Sent back by checks ",
							/* @__PURE__ */ f("b", { children: n }),
							"×"
						]
					}),
					/* @__PURE__ */ p("span", {
						className: r ? "is-hit" : "",
						children: [
							"Sent back by review ",
							/* @__PURE__ */ f("b", { children: r }),
							" round",
							r === 1 ? "" : "s"
						]
					}),
					/* @__PURE__ */ p("span", {
						className: i ? "is-hit" : "",
						children: [
							"Human decisions ",
							/* @__PURE__ */ f("b", { children: i }),
							"×"
						]
					})
				]
			})
		]
	});
}
function dn({ run: e }) {
	let t = new Set(e.roles.filter((e) => e.status !== "skipped").flatMap((e) => e.aidlc_agent.split(",").map((e) => e.trim()).filter(Boolean))), n = e.tests.cases.filter((e) => e.file.startsWith("tests/enterprise/")).length, r = e.tests.cases.length - n, i = e.roles.filter((e) => e.attempt > 0 && e.status !== "waiting" && e.status !== "skipped").length;
	return /* @__PURE__ */ p("div", {
		className: "kt-kpi kt-kpi-used",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-label",
				children: "What this run used"
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-used-row",
				children: [
					/* @__PURE__ */ f("b", { children: "Kiro Crew" }),
					" base · sessions ×",
					i,
					" · approvals · audit"
				]
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-used-row",
				children: [
					/* @__PURE__ */ f("b", { children: "AI-DLC" }),
					" experts ",
					ue.filter((e) => t.has(e.key)).length,
					"/14",
					t.size > ue.filter((e) => t.has(e.key)).length ? ` + custom ${t.size - ue.filter((e) => t.has(e.key)).length}` : "",
					/* @__PURE__ */ f("span", {
						className: "kt-used-dots",
						"aria-hidden": "true",
						children: ue.map((e) => /* @__PURE__ */ f("i", {
							className: t.has(e.key) ? "is-on" : "",
							title: `${e.name}${t.has(e.key) ? ": used this run" : ": not used this run"}`
						}, e.key))
					})
				]
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-used-row",
				children: [
					/* @__PURE__ */ f("b", { children: "Company standards" }),
					" ",
					e.standards.length ? `${e.standards.filter((e) => e.kind === "standard").length} apply · ` : "",
					"company checks ",
					n,
					" · written by the team ",
					r
				]
			})
		]
	});
}
function fn({ run: e, reducedMotion: t }) {
	let n = _t(), r = e.wall_s + (F(e.status) ? n : 0), { saved_s: i, speedup: a } = z({
		wall_s: r,
		serial_s: e.serial_s
	}), o = Math.round(vt(i / 60, 900, t)), s = Math.max(r, e.serial_s, 1), c = e.roles.filter((e) => e.active_s > 0), l = c.reduce((e, t) => e + t.active_s, 0) || 1;
	return /* @__PURE__ */ p("div", {
		className: "kt-kpi kt-kpi-par",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-label",
				children: "Time saved by parallel work · wall clock against one agent doing it all"
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-kpi-value",
				"data-testid": "kt-saving",
				children: [i >= 60 ? /* @__PURE__ */ p("span", {
					className: "kt-saving",
					children: [
						"Parallel work saved ",
						/* @__PURE__ */ f("span", {
							className: "kt-kpi-big",
							children: o
						}),
						" min"
					]
				}) : /* @__PURE__ */ f("span", {
					className: "kt-kpi-mid",
					children: "No time saved yet"
				}), a !== null && a > 1.05 && /* @__PURE__ */ p("span", {
					className: "kt-speedup",
					title: "Serial estimate ÷ wall clock",
					children: ["×", a.toFixed(1)]
				})]
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-bars",
				children: [/* @__PURE__ */ p("div", {
					className: "kt-bar-row",
					children: [
						/* @__PURE__ */ f("span", {
							className: "kt-bar-name",
							children: "Wall clock"
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-bar",
							title: `Actual time ${I(r)}`,
							children: /* @__PURE__ */ f("i", {
								className: "kt-bar-wall",
								style: { width: `${r / s * 100}%` }
							})
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-bar-val kt-mono",
							children: I(r)
						})
					]
				}), /* @__PURE__ */ p("div", {
					className: "kt-bar-row",
					children: [
						/* @__PURE__ */ f("span", {
							className: "kt-bar-name",
							children: "Serial estimate"
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-bar is-segs",
							title: `Each role's own working time added up: ${I(e.serial_s)} (${ee(e.serial_s)})`,
							children: c.map((t, n) => /* @__PURE__ */ f("i", {
								className: "kt-bar-seg",
								style: {
									width: `${t.active_s / l * (e.serial_s / s) * 100}%`,
									"--h": on(n)
								},
								title: `${t.title} ${I(t.active_s)}`
							}, t.key))
						}),
						/* @__PURE__ */ f("span", {
							className: "kt-bar-val kt-mono",
							children: I(e.serial_s)
						})
					]
				})]
			})
		]
	});
}
function pn({ run: e, onRole: t }) {
	let n = e.roles.filter((e) => P.has(e.status)).length, r = e.roles.filter((e) => N.has(e.status)).length, i = e.roles.filter((e) => M.has(e.status) && !N.has(e.status)).length, a = e.roles.filter((e) => e.status === "done" && e.writable.length > 0).length;
	return /* @__PURE__ */ p("div", {
		className: "kt-kpi kt-kpi-roles",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-label",
				children: "Roles done"
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-kpi-value",
				"data-testid": "kt-roles-counter",
				children: [/* @__PURE__ */ f("span", {
					className: "kt-kpi-big",
					children: n
				}), /* @__PURE__ */ p("span", {
					className: "kt-kpi-of",
					children: ["/", e.roles.length]
				})]
			}),
			/* @__PURE__ */ f("div", {
				className: "kt-role-dots",
				children: e.roles.map((e) => /* @__PURE__ */ f("button", {
					type: "button",
					className: `kt-role-dot tone-${C(e).tone}${N.has(e.status) ? " is-working" : ""}`,
					title: `${e.title}: ${C(e).label} (click to show only it)`,
					"aria-label": `${e.title}: ${C(e).label}`,
					onClick: () => t?.(e.key),
					children: /* @__PURE__ */ f(Z, {
						role: e.icon || e.key,
						size: 16
					})
				}, e.key))
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-kpi-note",
				children: [
					r ? /* @__PURE__ */ p("b", {
						className: "tone-run",
						children: ["Running now ", r]
					}) : "None running",
					i ? /* @__PURE__ */ p("b", {
						className: "tone-warn",
						children: [
							" · ",
							i,
							" stalled or waiting for you"
						]
					}) : null,
					a ? ` · ${a} waiting to merge` : ""
				]
			})
		]
	});
}
function mn({ credits: e, reducedMotion: t }) {
	let n = vt(e ?? 0, 900, t);
	return /* @__PURE__ */ p("div", {
		className: "kt-kpi kt-kpi-credits",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-label",
				children: "credits"
			}),
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-value",
				children: /* @__PURE__ */ f("span", {
					className: "kt-kpi-big",
					children: e === null ? "—" : R(n)
				})
			}),
			/* @__PURE__ */ f("div", {
				className: "kt-kpi-note",
				children: e === null ? "KiroCrew has not reported yet" : "Total for the whole run"
			})
		]
	});
}
function hn(e) {
	return e.rate == null ? e.name : `${e.name} · ${e.rate}x credits`;
}
var gn = [{
	label: "Black Friday · storewide sale",
	hint: "Larkspur Outfitters online store: starts from the campaign template, a person approves going live",
	text: "Black Friday sale: discount 20 products with spend-and-save offers, show a countdown, the reference price and the final price on the campaign page, and let operations configure it in the back office and go live with one click."
}], _n = [
	{
		value: "auto",
		label: "Pick the team from the requirement automatically (recommended)"
	},
	{
		value: "team-promo.json",
		label: "Larkspur Outfitters · Black Friday sale"
	},
	{
		value: "team-aidlc.json",
		label: "AI-DLC expert team (13 roles, any new requirement)"
	},
	{
		value: "team-bugfix.json",
		label: "Bug fix · two-person squad (project directory required)"
	}
];
function vn({ pick: e }) {
	if (!e?.team) return /* @__PURE__ */ f("p", {
		className: "kt-pick is-empty",
		"data-testid": "kt-pick",
		children: "The orchestrator is picking a team from the keywords in the requirement…"
	});
	let t = e.team, n = new Set(t.agents.flatMap((e) => e.split(",").map((e) => e.trim()))), r = pe(t.roles), i = t.roles.filter((e) => e.on_crew === !1), a = e.knowledge, o = j.map((e) => ({
		...e,
		roles: t.roles.filter((t) => t.phase === e.key)
	})).filter((e) => e.roles.length);
	return /* @__PURE__ */ p("section", {
		className: "kt-pick",
		"aria-label": "Team selection preview",
		"data-testid": "kt-pick",
		children: [
			/* @__PURE__ */ p("p", {
				className: "kt-pick-team",
				title: e.matched.length ? `Based on "${e.matched.join("\", \"")}" in the requirement` : "No particular clues; using the default flow",
				children: [
					/* @__PURE__ */ f("b", { children: t.name }),
					" · ",
					t.people?.length ? `${t.roles.length} of ${t.people.length} members picked` : `${t.roles.length} member${t.roles.length === 1 ? "" : "s"}`,
					" · ",
					e.why
				]
			}),
			/* @__PURE__ */ f("ol", {
				className: "kt-pick-phases",
				"aria-label": "By AI-DLC phase",
				children: o.map((e) => /* @__PURE__ */ p("li", { children: [/* @__PURE__ */ p("span", {
					className: "kt-pick-phase",
					children: [
						e.n,
						" ",
						e.title
					]
				}), e.roles.map((e) => /* @__PURE__ */ p("span", {
					className: `kt-pick-role${e.on_crew === !1 ? " is-absent" : ""}`,
					title: `${e.stage}${e.member ? ` · Crew member ${e.member}` : ""}`,
					children: [/* @__PURE__ */ f(Z, {
						role: e.icon || e.key,
						size: 16
					}), /* @__PURE__ */ p("span", { children: [
						e.title,
						" agent",
						e.gate ? /* @__PURE__ */ f("em", { children: " · human approval" }) : null,
						e.assignment && /* @__PURE__ */ f("small", { children: e.assignment })
					] })]
				}, e.key))] }, e.key))
			}),
			t.official_stages ? /* @__PURE__ */ p("p", {
				className: "kt-dim",
				children: [
					"Covers ",
					t.stages.length,
					" stage",
					t.stages.length === 1 ? "" : "s",
					" of the AI-DLC ",
					t.scope,
					" flow: ",
					t.stages.join(", "),
					t.extra_stages.length > 0 && `; plus ${t.extra_stages.join(", ")} (${t.extra_note})`
				]
			}) : null,
			/* @__PURE__ */ f("div", {
				className: "kt-pick-roster",
				"aria-label": "The 14 official AI-DLC experts and the company's own",
				children: r.map((e) => /* @__PURE__ */ f("span", {
					className: `kt-pick-agent${n.has(e.key) ? " is-used" : ""}${e.custom ? " is-custom" : ""}`,
					title: n.has(e.key) ? "Will be called this run" : "Will not be called this run",
					children: e.name
				}, e.key))
			}),
			i.some((e) => e.optional) && /* @__PURE__ */ f("p", {
				className: "kt-warn",
				"data-testid": "kt-pick-unhired",
				children: /* @__PURE__ */ p("span", {
					title: "Optional role: if this member is not under Crew Agents when the run is handed to the team, it stays out of this run and its part is left as the template has it",
					children: [
						i.filter((e) => e.optional).map((e) => e.title).join(", "),
						" not on Crew, so not in this run (add ",
						i.filter((e) => e.optional).map((e) => e.member).join(", "),
						" under Crew Agents, then hand the requirement to the team to include it)"
					]
				})
			}),
			i.some((e) => !e.optional) && /* @__PURE__ */ f("p", {
				className: "kt-warn",
				children: /* @__PURE__ */ p("span", {
					title: "If it is not added, the run stops and waits when its turn comes; once added it starts automatically",
					children: [
						i.filter((e) => !e.optional).map((e) => e.title).join(", "),
						" not on the team yet (add ",
						i.filter((e) => !e.optional).map((e) => e.member).join(", "),
						" under Crew Agents; if not added, the run stops and waits when its turn comes)"
					]
				})
			}),
			e.standards && e.standards.length > 0 && /* @__PURE__ */ p("div", {
				className: "kt-pick-std",
				"aria-label": "Applicable company standards",
				children: [/* @__PURE__ */ f("b", { children: "Applicable standards:" }), e.standards.map((e) => /* @__PURE__ */ p("span", {
					className: `kt-pick-agent is-used is-${e.kind}`,
					title: `${e.owner ? `${e.owner} · ` : ""}${e.why}`,
					children: [e.kind === "data" ? "Data: " : "", e.title]
				}, e.id))]
			}),
			a && /* @__PURE__ */ p("p", {
				className: a.present === !1 ? "kt-warn" : "kt-dim",
				children: [
					"Knowledge base \"",
					a.name,
					"\": ",
					a.present === !1 ? `not attached yet; add ${a.path || "knowledge/larkspur"} in the Crew sidebar under Knowledge base > Sources` : a.present === null ? "Reading" : `${a.items ?? 0} document${a.items === 1 ? "" : "s"}${a.status === "synced" ? " · synced" : " · indexing"}`
				]
			}),
			t.source && /* @__PURE__ */ p("p", {
				className: "kt-dim",
				children: ["Code repository: ", t.source]
			}),
			t.needs_source && !t.source && /* @__PURE__ */ f("p", {
				className: "kt-warn",
				children: "This team works on an existing project: enter the project's code directory below."
			})
		]
	});
}
var yn = 5e3;
function bn({ onStart: e, onCancel: t, preview: n, models: i, refreshMs: a = yn }) {
	let [s, c] = o(gn[0].text), [l, u] = o(""), [d, m] = o("auto"), [h, g] = o(""), [_, v] = o([]);
	r(() => {
		if (!i) return;
		let e = !0;
		return i().then((t) => e && v(t)).catch(() => e && v([])), () => {
			e = !1;
		};
	}, [i]);
	let [y, b] = o(null), [x, S] = o(!1), [C, w] = o(""), [T, E] = o(0);
	return r(() => {
		if (!n || d !== "auto") return;
		let e = setInterval(() => E((e) => e + 1), a);
		return () => clearInterval(e);
	}, [
		n,
		d,
		a
	]), r(() => {
		if (!n || d !== "auto") return;
		let e = !0, t = setTimeout(() => {
			n(s).then((t) => e && b(t)).catch(() => e && b(null));
		}, 250);
		return () => {
			e = !1, clearTimeout(t);
		};
	}, [
		n,
		d,
		s,
		T
	]), /* @__PURE__ */ p("form", {
		className: "kt-start",
		onSubmit: async (t) => {
			if (t.preventDefault(), !x) {
				S(!0), w("");
				try {
					let t = l.trim(), n = d === "team.json" ? void 0 : d;
					await e(s.trim(), {
						...t ? { source: t } : {},
						...n ? { team: n } : {},
						...h ? { model: h } : {}
					});
				} catch (e) {
					w(jt(e));
				} finally {
					S(!1);
				}
			}
		},
		"aria-label": "Give a requirement to the agent team",
		children: [
			/* @__PURE__ */ f("div", {
				className: "kt-scenarios",
				role: "group",
				"aria-label": "Example requirements",
				children: gn.map((e) => /* @__PURE__ */ p("button", {
					type: "button",
					className: `kt-scenario${s === e.text ? " is-on" : ""}`,
					onClick: () => c(e.text),
					title: e.hint,
					children: [/* @__PURE__ */ f("b", { children: e.label }), /* @__PURE__ */ f("small", { children: e.hint })]
				}, e.label))
			}),
			/* @__PURE__ */ f("label", {
				htmlFor: "kt-req",
				children: "Requirement for the agent team"
			}),
			/* @__PURE__ */ f("p", {
				className: "kt-dim kt-req-hint",
				children: "One sentence is enough: the orchestrator picks a team from it, the team first turns it into a scope, acceptance criteria and a work split, and nothing goes further until you approve at the gate."
			}),
			/* @__PURE__ */ f("textarea", {
				id: "kt-req",
				value: s,
				rows: 3,
				onChange: (e) => c(e.target.value),
				placeholder: gn[0].text
			}),
			n && d === "auto" && /* @__PURE__ */ f(vn, { pick: y }),
			_.length > 0 && /* @__PURE__ */ p("label", {
				className: "kt-start-field kt-start-model",
				children: [
					/* @__PURE__ */ f("span", { children: "Model (used by every role in this run)" }),
					/* @__PURE__ */ p("select", {
						value: h,
						onChange: (e) => g(e.target.value),
						title: _.find((e) => e.id === h)?.description || "The model set in the team file",
						children: [/* @__PURE__ */ f("option", {
							value: "",
							children: "Team default"
						}), _.map((e) => /* @__PURE__ */ f("option", {
							value: e.id,
							title: e.description,
							children: hn(e)
						}, e.id))]
					}),
					h && _.find((e) => e.id === h)?.description && /* @__PURE__ */ f("small", {
						className: "kt-dim",
						children: _.find((e) => e.id === h)?.description
					})
				]
			}),
			/* @__PURE__ */ p("details", {
				className: "kt-start-more",
				open: d !== "auto" || !!l,
				children: [/* @__PURE__ */ f("summary", { children: "Advanced options" }), /* @__PURE__ */ p("div", {
					className: "kt-start-row",
					children: [/* @__PURE__ */ p("label", {
						className: "kt-start-field",
						children: [/* @__PURE__ */ f("span", { children: "Code directory of an existing project (for bug fixes or taking over an existing product; leave empty for a new project)" }), /* @__PURE__ */ f("input", {
							type: "text",
							value: l,
							onChange: (e) => u(e.target.value),
							placeholder: "Absolute path of the directory, for example /Users/you/workplace/agent-rd-team/runs/r1009abcd/wt/_run"
						})]
					}), /* @__PURE__ */ p("label", {
						className: "kt-start-field is-narrow",
						children: [/* @__PURE__ */ f("span", { children: "Team" }), /* @__PURE__ */ f("select", {
							value: d,
							onChange: (e) => m(e.target.value),
							children: _n.filter((e) => n || e.value !== "auto").map((e) => /* @__PURE__ */ f("option", {
								value: e.value,
								children: e.label
							}, e.value))
						})]
					})]
				})]
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-start-actions",
				children: [
					/* @__PURE__ */ f("button", {
						type: "submit",
						className: "kt-btn is-primary",
						disabled: x,
						children: x ? "Handing to the team…" : "Hand to the team"
					}),
					t && /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn",
						onClick: t,
						children: "Cancel"
					}),
					/* @__PURE__ */ f("span", {
						className: "kt-dim",
						children: "Moves through the AI-DLC phases: you approve the requirement and the work split, and delivery passes company checks and an independent review first"
					})
				]
			}),
			C && /* @__PURE__ */ f("p", {
				className: "kt-error",
				role: "alert",
				children: C
			})
		]
	});
}
function xn({ run: e, onConfirm: t, onCancel: n }) {
	let [r, i] = o(!1), [a, s] = o(""), c = e.roles.filter((e) => M.has(e.status) || e.status === "queued").length;
	return /* @__PURE__ */ p("div", {
		className: "kt-confirm",
		role: "alertdialog",
		"aria-labelledby": "kt-stop-title",
		"aria-describedby": "kt-stop-desc",
		children: [
			/* @__PURE__ */ p("strong", {
				id: "kt-stop-title",
				children: [
					"Stop \"",
					e.title,
					"\"?"
				]
			}),
			/* @__PURE__ */ f("span", {
				id: "kt-stop-desc",
				children: c ? `The ${c} running and queued agent${c === 1 ? "" : "s"} will be stopped, and roles that have not started will not be dispatched.` : "Roles that have not started will not be dispatched."
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-confirm-actions",
				children: [/* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-danger is-solid",
					onClick: async () => {
						i(!0), s("");
						try {
							await t();
						} catch (e) {
							s(jt(e)), i(!1);
						}
					},
					disabled: r,
					children: r ? "Stopping…" : "Confirm stop"
				}), /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					onClick: n,
					autoFocus: !0,
					children: "Cancel"
				})]
			}),
			a && /* @__PURE__ */ f("p", {
				className: "kt-error",
				role: "alert",
				children: a
			})
		]
	});
}
var Sn = [
	"New app",
	"New feature",
	"Fix"
], Cn = [
	"Small",
	"Medium",
	"Large"
], wn = [
	"E-commerce",
	"Mobile app",
	"CRM",
	"Supply chain",
	"Internal systems"
];
function Tn({ label: e, who: t = "", decision: n, preset: r, presetRisk: i, split: a, skips: s, report: c, onReport: l, overrule: u = !1, delivery: d, questions: h = [], talk: g = [], outputs: _ = [], onConfirm: v, onCancel: y }) {
	let [b, x] = o(""), [S, C] = o({
		what: "",
		k: ""
	}), [w, T] = o(d ? {
		name: d.name,
		kind: d.kind,
		size: d.size,
		line: d.line
	} : null), [E, D] = o(() => Object.fromEntries(h.map((e) => [e.id, e.multi ? {
		choice: "",
		text: "",
		choices: []
	} : {
		choice: e.recommend || e.options[0]?.key || "",
		text: ""
	}]))), [O, k] = o(!1), [j, M] = o(""), N = n === "approve", P = n === "discuss", F = N && h.length > 0, I = !N && !P, ee = () => {
		let e = S.what.trim(), t = Number(S.k);
		return I && (e || t > 0) ? {
			what: e,
			amount: t > 0 ? Math.round(t * 1e3) : null
		} : void 0;
	}, L = (e, t) => D((n) => ({
		...n,
		[e]: {
			...n[e],
			...t
		}
	})), R = (e, t) => D((n) => {
		let r = n[e]?.choices ?? [];
		return {
			...n,
			[e]: {
				...n[e],
				choice: "",
				text: "",
				choices: r.includes(t) ? r.filter((e) => e !== t) : [...r, t]
			}
		};
	}), z = async () => {
		if (u && N && !b.trim()) {
			M("The review still says changes are needed: overruling it requires a reason");
			return;
		}
		if (P && !b.trim()) {
			M("Write what you want to ask or discuss");
			return;
		}
		if (!N && !P && !u && !b.trim()) {
			M("Say what to change when sending back");
			return;
		}
		let e = F ? h.find((e) => !e.multi && E[e.id]?.choice === "other" && !E[e.id].text.trim()) : void 0;
		if (e) M(`Decision ${e.id} is set to "Other": write your decision`);
		else {
			k(!0), M("");
			try {
				let e = ee();
				await (F ? v(b.trim(), w ?? void 0, E) : N && w ? v(b.trim(), w) : e ? v(b.trim(), void 0, void 0, e) : v(b.trim()));
			} catch (e) {
				M(jt(e)), k(!1);
			}
		}
	}, B = P ? `Discuss ${e}` : u ? N ? `Approve ${e} anyway` : `Send back ${e} for another round` : N ? `Approve ${e}` : `Send back ${e}`, te = P ? `Write what you want to ask or discuss. ${t || "It"} will answer and, if needed, change its own documents; the gate stays open, so approve or send back when you are done.` : u ? N ? "The review still says changes are needed and the send-back rounds are used up. Approving means you overrule the review and let it through: give a reason, it goes on the sign-off sheet, then it deploys." : "One more round as the review says: if you do not say who to send it back to, the members the review names get it; your comments go to them too, and yours win if they conflict with the review. The review looks again after the changes, then it comes back here." : c === void 0 ? N ? F ? "After approval, the orchestrator starts the next phase with this work split. Pick an answer for each item below (the default is its recommendation); your decisions and comments go to every agent after it." : "After approval, the orchestrator starts the next phase with this work split. You can write comments here and they go to every agent after it (optional)." : "Write what to change; it rewrites according to your comments and hands it back for your approval." : N ? "It deploys after approval. Your comment goes on the sign-off sheet." : "Say who to send it back to and what to change (for example \"Send back: Frontend #2\"). The review looks again after the changes, then it comes back here.";
	return /* @__PURE__ */ p("div", {
		className: `kt-confirm kt-gate-dialog${N ? " is-approve" : ""}${P ? " is-discuss" : ""}`,
		role: "dialog",
		"aria-labelledby": "kt-gate-title",
		"data-testid": "kt-gate-dialog",
		children: [
			/* @__PURE__ */ f("strong", {
				id: "kt-gate-title",
				children: B
			}),
			/* @__PURE__ */ f("span", { children: te }),
			_.length > 0 && /* @__PURE__ */ p("p", {
				className: "kt-gate-docs",
				"data-testid": "kt-gate-docs",
				children: [/* @__PURE__ */ f("span", {
					className: "kt-dim",
					children: "Output of this phase:"
				}), _.map((e) => /* @__PURE__ */ p("button", {
					type: "button",
					className: "kt-chip-link",
					onClick: e.onOpen,
					children: [
						/* @__PURE__ */ f(Z, {
							role: e.icon || e.key,
							size: 13
						}),
						" ",
						e.title,
						" ↗"
					]
				}, e.key))]
			}),
			F && /* @__PURE__ */ f("div", {
				className: "kt-gate-questions",
				"data-testid": "kt-gate-questions",
				children: h.map((e) => {
					let t = E[e.id] ?? {
						choice: "",
						text: ""
					}, n = !!e.recommend && t.choice !== e.recommend;
					if (e.multi) {
						let n = t.choices ?? [];
						return /* @__PURE__ */ p("fieldset", {
							className: "kt-gate-q",
							"aria-label": `Decision ${e.id}`,
							children: [
								/* @__PURE__ */ p("legend", { children: [
									/* @__PURE__ */ p("b", { children: ["Decision ", e.id] }),
									" ",
									e.q
								] }),
								e.options.map((t) => /* @__PURE__ */ p("label", {
									className: n.includes(t.key) ? "is-picked" : void 0,
									children: [/* @__PURE__ */ f("input", {
										type: "checkbox",
										name: `q-${e.id}`,
										checked: n.includes(t.key),
										onChange: () => R(e.id, t.key)
									}), /* @__PURE__ */ p("span", { children: [
										t.key,
										". ",
										t.text
									] })]
								}, t.key)),
								/* @__PURE__ */ p("span", {
									className: "kt-dim",
									children: [n.length ? `${n.length} selected` : "Nothing is recorded if none is ticked", e.why && `; ${e.why}`]
								})
							]
						}, e.id);
					}
					return /* @__PURE__ */ p("fieldset", {
						className: "kt-gate-q",
						"aria-label": `Decision ${e.id}`,
						children: [
							/* @__PURE__ */ p("legend", { children: [
								/* @__PURE__ */ p("b", { children: ["Decision ", e.id] }),
								" ",
								e.q
							] }),
							e.options.map((n) => /* @__PURE__ */ p("label", {
								className: t.choice === n.key ? "is-picked" : void 0,
								children: [/* @__PURE__ */ f("input", {
									type: "radio",
									name: `q-${e.id}`,
									checked: t.choice === n.key,
									onChange: () => L(e.id, { choice: n.key })
								}), /* @__PURE__ */ p("span", { children: [
									n.key,
									". ",
									n.text,
									n.key === e.recommend && /* @__PURE__ */ f("em", {
										className: "kt-gate-rec",
										children: "Recommended"
									})
								] })]
							}, n.key)),
							/* @__PURE__ */ p("label", {
								className: t.choice === "other" ? "is-picked" : void 0,
								children: [
									/* @__PURE__ */ f("input", {
										type: "radio",
										name: `q-${e.id}`,
										checked: t.choice === "other",
										onChange: () => L(e.id, { choice: "other" })
									}),
									/* @__PURE__ */ f("span", { children: "Other" }),
									t.choice === "other" && /* @__PURE__ */ f("input", {
										className: "kt-gate-other",
										"aria-label": `Decision ${e.id}: other answer`,
										value: t.text,
										maxLength: 300,
										onChange: (t) => L(e.id, { text: t.target.value }),
										placeholder: "Write your decision"
									})
								]
							}),
							(e.why || n) && /* @__PURE__ */ p("span", {
								className: "kt-dim",
								children: [e.why && `Reason for the recommendation: ${e.why}`, n && /* @__PURE__ */ p("b", {
									className: "kt-gate-differs",
									children: [
										e.why ? "; " : "",
										"Differs from the recommendation (",
										e.recommend,
										")"
									]
								})]
							})
						]
					}, e.id);
				})
			}),
			g.length > 0 && /* @__PURE__ */ f("ol", {
				className: "kt-gate-talk",
				"aria-label": "Discussion log",
				"data-testid": "kt-gate-talk",
				children: g.map((e, n) => /* @__PURE__ */ p("li", {
					className: e.who === "person" ? "is-person" : "is-agent",
					children: [/* @__PURE__ */ f("b", { children: e.who === "person" ? "You" : t || "It" }), /* @__PURE__ */ p("div", {
						className: "kt-gate-talk-text",
						children: [e.who === "agent" ? /* @__PURE__ */ f(m, { content: e.text }) : e.text, e.changed ? /* @__PURE__ */ f("em", {
							className: "kt-dim",
							children: "(changed the document)"
						}) : null]
					})]
				}, n))
			}),
			c !== void 0 && !P && /* @__PURE__ */ p("div", {
				className: "kt-gate-report",
				children: [
					/* @__PURE__ */ f("b", { children: u ? "The review still says changes are needed: " : "Review verdict: " }),
					c || "(no verdict)",
					l && /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn",
						onClick: l,
						children: "View the full review report"
					})
				]
			}),
			a && a.length > 0 && !P && /* @__PURE__ */ f("ul", {
				className: "kt-gate-split",
				"aria-label": "Work split proposal",
				children: a.map((e) => /* @__PURE__ */ p("li", { children: [
					/* @__PURE__ */ f(Z, {
						role: e.icon || e.key,
						size: 14
					}),
					" ",
					/* @__PURE__ */ f("b", { children: e.title }),
					" ",
					e.assignment
				] }, e.key))
			}),
			s && s.length > 0 && !P && /* @__PURE__ */ p("ul", {
				className: "kt-gate-split is-out",
				"aria-label": "Members left out of this run",
				"data-testid": "kt-gate-skips",
				children: [s.map((e) => /* @__PURE__ */ p("li", { children: [
					/* @__PURE__ */ f(Z, {
						role: e.key,
						size: 14
					}),
					" ",
					/* @__PURE__ */ f("b", { children: e.title }),
					" left out this time: ",
					e.why
				] }, e.key)), /* @__PURE__ */ f("li", {
					className: "kt-dim",
					children: "After approval they sit this run out and the checks that belong to them do not run; to keep them, send back and say who."
				})]
			}),
			N && w && d && /* @__PURE__ */ p("fieldset", {
				className: "kt-gate-delivery",
				"data-testid": "kt-gate-delivery",
				children: [
					/* @__PURE__ */ p("legend", {
						title: "After sign-off these tags count on the CTO view",
						children: ["Delivery tag", d.why ? ` (proposed: ${d.why})` : ""]
					}),
					/* @__PURE__ */ f("input", {
						"aria-label": "Delivery name",
						value: w.name,
						maxLength: 20,
						onChange: (e) => T({
							...w,
							name: e.target.value
						})
					}),
					/* @__PURE__ */ f("select", {
						"aria-label": "Type",
						value: w.kind,
						onChange: (e) => T({
							...w,
							kind: e.target.value
						}),
						children: Sn.map((e) => /* @__PURE__ */ f("option", {
							value: e,
							children: A(e)
						}, e))
					}),
					/* @__PURE__ */ f("select", {
						"aria-label": "Size",
						value: w.size,
						onChange: (e) => T({
							...w,
							size: e.target.value
						}),
						children: Cn.map((e) => /* @__PURE__ */ f("option", {
							value: e,
							children: A(e)
						}, e))
					}),
					/* @__PURE__ */ f("select", {
						"aria-label": "Business line",
						value: w.line,
						onChange: (e) => T({
							...w,
							line: e.target.value
						}),
						children: wn.map((e) => /* @__PURE__ */ f("option", {
							value: e,
							children: A(e)
						}, e))
					})
				]
			}),
			I && /* @__PURE__ */ p("fieldset", {
				className: "kt-gate-delivery kt-gate-risk",
				"data-testid": "kt-gate-risk",
				children: [
					/* @__PURE__ */ f("legend", {
						title: "Counts toward 'More stable' on the CTO view and the sign-off sheet",
						children: "Risk stopped (optional)"
					}),
					/* @__PURE__ */ f("input", {
						"aria-label": "Risk stopped",
						className: "kt-gate-what",
						value: S.what,
						maxLength: 60,
						onChange: (e) => C({
							...S,
							what: e.target.value
						}),
						placeholder: "For example: price-adjustment refunds above the approval limit"
					}),
					/* @__PURE__ */ p("label", { children: [
						"Amount ",
						/* @__PURE__ */ f("input", {
							"aria-label": "Amount (USD thousands)",
							className: "kt-gate-amount",
							type: "number",
							min: 0,
							step: .1,
							value: S.k,
							onChange: (e) => C({
								...S,
								k: e.target.value
							}),
							placeholder: "Optional"
						}),
						" × 1,000 USD"
					] })
				]
			}),
			/* @__PURE__ */ f("textarea", {
				className: "kt-gate-note",
				rows: 3,
				value: b,
				onChange: (e) => x(e.target.value),
				placeholder: P ? "For example: why is B recommended for question 2? What changes if it becomes A?" : u && N ? "For example: I accept the risk; $39,000 is reserved for price-adjustment refunds, and finance reviews after the campaign" : N ? "For example: add one business rule" : "For example: an acceptance criterion is missing",
				autoFocus: !0,
				"aria-label": P ? "Discussion" : "Comment"
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-confirm-actions",
				children: [
					r && b !== r && !P && /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn",
						onClick: () => {
							x(r), I && i && C({
								what: i.what,
								k: i.amount == null ? "" : String(i.amount / 1e3)
							});
						},
						title: r,
						children: "Fill in the preset comment"
					}),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: `kt-btn is-solid${N || P ? " is-primary" : " is-danger"}`,
						onClick: z,
						disabled: O,
						children: O ? "Submitting…" : P ? "Send" : u && N ? "Confirm overrule and approve" : N ? "Confirm approval" : "Confirm send back"
					}),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn",
						onClick: y,
						children: "Cancel"
					})
				]
			}),
			j && /* @__PURE__ */ f("p", {
				className: "kt-error",
				role: "alert",
				children: j
			})
		]
	});
}
var En = [
	{
		phase: "1 Ideation",
		title: "One-line requirement → scope list",
		roles: [[{
			key: "intent",
			title: "Intent",
			does: "Who it is for, why, what counts as success"
		}, {
			key: "feasibility",
			title: "Constraints",
			does: "Checked against company standards and store requirements"
		}], [{
			key: "scope",
			title: "Scope",
			does: "Handed to a person for approval"
		}]]
	},
	{
		phase: "2 Inception",
		title: "Read the system, set interfaces, split the work, hand to a person for approval",
		roles: [
			[{
				key: "architect",
				title: "Architect",
				does: "Reverse engineering, interfaces, who changes what"
			}],
			[{
				key: "designer",
				title: "UI design",
				does: "Follows the existing style"
			}],
			[{
				key: "pm",
				title: "Requirements",
				does: "Acceptance criteria, summarised and handed to a person for approval"
			}]
		]
	},
	{
		phase: "3 Construction",
		title: "Write the checks first, then the code",
		roles: [[{
			key: "compliance",
			title: "Compliance & security",
			does: "Standards → checks, red first"
		}, {
			key: "tester",
			title: "Testing",
			does: "Guardrail: do not break existing behaviour"
		}], [
			{
				key: "backend",
				title: "Backend",
				does: ""
			},
			{
				key: "frontend",
				title: "Web",
				does: ""
			},
			{
				key: "mobile",
				title: "Android",
				does: ""
			},
			{
				key: "ops",
				title: "Operations",
				does: ""
			}
		]]
	},
	{
		phase: "✓ Review gate",
		title: "Independent and read only; sends back if changes are needed",
		roles: [[{
			key: "reviewer",
			title: "Review",
			does: "Sends back at most two rounds, then hands to a person"
		}]]
	}
];
function Dn({ onStart: e, preview: t, models: n }) {
	return /* @__PURE__ */ p("section", {
		className: "kt-empty",
		"data-testid": "kt-empty",
		"aria-label": "No runs yet",
		children: [
			/* @__PURE__ */ p("div", {
				className: "kt-empty-hero",
				children: [
					/* @__PURE__ */ f("h2", { children: "Building keeps getting cheaper; good products are still scarce" }),
					/* @__PURE__ */ f("p", { children: "AI can turn a good idea into something demonstrable in a few days; the hard part is getting it into use across a whole company, listed in a store, and within the company's own standards. This agent team starts from a one-line requirement and follows the AWS AI-DLC flow: Ideation, Inception, Construction, Review gate. The orchestrator first picks the team from the keywords in the requirement (the same rule AI-DLC uses to pick a scope). Each role is a domain expert defined by AI-DLC, runs on Kiro Crew as its own session or sub-agent, and carries only the context it needs. The orchestrator is a deterministic program: it schedules, dispatches, merges, runs checks and sends work back according to the team configuration, and does not rely on the model to behave. A person approves the scope, machines judge the checks, and an independent review releases the delivery." }),
					/* @__PURE__ */ f("p", {
						className: "kt-empty-punch",
						children: "A good product is not generated in one go; it is accepted gate by gate."
					})
				]
			}),
			/* @__PURE__ */ f("ol", {
				className: "kt-team-intro is-phased",
				"aria-label": "Team, by AI-DLC phase from left to right",
				children: En.map((e) => /* @__PURE__ */ p("li", {
					className: "kt-intro-phase",
					children: [/* @__PURE__ */ p("div", {
						className: "kt-intro-phase-head",
						children: [/* @__PURE__ */ f("b", { children: e.phase }), /* @__PURE__ */ f("span", { children: e.title })]
					}), /* @__PURE__ */ f("div", {
						className: "kt-intro-phase-body",
						children: e.roles.map((e, t) => /* @__PURE__ */ p("div", {
							className: "kt-intro-stage",
							children: [e.length > 1 && /* @__PURE__ */ p("span", {
								className: "kt-intro-par",
								children: ["Parallel ×", e.length]
							}), e.map((e) => /* @__PURE__ */ p("div", {
								className: "kt-intro-role",
								children: [
									/* @__PURE__ */ f(Z, {
										role: e.key,
										size: 26,
										className: "kt-intro-emoji"
									}),
									/* @__PURE__ */ p("span", {
										className: "kt-intro-name",
										children: [/* @__PURE__ */ f("b", { children: e.title }), /* @__PURE__ */ f("small", {
											className: "kt-intro-agent",
											children: "agent"
										})]
									}),
									/* @__PURE__ */ f("span", {
										className: "kt-intro-does",
										children: e.does
									})
								]
							}, e.key))]
						}, t))
					})]
				}, e.phase))
			}),
			/* @__PURE__ */ f(bn, {
				onStart: e,
				preview: t,
				models: n
			})
		]
	});
}
var On = {
	busy: {
		label: "Working",
		hint: "Its agent is working"
	},
	used: {
		label: "Called",
		hint: "The orchestrator has already given it work"
	},
	team: {
		label: "Standing by",
		hint: "This team has tasks for it; its turn has not come yet"
	},
	none: {
		label: "Not involved",
		hint: "This team has no task for it, so it will not be activated this run"
	},
	absent: {
		label: "Not on Crew",
		hint: "This team needs it, but this member is not under Crew Agents yet: add it from the template on the Agents page (until then the template of the same name stands in)"
	}
};
function kn({ run: e }) {
	let { team: t, used: n, busy: r } = me(e.roles), i = pe(e.roles), a = i.filter((e) => e.custom).length, o = e.crew_members ? new Set(e.crew_members) : null, s = (t) => e.roles.filter((e) => e.status !== "skipped" && e.aidlc_agent.split(",").map((e) => e.trim()).includes(t)), c = (e.crew_members ?? []).filter((t) => !i.some((e) => e.key === t) && !fe(t) && !e.roles.some((e) => e.member === t));
	return /* @__PURE__ */ p("section", {
		className: "kt-experts",
		"aria-label": "The 14 official AI-DLC experts",
		"data-testid": "kt-experts",
		children: [/* @__PURE__ */ p("span", {
			className: "kt-experts-title",
			children: [
				"The 14 official AI-DLC experts",
				a + c.length ? ` + ${a + c.length} custom` : "",
				" · ",
				t.size,
				" used this run"
			]
		}), /* @__PURE__ */ p("ul", {
			className: "kt-experts-list",
			children: [i.map((e) => {
				let i = s(e.key), a = o !== null && i.some((e) => e.member && !o.has(e.member)), c = r.has(e.key) ? "busy" : n.has(e.key) ? "used" : t.has(e.key) ? a ? "absent" : "team" : "none", l = i.length, u = i.map((e) => e.title).join(", ");
				return /* @__PURE__ */ p("li", {
					className: `kt-expert is-${c}${e.custom ? " is-custom" : ""}`,
					"data-state": c,
					title: `${e.name} (${e.key}): ${On[c].hint}${u ? `; this run: ${u}` : ""}`,
					children: [/* @__PURE__ */ p("b", { children: [e.name, l > 1 ? ` ×${l}` : ""] }), /* @__PURE__ */ f("small", { children: e.custom && c === "none" ? "Custom" : On[c].label })]
				}, e.key);
			}), c.map((e) => /* @__PURE__ */ p("li", {
				className: "kt-expert is-none is-custom is-joined",
				"data-state": "joined",
				title: `${e}: joined the team (it is under Crew Agents), but this requirement has no task for it`,
				children: [/* @__PURE__ */ f("b", { children: e.replace(/-agent$/, "") }), /* @__PURE__ */ f("small", { children: "On Crew" })]
			}, e))]
		})]
	});
}
//#endregion
//#region src/board/Lanes.tsx
function An({ run: e, focus: t, follow: n, bumps: r, onRole: i, reducedMotion: a, projection: o = !1, onOutputs: s, onRetry: c, phase: l = null }) {
	let u = e.roles.filter((e) => e.status === "skipped");
	return /* @__PURE__ */ p("section", {
		className: "kt-lanes",
		"aria-label": "Role lanes",
		"data-testid": "kt-lanes",
		children: [
			/* @__PURE__ */ f(Nn, { run: e }),
			e.roles.filter((e) => e.status !== "skipped").map((u) => /* @__PURE__ */ f(Fn, {
				lane: u,
				run: e,
				focused: t === u.key,
				dim: t ? t !== u.key : !!l && (u.phase === "review" ? "construction" : u.phase) !== l,
				followed: n === u.key,
				bump: r[u.key] ?? 0,
				onRole: i,
				reducedMotion: a,
				projection: o,
				onOutputs: s,
				onRetry: c
			}, u.key)),
			u.length > 0 && /* @__PURE__ */ p("p", {
				className: "kt-dim kt-lanes-out",
				"data-testid": "kt-lanes-out",
				children: ["Not in this run: ", u.map((e) => `${e.title} (${e.summary || "not needed for this project"})`).join(", ")]
			})
		]
	});
}
function jn(e, t, n) {
	let r = t.events.filter((t) => t.role === e.key && (t.kind === "spawned" || t.kind === "done" || t.kind === "failed" || t.kind === "merged")).sort((e, t) => e.at - t.at || e.seq - t.seq), i = [], a = null, o = 0;
	for (let t of r) t.kind === "spawned" ? (a !== null && i.push({
		a,
		b: t.at,
		attempt: o,
		live: !1
	}), a = t.at, o++) : (a === null && !i.length && e.started_at !== null && (a = e.started_at, o = Math.max(o, 1)), a !== null && (i.push({
		a,
		b: t.at,
		attempt: o,
		live: !1
	}), a = null));
	let s = M.has(e.status) || e.status === "queued";
	return a === null ? s && e.agent && !i.some((t) => t.b >= e.agent.started) && i.push({
		a: e.agent.started,
		b: n,
		attempt: e.attempt,
		live: !0
	}) : i.push({
		a,
		b: s ? n : e.done_at ?? n,
		attempt: o,
		live: s
	}), !i.length && e.started_at !== null && i.push({
		a: e.started_at,
		b: e.done_at ?? (s ? n : e.started_at),
		attempt: 1,
		live: s
	}), i;
}
function Mn(e) {
	let t = gt(), n = e.started_at, r = Math.max(n + 1, e.ended_at ?? t);
	return {
		t0: n,
		t1: r,
		pct: (e) => Math.min(100, Math.max(0, (e - n) / (r - n) * 100))
	};
}
function Nn({ run: e }) {
	let { t0: t, t1: n } = Mn(e), r = n - t;
	return /* @__PURE__ */ p("div", {
		className: "kt-lane kt-lane-axis",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ f("div", {
			className: "kt-axis-title",
			children: "Timeline (from the start of the run)"
		}), /* @__PURE__ */ f("div", {
			className: "kt-axis",
			children: [
				0,
				.25,
				.5,
				.75,
				1
			].map((e) => /* @__PURE__ */ f("span", {
				className: "kt-axis-tick",
				style: { left: `${e * 100}%` },
				children: I(e * r)
			}, e))
		})]
	});
}
function Pn({ lane: e, run: t }) {
	let n = gt(), { pct: r } = Mn(t), i = jn(e, t, n), a = [
		...e.commits.map((e) => ({
			at: e.at,
			kind: "commit",
			title: `Commit ${e.sha}: ${e.subject}`
		})),
		...t.merges.filter((t) => t.role === e.key).map((e) => ({
			at: e.at,
			kind: e.status === "conflict" ? "conflict" : "merged",
			title: e.status === "conflict" ? `Merge conflict: ${e.note ?? ""}` : `Merged into the run branch ${e.sha}`
		})),
		...t.events.filter((t) => t.kind === "bounce" && (t.to === e.key || t.role === e.key) || t.kind === "violation" && t.role === e.key).map((e) => ({
			at: e.at,
			kind: e.kind,
			title: e.text
		}))
	];
	return /* @__PURE__ */ p("div", {
		className: "kt-track",
		role: "img",
		"aria-label": `${e.title} timeline: ${i.length ? i.map((e) => `round ${e.attempt} ${I(e.a - t.started_at)}–${e.live ? "now" : I(e.b - t.started_at)}`).join(", ") : "not started"}`,
		children: [
			/* @__PURE__ */ f("div", { className: "kt-track-line" }),
			i.map((e, n) => /* @__PURE__ */ f("span", {
				className: `kt-track-span${e.live ? " is-live" : ""}${e.attempt > 1 ? " is-fix" : ""}`,
				style: {
					left: `${r(e.a)}%`,
					width: `${Math.max(.6, r(e.b) - r(e.a))}%`
				},
				title: `Round ${e.attempt}: ${I(e.a - t.started_at)}–${e.live ? "now" : I(e.b - t.started_at)}`
			}, n)),
			a.map((e, t) => /* @__PURE__ */ f("span", {
				className: `kt-track-mark is-${e.kind}`,
				style: { left: `${r(e.at)}%` },
				title: e.title
			}, `m${t}`))
		]
	});
}
function Fn({ lane: e, run: t, focused: n, dim: i, followed: o, bump: s, onRole: c, reducedMotion: l, projection: u, onOutputs: d, onRetry: m }) {
	let h = a(null);
	r(() => {
		o && h.current?.scrollIntoView?.({
			block: u ? "start" : "nearest",
			behavior: l ? "auto" : "smooth"
		});
	}, [
		o,
		l,
		u
	]);
	let g = C(e), _ = e.status === "waiting";
	return /* @__PURE__ */ p("article", {
		ref: h,
		className: `kt-lane is-${e.status} tone-${g.tone}${n ? " is-focus" : ""}${i ? " is-dim" : ""}${o ? " is-followed" : ""}${_ ? " is-compact" : ""}`,
		"data-testid": "kt-lane",
		"data-role": e.key,
		"data-status": e.status,
		"aria-label": `${e.title}: ${g.label}`,
		children: [
			s > 0 && /* @__PURE__ */ f("span", {
				className: "kt-lane-bump",
				"aria-hidden": "true"
			}, s),
			/* @__PURE__ */ f(In, {
				lane: e,
				focused: n,
				onRole: c,
				onOutputs: d
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-lane-live",
				children: [/* @__PURE__ */ f(Bn, {
					lane: e,
					run: t,
					onRole: c,
					onRetry: m
				}), !_ && /* @__PURE__ */ f(Vn, {
					lane: e,
					reducedMotion: l
				})]
			}),
			/* @__PURE__ */ f("div", {
				className: "kt-lane-work",
				children: !_ && /* @__PURE__ */ f(Un, {
					lane: e,
					run: t,
					followed: o,
					onOutputs: d
				})
			}),
			/* @__PURE__ */ f(Pn, {
				lane: e,
				run: t
			})
		]
	});
}
function In({ lane: e, focused: t, onRole: n, onOutputs: r }) {
	let i = C(e), a = e.agent, o = M.has(e.status) || e.status === "queued", s = e.credits ?? a?.credits ?? null;
	return /* @__PURE__ */ p("div", {
		className: "kt-lane-id",
		children: [
			/* @__PURE__ */ f("button", {
				type: "button",
				className: "kt-avatar",
				onClick: () => n(e.key),
				"aria-pressed": t,
				"aria-label": t ? `Stop showing only ${e.title}` : `Show only ${e.title}`,
				title: t ? "Click again to show all" : "Show only this role",
				children: /* @__PURE__ */ f(Z, {
					role: e.icon || e.key,
					size: 20
				})
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-lane-who",
				children: [
					/* @__PURE__ */ p("div", {
						className: "kt-lane-name",
						children: [/* @__PURE__ */ f("span", { children: e.title }), e.attempt > 1 && /* @__PURE__ */ p("span", {
							className: "kt-badge tone-fix",
							children: ["Round ", e.attempt]
						})]
					}),
					e.doing && /* @__PURE__ */ f("div", {
						className: `kt-lane-doing${e.doing === e.assignment ? "" : " is-sent-back"}`,
						children: e.doing
					}),
					/* @__PURE__ */ p("div", {
						className: "kt-lane-tag",
						children: [/* @__PURE__ */ p("span", {
							className: `kt-pill tone-${i.tone}`,
							title: i.hint,
							children: [/* @__PURE__ */ f("i", {
								"aria-hidden": "true",
								children: i.icon
							}), i.label]
						}), /* @__PURE__ */ f("span", {
							className: "kt-lane-model kt-mono",
							title: `Model ${e.model}`,
							children: e.model
						})]
					})
				]
			}),
			e.status !== "waiting" && /* @__PURE__ */ p("p", {
				className: "kt-lane-stats",
				children: [
					/* @__PURE__ */ p("span", {
						title: o ? "How long this round has run" : "Time it spent working itself",
						children: [
							"⏱ ",
							/* @__PURE__ */ f("b", { children: o && a ? /* @__PURE__ */ f(Ln, { base: a.elapsed_s }) : I(e.active_s) }),
							o && a ? e.active_s > a.elapsed_s + 1 ? ` this round · total ${I(e.active_s)}` : " this round" : " time"
						]
					}),
					a && /* @__PURE__ */ p("span", { children: [
						/* @__PURE__ */ f("b", { children: a.turns }),
						" turn",
						a.turns === 1 ? "" : "s",
						" · ",
						/* @__PURE__ */ f("b", { children: a.tool_count }),
						" tool call",
						a.tool_count === 1 ? "" : "s"
					] }),
					(s !== null || o) && /* @__PURE__ */ p("span", { children: [
						/* @__PURE__ */ f("b", { children: R(s) }),
						" credits",
						o ? s === null ? " (this round not settled)" : " + this round not settled" : ""
					] })
				]
			}),
			e.status !== "waiting" && r && /* @__PURE__ */ p("button", {
				type: "button",
				className: "kt-out-btn",
				onClick: () => r(e.key),
				title: `What ${e.title} delivered: files, reply, task, every tool call`,
				children: [e.writable.length ? "View outputs" : "View review report", " ›"]
			})
		]
	});
}
function Ln({ base: e }) {
	let t = _t();
	return /* @__PURE__ */ f(d, { children: I(e + t) });
}
function Rn({ at: e }) {
	let t = gt();
	return e ? /* @__PURE__ */ f(d, { children: (() => {
		let n = L(t - e);
		return n === "just now" ? n : `quiet for ${n.replace(/ ago$/, "")}`;
	})() }) : null;
}
function zn({ at: e }) {
	let t = gt();
	return e ? /* @__PURE__ */ f("time", { children: L(t - e) }) : null;
}
function Bn({ lane: e, run: t, onRole: n, onRetry: r }) {
	let i = e.agent;
	switch (e.status) {
		case "waiting": {
			if (e.awaiting_member) return /* @__PURE__ */ p("div", {
				className: "kt-situation tone-warn",
				children: [/* @__PURE__ */ p("strong", { children: [
					"⏸ Not started: there is no member ",
					e.awaiting_member,
					" under Kiro Crew Agents yet"
				] }), /* @__PURE__ */ f("span", {
					className: "kt-deps",
					children: "Go to Agents → Add team member and add it (pick the template of the same name); it starts automatically once added"
				})]
			});
			let r = B(e, t.roles);
			return /* @__PURE__ */ p("div", {
				className: "kt-situation tone-idle",
				children: [/* @__PURE__ */ f("strong", { children: te(e, t.roles) }), r.length > 0 && /* @__PURE__ */ f("span", {
					className: "kt-deps",
					children: r.map((e) => /* @__PURE__ */ p("button", {
						type: "button",
						className: `kt-chip-role tone-${C(e).tone}`,
						onClick: () => n(e.key),
						title: `Show only ${e.title}`,
						children: [
							/* @__PURE__ */ f(Z, {
								role: e.icon || e.key,
								size: 13
							}),
							" ",
							e.title,
							" · ",
							C(e).label
						]
					}, e.key))
				})]
			});
		}
		case "queued": return /* @__PURE__ */ p("div", {
			className: "kt-situation tone-queue",
			children: [/* @__PURE__ */ f("strong", { children: "⏸ Queued:" }), i?.queued_reason ?? "KiroCrew has not started it yet"]
		});
		case "stalled": return /* @__PURE__ */ p("div", {
			className: "kt-situation tone-warn",
			children: [
				/* @__PURE__ */ f("strong", { children: "⚠ Stalled:" }),
				"KiroCrew marked it as stalled",
				i?.last_activity ? /* @__PURE__ */ p(d, { children: [", ", /* @__PURE__ */ f(Rn, { at: i.last_activity })] }) : null,
				i?.last_tool ? `; last in ${i.last_tool}` : ""
			]
		});
		case "awaiting_approval": return /* @__PURE__ */ p("div", {
			className: "kt-situation tone-approve",
			children: [
				/* @__PURE__ */ f("strong", { children: "✋ Needs your approval:" }),
				i?.last_tool ?? "A tool call",
				" (handle it under Approvals in KiroCrew)"
			]
		});
		case "failed": return /* @__PURE__ */ p("div", {
			className: "kt-situation tone-bad",
			children: [
				/* @__PURE__ */ f("strong", { children: "✕ Failed:" }),
				i?.error ?? "No explanation given",
				r && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn is-small is-danger kt-retry-btn",
					onClick: () => r(e.key),
					title: "Give it another round: work that was not merged starts over; if it failed after merging, it carries on fixing",
					children: "↻ Retry"
				})
			]
		});
		case "done": return e.writable.length ? /* @__PURE__ */ p("div", {
			className: "kt-situation tone-done",
			children: [/* @__PURE__ */ f("strong", { children: "✓ Done, waiting to merge into the run branch" }), e.summary ? /* @__PURE__ */ f("span", {
				className: "kt-summary",
				children: e.summary
			}) : null]
		}) : /* @__PURE__ */ p("div", {
			className: "kt-situation tone-ok",
			children: [/* @__PURE__ */ f("strong", { children: "✔ Done" }), /* @__PURE__ */ f("span", {
				className: "kt-summary",
				children: e.summary ?? "Read-only role; changes no files"
			})]
		});
		case "merged": return /* @__PURE__ */ p("div", {
			className: "kt-situation tone-ok",
			children: [/* @__PURE__ */ f("strong", { children: "✔ Delivered" }), /* @__PURE__ */ f("span", {
				className: "kt-summary",
				children: e.summary ?? "Branch merged into the run branch"
			})]
		});
		default: return null;
	}
}
function Vn({ lane: e, reducedMotion: t }) {
	let n = e.agent, r = M.has(e.status), i = N.has(e.status), a = xt(r ? n?.text_tail ?? null : null, t);
	return /* @__PURE__ */ p(d, { children: [
		e.violations.map((e) => /* @__PURE__ */ p("div", {
			className: "kt-violation",
			role: "alert",
			children: ["🚫 Changed something that is not its own ", /* @__PURE__ */ f("code", { children: e })]
		}, e)),
		r && n?.last_tool && /* @__PURE__ */ p("div", {
			className: `kt-ticker${i ? " is-working" : ""}`,
			title: "Most recent tool call",
			children: [
				/* @__PURE__ */ f("span", {
					className: "kt-ticker-arrow",
					"aria-hidden": "true",
					children: "▸"
				}),
				/* @__PURE__ */ f("span", {
					className: "kt-ticker-text kt-mono",
					children: n.last_tool
				}, n.last_tool),
				i && /* @__PURE__ */ f("span", {
					className: "kt-caret",
					"aria-hidden": "true"
				})
			]
		}),
		r && a.shown && /* @__PURE__ */ f("p", {
			className: `kt-tail${a.fresh ? " is-fresh" : ""}`,
			title: "What the agent is writing (about the last 300 characters)",
			children: /* @__PURE__ */ p("span", { children: [a.shown, a.typing && /* @__PURE__ */ f("span", {
				className: "kt-caret",
				"aria-hidden": "true"
			})] })
		}),
		r && n && n.recent_tools.length > 0 && /* @__PURE__ */ f("ol", {
			className: "kt-tools",
			"aria-label": "Recent tool calls",
			children: n.recent_tools.map((e, t) => /* @__PURE__ */ p("li", {
				className: t === n.recent_tools.length - 1 ? "is-last" : "",
				title: `${e.tool}${e.detail ? `: ${e.detail}` : ""}`,
				children: [
					/* @__PURE__ */ f("span", {
						"aria-hidden": "true",
						children: se(e.kind, e.tool)
					}),
					/* @__PURE__ */ f("span", {
						className: "kt-mono",
						children: e.detail ? /\s/.test(e.detail) ? e.detail : ae(e.detail) : e.tool
					}),
					/* @__PURE__ */ f(zn, { at: e.at })
				]
			}, `${e.at}-${t}`))
		}),
		!r && e.status !== "merged" && e.status !== "done" && e.summary && /* @__PURE__ */ f("p", {
			className: "kt-summary",
			children: e.summary
		})
	] });
}
function Hn(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		let e = n.ac ?? n.name, r = t.get(e) ?? {
			key: e,
			status: "pass",
			count: 0,
			titles: []
		};
		r.count += 1, r.titles.push(`${n.status === "fail" ? "✗" : n.status === "skip" ? "–" : "✓"} ${n.name}${n.message ? `: ${n.message}` : ""}`), (n.status === "fail" || n.status === "skip" && r.status === "pass") && (r.status = n.status), t.set(e, r);
	}
	return [...t.values()];
}
function Un({ lane: e, run: t, followed: n, onOutputs: r }) {
	let i = e.files.slice().sort((e, t) => t.added + t.removed - (e.added + e.removed)), a = Math.max(1, ...i.map((e) => e.added + e.removed)), o = n ? i : i.slice(0, 5), s = new Set(e.violations), c = new Map(t.tests.cases.map((e) => [e.id, e])), l = Hn(e.owns_tests.map((e) => c.get(e)).filter((e) => !!e)), u = e.commits.slice().reverse();
	return !e.files.length && !u.length && !l.length ? /* @__PURE__ */ f("p", {
		className: "kt-dim kt-nothing",
		children: "No changes yet"
	}) : /* @__PURE__ */ p(d, { children: [
		e.files.length > 0 && /* @__PURE__ */ p("div", {
			className: "kt-files-head",
			children: [
				/* @__PURE__ */ f("span", { children: "Changes" }),
				/* @__PURE__ */ p("span", {
					className: "kt-add",
					children: ["+", e.lines.added]
				}),
				/* @__PURE__ */ p("span", {
					className: "kt-del",
					children: ["−", e.lines.removed]
				}),
				/* @__PURE__ */ p("span", {
					className: "kt-dim",
					children: [
						e.files.length,
						" file",
						e.files.length === 1 ? "" : "s"
					]
				})
			]
		}),
		/* @__PURE__ */ p("ul", {
			className: "kt-files",
			children: [o.map((t) => /* @__PURE__ */ p("li", {
				className: s.has(t.path) ? "is-violation" : "",
				title: `${t.path}  +${t.added} −${t.removed}${s.has(t.path) ? " (out of bounds: not in a directory it may write to)" : ""}`,
				children: [
					/* @__PURE__ */ f("span", {
						className: `kt-file-st is-${t.status}`,
						children: t.status
					}),
					r && t.status !== "D" ? /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-file-path kt-file-open kt-mono",
						onClick: () => r(e.key, t.path),
						title: `Open ${t.path}`,
						children: t.path
					}) : /* @__PURE__ */ f("span", {
						className: "kt-file-path kt-mono",
						children: t.path
					}),
					/* @__PURE__ */ p("span", {
						className: "kt-file-bar",
						"aria-hidden": "true",
						children: [/* @__PURE__ */ f("i", {
							className: "kt-bar-add",
							style: { width: `${t.added / a * 100}%` }
						}), /* @__PURE__ */ f("i", {
							className: "kt-bar-del",
							style: { width: `${t.removed / a * 100}%` }
						})]
					}),
					/* @__PURE__ */ p("span", {
						className: "kt-file-num kt-mono",
						children: [/* @__PURE__ */ p("span", {
							className: "kt-add",
							children: ["+", t.added]
						}), t.removed > 0 && /* @__PURE__ */ p("span", {
							className: "kt-del",
							children: [" −", t.removed]
						})]
					})
				]
			}, t.path)), e.files.length > o.length && /* @__PURE__ */ p("li", {
				className: "kt-more kt-dim",
				children: [
					e.files.length - o.length,
					" more file",
					e.files.length - o.length === 1 ? "" : "s"
				]
			})]
		}),
		u.length > 0 && /* @__PURE__ */ f("ul", {
			className: "kt-commits",
			"aria-label": "Commits",
			children: u.slice(0, n ? 8 : 2).map((e) => /* @__PURE__ */ p("li", { children: [/* @__PURE__ */ f("code", { children: e.sha }), /* @__PURE__ */ f("span", { children: e.subject })] }, e.sha))
		}),
		l.length > 0 && /* @__PURE__ */ p("div", {
			className: "kt-owned",
			"aria-label": "Tests it is responsible for turning green",
			children: [/* @__PURE__ */ f("span", {
				className: "kt-dim",
				children: "Tests it owns"
			}), l.map((e) => /* @__PURE__ */ p("span", {
				className: `kt-owned-case is-${e.status}`,
				title: e.titles.join("\n"),
				children: [
					e.key,
					" ",
					w(e.status).glyph,
					e.count > 1 && /* @__PURE__ */ p("sub", { children: ["×", e.count] })
				]
			}, e.key))]
		})
	] });
}
var Wn = `
.kt-root {
  --kt-run: #3cc4ff; --kt-fix: #ff9f43; --kt-ok: #3ee08f; --kt-ok-solid: #0b7a4b; --kt-done: #7fe3b8;
  --kt-queue: #9ba6ff; --kt-warn: #ffc53d; --kt-approve: #ff6ec7; --kt-bad: #ff5d6c; --kt-bad-solid: #c4253a;
  --kt-handoff: #b48cff; --kt-info: #8fb8ff; --kt-idle: var(--muted, #938f9b);
  --kt-on: #16121b; --kt-seg-l: .74; --kt-seg-c: .12; --kt-glass: color-mix(in srgb, var(--text, #dcdadf) 4%, transparent);
  color: var(--text); font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); font-size: 14px; line-height: 1.45;
  display: flex; flex-direction: column; gap: 14px; padding: 16px 20px 28px; min-height: 100%; box-sizing: border-box;
}
:root[data-mode="light"] .kt-root {
  --kt-run: #0a6db5; --kt-fix: #c05200; --kt-ok: #0a7d45; --kt-ok-solid: #0a7d45; --kt-done: #0a7d45;
  --kt-queue: #4a4fd1; --kt-warn: #946200; --kt-approve: #b8237a; --kt-bad: #c8243b; --kt-bad-solid: #c8243b;
  --kt-handoff: #7b3fe4; --kt-info: #285092; --kt-on: #fff; --kt-seg-l: .62; --kt-seg-c: .13;
}
.kt-root *, .kt-root *::before, .kt-root *::after { box-sizing: border-box; }
${[
	"run",
	"fix",
	"ok",
	"done",
	"queue",
	"warn",
	"approve",
	"bad",
	"idle",
	"handoff",
	"info"
].map((e) => `.kt-root .tone-${e} { --kt-tone: var(--kt-${e}); }`).join("\n")}
.kt-root :is(span, strong, b, em, time)[class*="tone-"] { color: var(--kt-tone); }
.kt-mono { font-family: var(--mono, ui-monospace, SFMono-Regular, Menlo, monospace); }
.kt-dim { color: var(--muted); }
.kt-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }
.kt-root :is(button, select, textarea, summary, input):focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.kt-root code { font-family: var(--mono, ui-monospace, monospace); font-size: .92em; }
.kt-loading { color: var(--muted); margin: 24px 0; }

/* ---------- buttons, pills, banners ---------- */
.kt-btn { appearance: none; font: inherit; font-size: .93em; font-weight: 650; padding: 7px 14px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--border-strong, var(--border)); background: var(--card); color: var(--text); transition: border-color .15s, background .15s; white-space: nowrap; }
.kt-btn:hover { border-color: var(--accent); }
.kt-btn:disabled { opacity: .6; cursor: progress; }
.kt-btn.is-primary { background: var(--accent); border-color: var(--accent); color: var(--accent-fg, #fff); }
.kt-btn.is-primary:hover { filter: brightness(1.08); }
.kt-btn.is-danger { color: var(--kt-bad); border-color: color-mix(in srgb, var(--kt-bad) 55%, var(--border)); }
.kt-btn.is-danger.is-solid { background: var(--kt-bad-solid); border-color: var(--kt-bad-solid); color: #fff; }
.kt-btn[aria-pressed="true"], .kt-btn.is-on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, var(--card)); color: var(--text-strong); }
.kt-select { font: inherit; font-size: .93em; padding: 7px 10px; border-radius: 10px; border: 1px solid var(--border-strong, var(--border)); background: var(--card); color: var(--text); max-width: 360px; }
.kt-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 10px; border-radius: 999px; font-size: .86em; font-weight: 750; white-space: nowrap;
  color: var(--kt-tone); background: color-mix(in srgb, var(--kt-tone) 14%, transparent); border: 1px solid color-mix(in srgb, var(--kt-tone) 42%, transparent); }
.kt-pill i { font-style: normal; font-size: .9em; }
.kt-pill.is-live i { animation: kt-blink 1.6s ease-in-out infinite; }
.kt-root span.kt-badge { display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 999px; font-size: .74em; font-weight: 800; background: var(--kt-tone); color: var(--kt-on); white-space: nowrap; }
.kt-banner { padding: 8px 12px; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--kt-warn) 55%, var(--border)); background: color-mix(in srgb, var(--kt-warn) 10%, var(--card)); }
.kt-banner.is-error { border-color: color-mix(in srgb, var(--kt-bad) 60%, var(--border)); background: color-mix(in srgb, var(--kt-bad) 10%, var(--card)); }
.kt-replay { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 8px 12px; border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--kt-info, #60a5fa) 45%, var(--border)); background: color-mix(in srgb, var(--kt-info, #60a5fa) 8%, var(--card)); }
.kt-replay-scrub { flex: 1 1 240px; min-width: 160px; accent-color: var(--kt-info, #60a5fa); }
.kt-replay-time { font-size: .93em; min-width: 9ch; }
.kt-replay-speeds { display: inline-flex; gap: 4px; }
.kt-replay-speeds .kt-btn { padding: 4px 9px; font-size: .85em; }
.kt-replay-note { font-size: .86em; }
.kt-error { margin: 0; color: var(--kt-bad); font-weight: 650; }
.kt-focusbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 8px 6px 14px; border-radius: 12px;
  border: 1px solid var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--card)); }

/* ---------- top bar ---------- */
.kt-top { display: flex; align-items: center; gap: 10px 16px; flex-wrap: wrap; }
.kt-title { display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; min-width: 0; flex: 1 1 480px; } /* a laptop-wide window: the buttons go to the next line, not the title into a column */
.kt-title h1 { margin: 0; font-size: 1em; font-weight: 700; color: var(--muted); letter-spacing: .04em; }
.kt-run-title { font-size: 1.65em; font-weight: 800; color: var(--text-strong); letter-spacing: -.01em; }
.kt-run-meta { font-size: .82em; color: var(--muted); }
.kt-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.kt-start { display: grid; gap: 8px; padding: 14px 16px; border: 1px solid var(--border); border-radius: 16px; background: var(--card); }
.kt-start label { font-weight: 750; color: var(--text-strong); }
.kt-start textarea { font: inherit; resize: vertical; min-height: 86px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border-strong, var(--border)); background: var(--bg); color: var(--text); }
.kt-start-actions, .kt-confirm-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.kt-pick { display: grid; gap: 6px; padding: 10px 12px; border-radius: 12px; border: 1px dashed var(--border-strong, var(--border)); background: var(--bg); font-size: .92em; }
.kt-pick.is-empty { color: var(--muted); }
.kt-pick p { margin: 0; }
.kt-pick-why b, .kt-pick-team b { color: var(--text-strong); }
.kt-pick-phases { list-style: none; margin: 2px 0; padding: 0; display: grid; gap: 4px; }
.kt-pick-phases li { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.kt-pick-phase { min-width: 6.5em; font-weight: 700; color: var(--muted); }
.kt-pick-role { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: var(--card); border: 1px solid var(--border); }
.kt-pick-role em { font-style: normal; color: var(--kt-approve); font-weight: 700; }
.kt-pick-roster { display: flex; flex-wrap: wrap; gap: 4px; }
.kt-pick-agent { padding: 1px 7px; border-radius: 6px; font-size: .86em; color: var(--muted); opacity: .45; border: 1px solid var(--border); }
.kt-pick-agent.is-used { opacity: 1; color: var(--text-strong); border-color: var(--kt-ok, var(--border-strong)); font-weight: 700; }
.kt-warn { color: var(--kt-warn); font-weight: 700; }
.kt-cleanup-msg { margin: 0; cursor: pointer; }
.kt-pick-role > span { display: inline-flex; flex-direction: column; line-height: 1.25; }
.kt-pick-role small { font-size: .82em; color: var(--muted); font-weight: 500; }
.kt-pick-role.is-absent { border-style: dashed; border-color: var(--kt-warn); }
.kt-pick-agent.is-custom::after { content: ' ★'; color: var(--kt-approve); }
.kt-pick-std { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 6px 0; }
.kt-pick-agent.is-data { border-style: dashed; }
.kt-scenarios { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.kt-scenario { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--card); color: var(--text); cursor: pointer; text-align: left; font: inherit; }
.kt-scenario b { font-size: 1.02em; }
.kt-scenario small { color: var(--muted); font-size: .85em; }
.kt-scenario.is-on { border-color: var(--kt-on, var(--kt-run)); box-shadow: 0 0 0 2px color-mix(in srgb, var(--kt-run) 35%, transparent); }
.kt-kb { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 14px; } /* frame: kit.ts */
.kt-kb-col { min-width: 0; }
.kt-kb-head { display: flex; align-items: baseline; gap: 10px; margin: 0 0 6px; flex-wrap: wrap; }
.kt-kb-chips { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0; padding: 0; }
.kt-kb-chip { display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 10px; border-radius: 10px; border: 1px solid color-mix(in srgb, var(--kt-info) 55%, var(--border)); background: color-mix(in srgb, var(--kt-info) 10%, transparent); }
.kt-kb-chip.is-data { border-style: dashed; border-color: color-mix(in srgb, var(--kt-handoff) 60%, var(--border)); background: color-mix(in srgb, var(--kt-handoff) 9%, transparent); }
.kt-kb-chip small { color: var(--muted); font-size: .8em; }
.kt-kb-chip .kt-mono { font-size: .82em; color: var(--muted); }
.kt-kb-hits { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; max-height: 132px; overflow: auto; }
.kt-kb-hits li { display: flex; align-items: baseline; gap: 8px; font-size: .92em; white-space: nowrap; }
.kt-kb-hits li.is-data .kt-kb-what { color: var(--kt-handoff); }
.kt-kb-what { overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1; }
.kt-kb-who { all: unset; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: var(--text-strong); }
.kt-kb-empty { margin: 4px 0; }
.kt-gate-delivery { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 6px 0 8px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--kt-glass); }
.kt-gate-delivery legend { padding: 0 4px; font-size: .9em; color: var(--muted); }
.kt-gate-delivery input, .kt-gate-delivery select { font: inherit; font-size: .93em; padding: 4px 8px; border-radius: 8px; border: 1px solid var(--border-strong, var(--border)); background: var(--card); color: var(--text); }
.kt-gate-delivery input { width: 13em; }
.kt-gate-delivery .kt-gate-amount { width: 6em; }
.kt-gate-risk .kt-gate-what { width: 24em; }
.kt-sign-cto { margin-left: 10px; vertical-align: middle; }
.kt-gate-split { list-style: none; margin: 6px 0 8px; padding: 8px 10px; border-radius: 10px; background: color-mix(in srgb, var(--kt-handoff) 8%, transparent); display: grid; gap: 3px; font-size: .92em; }
.kt-gate-split b { margin-right: 6px; }
.kt-gate-split.is-out { background: color-mix(in srgb, var(--kt-warn) 10%, transparent); }
.kt-focuschip { position: sticky; top: 8px; z-index: 3; margin: -6px 0 6px auto; width: max-content; display: inline-flex; align-items: center; gap: 6px; padding: 4px 6px 4px 10px; border-radius: 999px; border: 1px solid var(--kt-on, var(--border)); background: var(--card); font-size: .9em; font-weight: 700; }
.kt-focuschip button { all: unset; cursor: pointer; padding: 0 6px; border-radius: 999px; color: var(--muted); }
.kt-focuschip button:hover { color: var(--text-strong); }
.kt-wall-src { font-size: .85em; color: var(--muted); }
.kt-req-hint { margin: 2px 0 6px; font-size: .88em; }
.kt-btn-icon { padding-left: 9px; padding-right: 9px; }
.kt-expert.is-joined { opacity: .75; border-style: dashed; }
.kt-start-more { margin: 8px 0; }
.kt-start-more > summary { cursor: pointer; color: var(--muted); font-size: .9em; }
.kt-ncard { position: absolute; z-index: 6; width: 300px; max-width: 34%; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--border-strong, var(--border)); background: var(--card); box-shadow: 0 14px 40px rgba(0,0,0,.35); font-size: 13px; }
.kt-ncard-body p { margin: 0 0 6px; }
.kt-ncard-head { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.kt-ncard-head .kt-pill { margin-left: auto; }
.kt-ncard-task .kt-dim { margin-right: 4px; }
.kt-ncard-back { color: var(--kt-fix); font-weight: 650; }
.kt-ncard-did { color: var(--text); line-height: 1.45; max-height: 6.2em; overflow: hidden; }
.kt-ncard-facts { list-style: none; margin: 0 0 8px; padding: 0; display: grid; gap: 2px; color: var(--muted); }
.kt-ncard-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.kt-ncard-actions .kt-btn { font-size: 12px; padding: 4px 10px; }
.kt-gate-report { margin: 6px 0 8px; padding: 8px 10px; border-radius: 10px; background: color-mix(in srgb, var(--kt-info) 9%, transparent); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; font-size: .94em; }
.kt-gate-report .kt-btn { margin-left: auto; font-size: 12px; padding: 3px 9px; }
.kt-sign-back { color: var(--kt-fix); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
/* .kt-sign: framed by kit.ts (a border for its state: magenta waiting, green signed) */

.kt-sign-head { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.kt-sign-head h2 { margin: 0; font-size: 1.25em; }
.kt-sign-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px 18px; margin: 10px 0; }
.kt-sign-grid dt { font-size: .82em; color: var(--muted); font-weight: 700; }
.kt-sign-grid dd { margin: 2px 0 0; }
.kt-sign-grid ul { margin: 0; padding-left: 1.1em; }
.kt-sign-groups { display: flex; flex-wrap: wrap; gap: 4px 10px; list-style: none; padding: 0 !important; margin-top: 2px !important; font-size: .88em; }
.kt-sign-groups .is-ok { color: var(--kt-ok); }
.kt-sign-groups .is-bad { color: var(--kt-bad); }
.kt-sign-form { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.kt-sign-form input { padding: 7px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--card); color: var(--text); font: inherit; }
.kt-sign-form input:first-child { width: 10em; }
.kt-sign-form input:nth-child(2) { flex: 1; min-width: 16em; }
.kt-sign-done { margin: 4px 0 0; font-size: 1.05em; }
.kt-sign-blocked { margin: 10px 0 0; padding: 8px 12px; border-radius: 10px; border: 1px dashed color-mix(in srgb, var(--kt-warn) 55%, var(--border)); color: var(--muted); }
.kt-ok { color: var(--kt-ok); }
.kt-bad { color: var(--kt-bad); }
.kt-lane-doing, .kt-node-task { }
.kt-experts { display: flex; align-items: center; gap: 10px 14px; flex-wrap: wrap; } /* frame: kit.ts */
.kt-experts-title { font-weight: 800; color: var(--text-strong); white-space: nowrap; }
.kt-experts-list { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; margin: 0; padding: 0; }
.kt-expert { display: inline-flex; align-items: baseline; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--border); font-size: .9em; }
.kt-expert small { font-size: .82em; font-weight: 700; }
.kt-expert.is-busy { border-color: var(--kt-run); background: color-mix(in srgb, var(--kt-run) 16%, transparent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--kt-run) 25%, transparent); }
.kt-expert.is-busy small { color: var(--kt-run); }
.kt-expert.is-used { border-color: color-mix(in srgb, var(--kt-ok) 60%, transparent); background: color-mix(in srgb, var(--kt-ok) 12%, transparent); }
.kt-expert.is-used small { color: var(--kt-ok); }
.kt-expert.is-team { border-style: dashed; color: var(--muted); }
.kt-expert.is-none { color: var(--muted); opacity: .45; }
.kt-expert.is-absent { border-style: dashed; border-color: var(--kt-warn); color: var(--kt-warn); }
.kt-expert.is-custom b::after { content: ' ★'; font-size: .8em; color: var(--kt-approve); }
.kt-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; padding: 12px 16px; border-radius: 14px;
  border: 1px solid var(--kt-bad); background: color-mix(in srgb, var(--kt-bad) 9%, var(--card)); }
.kt-confirm strong { color: var(--text-strong); }
.kt-gate-dialog { border-color: var(--kt-approve); background: color-mix(in srgb, var(--kt-approve) 9%, var(--card)); }
.kt-gate-docs, .kt-gate-talk, .kt-gate-questions, .kt-gate-split, .kt-gate-report, .kt-gate-risk { flex: 1 1 100%; }
.kt-gate-docs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; margin: 6px 0; font-size: .93em; }
.kt-gate-docs .kt-chip-link { display: inline-flex; align-items: center; gap: 4px; }
.kt-gate-talk { list-style: none; margin: 6px 0 8px; padding: 8px 10px; border-radius: 10px; background: var(--kt-glass); display: grid; gap: 6px; max-height: 260px; overflow: auto; font-size: .93em; }
.kt-gate-talk li { display: grid; grid-template-columns: 4.5em 1fr; gap: 8px; }
.kt-gate-talk li.is-person .kt-gate-talk-text { white-space: pre-wrap; }
.kt-gate-talk-text p { margin: 0 0 4px; }
.kt-gate-talk-text ul, .kt-gate-talk-text ol { margin: 0 0 4px; padding-left: 1.3em; }
.kt-gate-dialog.is-approve .kt-gate-talk { max-height: 180px; }
.kt-gate-talk li.is-person > b { color: var(--kt-approve); }
.kt-gate-questions { display: grid; gap: 8px; margin: 6px 0 8px; }
.kt-gate-q { margin: 0; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border); background: var(--kt-glass); display: grid; gap: 4px; }
.kt-gate-q legend { padding: 0 4px; font-size: .95em; }
.kt-gate-q label { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; font-size: .93em; cursor: pointer; }
.kt-gate-q label.is-picked > span { font-weight: 650; color: var(--text-strong); }
.kt-gate-rec { margin-left: 6px; padding: 0 6px; border-radius: 999px; font-style: normal; font-size: .85em; color: var(--kt-ok); border: 1px solid color-mix(in srgb, var(--kt-ok) 55%, var(--border)); }
.kt-gate-other { flex: 1 1 16em; font: inherit; padding: 3px 8px; border-radius: 8px; border: 1px solid var(--border-strong, var(--border)); background: var(--card); color: var(--text); }
.kt-gate-differs { color: var(--kt-warn); font-weight: 650; }
.kt-gate-note { flex: 1 1 100%; min-height: 64px; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-strong, var(--border)); background: var(--bg); color: var(--text); font: inherit; resize: vertical; }

/* ---------- the counters ---------- */
.kt-kpis { display: grid; grid-template-columns: minmax(190px, 1.05fr) minmax(300px, 1.75fr) minmax(190px, 1fr) minmax(170px, .85fr) minmax(120px, .65fr); gap: 12px; }
@media (max-width: 1240px) { .kt-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .kt-kpi-par, .kt-kpi-gates { grid-column: span 2; order: -1; } }
.kt-kpi { display: flex; flex-direction: column; gap: 5px; min-width: 0; } /* frame, glass, label and number: kit.ts */

.kt-kpi-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } /* type: kit.ts */
.kt-kpi-value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; color: var(--text-strong); font-weight: 750; font-variant-numeric: tabular-nums; }
.kt-kpi-big { display: inline-block; } /* type: kit.ts */
.kt-kpi-big.is-pop { animation: kt-pop .7s cubic-bezier(.2,1.6,.4,1) 1; }

.kt-kpi-mid { font-size: 1.5em; font-weight: 800; color: var(--muted); }
.kt-kpi-note { font-size: .84em; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.kt-kpi-tests.is-green .kt-kpi-big { color: var(--kt-ok); }
.kt-segs { display: flex; gap: 3px; margin-top: 2px; }
.kt-segs i { flex: 1; height: 9px; border-radius: 3px; background: color-mix(in srgb, var(--muted) 30%, transparent); transition: background .4s; }
.kt-segs i.is-pass { background: var(--kt-ok); box-shadow: 0 0 8px color-mix(in srgb, var(--kt-ok) 55%, transparent); }
.kt-segs i.is-fail { background: var(--kt-bad); }
.kt-saving { display: inline-flex; align-items: baseline; gap: 6px; font-size: 1.15em; }

.kt-speedup { margin-left: auto; align-self: center; padding: 2px 10px; border-radius: 999px; font-size: 1em; font-weight: 800; color: var(--kt-handoff);
  background: color-mix(in srgb, var(--kt-handoff) 14%, transparent); border: 1px solid color-mix(in srgb, var(--kt-handoff) 42%, transparent); }
.kt-bars { display: grid; gap: 5px; margin-top: 2px; }
.kt-bar-row { display: grid; grid-template-columns: 4.6em minmax(0, 1fr) 4.4em; align-items: center; gap: 8px; font-size: .84em; }
.kt-bar-name { color: var(--muted); white-space: nowrap; }
.kt-bar-val { text-align: right; color: var(--text-strong); font-weight: 700; }
.kt-bar { display: flex; height: 11px; border-radius: 6px; background: color-mix(in srgb, var(--muted) 16%, transparent); overflow: hidden; }
.kt-bar.is-segs { gap: 2px; background: none; }
.kt-bar-wall { border-radius: 6px; background: linear-gradient(90deg, var(--kt-run), var(--kt-handoff)); box-shadow: 0 0 12px color-mix(in srgb, var(--kt-run) 45%, transparent); transition: width .9s; }
.kt-bar-seg { height: 100%; border-radius: 3px; background: oklch(var(--kt-seg-l) var(--kt-seg-c) var(--h)); transition: width .9s; }
.kt-role-dots { display: flex; gap: 4px; flex-wrap: wrap; }
.kt-role-dot { width: 26px; height: 26px; padding: 0; display: grid; place-items: center; border-radius: 8px; font: inherit; font-size: 14px; line-height: 1; cursor: pointer; border: 2px solid var(--kt-tone); background: color-mix(in srgb, var(--kt-tone) 14%, transparent); }
.kt-role-dot:hover { transform: translateY(-1px); }
.kt-role-dot.tone-idle { border-style: dashed; filter: grayscale(.9); opacity: .55; }
.kt-role-dot.tone-ok { background: var(--kt-ok-solid); border-color: var(--kt-ok-solid); }
.kt-role-dot.is-working { box-shadow: 0 0 0 3px color-mix(in srgb, var(--kt-tone) 22%, transparent), 0 0 14px color-mix(in srgb, var(--kt-tone) 60%, transparent); animation: kt-glow 2.4s ease-in-out infinite; }
.kt-slots { display: flex; gap: 5px; flex-wrap: wrap; }
.kt-slots i { width: 22px; height: 22px; border-radius: 6px; border: 2px dashed var(--border-strong, var(--border)); }
.kt-slots i.is-on { border: 2px solid var(--kt-run); background: color-mix(in srgb, var(--kt-run) 32%, transparent); box-shadow: 0 0 10px color-mix(in srgb, var(--kt-run) 50%, transparent); }
.kt-slots i.is-queued { border: 2px dashed var(--kt-queue); background: color-mix(in srgb, var(--kt-queue) 20%, transparent); }
.kt-kpi-cap.is-queued { border-color: color-mix(in srgb, var(--kt-queue) 55%, var(--border)); }

.kt-gates-score { display: inline-flex; align-items: baseline; gap: 10px; }
.kt-gates-score .kt-kpi-mid { color: var(--kt-bad); }
.kt-gates-arrow { color: var(--muted); font-size: 22px; font-weight: 700; }
.kt-gates-rows { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; font-size: 13.5px; color: var(--muted); }
.kt-gates-rows b { color: var(--text-strong); font-size: 18px; margin: 0 2px; }
.kt-gates-rows .is-hit b { color: var(--kt-bad); }
.kt-used-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: 13px; color: var(--muted); }
.kt-used-row b { color: var(--text-strong); font-weight: 800; }
.kt-used-dots { display: inline-flex; gap: 3px; margin-left: 4px; }
.kt-used-dots i { width: 9px; height: 9px; border-radius: 3px; background: color-mix(in srgb, var(--muted) 28%, transparent); }
.kt-used-dots i.is-on { background: var(--kt-ok); box-shadow: 0 0 6px color-mix(in srgb, var(--kt-ok) 55%, transparent); }

/* ---------- the team graph ---------- */
.kt-graph { position: relative; overflow: hidden; /* border, radius: kit.ts */
  background: radial-gradient(110% 80% at 50% -12%, color-mix(in srgb, var(--accent) 15%, transparent), transparent 62%),
    radial-gradient(60% 50% at 100% 100%, color-mix(in srgb, var(--kt-ok) 7%, transparent), transparent 70%), var(--card); }
.kt-graph-stage { position: relative; }
.kt-graph-svg { display: block; width: 100%; height: auto; user-select: none; overflow: visible; }
.kt-g-dot { fill: color-mix(in srgb, var(--muted) 30%, transparent); }
.kt-stage-band { fill: color-mix(in srgb, var(--text) 2.5%, transparent); stroke: color-mix(in srgb, var(--muted) 22%, transparent); stroke-dasharray: 2 6; transition: fill .6s, stroke .6s; }
.kt-stage.is-live .kt-stage-band { fill: color-mix(in srgb, var(--kt-run) 5%, transparent); stroke: color-mix(in srgb, var(--kt-run) 40%, transparent); stroke-dasharray: none; }
.kt-stage-title { fill: var(--muted); font-size: 15px; font-weight: 750; letter-spacing: .02em; }
.kt-stage.is-live .kt-stage-title { fill: var(--text-strong); }
.kt-phase-band { fill: color-mix(in srgb, var(--text) 2.5%, transparent); stroke: color-mix(in srgb, var(--muted) 26%, transparent); stroke-dasharray: 2 6; transition: fill .6s, stroke .6s; }
.kt-phase.is-live .kt-phase-band { fill: color-mix(in srgb, var(--kt-run) 5%, transparent); stroke: color-mix(in srgb, var(--kt-run) 45%, transparent); stroke-dasharray: none; }
.kt-phase.is-done .kt-phase-band { stroke: color-mix(in srgb, var(--kt-ok) 45%, transparent); stroke-dasharray: none; }
.kt-phase-title { fill: var(--muted); font-size: 16px; font-weight: 800; letter-spacing: .02em; }
.kt-phase-title.is-pick { cursor: pointer; }
.kt-phase-title.is-pick:hover { fill: var(--accent); text-decoration: underline; }
.kt-phase.is-focus .kt-phase-band { fill: color-mix(in srgb, var(--accent) 8%, transparent); stroke: var(--accent); stroke-width: 2; stroke-dasharray: none; }
.kt-phase.is-focus .kt-phase-title { fill: var(--accent); }
.kt-phase.is-off { opacity: .55; }
.kt-run-link { border: 0; background: transparent; padding: 0; font: inherit; cursor: pointer; text-align: left; }
.kt-run-link:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }
.kt-pill-btn { cursor: pointer; font: inherit; }
.kt-focuschip .kt-chip-link { border: 0; background: transparent; color: var(--accent); cursor: pointer; font: inherit; padding: 0 4px; }
.kt-phase.is-live .kt-phase-title, .kt-phase.is-done .kt-phase-title { fill: var(--text-strong); }
.kt-phase-en { font-size: 12px; font-weight: 600; fill-opacity: .7; }
.kt-phase.is-unused .kt-phase-band { fill: none; stroke: color-mix(in srgb, var(--muted) 30%, transparent); stroke-dasharray: 4 6; }
.kt-phase.is-unused .kt-phase-title { fill: color-mix(in srgb, var(--muted) 70%, transparent); }
.kt-phase-note { fill: color-mix(in srgb, var(--muted) 75%, transparent); font-size: 13px; font-weight: 650; }
.kt-orch-body { fill: color-mix(in srgb, var(--kt-run) 10%, var(--card)); stroke: color-mix(in srgb, var(--kt-run) 55%, transparent); stroke-width: 2; }
.kt-orch.is-active .kt-orch-body { stroke: var(--kt-run); }
.kt-orch-title { fill: var(--text-strong); font-size: 15px; font-weight: 850; letter-spacing: .02em; }
.kt-orch-cn { fill: var(--text-strong); font-size: 14px; font-weight: 700; }
.kt-orch-sub { fill: var(--muted); font-size: 11px; font-weight: 600; }
.kt-phase-stages { fill: var(--muted); font-size: 11.5px; font-weight: 600; }
.kt-cmd { fill: none; stroke: var(--kt-run); stroke-width: 2.4; stroke-linecap: round; stroke-dasharray: 7 7; opacity: .9; animation: kt-cmd-flow 1.1s linear infinite; }
.kt-cmd.is-fixing { stroke: var(--kt-fix); }
.kt-cmd.is-queued { stroke: var(--kt-queue); opacity: .55; animation: none; }
.kt-cmd.is-awaiting_approval, .kt-cmd.is-stalled { stroke: var(--kt-approve); }
@keyframes kt-cmd-flow { to { stroke-dashoffset: -28; } }
@media (prefers-reduced-motion: reduce) { .kt-cmd { animation: none; } }
.kt-roster-title { fill: var(--muted); font-size: 11.5px; font-weight: 750; }
.kt-roster-group { fill: var(--muted); font-size: 10.5px; font-weight: 750; letter-spacing: .02em; }
.kt-roster-item.is-busy rect { stroke: var(--kt-run); fill: color-mix(in srgb, var(--kt-run) 16%, transparent); }
.kt-roster-item.is-busy circle { fill: var(--kt-run); }
.kt-roster-item rect { fill: color-mix(in srgb, var(--muted) 8%, transparent); stroke: color-mix(in srgb, var(--muted) 25%, transparent); }
.kt-roster-item circle { fill: color-mix(in srgb, var(--muted) 45%, transparent); }
.kt-roster-item text { fill: color-mix(in srgb, var(--muted) 75%, transparent); font-size: 11.5px; font-weight: 600; }
.kt-roster-item.is-team rect { stroke: color-mix(in srgb, var(--kt-ok) 45%, transparent); stroke-dasharray: 3 3; }
.kt-roster-item.is-team text { fill: var(--text); }
.kt-roster-item.is-team circle { fill: var(--kt-ok); }
.kt-roster-item.is-team rect { stroke: color-mix(in srgb, var(--kt-ok) 70%, transparent); }
.kt-roster-item.is-bench text { fill: var(--muted); }
.kt-roster-item:not(.is-team) { opacity: .38; }
.kt-roster-item:not(.is-team) rect { stroke-dasharray: none; fill: transparent; }
.kt-roster-state { font-size: 10px !important; font-weight: 700 !important; }
.kt-roster-item.is-team:not(.is-used) .kt-roster-state { fill: var(--muted) !important; }
.kt-roster-item.is-used .kt-roster-state { fill: var(--kt-ok) !important; }
.kt-roster-item.is-busy .kt-roster-state { fill: var(--kt-run) !important; }
.kt-roster-item.is-used rect { fill: color-mix(in srgb, var(--kt-ok) 14%, transparent); stroke: color-mix(in srgb, var(--kt-ok) 60%, transparent); stroke-dasharray: none; }
.kt-roster-item.is-used circle { fill: var(--kt-ok); }
.kt-roster-item.is-used text { fill: var(--text-strong); }
.kt-roster-item.is-busy rect { fill: color-mix(in srgb, var(--kt-run) 22%, transparent); stroke: var(--kt-run); }
.kt-roster-item.is-busy circle { fill: var(--kt-run); filter: drop-shadow(0 0 4px var(--kt-run)); }
.kt-node.is-skipped { opacity: .45; }
.kt-node.is-skipped .kt-node-body { fill: none; stroke: color-mix(in srgb, var(--muted) 55%, transparent); stroke-dasharray: 3 5; }
.kt-node.is-skipped .kt-node-emoji { filter: grayscale(1); opacity: .5; }
.kt-node.is-skipped .kt-node-title { fill: var(--muted); }
.kt-gate-chip { cursor: pointer; }
.kt-gate-chip.is-static { cursor: default; }
.kt-gate-chip rect { fill: var(--kt-approve); stroke: color-mix(in srgb, #fff 40%, transparent); stroke-width: 1; }
.kt-gate-chip.is-revise rect { fill: var(--card); stroke: var(--kt-approve); }
.kt-gate-chip text { fill: #fff; font-size: 12.5px; font-weight: 800; }
.kt-gate-chip.is-revise text { fill: var(--kt-approve); }
.kt-gate-chip.is-discuss rect { fill: var(--card); stroke: var(--kt-approve); stroke-dasharray: 3 2; }
.kt-gate-chip.is-discuss text { fill: var(--kt-approve); }
.kt-gate-chip.is-talking rect { fill: color-mix(in srgb, var(--kt-approve) 14%, var(--card)); stroke: var(--kt-approve); }
.kt-gate-chip.is-talking text { fill: var(--kt-approve); font-weight: 700; }
.kt-gate-chip:hover rect, .kt-gate-chip:focus-visible rect { filter: brightness(1.12); stroke-width: 2; }
.kt-par rect { fill: color-mix(in srgb, var(--kt-run) 16%, var(--card)); stroke: var(--kt-run); stroke-width: 1.3; }
.kt-par text { fill: var(--kt-run); font-size: 13px; font-weight: 800; }
.kt-par-dot { fill: var(--kt-run); animation: kt-blink 2.4s ease-in-out infinite; }
.kt-edge { fill: none; stroke-width: 2.2; stroke-linecap: round; transition: opacity .3s, stroke-width .3s; }
.kt-edge.is-pending { stroke: var(--muted); opacity: .38; stroke-dasharray: 5 6; }
.kt-graph.is-phased .kt-edge:not(.is-hot) { opacity: .2; }
.kt-edge.is-ready { stroke: var(--kt-handoff); opacity: .5; }
.kt-edge.is-used { stroke: var(--kt-handoff); opacity: .78; }
.kt-edge.is-dim { opacity: .08; }
.kt-edge.is-hot { opacity: 1; stroke-width: 3.2; }
.kt-arrow.is-pending { fill: var(--muted); }
.kt-arrow.is-ready, .kt-arrow.is-used { fill: var(--kt-handoff); }

.kt-node { cursor: pointer; outline: none; transition: opacity .3s; }
.kt-node.is-dim { opacity: .26; }
.kt-node-body { fill: var(--bg-elevated, var(--card)); stroke: var(--border-strong, var(--muted)); stroke-width: 2; transition: fill .5s, stroke .5s; }
.kt-node-avatar { fill: color-mix(in srgb, var(--text) 7%, var(--card)); stroke: color-mix(in srgb, var(--muted) 40%, transparent); stroke-width: 1.5; }
.kt-node-emoji { color: var(--text-strong); }
.kt-node-title { fill: var(--text-strong); font-size: 18.5px; font-weight: 800; }
.kt-node-agent { font-size: 12px; font-weight: 600; fill-opacity: 0.7; letter-spacing: 0.02em; }
.kt-node-title.is-long { font-size: 15.5px; }
.kt-node-title.is-long .kt-node-agent { font-size: 10.5px; }
.kt-node-sub { fill: var(--muted); font-size: 13.5px; font-weight: 650; font-variant-numeric: tabular-nums; }
.kt-node-task { fill: var(--text); fill-opacity: 0.78; font-size: 12px; font-weight: 600; }
.kt-node-task.is-sent-back { fill: var(--kt-fix); fill-opacity: 1; }
.kt-node.is-waiting .kt-node-task, .kt-node.is-skipped .kt-node-task { fill: var(--muted); }
.kt-node-ticker { fill: var(--kt-run); font-size: 12.5px; font-weight: 600; font-family: var(--mono, ui-monospace, monospace); }
.kt-node.is-fixing .kt-node-ticker { fill: var(--kt-fix); }
.kt-node.is-stalled .kt-node-ticker { fill: var(--kt-warn); }
.kt-node.is-awaiting_approval .kt-node-ticker { fill: var(--kt-approve); }
.kt-node-focus { fill: none; stroke: var(--accent); stroke-width: 3; opacity: 0; }
.kt-node:focus-visible .kt-node-focus, .kt-node.is-focus .kt-node-focus { opacity: 1; }
.kt-node-halo { fill: none; stroke-width: 12; opacity: .4; filter: blur(6px); transform-box: fill-box; transform-origin: center; animation: kt-halo 2.4s ease-in-out infinite; }
.kt-node-spin { fill: none; stroke-width: 3; stroke-linecap: round; stroke-dasharray: 30 130; transform-box: fill-box; transform-origin: center; animation: kt-spin 1.5s linear infinite; }
.kt-node.is-waiting .kt-node-body { fill: color-mix(in srgb, var(--card) 65%, transparent); stroke: color-mix(in srgb, var(--muted) 55%, transparent); stroke-dasharray: 6 5; }
.kt-node.is-waiting .kt-node-emoji { filter: grayscale(1); opacity: .5; }
.kt-graph.is-phased .kt-node.is-waiting { opacity: .5; }
.kt-node.is-waiting .kt-node-title { fill: var(--muted); }
.kt-node.is-running .kt-node-body { stroke: var(--kt-run); stroke-width: 3; fill: color-mix(in srgb, var(--kt-run) 11%, var(--card)); }
.kt-node.is-running .kt-node-sub { fill: var(--kt-run); }
.kt-node.is-running :is(.kt-node-halo, .kt-node-spin) { stroke: var(--kt-run); }
.kt-node.is-fixing .kt-node-body { stroke: var(--kt-fix); stroke-width: 3; fill: color-mix(in srgb, var(--kt-fix) 12%, var(--card)); }
.kt-node.is-fixing .kt-node-sub { fill: var(--kt-fix); }
.kt-node.is-fixing :is(.kt-node-halo, .kt-node-spin) { stroke: var(--kt-fix); }
.kt-node.is-queued .kt-node-body { stroke: color-mix(in srgb, var(--kt-queue) 50%, transparent); stroke-width: 1.5; fill: color-mix(in srgb, var(--kt-queue) 9%, var(--card)); }
.kt-node.is-queued .kt-node-sub { fill: var(--kt-queue); }
.kt-node-ants { fill: none; stroke: var(--kt-queue); stroke-width: 3; stroke-dasharray: 10 8; animation: kt-ants .9s linear infinite; }
.kt-node.is-stalled .kt-node-body { stroke: var(--kt-warn); stroke-width: 3.5; fill: color-mix(in srgb, var(--kt-warn) 10%, var(--card)); }
.kt-node.is-stalled .kt-node-sub { fill: var(--kt-warn); font-weight: 800; }
.kt-node-hatch { pointer-events: none; }
.kt-hatch-line { fill: color-mix(in srgb, var(--kt-warn) 15%, transparent); }
.kt-node.is-awaiting_approval .kt-node-body { stroke: var(--kt-approve); stroke-width: 3.5; fill: color-mix(in srgb, var(--kt-approve) 13%, var(--card)); }
.kt-node.is-awaiting_approval .kt-node-sub { fill: var(--kt-approve); font-weight: 800; }
.kt-node.is-awaiting_approval .kt-node-halo { stroke: var(--kt-approve); animation: kt-beacon 1.1s ease-in-out infinite; }
.kt-node.is-failed .kt-node-body { fill: var(--kt-bad-solid); stroke: var(--kt-bad); stroke-width: 3; }
.kt-node.is-failed :is(.kt-node-title, .kt-node-sub) { fill: #fff; }
.kt-node.is-failed .kt-node-avatar { fill: color-mix(in srgb, #fff 18%, transparent); stroke: none; }
.kt-node.is-done .kt-node-body { stroke: var(--kt-ok); stroke-width: 3; fill: color-mix(in srgb, var(--kt-ok) 9%, var(--card)); }
.kt-node.is-done .kt-node-sub { fill: var(--kt-ok); }
.kt-node:is(.is-merged, .is-final) .kt-node-body { fill: var(--kt-ok-solid); stroke: color-mix(in srgb, var(--kt-ok) 70%, #fff); stroke-width: 1.5; }
.kt-node:is(.is-merged, .is-final) .kt-node-title { fill: #fff; }
.kt-node:is(.is-merged, .is-final) .kt-node-sub { fill: #fff; opacity: .85; }
.kt-node:is(.is-merged, .is-final) .kt-node-avatar { fill: color-mix(in srgb, #fff 17%, transparent); stroke: color-mix(in srgb, #fff 30%, transparent); }
.kt-node-check circle { fill: #fff; }
.kt-node-check path { fill: none; stroke: var(--kt-ok-solid); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.kt-node-retry { cursor: pointer; }
.kt-node-retry rect { fill: var(--kt-bad-solid); stroke: color-mix(in srgb, #fff 40%, transparent); stroke-width: 1; }
.kt-node-retry text { fill: #fff; font-size: 12.5px; font-weight: 800; }
.kt-node-retry:hover rect, .kt-node-retry:focus-visible rect { filter: brightness(1.15); stroke: #fff; stroke-width: 2; }
.kt-retry-btn { margin-left: 8px; }
.kt-node-badge rect { fill: var(--kt-badge, var(--muted)); }
.kt-node-badge text { fill: var(--kt-on); font-size: 12px; font-weight: 800; }
.kt-node-badge.is-fix { --kt-badge: var(--kt-fix); }
.kt-node-badge.is-bad { --kt-badge: var(--kt-bad); }
.kt-node-badge.is-queue { --kt-badge: var(--kt-queue); }
.kt-node-badge.is-warn { --kt-badge: var(--kt-warn); }
.kt-node-badge.is-approve { --kt-badge: var(--kt-approve); }
.kt-node-badge.is-gate { --kt-badge: var(--kt-approve); }
.kt-node-flash { stroke-width: 6; opacity: 0; transform-box: fill-box; transform-origin: center; pointer-events: none; animation: kt-flash 1.4s ease-out 1 forwards; }
.kt-node-flash.is-bad { stroke: var(--kt-bad); fill: color-mix(in srgb, var(--kt-bad) 30%, transparent); }
.kt-node-flash.is-ok { stroke: var(--kt-ok); fill: color-mix(in srgb, var(--kt-ok) 25%, transparent); }

.kt-rail-base { stroke: color-mix(in srgb, var(--muted) 45%, transparent); stroke-width: 6; stroke-linecap: round; stroke-dasharray: 1 9; }
.kt-rail-fill { stroke: var(--kt-ok); stroke-width: 6; stroke-linecap: round; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--kt-ok) 60%, transparent)); transition: x2 .8s; }
.kt-rail-label { fill: var(--text-strong); font-size: 14.5px; font-weight: 800; }
.kt-rail-sub { fill: var(--muted); font-size: 13px; font-weight: 600; }
.kt-rail-label .kt-mono, .kt-rail-sub .kt-mono { font-weight: 500; fill: var(--muted); }
.kt-rail-dot circle { fill: var(--kt-ok-solid); stroke: var(--card); stroke-width: 2.5; }
.kt-rail-dot text { fill: #fff; font-size: 11px; font-weight: 800; }
.kt-rail-dot.is-conflict circle { fill: var(--kt-bad-solid); stroke: var(--kt-bad); }
.kt-rail-dot.is-dim { opacity: .3; }
.kt-rail-flash { fill: none; stroke-width: 4; transform-box: fill-box; transform-origin: center; animation: kt-flash 1.4s ease-out 1 forwards; }
.kt-rail-flash.is-bad { stroke: var(--kt-bad); }
.kt-rail-flash.is-ok { stroke: var(--kt-ok); }
.kt-station-bg { fill: var(--bg-elevated, var(--card)); stroke: var(--border-strong, var(--muted)); stroke-width: 2.5; transition: fill .5s, stroke .5s; }
.kt-station-track { fill: none; stroke: color-mix(in srgb, var(--muted) 28%, transparent); stroke-width: 6; }
.kt-station-pass { fill: none; stroke: var(--kt-ok); stroke-width: 6; transition: stroke-dasharray .8s; }
.kt-station-fail { fill: none; stroke: var(--kt-bad); stroke-width: 6; transition: stroke-dasharray .8s, stroke-dashoffset .8s; }
.kt-station-num { fill: var(--text-strong); font-size: 15px; font-weight: 850; font-variant-numeric: tabular-nums; }
.kt-station-label { fill: var(--text-strong); font-size: 13.5px; font-weight: 800; }
.kt-station.is-pass .kt-station-bg { fill: color-mix(in srgb, var(--kt-ok) 16%, var(--card)); stroke: var(--kt-ok); }
.kt-station.is-fail .kt-station-bg { stroke: color-mix(in srgb, var(--kt-bad) 70%, transparent); }
.kt-station-flash { fill: none; stroke-width: 6; transform-box: fill-box; transform-origin: center; animation: kt-flash 1.6s ease-out 1 forwards; }
.kt-station-flash.is-ok { stroke: var(--kt-ok); fill: color-mix(in srgb, var(--kt-ok) 22%, transparent); }
.kt-station-flash.is-bad { stroke: var(--kt-bad); }

.kt-particles { pointer-events: none; }
.kt-p { color: var(--kt-info); }
.kt-p.is-handoff { color: var(--kt-handoff); }
.kt-p:is(.is-merge, .is-pass, .is-ok) { color: var(--kt-ok); }
.kt-p:is(.is-fail, .is-bounce, .is-danger) { color: var(--kt-bad); }
.kt-p:is(.is-run, .is-tool) { color: var(--kt-run); }
.kt-p-halo { fill: currentColor; opacity: .22; }
.kt-p-tail-glow { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; opacity: .16; }
.kt-p-tail { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; opacity: .62; }
.kt-p-head { fill: color-mix(in srgb, currentColor 40%, #fff); stroke: currentColor; stroke-width: 2.2; }
.kt-p-ring { fill: none; stroke: currentColor; }
.kt-p.is-tool .kt-p-ring { opacity: .7; }
.kt-p-cross, .kt-p-check { fill: none; stroke: currentColor; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }
.kt-p-label { fill: currentColor; font-size: 13px; font-weight: 800; paint-order: stroke; stroke: var(--card); stroke-width: 4px; stroke-linejoin: round; }

.kt-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; padding: 8px 16px 10px; font-size: 12px; color: var(--muted);
  border-top: 1px solid color-mix(in srgb, var(--border) 70%, transparent); background: color-mix(in srgb, var(--bg) 35%, transparent); }
.kt-legend-item { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.kt-legend-item i { width: 18px; height: 11px; border-radius: 4px; border: 2px solid var(--border-strong, var(--muted)); }
${Object.entries({
	waiting: "idle",
	queued: "queue",
	running: "run",
	stalled: "warn",
	awaiting_approval: "approve",
	done: "done",
	merged: "ok",
	fixing: "fix",
	failed: "bad"
}).map(([e, t]) => `.kt-legend-item.is-${e} i { border-color: var(--kt-${t}); background: color-mix(in srgb, var(--kt-${t}) 16%, transparent); }`).join("\n")}
.kt-legend-item.is-waiting i { border-style: dashed; background: none; }
.kt-legend-item.is-skipped i { border-style: dotted; background: none; opacity: .6; }
.kt-legend-item.is-queued i { border-style: dashed; }
.kt-legend-item.is-merged i, .kt-legend-item.is-failed i { background: var(--kt-ok-solid); }
.kt-legend-item.is-failed i { background: var(--kt-bad-solid); }
.kt-legend-item b { width: 9px; height: 9px; border-radius: 50%; background: var(--kt-info); box-shadow: 0 0 8px currentColor; }
.kt-legend-item.is-p-handoff b { background: var(--kt-handoff); color: var(--kt-handoff); }
.kt-legend-item:is(.is-p-merge, .is-p-pass) b { background: var(--kt-ok); color: var(--kt-ok); }
.kt-legend-item.is-p-fail b { background: var(--kt-bad); color: var(--kt-bad); }
.kt-legend-sep { width: 1px; height: 14px; background: var(--border); }
.kt-legend-note { margin-left: auto; font-style: italic; }

/* ---------- cards: conveyor, wall, feed ---------- */
.kt-card { min-width: 0; } /* frame: kit.ts */
.kt-card-head { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; margin-bottom: 10px; }

.kt-belt { list-style: none; margin: 0; padding: 4px 2px 6px; display: flex; align-items: center; gap: 10px; overflow-x: auto; position: relative; scrollbar-width: thin; scroll-behavior: smooth; }
.kt-belt::before { content: ''; position: absolute; left: 8px; right: 8px; top: 50%; height: 4px; margin-top: -2px; border-radius: 2px;
  background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--muted) 38%, transparent) 0 10px, transparent 10px 17px); }
.kt-belt > li { position: relative; z-index: 1; flex: none; }
.kt-belt.has-older { -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 56px); mask-image: linear-gradient(90deg, transparent 0, #000 56px); }
.kt-belt-end { display: flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px; font-size: .86em; font-weight: 750; border: 1px solid var(--border-strong, var(--border)); background: var(--bg-elevated, var(--card)); color: var(--muted); }
.kt-belt-end.is-head { margin-left: auto; color: var(--kt-ok); border-color: var(--kt-ok); background: color-mix(in srgb, var(--kt-ok) 10%, var(--card)); box-shadow: 0 0 20px -6px var(--kt-ok); }
.kt-belt-chip { display: flex; flex-direction: column; gap: 1px; padding: 5px 11px 6px; border-radius: 12px; transition: opacity .3s;
  border: 1px solid color-mix(in srgb, var(--kt-ok) 50%, var(--border)); background: color-mix(in srgb, var(--kt-ok) 10%, var(--card)); }
.kt-belt-chip.is-conflict { border: 2px solid var(--kt-bad); background: color-mix(in srgb, var(--kt-bad) 14%, var(--card)); }
.kt-belt-chip.is-pending { border: 1px dashed var(--border-strong, var(--muted)); background: var(--card); }
.kt-belt-chip.is-new { animation: kt-slide-in 1s cubic-bezier(.2,.8,.2,1) 1; }
.kt-belt-chip.is-dim { opacity: .3; }
.kt-belt-role { appearance: none; border: 0; background: none; padding: 0; font: inherit; font-weight: 800; color: var(--text-strong); cursor: pointer; text-align: left; white-space: nowrap; }
.kt-belt-meta { font-size: .78em; color: var(--muted); white-space: nowrap; }
.kt-belt-meta code { color: var(--text); }
.kt-belt-note { font-size: .82em; font-weight: 800; color: var(--kt-bad); white-space: nowrap; }

.kt-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 400px); gap: 14px; align-items: start; }
.kt-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.kt-side { position: sticky; top: 12px; display: flex; flex-direction: column; gap: 14px; min-width: 0; max-height: calc(100vh - 24px); overflow-y: auto; scrollbar-width: thin; }
.kt-side .kt-feed { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 240px; }
.kt-side .kt-feed-list { flex: 1 1 auto; min-height: 0; max-height: none; }
@media (max-width: 1240px) { .kt-body { grid-template-columns: minmax(0, 1fr); } .kt-side { position: static; max-height: none; } .kt-side .kt-feed-list { max-height: 460px; } }

.kt-wall-score { font-size: 1.4em; font-weight: 850; font-variant-numeric: tabular-nums; color: var(--text-strong); }
.kt-wall-cmd { padding: 1px 7px; border-radius: 6px; font-size: .8em; color: var(--muted); background: color-mix(in srgb, var(--text) 6%, transparent); }
.kt-wall-at { font-size: .8em; }

.kt-wall-empty { margin: 4px 0; }
.kt-spark-row { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; margin: -2px 0 10px; font-size: .78em; color: var(--muted); }
.kt-spark { display: block; width: 100%; height: 40px; overflow: visible; }
.kt-spark-total { stroke: var(--border-strong, var(--muted)); stroke-dasharray: 3 3; }
.kt-spark-area { fill: color-mix(in srgb, var(--kt-ok) 20%, transparent); }
.kt-spark-line { fill: none; stroke: var(--kt-ok); stroke-width: 2; stroke-linejoin: round; }
.kt-spark-pt.is-pass { fill: var(--kt-ok); } .kt-spark-pt.is-fail { fill: var(--kt-bad); }
.kt-spark-label { fill: var(--text-strong); font-size: 10px; font-weight: 800; }
.kt-wall-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.kt-ac { display: flex; flex-direction: column; gap: 3px; }
.kt-ac-label { padding-left: 3px; font-size: .74em; font-weight: 800; color: var(--muted); }
.kt-group-label { padding-left: 3px; font-size: .82em; font-weight: 900; letter-spacing: .04em; color: var(--text-strong); }
.kt-ac-cells { display: flex; gap: 4px; }
.kt-ac.is-multi .kt-ac-cells { padding: 3px; border-radius: 13px; border: 1px dashed var(--border-strong, var(--border)); }
.kt-cell { position: relative; width: 54px; height: 54px; padding: 0; border: 0; border-radius: 12px; background: none; font: inherit; cursor: pointer; perspective: 320px; transition: opacity .3s; }
.kt-cell.is-pass { --kt-c: var(--kt-ok); } .kt-cell.is-fail { --kt-c: var(--kt-bad); } .kt-cell.is-skip { --kt-c: var(--muted); }
.kt-cell-face { position: absolute; inset: 0; display: grid; grid-template-rows: auto 1fr; padding: 4px 6px; border-radius: 12px; text-align: left;
  border: 2px solid var(--kt-c); background: color-mix(in srgb, var(--kt-c) 15%, var(--card)); color: var(--text-strong); transform-origin: 50% 50%; backface-visibility: hidden; }
.kt-cell.is-pass .kt-cell-face { background: var(--kt-ok-solid); border-color: color-mix(in srgb, var(--kt-ok) 75%, transparent); color: #fff; }
.kt-cell.is-skip .kt-cell-face { border-style: dashed; color: var(--muted); }
.kt-cell-ac { font-size: .72em; font-weight: 850; white-space: nowrap; }
.kt-cell-glyph { align-self: center; justify-self: center; margin-top: -4px; font-size: 1.4em; font-weight: 900; line-height: 1; }
.kt-cell.is-fail .kt-cell-glyph { color: var(--kt-bad); }
.kt-cell-owner { position: absolute; right: 3px; bottom: 1px; font-size: 13px; }
.kt-cell-face.is-flip { animation: kt-flip .85s cubic-bezier(.2,.8,.25,1) 1, kt-burst 1.3s ease-out 1; }
.kt-cell:hover .kt-cell-face, .kt-cell:focus-visible .kt-cell-face { box-shadow: 0 0 0 2px var(--accent); }
.kt-cell.is-dim { opacity: .28; }
.kt-cell.is-hot .kt-cell-face { box-shadow: 0 0 0 2px var(--accent); }
.kt-wall-inspect { display: flex; flex-wrap: wrap; align-items: baseline; gap: 3px 10px; min-height: 2.6em; margin-top: 10px; padding: 7px 10px; border-radius: 10px; font-size: .86em; background: color-mix(in srgb, var(--text) 4.5%, transparent); }
.kt-wall-inspect.is-fail { background: color-mix(in srgb, var(--kt-bad) 9%, transparent); }
.kt-wall-inspect strong { color: var(--text-strong); }
.kt-fail-msg { color: var(--kt-bad); font-weight: 750; }
.kt-inspect-owner { margin-left: 8px; }

.kt-feed-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; max-height: 460px; overflow-y: auto; scrollbar-width: thin; }
.kt-ev { display: grid; grid-template-columns: 1.6em minmax(0, 1fr) auto auto; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 8px; font-size: .88em; }
.kt-ev:hover { background: color-mix(in srgb, var(--text) 5%, transparent); }
.kt-ev-icon { text-align: center; }
.kt-ev-text { min-width: 0; overflow-wrap: anywhere; color: var(--text); }
.kt-ev.is-tool .kt-ev-text { color: var(--muted); }
.kt-ev.tone-bad .kt-ev-text { color: var(--kt-bad); font-weight: 750; }
.kt-ev.is-merged .kt-ev-text, .kt-ev.is-done .kt-ev-text { color: var(--kt-ok); }
.kt-ev.is-handoff .kt-ev-text { color: var(--kt-handoff); }
.kt-ev.is-new { animation: kt-ev-in 1.6s ease-out 1; }
.kt-ev-roles { display: inline-flex; align-items: center; gap: 2px; color: var(--muted); font-size: .9em; }
.kt-ev-role { appearance: none; padding: 0 4px; border-radius: 7px; border: 1px solid var(--border); background: var(--bg-elevated, var(--card)); font-size: 13px; line-height: 1.5; cursor: pointer; }
.kt-ev-role:hover { border-color: var(--accent); }
.kt-ev-time { color: var(--muted); font-size: .84em; white-space: nowrap; font-variant-numeric: tabular-nums; }
.kt-feed-empty { padding: 8px 6px; }
.kt-filter { appearance: none; font: inherit; font-size: .82em; font-weight: 700; padding: 2px 10px; border-radius: 999px; cursor: pointer; border: 1px solid var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--text-strong); }
.kt-check { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: .82em; color: var(--muted); cursor: pointer; }

/* ---------- lanes ---------- */
.kt-lanes { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.kt-lane { position: relative; display: grid; grid-template-columns: 236px minmax(0, 1.2fr) minmax(0, 1fr); grid-template-areas: "id live work" "id track track";
  gap: 6px 16px; padding: 12px 14px 10px 18px; border-radius: 14px; border: 1px solid var(--border); background: var(--card); overflow: hidden;
  transition: opacity .3s, box-shadow .3s, border-color .3s; scroll-margin: 16px; }
.kt-lane::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--kt-tone); }
.kt-lane.is-compact { grid-template-areas: "id live live" "id track track"; }
.kt-lane:is(.is-running, .is-fixing) { border-color: color-mix(in srgb, var(--kt-tone) 55%, var(--border));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--kt-tone) 30%, transparent), 0 10px 30px -16px var(--kt-tone);
  background: linear-gradient(100deg, color-mix(in srgb, var(--kt-tone) 8%, var(--card)), var(--card) 45%); }
.kt-lane:is(.is-merged, .tone-ok) { background: linear-gradient(100deg, color-mix(in srgb, var(--kt-ok) 6%, var(--card)), var(--card) 40%); }
.kt-lane:is(.is-stalled, .is-awaiting_approval, .is-failed) { border-color: var(--kt-tone); box-shadow: 0 0 0 1px var(--kt-tone); }
.kt-lane.is-stalled { background-image: repeating-linear-gradient(135deg, color-mix(in srgb, var(--kt-warn) 7%, transparent) 0 10px, transparent 10px 20px); }
.kt-lane.is-waiting { background: color-mix(in srgb, var(--card) 70%, transparent); border-style: dashed; }
.kt-lane.is-dim { opacity: .42; }
.kt-lane.is-focus { border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 55%, transparent); }
.kt-lane.is-followed { font-size: 1.07em; border-color: var(--kt-tone); box-shadow: 0 0 0 2px var(--kt-tone), 0 16px 44px -16px var(--kt-tone); }
.kt-lane.is-followed::after { content: 'Following'; position: absolute; top: 8px; right: 10px; padding: 1px 8px; border-radius: 999px; font-size: .72em; font-weight: 800; background: var(--kt-tone); color: var(--kt-on); }
.kt-lane-bump { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; animation: kt-bump 1.8s ease-out 1 forwards; }
.kt-lane-axis { padding: 0 14px 0 18px; border: 0; background: none; box-shadow: none; }
.kt-lane-axis::before { display: none; }
.kt-axis-title { grid-area: id; align-self: end; font-size: .76em; color: var(--muted); white-space: nowrap; }
.kt-axis { grid-area: track; position: relative; height: 16px; }
.kt-axis-tick { position: absolute; top: 0; transform: translateX(-50%); font-size: .76em; color: var(--muted); font-variant-numeric: tabular-nums; }
.kt-axis-tick:first-child { transform: none; }
.kt-axis-tick:last-child { transform: translateX(-100%); }
.kt-lane-id { grid-area: id; display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 4px 10px; align-content: start; }
.kt-avatar { width: 52px; height: 52px; padding: 0; display: grid; place-items: center; border-radius: 16px; font-size: 27px; cursor: pointer;
  border: 2px solid var(--kt-tone); background: color-mix(in srgb, var(--kt-tone) 13%, var(--card)); transition: box-shadow .3s; }
.kt-lane.is-waiting .kt-avatar span { filter: grayscale(1); opacity: .55; }
.kt-lane:is(.is-merged, .tone-ok) .kt-avatar { background: var(--kt-ok-solid); border-color: var(--kt-ok-solid); }
.kt-lane:is(.is-running, .is-fixing) .kt-avatar { animation: kt-glow 2.4s ease-in-out infinite; }
.kt-lane-who { display: flex; flex-direction: column; justify-content: center; gap: 5px; min-width: 0; }
.kt-lane-name { display: flex; align-items: center; gap: 6px; font-size: 1.18em; line-height: 1.2; font-weight: 850; color: var(--text-strong); }
.kt-lane-doing { font-size: 12px; color: var(--muted); margin: 1px 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kt-lane-doing.is-sent-back { color: var(--kt-fix); font-weight: 650; }
.kt-lane-tag { display: flex; align-items: center; gap: 6px; min-width: 0; }
.kt-lane-model { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .74em; color: var(--muted); }
.kt-lane-stats { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 1px 10px; margin: 6px 0 0; font-size: .82em; color: var(--muted); font-variant-numeric: tabular-nums; }
.kt-lane-stats b { font-weight: 750; color: var(--text); }
.kt-lane-live { grid-area: live; display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.kt-lane-work { grid-area: work; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.kt-situation { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; padding: 6px 10px; border-radius: 10px; font-size: .93em;
  border: 1px solid color-mix(in srgb, var(--kt-tone) 42%, transparent); background: color-mix(in srgb, var(--kt-tone) 10%, transparent); color: var(--text); }
.kt-situation strong { color: var(--kt-tone); font-weight: 800; }
.kt-situation:is(.tone-ok, .tone-done) { padding: 0; border: 0; background: none; }
.kt-situation.tone-idle { background: none; border-style: dashed; }
.kt-situation.tone-idle strong { color: var(--text-strong); }
.kt-situation:is(.tone-warn, .tone-approve, .tone-bad) { font-weight: 600; }
.kt-summary { color: var(--text); overflow-wrap: anywhere; }
.kt-deps { display: flex; flex-wrap: wrap; gap: 6px; }
.kt-chip-role { appearance: none; font: inherit; font-size: .86em; font-weight: 650; padding: 1px 9px; border-radius: 999px; cursor: pointer;
  border: 1px solid color-mix(in srgb, var(--kt-tone) 48%, transparent); background: color-mix(in srgb, var(--kt-tone) 11%, transparent); color: var(--kt-tone); }
.kt-violation { padding: 6px 10px; border-radius: 10px; font-size: .93em; font-weight: 800; color: var(--kt-bad);
  border: 1px solid color-mix(in srgb, var(--kt-bad) 60%, transparent); background: color-mix(in srgb, var(--kt-bad) 13%, transparent); }
.kt-ticker { display: flex; align-items: center; gap: 6px; min-width: 0; font-weight: 700; color: var(--kt-tone); }
.kt-ticker-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: kt-tick-in .45s ease-out 1; }
.kt-caret { display: inline-block; flex: none; width: .5em; height: 1.05em; margin-left: 2px; vertical-align: -.15em; background: currentColor; animation: kt-caret 1s steps(1) infinite; }
.kt-tail { margin: 0; display: flex; flex-direction: column; justify-content: flex-end; max-height: 4.9em; overflow: hidden; padding: 6px 10px; font-size: .92em; line-height: 1.55; color: var(--text);
  border-left: 3px solid color-mix(in srgb, var(--kt-tone) 65%, transparent); border-radius: 0 10px 10px 0; background: color-mix(in srgb, var(--text) 4%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 1.5em); mask-image: linear-gradient(to bottom, transparent 0, #000 1.5em); }
.kt-tail.is-fresh { animation: kt-fade-in .8s ease-out 1; }
.kt-lane.is-followed .kt-tail { max-height: 8em; }
.kt-tools { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 5px; font-size: .8em; }
.kt-tools li { display: inline-flex; align-items: center; gap: 5px; max-width: 220px; padding: 2px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--kt-glass); color: var(--muted); }
.kt-tools li .kt-mono { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.kt-tools li time { font-size: .92em; white-space: nowrap; }
.kt-tools li.is-last { border-color: color-mix(in srgb, var(--kt-tone) 60%, transparent); background: color-mix(in srgb, var(--kt-tone) 12%, transparent); }
.kt-files-head { display: flex; align-items: baseline; gap: 8px; font-size: .84em; font-weight: 750; color: var(--text-strong); }
.kt-add { color: var(--kt-ok); font-weight: 750; } .kt-del { color: var(--kt-bad); font-weight: 750; }
.kt-files { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; font-size: .8em; }
.kt-files li { display: grid; grid-template-columns: 1.3em minmax(0, 1fr) 64px 5.6em; align-items: center; gap: 6px; }
.kt-file-st { text-align: center; font-family: var(--mono, monospace); font-weight: 850; }
.kt-file-st.is-A { color: var(--kt-ok); } .kt-file-st.is-M { color: var(--kt-warn); } .kt-file-st.is-D { color: var(--kt-bad); }
.kt-file-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
.kt-file-bar { display: flex; height: 7px; border-radius: 4px; overflow: hidden; background: color-mix(in srgb, var(--muted) 15%, transparent); }
.kt-bar-add { background: var(--kt-ok); } .kt-bar-del { background: var(--kt-bad); }
.kt-file-num { text-align: right; white-space: nowrap; }
.kt-files li.is-violation .kt-file-path { color: var(--kt-bad); font-weight: 800; text-decoration: underline wavy color-mix(in srgb, var(--kt-bad) 70%, transparent); text-underline-offset: 3px; }
.kt-files li.is-violation .kt-file-st { color: var(--kt-bad); }
.kt-files li.kt-more { display: block; font-size: .95em; }
.kt-commits { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; font-size: .8em; }
.kt-commits li { display: flex; gap: 6px; min-width: 0; }
.kt-commits code { flex: none; color: var(--kt-handoff); }
.kt-commits span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kt-owned { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: .78em; }
.kt-owned-case { padding: 1px 7px; border-radius: 6px; font-weight: 800; font-family: var(--mono, monospace); }
.kt-owned-case sub { font-size: .72em; margin-left: 2px; opacity: .75; vertical-align: baseline; }
.kt-owned-case.is-pass { color: var(--kt-ok); background: color-mix(in srgb, var(--kt-ok) 13%, transparent); }
.kt-owned-case.is-fail { color: var(--kt-bad); background: color-mix(in srgb, var(--kt-bad) 13%, transparent); }
.kt-owned-case.is-skip { color: var(--muted); background: var(--kt-glass); }
.kt-nothing { margin: 0; font-size: .84em; }
.kt-track { grid-area: track; position: relative; height: 14px; margin-top: 2px; }
.kt-track-line { position: absolute; left: 0; right: 0; top: 6px; height: 2px; border-radius: 1px; background: color-mix(in srgb, var(--muted) 22%, transparent); }
.kt-track-span { position: absolute; top: 3px; height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--text) 34%, transparent); }
.kt-track-span.is-fix { background: color-mix(in srgb, var(--kt-fix) 65%, transparent); }
.kt-track-span.is-live { background: var(--kt-tone); box-shadow: 0 0 10px color-mix(in srgb, var(--kt-tone) 70%, transparent); }
.kt-track-span.is-live::after { content: ''; position: absolute; right: -3px; top: -3px; width: 14px; height: 14px; border-radius: 50%; background: var(--kt-tone); box-shadow: 0 0 10px var(--kt-tone); animation: kt-blink 1.4s ease-in-out infinite; }
.kt-track-mark { position: absolute; top: 0; width: 4px; height: 14px; margin-left: -2px; border-radius: 2px; background: var(--muted); }
.kt-track-mark.is-commit { top: 4px; width: 6px; height: 6px; margin-left: -3px; border-radius: 50%; background: var(--text-strong); box-shadow: 0 0 0 2px var(--card); }
.kt-track-mark.is-merged { background: var(--kt-ok); }
.kt-track-mark:is(.is-conflict, .is-bounce, .is-violation) { background: var(--kt-bad); }

/* ---------- the empty state and the probe ---------- */
.kt-empty { display: grid; gap: 22px; padding: 28px 30px; border-radius: 22px; border: 1px solid var(--border);
  background: radial-gradient(90% 90% at 0% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%), var(--card); }
.kt-empty-hero h2 { margin: 0 0 8px; font-size: 2.1em; font-weight: 850; color: var(--text-strong); letter-spacing: -.01em; }
.kt-empty-hero p { margin: 0; max-width: 62em; color: var(--text); font-size: 1.04em; line-height: 1.65; }
.kt-team-intro { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 22px; align-items: center; }
@media (max-width: 1000px) { .kt-team-intro { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.kt-team-intro.is-phased { grid-template-columns: 1.15fr 1.15fr 1.6fr .8fr; align-items: stretch; gap: 14px; }
@media (max-width: 1000px) { .kt-team-intro.is-phased { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.kt-intro-phase { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 16px; border: 1px dashed color-mix(in srgb, var(--muted) 35%, transparent); }
.kt-intro-phase-head { display: flex; flex-direction: column; gap: 2px; }
.kt-intro-phase-head b { color: var(--text-strong); font-size: 1.02em; }
.kt-intro-phase-head span { color: var(--muted); font-size: .86em; }
.kt-intro-phase-body { display: flex; gap: 10px; align-items: center; flex: 1; }
.kt-intro-phase-body > .kt-intro-stage { flex: 1; min-width: 0; }
.kt-intro-stage { position: relative; display: flex; flex-direction: column; gap: 8px; }
.kt-intro-stage:not(:last-child)::after { content: '→'; position: absolute; right: -18px; top: 50%; transform: translateY(-50%); color: var(--kt-handoff); font-weight: 900; font-size: 1.2em; }
.kt-intro-role { display: grid; grid-template-columns: 36px minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 8px; padding: 9px 11px; border-radius: 14px; border: 1px solid var(--border); background: var(--bg-elevated, var(--card)); }
.kt-empty-punch { margin-top: 10px; font-size: 1.12em; font-weight: 850; color: var(--text-strong); }
.kt-intro-emoji { grid-row: span 2; align-self: center; color: var(--text-strong); opacity: .85; }
.kt-role-icon { display: inline-block; vertical-align: -0.18em; flex: none; }
.kt-start-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
.kt-start-field { display: flex; flex-direction: column; gap: 4px; flex: 1 1 360px; font-size: .9em; }
.kt-start-field span { font-weight: 750; color: var(--text-strong); }
.kt-start-field.is-narrow { flex: 0 1 260px; }
.kt-start-field input, .kt-start-field select { font: inherit; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--border-strong, var(--border)); background: var(--bg); color: var(--text); font-weight: 400; }
.kt-start-field input::placeholder, .kt-start textarea::placeholder { color: var(--muted); font-weight: 400; }
.kt-intro-role b { color: var(--text-strong); }
.kt-intro-does { font-size: .82em; color: var(--muted); }
.kt-intro-name { display: flex; align-items: baseline; gap: 4px; min-width: 0; }
.kt-intro-agent { font-size: 11px; font-weight: 600; color: var(--muted); }
.kt-intro-par { align-self: flex-start; padding: 1px 9px; border-radius: 999px; font-size: .74em; font-weight: 850; color: var(--kt-run); background: color-mix(in srgb, var(--kt-run) 13%, transparent); border: 1px solid color-mix(in srgb, var(--kt-run) 40%, transparent); }
.kt-debug summary { cursor: pointer; font-size: .84em; color: var(--muted); }
.kt-debug pre { max-height: 320px; overflow: auto; margin: 8px 0 0; padding: 10px 12px; border-radius: 10px; font-size: 12px; background: var(--bg-elevated, var(--card)); border: 1px solid var(--border); }

/* ---------- projection ---------- */
.kt-root.is-projection { position: fixed; inset: 0; z-index: 2147483000; height: 100vh; overflow: hidden; background: var(--bg); font-size: 16.5px; padding: 16px 26px 18px; gap: 12px; }
.kt-root.is-projection .kt-body { flex: 1 1 auto; min-height: 0; grid-template-columns: minmax(0, 1fr) minmax(400px, 470px); align-items: stretch; }
.kt-root.is-projection .kt-col { min-height: 0; overflow: hidden; }
.kt-root.is-projection .kt-col > :not(.kt-lanes) { flex: none; }
.kt-root.is-projection > :not(.kt-body) { flex: none; }
.kt-root.is-projection .kt-graph-svg { max-height: 44vh; }
.kt-root.is-projection .kt-graph.is-phased .kt-graph-svg { max-height: 62vh; }
.kt-root.is-projection .kt-body:has(.kt-graph.is-phased) { grid-template-columns: minmax(0, 1fr) minmax(300px, 340px); }
.kt-root.is-projection .kt-lanes { flex: 1 1 auto; min-height: 0; overflow-y: auto; scrollbar-width: thin; padding-right: 4px; }
.kt-root.is-projection .kt-lane { flex: none; }
.kt-root.is-projection .kt-side { position: static; max-height: none; min-height: 0; height: 100%; }
.kt-root.is-projection .kt-lane:is(.is-merged, .is-waiting):not(.is-followed):not(.is-focus) { grid-template-areas: "id live live" "id track track"; padding-top: 8px; padding-bottom: 6px; }
.kt-root.is-projection .kt-lane:is(.is-merged, .is-waiting):not(.is-followed):not(.is-focus) :is(.kt-lane-work, .kt-lane-stats, .kt-lane-model, .kt-deps) { display: none; }
.kt-root.is-projection .kt-lane:is(.is-merged, .is-waiting):not(.is-followed):not(.is-focus) .kt-avatar { width: 40px; height: 40px; font-size: 21px; border-radius: 12px; }
.kt-root.is-projection .kt-lane:is(.is-merged, .is-waiting):not(.is-followed):not(.is-focus) .kt-lane-id { grid-template-columns: 40px minmax(0, 1fr); }
.kt-root:fullscreen { background: var(--bg); }

/* ---------- Outputs: each step's deliverables ---------- */
.kt-grow { flex: 1 1 auto; }
.kt-folder { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.kt-folder-path { padding: 4px 8px; border-radius: 8px; background: var(--kt-glass); border: 1px solid var(--border); overflow-wrap: anywhere; user-select: all; }
.kt-folder-acts { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.kt-folder-panel { display: grid; gap: 8px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--card); }
.kt-folder-panel-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.kt-pane-folder { margin-top: 2px; font-size: .9em; }
.kt-pad { padding: 12px 14px; margin: 0; }
.kt-btn.is-small { padding: 4px 10px; font-size: .84em; border-radius: 8px; }
.kt-seg { display: inline-flex; gap: 4px; }
.kt-out-btn { grid-column: 1 / -1; justify-self: start; appearance: none; border: 0; background: none; padding: 2px 0 0; font: inherit; font-size: .84em; font-weight: 750; color: var(--accent); cursor: pointer; }
.kt-out-btn:hover { text-decoration: underline; }
.kt-file-open { appearance: none; border: 0; background: none; padding: 0; font: inherit; text-align: left; cursor: pointer; }
.kt-file-open:hover { color: var(--accent); text-decoration: underline; }
.kt-drawer-backdrop { position: fixed; inset: 0; z-index: 80; display: flex; justify-content: flex-end; background: color-mix(in srgb, #05030a 46%, transparent); animation: kt-fade-in .16s ease-out; }
.kt-drawer { width: min(1240px, 96vw); height: 100%; display: flex; flex-direction: column; min-height: 0; background: var(--bg, var(--card)); color: var(--text);
  border-left: 1px solid var(--border-strong, var(--border)); box-shadow: -30px 0 80px rgba(0, 0, 0, .38); }
.kt-drawer-top { display: flex; align-items: center; gap: 10px; padding: 14px 20px 10px; }
.kt-drawer-top h2 { margin: 0; font-size: 1.12em; color: var(--text-strong); }
.kt-steps { display: flex; gap: 6px; padding: 4px 20px 12px; overflow-x: auto; border-bottom: 1px solid var(--border); }
.kt-step { appearance: none; display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px 5px 6px; border-radius: 999px; cursor: pointer; white-space: nowrap; font: inherit; font-size: .9em; font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--kt-tone, var(--border)) 45%, var(--border)); background: color-mix(in srgb, var(--kt-tone, var(--muted)) 8%, var(--card)); color: var(--text); }
.kt-step-n { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; font-size: .78em; background: color-mix(in srgb, var(--kt-tone, var(--muted)) 30%, transparent); color: var(--text-strong); }
.kt-step.is-product { padding-left: 12px; }
.kt-step.is-on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 22%, var(--card)); color: var(--text-strong); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 35%, transparent); }
.kt-pane { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.kt-pane-head { padding: 12px 20px 0; display: grid; gap: 6px; }
.kt-pane-who { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.kt-pane-who h3 { margin: 0; font-size: 1.2em; color: var(--text-strong); }
.kt-pane-emoji { color: var(--text-strong); }
.kt-pane-scope { margin: 0; font-size: .86em; }
.kt-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border); margin-top: 4px; }
.kt-tab { appearance: none; border: 0; background: none; padding: 9px 14px; margin-bottom: -1px; font: inherit; font-weight: 750; color: var(--muted); cursor: pointer; border-bottom: 2px solid transparent; }
.kt-tab sub { font-size: .72em; margin-left: 3px; vertical-align: baseline; opacity: .8; }
.kt-tab[aria-selected="true"] { color: var(--text-strong); border-bottom-color: var(--accent); }
.kt-tab:hover { color: var(--text-strong); }
.kt-pane-body { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 14px 20px 26px; }
.kt-files-pane { display: grid; grid-template-columns: minmax(220px, 310px) minmax(0, 1fr); gap: 14px; height: 100%; min-height: 420px; }
.kt-flist { overflow: auto; min-height: 0; }
.kt-flist ul { list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 2px; }
.kt-flist-h { margin: 4px 0 6px; font-size: .78em; font-weight: 800; letter-spacing: .04em; color: var(--muted); }
.kt-frow { appearance: none; width: 100%; display: grid; grid-template-columns: 1.3em minmax(0, 1fr) auto; gap: 6px; align-items: center; padding: 5px 8px; border-radius: 8px; border: 1px solid transparent;
  background: none; font: inherit; font-size: .86em; color: var(--text); text-align: left; cursor: pointer; }
.kt-frow:hover { background: var(--kt-glass); }
.kt-frow.is-on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
.kt-frow-path { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kt-frow-num { font-size: .92em; white-space: nowrap; }
.kt-fview { min-width: 0; min-height: 0; display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 12px; background: var(--card); overflow: hidden; }
.kt-fview-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.kt-fview-path { font-weight: 750; color: var(--text-strong); overflow-wrap: anywhere; }
.kt-fview-body { flex: 1 1 auto; min-height: 0; overflow: auto; }
.kt-code { list-style: none; margin: 0; padding: 8px 0 12px; counter-reset: kt-ln; font-family: var(--mono, ui-monospace, monospace); font-size: 12.5px; line-height: 1.6; }
.kt-code li { counter-increment: kt-ln; display: grid; grid-template-columns: 4.4em minmax(0, 1fr); }
.kt-code li::before { content: counter(kt-ln); text-align: right; padding-right: 14px; color: var(--muted); opacity: .65; user-select: none; }
.kt-code code { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 1em; padding-right: 12px; }
.kt-code.is-diff li.is-add { background: color-mix(in srgb, var(--kt-ok) 15%, transparent); }
.kt-code.is-diff li.is-add code { color: var(--text-strong); }
.kt-code.is-diff li.is-del { background: color-mix(in srgb, var(--kt-bad) 15%, transparent); }
.kt-code.is-diff li.is-hunk { color: var(--kt-info); background: color-mix(in srgb, var(--kt-info) 8%, transparent); }
.kt-code.is-diff li.is-meta { color: var(--muted); }
.kt-md { padding: 14px 18px; overflow-wrap: anywhere; }
.kt-reply { max-width: 920px; padding: 4px 2px; }
.kt-rounds { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.kt-attempt-meta { margin: 0 0 10px; font-size: .86em; }
.kt-task { margin: 0; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--card); white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12.5px; line-height: 1.6; }
.kt-calls { list-style: none; margin: 0; padding: 0; display: grid; }
.kt-calls li { display: grid; grid-template-columns: 4.2em 1.7em minmax(0, 1fr); gap: 6px; align-items: baseline; padding: 5px 2px; border-bottom: 1px dashed var(--border); font-size: .86em; }
.kt-calls li span:last-child { overflow-wrap: anywhere; }
.kt-site { display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 520px; }
.kt-site-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.kt-site-bar a { color: var(--accent); font-weight: 750; }
.kt-site-frame { flex: 1 1 auto; width: 100%; min-height: 560px; border: 1px solid var(--border-strong, var(--border)); border-radius: 12px; background: #fff; }
.kt-site-log pre { margin: 6px 0 0; max-height: 220px; overflow: auto; padding: 10px 12px; border-radius: 10px; background: var(--card); border: 1px solid var(--border); font-size: 12px; white-space: pre-wrap; }
@media (max-width: 900px) { .kt-files-pane { grid-template-columns: minmax(0, 1fr); } }

/* ---------- motion ---------- */
@keyframes kt-halo { 0%, 100% { opacity: .1; transform: scale(.985); } 50% { opacity: .55; transform: scale(1.025); } }
@keyframes kt-spin { to { transform: rotate(360deg); } }
@keyframes kt-ants { to { stroke-dashoffset: -36; } }
@keyframes kt-beacon { 0%, 100% { opacity: .15; } 50% { opacity: .85; } }
@keyframes kt-blink { 0%, 100% { opacity: 1; } 50% { opacity: .3; } }
@keyframes kt-glow { 0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--kt-tone) 14%, transparent), 0 0 8px color-mix(in srgb, var(--kt-tone) 25%, transparent); }
  50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--kt-tone) 26%, transparent), 0 0 22px color-mix(in srgb, var(--kt-tone) 65%, transparent); } }
@keyframes kt-flash { 0% { opacity: 1; transform: scale(1); } 35% { opacity: .9; } 100% { opacity: 0; transform: scale(1.14); } }
@keyframes kt-flip { 0% { transform: rotateX(-92deg); filter: brightness(1.9); } 65% { transform: rotateX(14deg); } 100% { transform: rotateX(0); filter: none; } }
@keyframes kt-burst { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--kt-c) 80%, transparent); } 100% { box-shadow: 0 0 0 16px transparent; } }
@keyframes kt-slide-in { 0% { transform: translateX(-46px) scale(.88); opacity: 0; } 55% { opacity: 1; } 75% { transform: translateX(3px) scale(1.02); } 100% { transform: none; } }
@keyframes kt-ev-in { 0% { transform: translateY(-10px); opacity: 0; background: color-mix(in srgb, var(--accent) 28%, transparent); } 25% { transform: none; opacity: 1; } 100% { background: transparent; } }
@keyframes kt-bump { 0% { opacity: 1; box-shadow: inset 0 0 0 2px var(--kt-tone); background: color-mix(in srgb, var(--kt-tone) 16%, transparent); } 100% { opacity: 0; box-shadow: inset 0 0 0 2px var(--kt-tone); } }
@keyframes kt-pop { 0% { transform: scale(1); } 35% { transform: scale(1.22); color: var(--kt-ok); } 100% { transform: scale(1); } }
@keyframes kt-tick-in { 0% { opacity: 0; transform: translateY(5px); } 100% { opacity: 1; transform: none; } }
@keyframes kt-caret { 50% { opacity: 0; } }
@keyframes kt-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .kt-root *, .kt-root *::before, .kt-root *::after { animation: none !important; transition: none !important; }
}
.kt-root[data-motion="reduce"] *, .kt-root[data-motion="reduce"] *::before, .kt-root[data-motion="reduce"] *::after { animation: none !important; transition: none !important; }
`, Gn = 5e3, Kn = 1500;
function qn(e) {
	return e === "bounce" || e === "fail" ? "cross" : e === "pass" || e === "merge" ? "check" : "ring";
}
var Jn = class {
	now;
	spreadMs;
	base;
	seen = /* @__PURE__ */ new Set();
	order = [];
	queue = [];
	active = [];
	nextId = 1;
	skipToggle = !1;
	calmSince = null;
	hiddenAt = null;
	level;
	dropped = {
		duplicate: 0,
		merged: 0,
		admission: 0,
		level: 0,
		expired: 0
	};
	constructor(e) {
		this.now = e.now, this.spreadMs = e.spreadMs ?? 1600, this.base = e.reducedMotion ? 3 : 0, this.level = this.base;
	}
	get reducedMotion() {
		return this.base === 3;
	}
	get busy() {
		return this.hiddenAt === null && (this.queue.length > 0 || this.active.length > 0);
	}
	history(e) {
		for (let t of e) this.seen.has(t.key) || this.remember(t.key);
	}
	ingest(e, t = this.now()) {
		let n = [];
		for (let t of e) this.seen.has(t.key) ? this.dropped.duplicate++ : (this.remember(t.key), n.push(t));
		if (!n.length) return n;
		let r = Math.min(...n.map((e) => e.t)), i = (Math.max(...n.map((e) => e.t)) - r) * 1e3, a = i > this.spreadMs ? this.spreadMs / i : 1;
		for (let e of n) this.queue.push({
			...e,
			playAt: t + (e.t - r) * 1e3 * a
		});
		return this.queue.sort((e, t) => e.playAt - t.playAt), n;
	}
	frame(e = this.now()) {
		if (this.hiddenAt !== null) return {
			particles: [],
			level: this.level
		};
		for (; this.queue.length && this.queue[0].playAt <= e;) {
			let t = this.queue.shift();
			this.spawn(t, Math.max(t.playAt, e - 100));
		}
		let t = [];
		for (let n of this.active) e - n.start < n.dur ? t.push(n) : n.travel && t.push({
			...n,
			id: this.nextId++,
			from: n.to,
			travel: !1,
			shape: qn(n.tone),
			start: n.start + n.dur,
			dur: 850
		});
		return this.active = t.filter((t) => e - t.start < t.dur), {
			particles: this.active.map((t) => ({
				...t,
				p: Math.min(1, Math.max(0, (e - t.start) / t.dur))
			})),
			level: this.level
		};
	}
	report(e, t = this.now()) {
		this.base !== 3 && (e > 2 ? (this.level = Math.min(3, this.level + 1), this.calmSince = null) : e < 1.5 ? this.calmSince === null ? this.calmSince = t : t - this.calmSince >= 5e3 && this.level > this.base && (--this.level, this.calmSince = t) : this.calmSince = null);
	}
	setHidden(e, t = this.now()) {
		if (e) {
			this.hiddenAt === null && (this.hiddenAt = t);
			return;
		}
		if (this.hiddenAt === null) return;
		this.hiddenAt = null;
		let n = this.queue.filter((e) => t - e.playAt > Gn);
		this.dropped.expired += n.length, this.queue = this.queue.filter((e) => t - e.playAt <= Gn), this.active = this.active.filter((e) => t - e.start < e.dur);
	}
	remember(e) {
		this.seen.add(e), this.order.push(e), this.order.length > 2048 && this.seen.delete(this.order.shift());
	}
	spawn(e, t) {
		if (this.level >= 3 || this.level >= 2 && e.prio < 2 || this.level === 1 && e.prio < 3 && (this.skipToggle = !this.skipToggle, this.skipToggle)) {
			this.dropped.level++;
			return;
		}
		let n = `${e.kind}|${e.from}|${e.to}`, r = this.active.find((e) => `${e.kind}|${e.from}|${e.to}` === n && Math.abs(t - e.start) < 250);
		if (r) {
			r.count++, r.prio = Math.max(r.prio, e.prio), this.dropped.merged++;
			return;
		}
		let i = `${e.from}>${e.to}`, a = this.active.filter((e) => `${e.from}>${e.to}` === i);
		if (a.length >= 4 && !this.evict(a, e.prio) || this.active.length >= 32 && !this.evict(this.active, e.prio)) {
			this.dropped.admission++;
			return;
		}
		let o = e.from !== e.to;
		this.active.push({
			...e,
			id: this.nextId++,
			start: t,
			dur: o ? Kn : 900,
			count: 1,
			travel: o
		});
	}
	evict(e, t) {
		let n = e.filter((e) => e.prio < 3 && e.prio < t).sort((e, t) => e.prio - t.prio || e.start - t.start)[0];
		return n ? (this.active = this.active.filter((e) => e !== n), this.dropped.admission++, !0) : t === 3;
	}
}, Yn = "http://www.w3.org/2000/svg", Xn = 9, Zn = 96, Qn = (e) => typeof requestAnimationFrame == "function" ? requestAnimationFrame(e) : setTimeout(() => e(performance.now()), 16), $n = (e) => typeof cancelAnimationFrame == "function" ? cancelAnimationFrame(e) : clearTimeout(e), er = (e) => e < .5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2, tr = (e) => 1 - (1 - e) ** 3, Q = (e) => e.toFixed(1), nr = class {
	group;
	engine;
	opts;
	pool = [];
	routes = /* @__PURE__ */ new Map();
	handle = null;
	stopped = !1;
	constructor(e, t, n) {
		this.group = e, this.engine = t, this.opts = n;
	}
	get running() {
		return this.handle !== null;
	}
	wake() {
		!this.stopped && this.handle === null && this.engine.busy && (this.handle = (this.opts.raf ?? Qn)(this.tick));
	}
	dispose() {
		this.stopped = !0, this.handle !== null && (this.opts.caf ?? $n)(this.handle), this.handle = null;
		for (let e of this.pool) e.remove();
		this.pool.length = 0, this.routes.clear();
	}
	tick = () => {
		this.handle = null;
		let e = this.opts.perf ?? (() => performance.now()), t = e(), n = this.engine.frame(this.opts.now());
		this.draw(n.particles), this.engine.report(e() - t), this.opts.onFrame?.(n), this.engine.busy && !this.stopped ? this.handle = (this.opts.raf ?? Qn)(this.tick) : this.hideFrom(0);
	};
	shape(e) {
		let t = this.pool[e];
		if (t) return t;
		let n = document.createElementNS(Yn, "g"), r = (e) => {
			let t = document.createElementNS(Yn, "circle");
			return t.setAttribute("class", e), t;
		}, i = (e, t) => {
			let n = document.createElementNS(Yn, "path");
			return n.setAttribute("class", e), n.setAttribute("d", t), n;
		}, a = (e) => {
			let t = document.createElementNS(Yn, "polyline");
			return t.setAttribute("class", e), t;
		}, o = document.createElementNS(Yn, "rect");
		o.setAttribute("class", "kt-p-ring");
		let s = document.createElementNS(Yn, "text");
		return s.setAttribute("class", "kt-p-label"), s.setAttribute("text-anchor", "middle"), n.append(a("kt-p-tail-glow"), a("kt-p-tail"), r("kt-p-halo"), r("kt-p-head"), o, i("kt-p-cross", "M-6,-6 L6,6 M6,-6 L-6,6"), i("kt-p-check", "M-6,0 L-2,4.5 L6.5,-5"), s), this.group.appendChild(n), this.pool[e] = n, n;
	}
	route(e) {
		if (this.routes.has(e.id)) return this.routes.get(e.id) ?? null;
		let t = this.opts.path(e.from, e.to), n = t && t.length ? ke(t) : null;
		return this.routes.set(e.id, n), n;
	}
	draw(e) {
		let t = /* @__PURE__ */ new Set(), n = 0;
		for (let r of e) {
			if (t.add(r.id), r.travel) {
				let e = this.route(r);
				if (!e) continue;
				let t = this.shape(n++);
				this.mark(t, r);
				let i = Math.min(1.8, 1 + .25 * (r.count - 1)) * (r.prio >= 3 ? 1.15 : 1), a = er(r.p), o = Ae(e, a), s = t.children, c = Math.min(a, Zn / Math.max(1, e.total)), l = [];
				for (let t = 0; t <= Xn; t++) {
					let n = Ae(e, a - c + c * t / Xn);
					l.push(`${Q(n.x)},${Q(n.y)}`);
				}
				let u = l.join(" ");
				for (let e of [0, 1]) s[e].setAttribute("points", u), s[e].setAttribute("stroke-width", Q((e === 0 ? 9 : 3.2) * i)), s[e].setAttribute("display", "inline");
				rr(s[2], o, 12 * i), rr(s[3], o, 5.4 * i);
				for (let e = 4; e < 7; e++) s[e].setAttribute("display", "none");
				let d = s[7];
				r.label ? (d.textContent !== r.label && (d.textContent = r.label), d.setAttribute("x", Q(o.x)), d.setAttribute("y", Q(o.y - 15 * i)), d.setAttribute("display", "inline")) : d.setAttribute("display", "none"), t.setAttribute("opacity", Q(Math.min(1, r.p / .06, (1 - r.p) / .08 + .35)));
				continue;
			}
			let e = this.opts.box(r.to);
			if (!e) continue;
			let i = this.shape(n++);
			this.mark(i, r);
			let a = i.children;
			for (let e of [
				0,
				1,
				2,
				3,
				7
			]) a[e].setAttribute("display", "none");
			let o = tr(r.p), s = (r.shape === "spark" ? 7 : 26) * Math.min(1.6, 1 + .2 * (r.count - 1)) * o, c = a[4];
			c.setAttribute("x", Q(e.x - e.w / 2 - s)), c.setAttribute("y", Q(e.y - e.h / 2 - s)), c.setAttribute("width", Q(e.w + 2 * s)), c.setAttribute("height", Q(e.h + 2 * s)), c.setAttribute("rx", Q(e.rx + s / 2)), c.setAttribute("stroke-width", Q(r.shape === "spark" ? 2 : 4 - 2.5 * o)), c.setAttribute("display", "inline");
			let l = r.shape === "cross" ? a[5] : r.shape === "check" ? a[6] : null;
			for (let e of [5, 6]) a[e] !== l && a[e].setAttribute("display", "none");
			l && (l.setAttribute("display", "inline"), l.setAttribute("transform", `translate(${Q(e.x + e.w / 2 - 4)},${Q(e.y - e.h / 2 - 6 - 10 * o)}) scale(${(1.7 - .5 * o).toFixed(2)})`)), i.setAttribute("opacity", Q(1 - r.p * r.p));
		}
		for (let e of [...this.routes.keys()]) t.has(e) || this.routes.delete(e);
		this.hideFrom(n);
	}
	mark(e, t) {
		e.setAttribute("class", `kt-p is-${t.tone}${t.travel ? " is-travel" : " is-blip"}`), e.setAttribute("data-src", t.key), e.setAttribute("data-kind", t.kind), e.removeAttribute("display");
	}
	hideFrom(e) {
		for (let t = e; t < this.pool.length; t++) {
			let e = this.pool[t];
			e.getAttribute("display") !== "none" && (e.setAttribute("display", "none"), e.removeAttribute("data-src"));
		}
	}
};
function rr(e, t, n) {
	e.setAttribute("cx", Q(t.x)), e.setAttribute("cy", Q(t.y)), e.setAttribute("r", Q(n)), e.setAttribute("display", "inline");
}
//#endregion
//#region src/board/NodeCard.tsx
function ir({ run: e, lane: t, onOutputs: n }) {
	let r = C(t), i = M.has(t.status), a = e.tests.cases.filter((e) => e.owner === t.key), o = a.filter((e) => e.status === "pass").length, s = e.knowledge.hits.filter((e) => e.role === t.key).length, c = t.files.length, l = t.doing && t.doing !== t.assignment, u = i ? t.agent?.last_tool ? `Now: ${t.agent.last_tool}` : "Just started" : t.summary || (t.status === "waiting" ? t.awaiting_member ? "" : "Not its turn yet" : t.status === "skipped" ? "Not in this run" : ""), d = t.status === "waiting" ? t.awaiting_member : null;
	return /* @__PURE__ */ p("div", {
		className: "kt-ncard-body",
		children: [
			/* @__PURE__ */ p("p", {
				className: "kt-ncard-head",
				children: [
					/* @__PURE__ */ f(Z, {
						role: t.icon || t.key,
						size: 16
					}),
					" ",
					/* @__PURE__ */ f("b", { children: t.title }),
					/* @__PURE__ */ f("span", {
						className: `kt-pill tone-${r.tone}`,
						children: r.label
					})
				]
			}),
			t.assignment && /* @__PURE__ */ p("p", {
				className: "kt-ncard-task",
				children: [
					/* @__PURE__ */ f("span", {
						className: "kt-dim",
						children: "Task"
					}),
					" ",
					t.assignment
				]
			}),
			d && /* @__PURE__ */ p("p", {
				className: "kt-ncard-back",
				children: [
					"⏸ Not started: there is no member ",
					d,
					" under Agents yet. In Kiro Crew, go to Agents → Add team member and add it (use ",
					d,
					" for both name and template); it starts automatically once added."
				]
			}),
			l && /* @__PURE__ */ p("p", {
				className: "kt-ncard-back",
				children: ["This round: ", t.doing]
			}),
			u && /* @__PURE__ */ f("p", {
				className: "kt-ncard-did",
				children: u
			}),
			/* @__PURE__ */ p("ul", {
				className: "kt-ncard-facts",
				children: [
					(t.active_s > 0 || i) && /* @__PURE__ */ p("li", { children: ["Time ", I(i && t.agent ? t.agent.elapsed_s : t.active_s)] }),
					t.writable.length > 0 && c > 0 && /* @__PURE__ */ p("li", { children: [
						"Changed ",
						c,
						" file",
						c === 1 ? "" : "s",
						" ",
						/* @__PURE__ */ p("span", {
							className: "kt-ok",
							children: ["+", t.lines.added]
						}),
						" ",
						/* @__PURE__ */ p("span", {
							className: "kt-bad",
							children: ["−", t.lines.removed]
						}),
						" · ",
						t.commits.length,
						" commit",
						t.commits.length === 1 ? "" : "s"
					] }),
					t.writable.length === 0 && t.status !== "waiting" && /* @__PURE__ */ f("li", { children: "Read only: does not change code, only looks at the actual changes" }),
					a.length > 0 && /* @__PURE__ */ p("li", { children: [
						"Checks it owns: ",
						o,
						"/",
						a.length,
						" passing"
					] }),
					s > 0 && /* @__PURE__ */ p("li", { children: ["Knowledge-base lookups and data reads: ", s] }),
					t.credits !== null && /* @__PURE__ */ p("li", { children: [R(t.credits), " credits"] })
				]
			}),
			/* @__PURE__ */ p("div", {
				className: "kt-ncard-actions",
				children: [n && t.status !== "waiting" && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-btn",
					onClick: () => n(t.key),
					children: "View outputs"
				}), t.session && /* @__PURE__ */ f(zt, {
					slot: t.session,
					title: t.title
				})]
			})
		]
	});
}
//#endregion
//#region src/board/TeamGraph.tsx
var ar = "①②③④⑤⑥⑦⑧⑨⑩", or = 2400, sr = () => `-${Math.round(performance.now() % or)}ms`;
function cr(e) {
	let [t] = o(sr);
	return e ? void 0 : { animationDelay: t };
}
function lr({ w: e, h: t, reducedMotion: n }) {
	let r = cr(n);
	return /* @__PURE__ */ f("rect", {
		className: "kt-node-halo",
		x: -e / 2 - 8,
		y: -t / 2 - 8,
		width: e + 16,
		height: t + 16,
		rx: 23,
		style: r
	});
}
function ur({ reducedMotion: e }) {
	let t = cr(e);
	return /* @__PURE__ */ f("circle", {
		className: "kt-par-dot",
		cx: -38,
		cy: 0,
		r: 4,
		style: t
	});
}
var dr = (e) => e === "review" ? "construction" : e || "";
function fr({ run: e, lay: n, focus: s, onRole: c, flashes: l, reducedMotion: u, feed: d, onRetry: m, onGate: h, quiet: g = !1, onOutputs: _, phase: v = null, onPhase: y }) {
	let [b, x] = o(null), S = a(null), C = t((e, t) => {
		S.current && clearTimeout(S.current), S.current = setTimeout(() => x(e), t);
	}, []);
	r(() => () => void (S.current && clearTimeout(S.current)), []);
	let w = i(() => new Jn({
		now: () => performance.now(),
		reducedMotion: u
	}), [u]), T = a(null), E = qe(n, e.merges), D = ot(n), O = ot(E), k = i(() => new Map(e.roles.map((e) => [e.key, e])), [e.roles]), A = t((e) => {
		T.current?.dispose(), T.current = e && !u ? new nr(e, w, {
			path: (e, t) => Ke(D.current, e, t, O.current),
			box: (e) => He(D.current, e, O.current),
			now: () => performance.now()
		}) : null;
	}, [
		w,
		u,
		D,
		O
	]);
	r(() => (d.current = (e) => {
		w.ingest(e, performance.now()), T.current?.wake();
	}, () => {
		d.current = null;
	}), [w, d]), r(() => {
		let e = () => {
			w.setHidden(document.hidden, performance.now()), document.hidden || T.current?.wake();
		};
		return document.addEventListener("visibilitychange", e), () => document.removeEventListener("visibilitychange", e);
	}, [w]), r(() => () => T.current?.dispose(), []);
	let j = e.roles.filter((e) => N.has(e.status)).length, M = e.roles.filter((e) => e.status === "merged").length, P = `Team graph: ${e.roles.length} role${e.roles.length === 1 ? "" : "s"}, ${j} running, ${M} merged; tests ${e.tests.passed}/${e.tests.total}. Click a role to show only it.`;
	return /* @__PURE__ */ p("div", {
		className: `kt-graph${n.orch ? " is-phased" : ""}`,
		"data-testid": "kt-graph",
		children: [/* @__PURE__ */ p("div", {
			className: "kt-graph-stage",
			children: [/* @__PURE__ */ p("svg", {
				className: "kt-graph-svg",
				viewBox: `0 0 ${n.width} ${n.height}`,
				role: "group",
				"aria-label": P,
				children: [
					/* @__PURE__ */ f(mr, {}),
					/* @__PURE__ */ f("rect", {
						className: "kt-g-bg",
						x: 0,
						y: 0,
						width: n.width,
						height: n.height,
						fill: "url(#kt-dots)"
					}),
					n.phases.length ? /* @__PURE__ */ f(_r, {
						run: e,
						lay: n,
						byKey: k,
						reducedMotion: u,
						phase: v,
						onPhase: y
					}) : /* @__PURE__ */ f(hr, {
						run: e,
						lay: n,
						byKey: k,
						reducedMotion: u
					}),
					n.orch && /* @__PURE__ */ f(yr, {
						run: e,
						lay: n
					}),
					n.orch && /* @__PURE__ */ f(vr, {
						run: e,
						lay: n,
						flash: l.orch
					}),
					n.orch && /* @__PURE__ */ f(br, {
						run: e,
						lay: n
					}),
					/* @__PURE__ */ f("g", {
						className: "kt-edges",
						"aria-hidden": "true",
						children: n.edges.map((e) => {
							let t = k.get(e.from), n = k.get(e.to), r = t?.status === "merged" ? n && n.status !== "waiting" ? "used" : "ready" : "pending", i = !!s && (e.from === s || e.to === s);
							return /* @__PURE__ */ f("path", {
								className: `kt-edge is-${r}${s ? i ? " is-hot" : " is-dim" : ""}`,
								d: e.d,
								markerEnd: `url(#kt-arrow-${r})`
							}, `${e.from}>${e.to}`);
						})
					}),
					/* @__PURE__ */ f(xr, {
						run: e,
						lay: n,
						head: E,
						byKey: k,
						focus: s,
						flash: l.run
					}),
					/* @__PURE__ */ f(Sr, {
						run: e,
						lay: n,
						flash: l.tests
					}),
					/* @__PURE__ */ p("g", {
						className: "kt-nodes",
						children: [
							e.roles.map((t) => {
								let r = n.nodes.get(t.key);
								return r ? /* @__PURE__ */ f(Er, {
									lane: t,
									lanes: e.roles,
									box: r,
									focus: s,
									off: !s && !!v && dr(t.phase) !== v,
									flash: l[t.key],
									onRole: c,
									reducedMotion: u,
									quiet: g,
									onHover: (e) => C(e ? t.key : null, e ? 300 : 250)
								}, t.key) : null;
							}),
							m && e.roles.filter((e) => e.status === "failed" && n.nodes.get(e.key)).map((e) => /* @__PURE__ */ f(Dr, {
								lane: e,
								box: n.nodes.get(e.key),
								onRetry: m
							}, `retry-${e.key}`)),
							e.roles.filter((e) => (e.gate === "pending" || e.gate === "discussing") && n.nodes.get(e.key)).map((e) => /* @__PURE__ */ f(Or, {
								lane: e,
								box: n.nodes.get(e.key),
								onGate: h
							}, `gate-${e.key}`))
						]
					}),
					/* @__PURE__ */ f("g", {
						className: "kt-particles",
						"aria-hidden": "true",
						ref: A
					})
				]
			}), b && k.get(b) && n.nodes.get(b) && (() => {
				let t = n.nodes.get(b), r = t.x > n.width * .62, i = {
					...t.y > n.height * .55 ? { bottom: `${Math.max(1, (n.height - (t.y + 40)) / n.height * 100)}%` } : { top: `${Math.max(1, (t.y - 40) / n.height * 100)}%` },
					...r ? { right: `${(n.width - (t.x - 92 - 10)) / n.width * 100}%` } : { left: `${(t.x + 92 + 10) / n.width * 100}%` }
				};
				return /* @__PURE__ */ f("div", {
					ref: pr,
					className: "kt-ncard",
					style: i,
					"data-testid": "kt-ncard",
					role: "dialog",
					"aria-label": `What ${k.get(b).title} did`,
					onMouseEnter: () => C(b, 0),
					onMouseLeave: () => C(null, 200),
					children: /* @__PURE__ */ f(ir, {
						run: e,
						lane: k.get(b),
						onOutputs: _
					})
				}, b);
			})()]
		}), /* @__PURE__ */ f(Ar, {})]
	});
}
function pr(e) {
	let t = e?.parentElement?.clientHeight;
	if (!e || !t) return;
	let n = Math.max(4, Math.min(e.offsetTop, t - e.offsetHeight - 4));
	n !== e.offsetTop && (e.style.top = `${n}px`, e.style.bottom = "auto");
}
function mr() {
	return /* @__PURE__ */ p("defs", { children: [
		/* @__PURE__ */ f("pattern", {
			id: "kt-dots",
			width: 22,
			height: 22,
			patternUnits: "userSpaceOnUse",
			children: /* @__PURE__ */ f("circle", {
				className: "kt-g-dot",
				cx: 2,
				cy: 2,
				r: 1
			})
		}),
		/* @__PURE__ */ f("pattern", {
			id: "kt-hatch",
			width: 9,
			height: 9,
			patternUnits: "userSpaceOnUse",
			patternTransform: "rotate(45)",
			children: /* @__PURE__ */ f("rect", {
				className: "kt-hatch-line",
				x: 0,
				y: 0,
				width: 3.5,
				height: 9
			})
		}),
		[
			"pending",
			"ready",
			"used"
		].map((e) => /* @__PURE__ */ f("marker", {
			id: `kt-arrow-${e}`,
			viewBox: "0 0 10 10",
			refX: 8.5,
			refY: 5,
			markerWidth: 7,
			markerHeight: 7,
			orient: "auto-start-reverse",
			children: /* @__PURE__ */ f("path", {
				className: `kt-arrow is-${e}`,
				d: "M0,0.8 L9,5 L0,9.2 Z"
			})
		}, e))
	] });
}
function hr({ run: e, lay: t, byKey: n, reducedMotion: r }) {
	return /* @__PURE__ */ f("g", {
		className: "kt-stages",
		"aria-hidden": "true",
		children: t.stages.map((e) => {
			let i = e.keys.map((e) => n.get(e)).filter((e) => !!e), a = i.filter((e) => M.has(e.status)).length, o = i.filter((e) => N.has(e.status)).length, s = H(`${ar[e.index] ?? e.index + 1} ${i.map((e) => e.title).join(" ‖ ")}`, 16);
			return /* @__PURE__ */ p("g", {
				className: `kt-stage${a ? " is-live" : ""}`,
				"data-stage": e.index,
				children: [
					/* @__PURE__ */ f("rect", {
						className: "kt-stage-band",
						x: e.x - 92 - 14,
						y: 8,
						width: 212,
						height: t.rail.y - 34,
						rx: 18
					}),
					/* @__PURE__ */ f("text", {
						className: "kt-stage-title",
						x: e.x,
						y: 30,
						textAnchor: "middle",
						children: s
					}),
					o >= 2 && /* @__PURE__ */ p("g", {
						className: "kt-par",
						transform: `translate(${e.x},54)`,
						children: [
							/* @__PURE__ */ f("rect", {
								x: -52,
								y: -12,
								width: 104,
								height: 24,
								rx: 12
							}),
							/* @__PURE__ */ f(ur, { reducedMotion: r }),
							/* @__PURE__ */ p("text", {
								x: 6,
								y: 4.5,
								textAnchor: "middle",
								children: ["Running now ", o]
							})
						]
					})
				]
			}, e.index);
		})
	});
}
function gr(e, t) {
	let n = [...new Set(t.flatMap((e) => [...e.stage.matchAll(/(\d+)\.\d+/g)].map((e) => e[1])))].sort().map((e) => j.find((t) => t.n === e)).filter((e) => !!e);
	return n.length < 2 ? e : {
		n: `${n[0].n}–${n[n.length - 1].n}`,
		title: n.map((e) => e.title).join(" · "),
		en: n.map((e) => e.en).join(" · ")
	};
}
function _r({ run: e, lay: t, byKey: n, reducedMotion: r, phase: i, onPhase: a }) {
	return /* @__PURE__ */ f("g", {
		className: "kt-phases",
		"aria-hidden": "true",
		children: t.phases.map((e) => {
			let o = t.stages.filter((t) => t.phase === e.key).flatMap((e) => e.keys).map((e) => n.get(e)).filter((e) => !!e), s = gr(e, o), c = o.some((e) => M.has(e.status)), l = o.filter((e) => N.has(e.status)).length, u = o.length > 0 && o.every((e) => E(e) || e.status === "skipped"), d = (e.x1 + e.x2) / 2;
			return /* @__PURE__ */ p("g", {
				className: `kt-phase${e.used ? "" : " is-unused"}${c ? " is-live" : ""}${u ? " is-done" : ""}${i ? i === e.key ? " is-focus" : " is-off" : ""}`,
				"data-phase": e.key,
				children: [
					/* @__PURE__ */ f("rect", {
						className: "kt-phase-band",
						x: e.x1,
						y: 8,
						width: e.x2 - e.x1,
						height: t.rail.y - 34,
						rx: 18
					}),
					/* @__PURE__ */ p("text", {
						className: `kt-phase-title${a && e.used && e.key !== "init" ? " is-pick" : ""}`,
						x: d,
						y: 30,
						textAnchor: "middle",
						onClick: a && e.used && e.key !== "init" ? () => a(e.key) : void 0,
						children: [
							s.n,
							" ",
							s.title,
							e.x2 - e.x1 > 230 && s.en !== s.title && /* @__PURE__ */ f("tspan", {
								className: "kt-phase-en",
								dx: 6,
								children: s.en
							})
						]
					}),
					/* @__PURE__ */ f("text", {
						className: "kt-phase-stages",
						x: d,
						y: 48,
						textAnchor: "middle",
						children: e.key === "init" ? "Pick flow · select team · create repository" : H([...new Set(o.flatMap((e) => e.stage.split(/\s*·\s*/)).filter(Boolean))].join(" · "), Math.max(6, (e.x2 - e.x1) / 13))
					}),
					!e.used && /* @__PURE__ */ f("text", {
						className: "kt-phase-note",
						x: d,
						y: t.rail.y / 2,
						textAnchor: "middle",
						children: e.key === "operation" ? "Not run this time" : "Not needed this time"
					}),
					l >= 2 && /* @__PURE__ */ p("g", {
						className: "kt-par",
						transform: `translate(${d},${e.x2 - e.x1 > 300 ? 84 : 72})`,
						children: [
							/* @__PURE__ */ f("rect", {
								x: -52,
								y: -12,
								width: 104,
								height: 24,
								rx: 12
							}),
							/* @__PURE__ */ f(ur, { reducedMotion: r }),
							/* @__PURE__ */ p("text", {
								x: 6,
								y: 4.5,
								textAnchor: "middle",
								children: ["Running now ", l]
							})
						]
					})
				]
			}, e.key);
		})
	});
}
function vr({ run: e, lay: t, flash: n }) {
	let r = t.orch, { w: i, h: a } = Be, o = e.status !== "done" && e.status !== "failed" && e.status !== "stopped";
	return /* @__PURE__ */ p("g", {
		className: `kt-orch${o ? " is-active" : ""}`,
		transform: `translate(${r.x},${r.y})`,
		"data-testid": "kt-orch",
		children: [
			/* @__PURE__ */ f("title", { children: `Orchestrator: does the AI-DLC initialization (picks the flow, selects the team, creates the repository), then dispatches, merges, runs checks and sends work back by dependency. It is a deterministic program, not a model. Implementation: ${e.team.orchestrator}` }),
			/* @__PURE__ */ f("rect", {
				className: "kt-orch-body",
				x: -i / 2,
				y: -a / 2,
				width: i,
				height: a,
				rx: 18
			}),
			/* @__PURE__ */ f("text", {
				className: "kt-orch-title",
				y: -14,
				textAnchor: "middle",
				children: "Orchestrator"
			}),
			/* @__PURE__ */ f("text", {
				className: "kt-orch-cn",
				y: 6,
				textAnchor: "middle",
				children: "Orchestrator"
			}),
			/* @__PURE__ */ f("text", {
				className: "kt-orch-sub",
				y: 26,
				textAnchor: "middle",
				children: "0 Initialization · team selection, repository"
			}),
			n && /* @__PURE__ */ f("rect", {
				className: `kt-node-flash is-${n.tone}`,
				x: -i / 2 - 5,
				y: -a / 2 - 5,
				width: i + 10,
				height: a + 10,
				rx: 22
			}, n.n)
		]
	});
}
function yr({ run: e, lay: t }) {
	let n = e.roles.filter((e) => M.has(e.status) || e.status === "queued");
	return /* @__PURE__ */ f("g", {
		className: "kt-cmds",
		"aria-hidden": "true",
		children: n.map((e) => {
			let n = We(t, e.key);
			return n ? /* @__PURE__ */ f("path", {
				className: `kt-cmd is-${e.status}`,
				d: Oe(n)
			}, e.key) : null;
		})
	});
}
function br({ run: e, lay: t }) {
	let n = t.orch, r = n.y + Be.h / 2 + J.top, i = Be.w + 12, a = new Map(e.roles.map((e) => [e.key, e])), o = new Map((e.roster ?? []).map((e) => [e.key, e])), s = _e(e.roles, e.roster), c = e.roles.filter((e) => e.status !== "skipped").length, l = J.title;
	return /* @__PURE__ */ p("g", {
		className: "kt-roster",
		transform: `translate(${n.x},${r})`,
		"data-testid": "kt-roster",
		children: [/* @__PURE__ */ f("text", {
			className: "kt-roster-title",
			y: 0,
			textAnchor: "middle",
			children: e.roster?.length ? `Team of ${e.roster.length} · ${c} picked this run` : `Team · ${c} picked`
		}), s.map((e) => {
			let t = l;
			l += J.group;
			let n = e.keys.map((e) => {
				let t = a.get(e), n = l;
				if (l += J.row, !t || t.status === "skipped") {
					let r = t?.title ?? o.get(e)?.title ?? e;
					return /* @__PURE__ */ p("g", {
						className: "kt-roster-item is-bench",
						transform: `translate(0,${n})`,
						"data-state": "bench",
						children: [
							/* @__PURE__ */ f("title", { children: `${r}: ${t?.status === "skipped" && t.summary ? `${t.summary}, ` : "this requirement does not need this post, "}so it is not in the workflow` }),
							/* @__PURE__ */ f("rect", {
								x: -i / 2 + 8,
								y: -7.5,
								width: i - 8,
								height: 15,
								rx: 7.5
							}),
							/* @__PURE__ */ f("circle", {
								cx: -i / 2 + 18,
								cy: .5,
								r: 3.5
							}),
							/* @__PURE__ */ f("text", {
								x: -i / 2 + 28,
								y: 4.5,
								children: H(r, 8)
							})
						]
					}, e);
				}
				let r = M.has(t.status) || t.status === "queued" ? "busy" : t.status === "waiting" ? "team" : "used";
				return /* @__PURE__ */ p("g", {
					className: `kt-roster-item is-team${r === "team" ? "" : " is-used"}${r === "busy" ? " is-busy" : ""}`,
					transform: `translate(0,${n})`,
					"data-state": r,
					children: [
						/* @__PURE__ */ f("title", { children: `${t.title}: ${t.doing || t.mission}` }),
						/* @__PURE__ */ f("rect", {
							x: -i / 2 + 8,
							y: -7.5,
							width: i - 8,
							height: 15,
							rx: 7.5
						}),
						/* @__PURE__ */ f("circle", {
							cx: -i / 2 + 18,
							cy: .5,
							r: 3.5
						}),
						/* @__PURE__ */ f("text", {
							x: -i / 2 + 28,
							y: 4.5,
							children: H(t.title, 8)
						})
					]
				}, t.key);
			});
			return l += J.gap, /* @__PURE__ */ p("g", { children: [/* @__PURE__ */ p("text", {
				className: "kt-roster-group",
				x: -i / 2,
				y: t + 4,
				children: [
					U(e.key),
					" expert",
					e.keys.length > 1 ? ` ×${e.keys.length}` : ""
				]
			}), n] }, e.key);
		})]
	});
}
function xr({ run: e, lay: t, head: n, byKey: r, focus: i, flash: a }) {
	let { x1: o, x2: s, y: c } = t.rail, l = /* @__PURE__ */ new Map();
	for (let t of e.merges) {
		let e = l.get(t.role);
		l.set(t.role, {
			status: t.status,
			sha: t.sha,
			count: (e?.count ?? 0) + 1,
			note: t.note
		});
	}
	let u = e.merges.some((e) => e.status === "merged");
	return /* @__PURE__ */ p("g", {
		className: "kt-rail",
		"data-testid": "kt-rail",
		children: [
			/* @__PURE__ */ f("line", {
				className: "kt-rail-base",
				x1: o,
				y1: c,
				x2: s,
				y2: c
			}),
			u && /* @__PURE__ */ f("line", {
				className: "kt-rail-fill",
				x1: o,
				y1: c,
				x2: n,
				y2: c
			}),
			/* @__PURE__ */ p("text", {
				className: "kt-rail-label",
				x: o,
				y: c - 18,
				children: ["Run branch ", /* @__PURE__ */ f("tspan", {
					className: "kt-mono",
					children: e.branch
				})]
			}),
			/* @__PURE__ */ p("text", {
				className: "kt-rail-sub",
				x: o,
				y: c + 24,
				children: ["Base ", /* @__PURE__ */ f("tspan", {
					className: "kt-mono",
					children: e.base
				})]
			}),
			[...l.entries()].map(([e, n]) => {
				let a = t.mergeX.get(e), o = r.get(e);
				if (a === void 0 || !o) return null;
				let s = `${o.title}: ${n.status === "conflict" ? `merge conflict${n.note ? ` (${n.note})` : ""}` : `merged ${n.sha}`}${n.count > 1 ? `, merged ${n.count} times` : ""}`;
				return /* @__PURE__ */ p("g", {
					className: `kt-rail-dot is-${n.status}${i && i !== e ? " is-dim" : ""}`,
					transform: `translate(${a},${c})`,
					children: [
						/* @__PURE__ */ f("title", { children: s }),
						/* @__PURE__ */ f("circle", { r: 10 }),
						n.status === "conflict" ? /* @__PURE__ */ f("text", {
							y: .5,
							textAnchor: "middle",
							dominantBaseline: "central",
							children: "✕"
						}) : /* @__PURE__ */ f(Et, {
							role: o.icon || o.key,
							cx: 0,
							cy: 0,
							size: 13
						})
					]
				}, e);
			}),
			a && /* @__PURE__ */ f("circle", {
				className: `kt-rail-flash is-${a.tone}`,
				cx: n,
				cy: c,
				r: 14
			}, a.n)
		]
	});
}
function Sr({ run: e, lay: t, flash: n }) {
	let r = t.station, { passed: i, failed: a, total: o } = e.tests, s = r.r - 5, c = 2 * Math.PI * s, l = o ? i / o * c : 0, u = o ? a / o * c : 0;
	return /* @__PURE__ */ p("g", {
		className: `kt-station is-${o ? a ? "fail" : "pass" : "none"}`,
		transform: `translate(${r.x},${r.y})`,
		"data-testid": "kt-station",
		role: "img",
		"aria-label": o ? `Tests ${i}/${o}` : "Tests have not run yet",
		children: [
			/* @__PURE__ */ f("circle", {
				className: "kt-station-bg",
				r: r.r
			}),
			/* @__PURE__ */ f("circle", {
				className: "kt-station-track",
				r: s
			}),
			l > 0 && /* @__PURE__ */ f("circle", {
				className: "kt-station-pass",
				r: s,
				strokeDasharray: `${l} ${c}`,
				transform: "rotate(-90)"
			}),
			u > 0 && /* @__PURE__ */ f("circle", {
				className: "kt-station-fail",
				r: s,
				strokeDasharray: `${u} ${c}`,
				strokeDashoffset: -l,
				transform: "rotate(-90)"
			}),
			/* @__PURE__ */ f("text", {
				className: "kt-station-num",
				y: 1,
				textAnchor: "middle",
				dominantBaseline: "central",
				children: o ? `${i}/${o}` : "—"
			}),
			/* @__PURE__ */ f("text", {
				className: "kt-station-label",
				y: -r.r - 9,
				textAnchor: "middle",
				children: "🧪 Tests"
			}),
			n && /* @__PURE__ */ f("circle", {
				className: `kt-station-flash is-${n.tone}`,
				r: r.r + 3
			}, n.n)
		]
	});
}
function Cr({ lane: e }) {
	let t = _t(), n = e.agent, r = !!n && (M.has(e.status) || e.status === "queued");
	return /* @__PURE__ */ f(d, { children: I(r && n ? n.elapsed_s + t : e.active_s) });
}
function wr({ lane: e }) {
	let t = gt(), n = e.agent?.last_activity;
	if (!n) return /* @__PURE__ */ f(d, { children: "Stalled" });
	let r = Math.max(0, t - n);
	return /* @__PURE__ */ p(d, { children: ["Quiet for ", r < 60 ? `${Math.round(r)} s` : `${Math.round(r / 60)} min`] });
}
function Tr(e, t) {
	if (e.status === "merged" && e.gate === "pending") return `Awaiting approval${e.gate_label ? `: ${e.gate_label}` : ""}`;
	switch (e.status) {
		case "skipped": return H(e.summary || "Skipped: not needed for this project", 8.2);
		case "waiting": return e.awaiting_member ? "Waiting for a member to be added" : H(te(e, t), 8.2);
		case "queued": return "Waiting for KiroCrew to release it";
		case "running": return /* @__PURE__ */ p(d, { children: ["Running · ", /* @__PURE__ */ f(Cr, { lane: e })] });
		case "fixing": return /* @__PURE__ */ p(d, { children: ["Fixing · ", /* @__PURE__ */ f(Cr, { lane: e })] });
		case "stalled": return /* @__PURE__ */ f(wr, { lane: e });
		case "awaiting_approval": return "✋ Needs your approval";
		case "done": return e.writable.length ? "Done · waiting to merge" : `Done · ${I(e.active_s)}`;
		case "merged": return e.deployed ? `Deployed · :${e.deployed.url.split(":").pop()?.replace(/\/$/, "")}` : `Merged · ${I(e.active_s)}`;
		case "failed": return "✕ Failed";
		default: return C(e).label;
	}
}
function Er({ lane: e, lanes: t, box: n, focus: r, off: i = !1, flash: a, onRole: o, reducedMotion: s, quiet: c = !1, onHover: l }) {
	let u = C(e), d = N.has(e.status), m = !c && M.has(e.status) && e.agent?.last_tool ? e.agent.last_tool : null, h = [];
	e.attempt > 1 && h.push({
		text: `Round ${e.attempt}`,
		tone: "fix"
	}), e.violations.length && h.push({
		text: `Out of bounds ${e.violations.length}`,
		tone: "bad"
	}), e.status === "queued" && h.push({
		text: "Queued",
		tone: "queue"
	}), e.status === "stalled" && h.push({
		text: "⚠ Stalled",
		tone: "warn"
	}), e.gate === "pending" && h.push({
		text: "Needs your approval",
		tone: "gate"
	}), e.awaiting_member && e.status === "waiting" && h.push({
		text: "Missing member",
		tone: "warn"
	});
	let g = r === e.key, _ = `${e.stage ? `${e.stage} · ` : ""}${e.title}${e.doing ? ` (${e.doing})` : ""}: ${u.label}${e.attempt > 1 ? `, round ${e.attempt}` : ""}${e.violations.length ? `, changed out of bounds: ${e.violations.join(", ")}` : ""}${e.status === "waiting" ? `, ${te(e, t)}` : ""}${m ? `, now: ${m}` : ""}`, v = (t) => {
		(t.key === "Enter" || t.key === " ") && (t.preventDefault(), o(e.key));
	}, y = 84;
	return /* @__PURE__ */ p("g", {
		className: `kt-node is-${e.status}${E(e) ? " is-final" : ""}${r ? g ? " is-focus" : " is-dim" : i ? " is-dim" : ""}`,
		transform: `translate(${n.x},${n.y})`,
		"data-role": e.key,
		"data-status": e.status,
		role: "button",
		tabIndex: 0,
		"aria-label": _,
		"aria-pressed": g,
		onClick: () => o(e.key),
		onKeyDown: v,
		onMouseEnter: () => l?.(!0),
		onMouseLeave: () => l?.(!1),
		children: [
			/* @__PURE__ */ f("title", { children: _ }),
			(d || e.status === "awaiting_approval") && /* @__PURE__ */ f(lr, {
				w: 184,
				h: 80,
				reducedMotion: s
			}),
			/* @__PURE__ */ f("rect", {
				className: "kt-node-body",
				x: -92,
				y: -40,
				width: 184,
				height: 80,
				rx: 16
			}),
			e.status === "stalled" && /* @__PURE__ */ f("rect", {
				className: "kt-node-hatch",
				x: -92,
				y: -40,
				width: 184,
				height: 80,
				rx: 16,
				fill: "url(#kt-hatch)"
			}),
			e.status === "queued" && /* @__PURE__ */ f("rect", {
				className: "kt-node-ants",
				x: -96,
				y: -44,
				width: 192,
				height: 88,
				rx: 19
			}),
			/* @__PURE__ */ f("circle", {
				className: "kt-node-avatar",
				cx: -59,
				cy: 0,
				r: 22.5
			}),
			d && /* @__PURE__ */ f("circle", {
				className: "kt-node-spin",
				cx: -59,
				cy: 0,
				r: 27
			}),
			/* @__PURE__ */ f(Et, {
				role: e.icon || e.key,
				cx: -59,
				cy: 0,
				size: 24,
				className: "kt-node-emoji"
			}),
			/* @__PURE__ */ p("text", {
				className: `kt-node-title${e.title.length >= 5 ? " is-long" : ""}`,
				x: -26,
				y: -15,
				children: [H(e.title, 6.2), /* @__PURE__ */ f("tspan", {
					className: "kt-node-agent",
					dx: 5,
					children: "agent"
				})]
			}),
			e.doing && /* @__PURE__ */ f("text", {
				className: `kt-node-task${e.doing === e.assignment ? "" : " is-sent-back"}`,
				x: -26,
				y: 4,
				children: H(e.doing, 9.2)
			}),
			/* @__PURE__ */ f("text", {
				className: "kt-node-sub",
				x: -26,
				y: e.doing ? 23 : 16,
				children: Tr(e, t)
			}),
			E(e) && /* @__PURE__ */ p("g", {
				className: "kt-node-check",
				transform: "translate(78,26)",
				children: [/* @__PURE__ */ f("circle", { r: 9 }), /* @__PURE__ */ f("path", { d: "M-4,0 L-1.2,3 L4.2,-3.2" })]
			}),
			h.map((e) => {
				let t = Math.max(34, e.text.length * 11 + 8);
				y -= t;
				let n = y;
				return y -= 4, /* @__PURE__ */ p("g", {
					className: `kt-node-badge is-${e.tone}`,
					transform: `translate(${n + t / 2},-40)`,
					children: [/* @__PURE__ */ f("rect", {
						x: -t / 2,
						y: -10,
						width: t,
						height: 20,
						rx: 10
					}), /* @__PURE__ */ f("text", {
						y: 4.5,
						textAnchor: "middle",
						children: e.text
					})]
				}, e.text);
			}),
			m && /* @__PURE__ */ p("text", {
				className: "kt-node-ticker",
				x: 0,
				y: 58,
				textAnchor: "middle",
				children: ["▸ ", H(m, 25)]
			}),
			a && /* @__PURE__ */ f("rect", {
				className: `kt-node-flash is-${a.tone}`,
				x: -97,
				y: -45,
				width: 194,
				height: 90,
				rx: 20
			}, a.n),
			/* @__PURE__ */ f("rect", {
				className: "kt-node-focus",
				x: -97,
				y: -45,
				width: 194,
				height: 90,
				rx: 20
			})
		]
	});
}
function Dr({ lane: e, box: t, onRetry: n }) {
	let r = () => n(e.key);
	return /* @__PURE__ */ p("g", {
		className: "kt-node-retry",
		transform: `translate(${t.x + 92 - 34},${t.y + 40 + 14})`,
		role: "button",
		tabIndex: 0,
		"aria-label": `Retry ${e.title}`,
		onClick: r,
		onKeyDown: (e) => {
			(e.key === "Enter" || e.key === " ") && (e.preventDefault(), r());
		},
		children: [
			/* @__PURE__ */ f("title", { children: `Retry ${e.title}: give it another round` }),
			/* @__PURE__ */ f("rect", {
				x: -32,
				y: -12,
				width: 64,
				height: 24,
				rx: 12
			}),
			/* @__PURE__ */ f("text", {
				y: 4.5,
				textAnchor: "middle",
				children: "↻ Retry"
			})
		]
	});
}
function Or({ lane: e, box: t, onGate: n }) {
	let r = e.gate_label || e.title;
	if (e.gate === "discussing") return /* @__PURE__ */ f("g", {
		className: "kt-gate",
		transform: `translate(${t.x},${t.y + 40 + 22})`,
		"data-testid": "kt-gate",
		children: /* @__PURE__ */ p("g", {
			className: "kt-gate-chip is-talking is-static",
			"aria-label": `${e.title} is answering your discussion`,
			children: [/* @__PURE__ */ f("rect", {
				x: -56,
				y: -13,
				width: 112,
				height: 26,
				rx: 13
			}), /* @__PURE__ */ f("text", {
				y: 5,
				textAnchor: "middle",
				children: "Discussing · answering"
			})]
		})
	});
	let i = (t, r, i, a) => {
		let o = () => n?.(e.key, t);
		return /* @__PURE__ */ p("g", {
			className: `kt-gate-chip is-${t}${n ? "" : " is-static"}`,
			transform: `translate(${i},0)`,
			role: n ? "button" : void 0,
			tabIndex: n ? 0 : void 0,
			"aria-label": n ? `${r}` : void 0,
			onClick: o,
			onKeyDown: (e) => {
				(e.key === "Enter" || e.key === " ") && (e.preventDefault(), o());
			},
			children: [/* @__PURE__ */ f("rect", {
				x: -a / 2,
				y: -13,
				width: a,
				height: 26,
				rx: 13
			}), /* @__PURE__ */ f("text", {
				y: 5,
				textAnchor: "middle",
				children: r
			})]
		});
	};
	return /* @__PURE__ */ f("g", {
		className: "kt-gate",
		transform: `translate(${t.x},${t.y + 40 + 22})`,
		"data-testid": "kt-gate",
		children: e.can_discuss ? /* @__PURE__ */ p(d, { children: [
			e.overrule ? i("approve", "Approve anyway", -70, 132) : i("approve", `✓ Approve ${r}`, -70, 132),
			i("discuss", "Discuss", 34, 64),
			i("revise", e.overrule ? "Another round" : "Send back", e.overrule ? 118 : 108, e.overrule ? 96 : 76)
		] }) : /* @__PURE__ */ p(d, { children: [e.overrule ? i("approve", "Approve anyway", -66, 132) : i("approve", `✓ Approve ${r}`, -66, 132), i("revise", e.overrule ? "Another round" : "Send back", e.overrule ? 62 : 50, e.overrule ? 96 : 84)] })
	});
}
var kr = [
	{
		status: "running",
		text: "Running"
	},
	{
		status: "fixing",
		text: "Fixing"
	},
	{
		status: "queued",
		text: "Queued"
	},
	{
		status: "stalled",
		text: "Stalled"
	},
	{
		status: "awaiting_approval",
		text: "Needs your approval"
	},
	{
		status: "done",
		text: "Done · waiting to merge"
	},
	{
		status: "merged",
		text: "Merged"
	},
	{
		status: "failed",
		text: "Failed"
	},
	{
		status: "waiting",
		text: "Waiting for upstream"
	},
	{
		status: "skipped",
		text: "Skipped"
	}
];
function Ar() {
	return /* @__PURE__ */ p("div", {
		className: "kt-legend",
		role: "note",
		"aria-label": "Legend",
		children: [
			kr.map((e) => /* @__PURE__ */ p("span", {
				className: `kt-legend-item is-${e.status}`,
				children: [/* @__PURE__ */ f("i", { "aria-hidden": "true" }), e.text]
			}, e.status)),
			/* @__PURE__ */ f("span", {
				className: "kt-legend-sep",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-legend-item is-p-handoff",
				children: [/* @__PURE__ */ f("b", { "aria-hidden": "true" }), "Handoff"]
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-legend-item is-p-merge",
				children: [/* @__PURE__ */ f("b", { "aria-hidden": "true" }), "Merged into the run branch"]
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-legend-item is-p-pass",
				children: [/* @__PURE__ */ f("b", { "aria-hidden": "true" }), "Tests all green"]
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-legend-item is-p-fail",
				children: [/* @__PURE__ */ f("b", { "aria-hidden": "true" }), "Tests red / sent back"]
			})
		]
	});
}
//#endregion
//#region src/board/Knowledge.tsx
function jr(e) {
	let t = e.knowledge.source;
	if (!t) return "";
	if (t.present === null) return "Reading…";
	if (!t.present) return `Not attached yet: add ${t.path || "knowledge/larkspur"} in the Crew sidebar under Knowledge base > Sources`;
	let n = t.status === "synced" ? "Synced" : t.files_total ? `Indexing ${t.files_done ?? 0}/${t.files_total}` : t.status || "Indexing";
	return `${t.items ?? 0} document${t.items === 1 ? "" : "s"} · ${n}`;
}
function Mr({ s: e }) {
	let t = e.rules.length ? `${e.rules[0]}${e.rules.length > 1 ? `–${e.rules[e.rules.length - 1].split("-")[1]}` : ""}` : "";
	return /* @__PURE__ */ p("li", {
		className: `kt-kb-chip is-${e.kind}`,
		title: `${e.owner ? `Set by ${e.owner}` : ""}${e.doc ? ` · ${e.doc} in the knowledge base` : ""}; ${e.why}`,
		children: [/* @__PURE__ */ p("b", { children: [
			e.kind === "data" ? "Data" : "Standard",
			": ",
			e.title
		] }), t && /* @__PURE__ */ f("span", {
			className: "kt-mono",
			children: t
		})]
	});
}
function Nr({ run: e, onRole: t }) {
	let n = gt(), r = e.knowledge.source;
	if (!r && e.standards.length === 0) return null;
	let i = new Map(e.roles.map((e) => [e.key, e])), a = [...e.knowledge.hits].reverse(), o = e.knowledge.hits.filter((e) => e.kind === "search").length, s = e.knowledge.hits.length - o;
	return /* @__PURE__ */ p("section", {
		className: "kt-kb",
		"aria-label": "Knowledge base and company standards",
		"data-testid": "kt-kb",
		children: [/* @__PURE__ */ p("div", {
			className: "kt-kb-col",
			children: [/* @__PURE__ */ p("p", {
				className: "kt-kb-head",
				children: [/* @__PURE__ */ p("b", { children: [
					/* @__PURE__ */ f(Z, {
						role: "book",
						size: 16
					}),
					" Knowledge base",
					r ? ` "${r.name}"` : ""
				] }), /* @__PURE__ */ f("span", {
					className: `kt-dim${r && r.present === !1 ? " kt-warn" : ""}`,
					children: jr(e)
				})]
			}), /* @__PURE__ */ f("ul", {
				className: "kt-kb-chips",
				"aria-label": "Applicable company standards and data",
				children: e.standards.map((e) => /* @__PURE__ */ f(Mr, { s: e }, e.id))
			})]
		}), /* @__PURE__ */ p("div", {
			className: "kt-kb-col is-hits",
			children: [/* @__PURE__ */ p("p", {
				className: "kt-kb-head",
				children: [/* @__PURE__ */ f("b", { children: "What the agents looked up" }), /* @__PURE__ */ p("span", {
					className: "kt-dim",
					children: [
						o,
						" knowledge-base search",
						o === 1 ? "" : "es",
						" · ",
						s,
						" data read",
						s === 1 ? "" : "s"
					]
				})]
			}), a.length === 0 ? /* @__PURE__ */ f("p", {
				className: "kt-dim kt-kb-empty",
				children: "No lookups yet"
			}) : /* @__PURE__ */ f("ol", {
				className: "kt-kb-hits",
				children: a.slice(0, 8).map((e, r) => {
					let a = i.get(e.role);
					return /* @__PURE__ */ p("li", {
						className: `is-${e.kind}`,
						children: [
							/* @__PURE__ */ p("button", {
								type: "button",
								className: "kt-kb-who",
								onClick: () => t?.(e.role),
								children: [
									/* @__PURE__ */ f(Z, {
										role: a?.icon || e.role,
										size: 13
									}),
									" ",
									a?.title ?? e.role
								]
							}),
							/* @__PURE__ */ f("span", {
								className: "kt-kb-what",
								children: e.kind === "search" ? `Searched the knowledge base for "${e.text}"` : `Read data ${e.text}`
							}),
							/* @__PURE__ */ f("small", {
								className: "kt-dim",
								children: L(n - e.at)
							})
						]
					}, `${e.at}-${r}`);
				})
			})]
		})]
	});
}
//#endregion
//#region src/cto/metrics.ts
var Pr = {
	app: "New app",
	feat: "New feature",
	fix: "Fix"
}, Fr = [
	"app",
	"feat",
	"fix"
], Ir = {
	S: "Small",
	M: "Medium",
	L: "Large"
}, Lr = {
	app: "var(--s1)",
	feat: "var(--s2)",
	fix: "var(--s3)"
}, $ = (e) => Math.round(e).toLocaleString("en-US"), Rr = (e) => e == null ? "" : e >= 1e4 ? `$${(e / 1e3).toFixed(1)}k` : `$${$(e)}`, zr = (e) => e >= 1e7 ? `${(e / 1e6).toFixed(2)}M` : `${$(e / 1e3)}k`, Br = (e) => e >= 10 ? Math.round(e) : Math.round(e * 10) / 10, Vr = (e) => e.length ? e.reduce((e, t) => e + t, 0) / e.length : 0, Hr = (e) => e.slice(5), Ur = (e) => e < 1 ? `${Math.max(1, Math.round(e * 60))} min` : `${e.toFixed(1)} h`;
function Wr(e, t) {
	let [n, r, i] = e.split("-").map(Number), a = new Date(n, r - 1, i - t);
	return `${a.getFullYear()}-${String(a.getMonth() + 1).padStart(2, "0")}-${String(a.getDate()).padStart(2, "0")}`;
}
function Gr(e) {
	let t = {};
	for (let n of [
		"S",
		"M",
		"L"
	]) t[n] = Vr(e.filter((e) => e.period === "base" && e.size === n).map((e) => e.cyc));
	return t;
}
var Kr = (e) => (t) => e < 0 || t.line === e;
function qr(e, t, n) {
	let r = e.meta, i = e.items.filter(Kr(t)), a = i.filter((e) => e.period === "base"), o = i.filter((e) => e.period === "agent"), s = (e, t) => e.filter((e) => e.kind === t).length, c = (e) => Vr(o.filter((t) => t.size === e && !t.real).map((e) => e.cyc)), l = o.reduce((e, t) => e + r.eq[t.size], 0), u = o.reduce((e, t) => e + r.human[t.size], 0), d = r.peoplePerLine * (t < 0 ? r.lines.length : 1), f = d * r.seatUsdMonth * r.months * r.fx, p = u * r.dayRate + f, m = l ? p / l : 0, h = o.filter((e) => e.kind !== "fix");
	return {
		before: a,
		agent: o,
		seats: d,
		eq: l,
		human: u,
		sub: f,
		unit: m,
		built: h,
		adv: Vr(h.map((e) => Math.max(0, n[e.size] - e.cyc))),
		count: s,
		cycle: c,
		steady: Jr(a, o),
		ratio: a.length ? o.length / a.length : 0,
		save: l * r.dayRate - p,
		real: o.filter((e) => e.real).length
	};
}
function Jr(e, t) {
	let n = (e) => e.filter((e) => e.kind !== "fix" && !e.real), r = (e) => e.reduce((e, t) => e + (t.defects?.length ?? 0), 0), i = (e) => e.length ? r(e) / e.length * 100 : 0, a = n(e), o = n(t), s = t.filter((e) => e.real), c = {
		checks: 0,
		review: 0,
		person: 0
	};
	for (let e of s) c.checks += e.caught?.checks ?? 0, c.review += e.caught?.review ?? 0, c.person += e.caught?.person ?? 0;
	let l = s.flatMap((e) => (e.risks ?? []).map((t) => ({
		...t,
		item: e
	}))).sort((e, t) => (t.amount ?? 0) - (e.amount ?? 0));
	return {
		before: i(a),
		now: i(o),
		defectsBefore: r(a),
		defectsNow: r(o),
		watchedBefore: a.length,
		watchedNow: o.length,
		caught: c,
		caughtAll: c.checks + c.review + c.person,
		reals: s.length,
		risks: l,
		kept: l.reduce((e, t) => e + (t.amount ?? 0), 0)
	};
}
function Yr(e, t) {
	let n = e.filter(Kr(t)), r = n.filter((e) => e.period === "base").length;
	return r ? n.filter((e) => e.period === "agent").length / r : 0;
}
function Xr(e, t, n) {
	let r = (/* @__PURE__ */ new Date(`${t.weeks[0]}T00:00:00`)).getTime(), i = t.weeks.map((e) => ({
		start: e,
		app: 0,
		feat: 0,
		fix: 0,
		total: 0
	}));
	for (let t of e.filter(Kr(n))) {
		let e = Math.floor(((/* @__PURE__ */ new Date(`${t.ship}T00:00:00`)).getTime() - r) / 864e5 / 7);
		e >= 0 && e < i.length && (i[e][t.kind] += 1, i[e].total += 1);
	}
	return i;
}
function Zr(e, t, n, r, i, a = {}) {
	let o = a.week, s = o ? Wr(o, -7) : "", c = e.filter((e) => (o ? e.ship >= o && e.ship < s : e.period === "agent") && Kr(t)(e));
	a.size && (c = c.filter((e) => e.size === a.size)), a.defects && (c = c.filter((e) => (e.defects?.length ?? 0) > 0)), n !== "all" && (c = c.filter((e) => e.kind === n)), r && (c = c.filter((e) => e.real));
	let l = (e) => e.real && i.has(e.real) ? 0 : e.real ? 1 : 2;
	return [...c].sort((e, t) => l(e) - l(t) || (e.ship < t.ship ? 1 : e.ship > t.ship ? -1 : 0));
}
function Qr(e, t, n) {
	let r = (e) => /[",\n]/.test(String(e)) ? `"${String(e).replace(/"/g, "\"\"")}"` : String(e), i = [
		"Delivery",
		"Business line",
		"Type",
		"Size",
		"Issue",
		"Raised by",
		"Issue created",
		"Release date",
		"Cycle (days)",
		"Average cycle before (same size, days)",
		"Signed by",
		"PR",
		"Post-release defects",
		"Fixed Issue",
		"Source",
		"Run id"
	], a = e.map((e) => [
		e.t,
		A(t.lines[e.line]),
		Pr[e.kind],
		Ir[e.size],
		e.issue ?? "",
		A(e.reporter ?? ""),
		e.created ?? "",
		e.ship,
		(e.mins == null ? e.cyc : e.mins / 1440).toFixed(2),
		n[e.size].toFixed(1),
		e.signer,
		e.pr ? `#${e.pr}` : "",
		(e.defects ?? []).join(" "),
		e.origin ?? "",
		e.real ? "Measured" : "Simulated",
		e.real ?? ""
	].map(r).join(","));
	return "﻿" + [i.join(","), ...a].join("\r\n");
}
//#endregion
//#region src/cto/vocab.ts
function $r(e) {
	return e ?? "";
}
var ei = $r, ti = $r, ni = "agent-rd-team:signer";
function ri(e) {
	let t = e.pr;
	return t ? t.state === "open" ? "Waiting to merge: merged into main when signed off" : t.state === "merged" ? `Merged into main (${t.sha})` : e.imported ? "Signed off; the run was imported from another computer and the code repository is not here, so nothing was merged here" : "Signed off; main got new commits during the run, so it could not be merged directly" : "";
}
var ii = new RegExp(String.raw`^\u4eba`);
function ai({ run: e, onSign: t, onCto: n, onItem: r }) {
	let [i, a] = o(() => typeof localStorage < "u" && localStorage.getItem(ni) || ""), [s, c] = o(""), [l, u] = o(!1), [d, m] = o(""), h = e.tests, g = ne.map((e, t) => {
		let n = h.cases.filter((e) => re(e.ac) === t);
		return {
			...e,
			total: n.length,
			passed: n.filter((e) => e.status === "pass").length
		};
	}).filter((e) => e.total > 0), _ = e.overruled, v = e.roles.filter((t) => t.gate_label && e.gate_notes[t.key] && t.key !== _?.role), y = e.events.filter((e) => e.kind === "bounce" && e.from === "person"), b = (t) => Math.max(-1, ...e.events.filter((e) => e.kind === "approved" && e.role === t).map((e) => e.seq)), x = [...y.map((e) => ({
		seq: e.seq,
		key: `b${e.seq}`,
		back: !0,
		text: e.text.replace(ii, "")
	})), ...v.map((t) => ({
		seq: b(t.key),
		key: t.key,
		back: !1,
		text: `Approved ${t.gate_label}: ${e.gate_notes[t.key]}`
	}))].sort((e, t) => (e.seq < 0 ? Infinity : e.seq) - (t.seq < 0 ? Infinity : t.seq)), S = e.roles.find((e) => e.writable.length === 0), C = e.roles.find((e) => e.deployed)?.deployed ?? null, w = e.roles.reduce((e, t) => e + t.commits.length, 0), T = e.roles.filter((e) => e.status !== "skipped"), E = h.total > 0 && h.failed === 0;
	return /* @__PURE__ */ p("section", {
		id: "kt-signoff",
		className: `kt-sign${e.signoff ? " is-signed" : ""}`,
		"aria-label": "Sign-off sheet",
		"data-testid": "kt-sign",
		children: [
			/* @__PURE__ */ p("header", {
				className: "kt-sign-head",
				children: [/* @__PURE__ */ f("h2", { children: "Sign-off sheet" }), /* @__PURE__ */ f("p", {
					className: "kt-dim",
					children: "Confirmed by the owner before release"
				})]
			}),
			/* @__PURE__ */ p("dl", {
				className: "kt-sign-grid",
				children: [
					/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Requirement" }), /* @__PURE__ */ f("dd", { children: e.requirement || e.title })] }),
					e.issue && /* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Issue · PR" }), /* @__PURE__ */ p("dd", {
						"data-testid": "kt-sign-pr",
						children: [
							"Issue ",
							e.issue.id,
							" (",
							k(e.issue.kind),
							" · raised by ",
							A(e.issue.reporter),
							")",
							e.pr ? ` → PR #${e.pr.number}: ${e.pr.head} → ${e.pr.base} · ${ri(e)}` : ""
						]
					})] }),
					/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Decisions made by people" }), /* @__PURE__ */ f("dd", { children: v.length || y.length || _ ? /* @__PURE__ */ p("ul", { children: [x.map((e) => /* @__PURE__ */ f("li", {
						className: e.back ? "kt-sign-back" : void 0,
						children: e.text
					}, e.key)), _ && /* @__PURE__ */ p("li", {
						className: "kt-sign-back",
						"data-testid": "kt-sign-overruled",
						children: [
							"Overruled the review and approved ",
							e.roles.find((e) => e.key === _.role)?.gate_label || _.role,
							": ",
							_.note
						]
					})] }) : "(no comment left at the gates)" })] }),
					(e.risks ?? []).length > 0 && /* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Risks stopped" }), /* @__PURE__ */ f("dd", {
						"data-testid": "kt-sign-risks",
						children: /* @__PURE__ */ f("ul", { children: (e.risks ?? []).map((e, t) => /* @__PURE__ */ p("li", {
							className: "kt-sign-back",
							children: [
								e.what,
								e.amount == null ? "" : ` ${Rr(e.amount)}`,
								" (noted when ",
								$r(e.gate),
								" was sent back)"
							]
						}, t)) })
					})] }),
					/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Machine checks" }), /* @__PURE__ */ p("dd", { children: [/* @__PURE__ */ p("b", {
						className: E ? "kt-ok" : "kt-bad",
						children: [
							h.passed,
							"/",
							h.total,
							" passed"
						]
					}), /* @__PURE__ */ f("ul", {
						className: "kt-sign-groups",
						children: g.map((e) => /* @__PURE__ */ p("li", {
							className: e.passed === e.total ? "is-ok" : "is-bad",
							children: [
								e.label,
								" ",
								e.passed,
								"/",
								e.total
							]
						}, e.prefix))
					})] })] }),
					/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Independent review" }), /* @__PURE__ */ f("dd", { children: S ? `${S.title} (separate session, reads the changes only): ${S.summary || "no verdict"}${_?.role === S.key ? " (a person overruled this verdict)" : ""}` : "This team has no independent review" })] }),
					/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "Deploy" }), /* @__PURE__ */ f("dd", { children: C ? /* @__PURE__ */ f("a", {
						href: C.url,
						target: "_blank",
						rel: "noreferrer",
						children: C.url
					}) : "Not deployed" })] }),
					/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("dt", { children: "What the agents did" }), /* @__PURE__ */ p("dd", { children: [
						T.length,
						" member",
						T.length === 1 ? "" : "s",
						" · ",
						w,
						" commit",
						w === 1 ? "" : "s",
						" · time ",
						ee(e.wall_s),
						" · ",
						R(e.credits),
						" credits"
					] })] })
				]
			}),
			e.signoff ? /* @__PURE__ */ p("p", {
				className: "kt-sign-done",
				role: "status",
				children: [
					/* @__PURE__ */ f(Z, {
						role: "sign",
						size: 16
					}),
					" ",
					/* @__PURE__ */ f("b", { children: e.signoff.by }),
					" signed off on ",
					(/* @__PURE__ */ new Date(e.signoff.at * 1e3)).toLocaleString("en-US", { hour12: !1 }),
					e.signoff.note ? `: ${e.signoff.note}` : "",
					" (checks at sign-off ",
					e.signoff.tests,
					")",
					n && /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-primary kt-sign-cto",
						onClick: n,
						title: "A signed-off delivery counts on the CTO view: the delivery list, the three cards and weekly releases",
						children: "Counted on the CTO view ↗"
					}),
					r && /* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn kt-sign-cto",
						onClick: r,
						title: "This delivery's cycle time, where the time went, cost, quality and value stream",
						children: "Delivery detail ↗"
					})
				]
			}) : e.sign_block ? /* @__PURE__ */ f("p", {
				className: "kt-sign-blocked",
				role: "status",
				"data-testid": "kt-sign-blocked",
				children: e.sign_block
			}) : t ? /* @__PURE__ */ p("form", {
				className: "kt-sign-form",
				onSubmit: async (e) => {
					if (e.preventDefault(), t && i.trim() && !l) {
						u(!0), m("");
						try {
							localStorage.setItem(ni, i.trim()), await t(i.trim(), s.trim());
						} catch (e) {
							m(e instanceof Error ? e.message : String(e));
						} finally {
							u(!1);
						}
					}
				},
				children: [
					/* @__PURE__ */ f("input", {
						"aria-label": "Signer",
						placeholder: "Signer",
						value: i,
						onChange: (e) => a(e.target.value)
					}),
					/* @__PURE__ */ f("input", {
						"aria-label": "Note",
						placeholder: "Note (optional), for example: checked in the staging environment",
						value: s,
						onChange: (e) => c(e.target.value)
					}),
					/* @__PURE__ */ f("button", {
						type: "submit",
						className: "kt-btn is-primary",
						disabled: l || !i.trim(),
						children: l ? "Signing…" : E ? "Sign off" : `${h.failed} check${h.failed === 1 ? "" : "s"} still failing; sign off anyway`
					}),
					d && /* @__PURE__ */ f("span", {
						className: "kt-error",
						children: d
					})
				]
			}) : null
		]
	});
}
//#endregion
//#region src/board/timeline.ts
var oi = new RegExp(String.raw`\u7b2c \d+ \u8f6e\uff1a|, round \d+: `);
function si(e, t) {
	let n = e.started_at, r = t.length ? Math.max(...t.map((e) => e.at)) : n;
	return {
		start: n,
		end: Math.max(e.ended_at ?? r, r, n + 1)
	};
}
var ci = (e) => {
	let t = /[：:]/.exec(e);
	return t ? e.slice(t.index + 1).trim() : "";
};
function li(e, t, n) {
	let r = si(e, t);
	if (n >= r.end) return {
		...e,
		events: e.events
	};
	let i = t.filter((e) => e.at <= n).sort((e, t) => e.seq - t.seq), a = new Map(e.roles.map((e) => [e.key, e])), o = /* @__PURE__ */ new Map(), s = new Set(t.filter((e) => e.kind === "skipped" && e.role).map((e) => e.role));
	for (let t of e.roles) o.set(t.key, {
		status: t.status === "skipped" && !s.has(t.key) ? "skipped" : "waiting",
		attempts: 0,
		doing: t.assignment,
		summary: null,
		spans: [],
		gate: null,
		deployed: null,
		lastTool: "",
		lastAt: null
	});
	let c = (e, t) => {
		let n = e.spans[e.spans.length - 1];
		n && n.b === null && (n.b = t);
	}, l = null, u = [];
	for (let e of i) {
		let t = e.role ? o.get(e.role) : void 0;
		switch (e.kind) {
			case "spawned":
				t && (t.attempts += 1, t.status = t.attempts > 1 && a.get(e.role)?.writable.length ? "fixing" : "running", t.spans.push({
					a: e.at,
					b: null
				}), t.doing = (oi.test(e.text) ? ci(e.text) : "") || a.get(e.role)?.assignment || "");
				break;
			case "tool":
				t && (t.lastTool = ci(e.text) || e.text, t.lastAt = e.at);
				break;
			case "done":
				t && (c(t, e.at), t.status = "done", t.summary = ci(e.text) || t.summary);
				break;
			case "review":
				t && (c(t, e.at), t.status = "done", t.summary = ci(e.text) || t.summary);
				break;
			case "merged":
				t && (c(t, e.at), t.status = "merged");
				break;
			case "failed":
				t && (c(t, e.at), t.status = "failed");
				break;
			case "skipped":
				t && (t.status = "skipped", t.summary = a.get(e.role)?.summary ?? null);
				break;
			case "gate":
				t && (t.gate = "pending");
				break;
			case "talk":
				t && e.from === "person" && (t.gate = "discussing");
				break;
			case "approved":
				t && (t.gate = "approved");
				break;
			case "bounce": {
				let t = e.to ? o.get(e.to) : void 0;
				e.from === "person" && t ? (t.gate = null, a.get(e.to)?.writable.length || (t.status = "waiting")) : t && t.status !== "waiting" && (t.status = "fixing");
				break;
			}
			case "deployed":
				t && (t.deployed = {
					url: String(e.data?.url ?? ""),
					at: e.at
				});
				break;
			case "tests": {
				l = e;
				let t = e.data;
				t && typeof t.passed == "number" && typeof t.total == "number" && u.push({
					at: e.at,
					passed: t.passed,
					failed: t.total - t.passed
				});
				break;
			}
		}
	}
	let d = e.roles.map((e) => {
		let t = o.get(e.key), r = t.spans.reduce((e, t) => e + Math.max(0, (t.b ?? n) - t.a), 0), i = t.spans[t.spans.length - 1], a = t.status === "running" || t.status === "fixing", s = a && i ? {
			id: `replay-${e.key}`,
			turns: 0,
			tool_count: 0,
			last_tool: t.lastTool,
			last_activity: t.lastAt ?? i.a,
			started: i.a,
			elapsed_s: Math.max(0, n - i.a),
			queued_reason: null,
			error: null,
			recent_tools: [],
			text_tail: null,
			credits: null
		} : null, c = t.status === "merged" || t.status === "done", l = t.attempts >= e.attempt && !a && t.status !== "waiting";
		return {
			...e,
			status: t.status,
			attempt: Math.max(1, t.attempts),
			agent: s,
			doing: t.doing,
			summary: c || t.status === "failed" || t.status === "skipped" ? t.summary ?? e.summary : null,
			active_s: Math.round(r * 10) / 10,
			started_at: t.spans[0]?.a ?? null,
			done_at: c ? t.spans[t.spans.length - 1]?.b ?? null : null,
			gate: e.gate_label ? t.gate : e.gate,
			deployed: t.deployed,
			credits: l ? e.credits : null,
			files: t.status === "merged" ? e.files : [],
			lines: t.status === "merged" ? e.lines : {
				added: 0,
				removed: 0
			},
			commits: e.commits.filter((e) => e.at <= n),
			kinds: e.kinds.slice(0, Math.max(1, t.attempts))
		};
	}), f = /* @__PURE__ */ new Map(), p = l, m = p?.data ?? null;
	for (let [e, t] of m?.cases ?? []) f.set(e, t);
	let h = e.tests.cases.filter((e) => f.has(e.id)).map((e) => ({
		...e,
		status: f.get(e.id),
		message: f.get(e.id) === "fail" ? e.message : null
	})), g = m?.passed ?? h.filter((e) => e.status === "pass").length, _ = m?.total ?? h.length, v = {
		...e.tests,
		at: p?.at ?? null,
		cases: h,
		passed: g,
		failed: _ - g,
		total: _,
		history: u
	}, y = d.some((e) => e.gate === "pending"), b = d.some((e) => e.writable.length === 0 && (e.status === "running" || e.status === "fixing")), x = y ? "gating" : b ? "reviewing" : "running", S = d.filter((e) => e.credits !== null);
	return {
		...e,
		status: x,
		ended_at: null,
		wall_s: Math.round(Math.max(0, n - r.start) * 10) / 10,
		serial_s: d.reduce((e, t) => e + t.active_s, 0),
		credits: S.length ? S.reduce((e, t) => e + (t.credits ?? 0), 0) : null,
		roles: d,
		tests: v,
		merges: e.merges.filter((e) => e.at <= n),
		events: i.slice(-200),
		gate_notes: Object.fromEntries(Object.entries(e.gate_notes).filter(([e]) => d.find((t) => t.key === e)?.gate === "approved")),
		signoff: null,
		knowledge: {
			...e.knowledge,
			hits: e.knowledge.hits.filter((e) => e.at <= n)
		}
	};
}
//#endregion
//#region src/board/Replay.tsx
var ui = [
	10,
	30,
	60,
	120
];
function di(e) {
	return ui.find((t) => e / t <= 90) ?? ui[ui.length - 1];
}
var fi = {
	id: null,
	events: null,
	t: 0,
	speed: ui[1],
	playing: !1,
	loading: !1,
	error: ""
};
function pi(e, n, s) {
	let [c, l] = o(fi), u = a(null), d = a(!1), f = !!(n && c.id === n.id && c.events), p = i(() => f && n && c.events ? si(n, c.events) : null, [
		f,
		n,
		c.events
	]);
	r(() => {
		c.id && n && n.id !== c.id && l(fi);
	}, [n, c.id]);
	let m = t(() => {
		if (!n) return;
		let t = n.id;
		l({
			...fi,
			id: t,
			loading: !0
		}), e.get(v.events(t)).then((e) => {
			let r = Array.isArray(e?.events) ? e.events : [], i = si(n, r);
			u.current = null, l({
				...fi,
				id: t,
				events: r,
				t: i.start,
				speed: di(i.end - i.start),
				playing: !0
			});
		}).catch((e) => l({
			...fi,
			error: `Replay did not open: ${jt(e)}`
		}));
	}, [e, n]), h = t(() => {
		u.current = null, l(fi);
	}, []), g = t(() => {
		l((e) => p ? e.t >= p.end ? (d.current = !0, u.current = null, {
			...e,
			t: p.start,
			playing: !0
		}) : {
			...e,
			playing: !e.playing
		} : e);
	}, [p]), _ = t((e) => {
		d.current = !0, l((t) => ({
			...t,
			t: e
		}));
	}, []), y = t((e) => l((t) => ({
		...t,
		speed: e
	})), []), b = t(() => l((e) => ({
		...e,
		playing: !1
	})), []);
	r(() => {
		if (!f || !c.playing || !p) return;
		let e = setInterval(() => {
			l((e) => {
				let t = Math.min(p.end, e.t + e.speed * 250 / 1e3);
				return {
					...e,
					t,
					playing: t < p.end
				};
			});
		}, 250);
		return () => clearInterval(e);
	}, [
		f,
		c.playing,
		p
	]);
	let x = i(() => f && n && c.events ? li(n, c.events, c.t) : null, [
		f,
		n,
		c.events,
		c.t
	]);
	r(() => {
		if (!x) return;
		let e = it(u.current, x, {
			at: c.t,
			resync: d.current,
			lateS: Math.max(30, c.speed * 250 * 2 / 1e3)
		});
		d.current = !1, u.current = x, s(e);
	}, [x]);
	let S = i(() => x ? {
		at: Math.min(c.t, p?.end ?? c.t),
		receivedAt: Infinity
	} : null, [
		x,
		c.t,
		p
	]);
	return {
		id: c.id,
		loading: c.loading,
		error: c.error,
		run: x,
		clock: S,
		span: p,
		t: c.t,
		speed: c.speed,
		playing: c.playing,
		start: m,
		exit: h,
		toggle: g,
		pause: b,
		seek: _,
		setSpeed: y
	};
}
function mi({ rp: e, projection: t }) {
	if (e.loading) return /* @__PURE__ */ f("div", {
		className: "kt-replay",
		role: "status",
		children: "Reading the record of this run…"
	});
	if (e.error) return /* @__PURE__ */ f("div", {
		className: "kt-banner is-error",
		role: "alert",
		children: e.error
	});
	if (!e.run || !e.span) return null;
	let { start: n, end: r } = e.span, i = e.t >= r;
	return /* @__PURE__ */ p("div", {
		className: "kt-replay",
		role: "group",
		"aria-label": "Replay",
		children: [
			/* @__PURE__ */ f("span", {
				className: "kt-pill tone-info",
				children: "Replay"
			}),
			/* @__PURE__ */ f("button", {
				type: "button",
				className: "kt-btn kt-btn-icon",
				onClick: e.toggle,
				"aria-label": e.playing ? "Pause" : i ? "Play again from the start" : "Play",
				title: e.playing ? "Pause" : i ? "Play again from the start" : "Play",
				children: e.playing ? "⏸" : i ? "↺" : "▶"
			}),
			/* @__PURE__ */ f("input", {
				type: "range",
				className: "kt-replay-scrub",
				"aria-label": "Replay progress",
				min: n,
				max: r,
				step: 1,
				value: Math.min(r, e.t),
				onChange: (t) => e.seek(Number(t.target.value))
			}),
			/* @__PURE__ */ p("span", {
				className: "kt-mono kt-replay-time",
				children: [
					I(Math.round(e.t - n)),
					" / ",
					I(Math.round(r - n))
				]
			}),
			!t && /* @__PURE__ */ f("span", {
				className: "kt-replay-speeds",
				role: "radiogroup",
				"aria-label": "Speed",
				children: ui.map((t) => /* @__PURE__ */ p("button", {
					type: "button",
					role: "radio",
					"aria-checked": e.speed === t,
					className: `kt-btn${e.speed === t ? " is-on" : ""}`,
					onClick: () => e.setSpeed(t),
					children: [t, "×"]
				}, t))
			}),
			/* @__PURE__ */ f("span", {
				className: "kt-dim kt-replay-note",
				children: i ? "Finished: below is how the run ended" : "Replays the record of this run; no agent is called"
			}),
			/* @__PURE__ */ f("button", {
				type: "button",
				className: "kt-btn",
				onClick: e.exit,
				children: "Exit replay"
			})
		]
	});
}
//#endregion
//#region src/nav.ts
var hi = /^r[0-9a-z]{4,12}$/, gi = /^[a-z][a-z0-9-]{0,23}$/, _i = /^(?:LK|LO|TY)-\d{4}$/, vi = /^\d{4}-\d{2}-\d{2}$/, yi = [
	"ideation",
	"inception",
	"construction",
	"review",
	"operation"
], bi = [
	"signoff",
	"tests",
	"cost",
	"lanes"
], xi = [
	"more",
	"fast",
	"cheap",
	"steady",
	"weekly",
	"flow",
	"ledger"
], Si = (e) => {
	let t = Number(e ?? "x");
	return e !== null && e !== "" && Number.isFinite(t) && t >= 0 ? Math.round(t) : void 0;
};
function Ci(e) {
	let t = new URLSearchParams(e), n = t.get("run") ?? "";
	if (t.get("view") === "item") {
		let e = Si(t.get("at")), r = t.get("from"), i = {
			...e === void 0 ? {} : { at: e },
			...r === "cto" || r === "board" ? { from: r } : {}
		};
		if (hi.test(n)) return {
			kind: "item",
			run: n,
			...i
		};
		let a = t.get("issue") ?? "";
		return _i.test(a) ? {
			kind: "item",
			issue: a,
			...i
		} : { kind: "cto" };
	}
	if (t.get("view") !== "board") {
		let e = {
			kind: "cto",
			...wi(t)
		}, n = t.get("hl") ?? "";
		(hi.test(n) || _i.test(n)) && (e.hl = n);
		let r = t.get("at") ?? "";
		return xi.includes(r) && (e.at = r), e;
	}
	let r = { kind: "board" };
	if (hi.test(n) && (r.run = n), r.run) {
		for (let e of ["gate", "role"]) {
			let n = t.get(e) ?? "";
			gi.test(n) && (r[e] = n);
		}
		let e = t.get("phase") ?? "";
		yi.includes(e) && (r.phase = e);
		let n = Si(t.get("at"));
		n !== void 0 && (r.at = n);
		let i = Number(t.get("replay"));
		[
			10,
			30,
			60,
			120
		].includes(i) && (r.replay = i);
		let a = t.get("focus") ?? "";
		bi.includes(a) && (r.focus = a);
		let o = t.get("from");
		(o === "cto" || o === "item") && (r.from = o), t.get("pick") === "latest" && (r.pick = "latest");
	}
	return t.get("new") === "promo" && (r.new = "promo"), r;
}
function wi(e) {
	let t = {}, n = Number(e.get("line") ?? "x");
	Number.isInteger(n) && n >= 0 && n < 20 && (t.line = n);
	let r = e.get("kind");
	(r === "app" || r === "feat" || r === "fix") && (t.type = r);
	let i = e.get("size");
	(i === "S" || i === "M" || i === "L") && (t.size = i);
	let a = e.get("week") ?? "";
	return vi.test(a) && (t.week = a), e.get("real") === "1" && (t.real = !0), e.get("defect") === "1" && (t.defects = !0), t;
}
function Ti(e) {
	let { line: t, type: n, size: r, week: i, real: a, defects: o } = e;
	return Object.fromEntries(Object.entries({
		line: t,
		type: n,
		size: r,
		week: i,
		real: a,
		defects: o
	}).filter(([, e]) => e !== void 0 && e !== !1));
}
function Ei(e) {
	let t = new URLSearchParams();
	if (e.kind === "cto") {
		let n = Ti(e);
		n.line !== void 0 && t.set("line", String(n.line)), n.type && t.set("kind", n.type), n.size && t.set("size", n.size), n.week && t.set("week", n.week), n.real && t.set("real", "1"), n.defects && t.set("defect", "1"), e.hl && t.set("hl", e.hl), e.at && t.set("at", e.at);
	} else if (e.kind === "item") t.set("view", "item"), e.run ? t.set("run", e.run) : e.issue && t.set("issue", e.issue), e.at !== void 0 && t.set("at", String(e.at)), e.from && t.set("from", e.from);
	else {
		t.set("view", "board");
		for (let n of [
			"run",
			"phase",
			"gate",
			"role",
			"at",
			"replay",
			"focus",
			"from",
			"pick",
			"new"
		]) {
			let r = e[n];
			r !== void 0 && t.set(n, String(r));
		}
	}
	let n = t.toString();
	return n ? `?${n}` : "";
}
function Di(e) {
	return e.real ? { run: e.real } : { issue: e.issue };
}
//#endregion
//#region src/cto/charts.tsx
function Oi(e = 600) {
	let t = a(null), [n, i] = o(e);
	return r(() => {
		let e = t.current;
		if (!e) return;
		let n = () => e.clientWidth > 0 && i(e.clientWidth);
		if (n(), typeof ResizeObserver > "u") return;
		let r = new ResizeObserver(n);
		return r.observe(e), () => r.disconnect();
	}, []), [t, n];
}
function ki({ tip: e, width: t }) {
	let n = a(null), [i, s] = o(0);
	return r(() => {
		if (!e || !n.current) return;
		let r = n.current.offsetWidth || 200;
		s(Math.min(Math.max(e.x - r / 2, 0), Math.max(0, t - r)));
	}, [e, t]), e ? /* @__PURE__ */ p("div", {
		ref: n,
		className: "cto-tip",
		role: "tooltip",
		style: {
			left: i,
			top: e.y
		},
		children: [e.when && /* @__PURE__ */ f("div", {
			className: "cto-when",
			children: e.when
		}), e.rows.map(([e, t, n], r) => /* @__PURE__ */ p("div", {
			className: "cto-row",
			children: [
				/* @__PURE__ */ f("b", { children: e }),
				n && /* @__PURE__ */ f("i", {
					className: "cto-key",
					style: { background: n }
				}),
				/* @__PURE__ */ f("span", { children: t })
			]
		}, r))]
	}) : null;
}
function Ai({ x: e, y: t, w: n, h: r, rows: i, onTip: a, when: o, tipY: s, onPick: c, label: l }) {
	let u = () => a({
		x: e + n / 2,
		y: s ?? t + r + 6,
		rows: i,
		when: o
	});
	return /* @__PURE__ */ f("rect", {
		className: `cto-hit${c ? " is-pick" : ""}`,
		x: e,
		y: t,
		width: n,
		height: r,
		rx: 6,
		tabIndex: 0,
		role: c ? "button" : void 0,
		"aria-label": l,
		onPointerEnter: u,
		onFocus: u,
		onPointerLeave: () => a(null),
		onBlur: () => a(null),
		onClick: c,
		onKeyDown: c ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), c()) : void 0
	});
}
function ji({ x: e, y: t, w: n, h: r, fill: i }) {
	let a = Math.min(4, n, r / 2);
	return /* @__PURE__ */ f("path", {
		d: `M${e},${t} H${e + n - a} Q${e + n},${t} ${e + n},${t + a} V${t + r - a} Q${e + n},${t + r} ${e + n - a},${t + r} H${e} Z`,
		fill: i
	});
}
function Mi({ label: e, height: t, children: n }) {
	let [r, i] = Oi(360), [a, s] = o(null);
	return /* @__PURE__ */ p("div", {
		className: "cto-mini",
		ref: r,
		children: [/* @__PURE__ */ f("svg", {
			viewBox: `0 0 ${i} ${t}`,
			height: t,
			role: "img",
			"aria-label": e,
			children: n(i, s)
		}), /* @__PURE__ */ f(ki, {
			tip: a,
			width: i
		})]
	});
}
function Ni({ m: e }) {
	let t = [["First 12 weeks", e.before], ["Last 12 weeks", e.agent]];
	return /* @__PURE__ */ f(Mi, {
		label: `Delivery volume: first 12 weeks ${e.before.length}, last 12 weeks ${e.agent.length}`,
		height: 62,
		children: (n, r) => {
			let i = Math.max(e.before.length, e.agent.length, 1), a = Math.max(10, n - 64 - 70);
			return t.map(([t, n], o) => {
				let s = 2 + o * 36, c = o === 1, l = 0, u = Fr.map((t) => [t, e.count(n, t)]).filter(([, e]) => e > 0), d = u.map(([e, t], n) => {
					let r = 64 + l / i * a + (l > 0 ? 2 : 0), o = 64 + (l + t) / i * a;
					return l += t, o - r <= .5 ? null : n === u.length - 1 ? /* @__PURE__ */ f(ji, {
						x: r,
						y: s,
						w: o - r,
						h: 22,
						fill: Lr[e]
					}, e) : /* @__PURE__ */ f("rect", {
						x: r,
						y: s,
						width: o - r,
						height: 22,
						fill: Lr[e]
					}, e);
				}), m = 64 + l / i * a;
				return /* @__PURE__ */ p("g", { children: [
					/* @__PURE__ */ f("text", {
						x: 0,
						y: s + 11 + 4,
						className: c ? "is-strong" : void 0,
						children: t
					}),
					d,
					/* @__PURE__ */ f("text", {
						x: m + 8,
						y: s + 11 + 4,
						className: c ? "is-strong" : void 0,
						children: $(n.length)
					}),
					/* @__PURE__ */ f(Ai, {
						x: 60,
						y: s - 3,
						w: m - 64 + 8,
						h: 28,
						onTip: r,
						rows: [[$(n.length), `${t} total`], ...Fr.map((t) => [
							$(e.count(n, t)),
							Pr[t],
							Lr[t]
						])]
					})
				] }, t);
			});
		}
	});
}
function Pi({ m: e, base: t, onPick: n }) {
	let r = [
		"L",
		"M",
		"S"
	], i = [
		["Large", "L"],
		["Medium", "M"],
		["Small", "S"]
	].map(([n, r]) => [
		n,
		t[r],
		e.cycle(r)
	]), a = i.length * 26;
	return /* @__PURE__ */ f(Mi, {
		label: "Delivery cycle, before and now: " + i.map(([e, t, n]) => `${e} ${Br(t)} days → ${Br(n)} days`).join(", "),
		height: a,
		children: (e, t) => {
			let o = Math.max(...i.map(([, e, t]) => Math.max(e, t)), 1), s = Math.max(10, e - 40 - 104), c = (e) => 40 + e / o * s;
			return /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("line", {
				x1: 40,
				x2: 40,
				y1: 2,
				y2: a - 2,
				stroke: "var(--border-strong)",
				strokeWidth: 1
			}), i.map(([i, a, o], s) => {
				let l = s * 26 + 13;
				return /* @__PURE__ */ p("g", { children: [
					/* @__PURE__ */ f("text", {
						x: 0,
						y: l + 4,
						className: s === 0 ? "is-strong" : void 0,
						children: i
					}),
					/* @__PURE__ */ f("line", {
						x1: c(o),
						x2: c(a),
						y1: l,
						y2: l,
						stroke: "var(--border-strong)",
						strokeWidth: 2,
						strokeLinecap: "round"
					}),
					/* @__PURE__ */ f("circle", {
						cx: c(a),
						cy: l,
						r: 4.5,
						fill: "var(--deemph)",
						stroke: "var(--card)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ f("circle", {
						cx: c(o),
						cy: l,
						r: 5,
						fill: "var(--s4)",
						stroke: "var(--card)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ p("text", {
						x: e,
						y: l + 4,
						textAnchor: "end",
						children: [
							Br(a),
							" → ",
							/* @__PURE__ */ p("tspan", {
								style: {
									fill: "var(--text-strong)",
									fontWeight: 600
								},
								children: [Br(o), " days"]
							})
						]
					}),
					/* @__PURE__ */ f(Ai, {
						x: 0,
						y: l - 13 + 1,
						w: e,
						h: 24,
						onTip: t,
						rows: [
							[
								`${Br(a)} days`,
								"Before",
								"var(--deemph)"
							],
							[
								`${Br(o)} days`,
								"Now",
								"var(--s4)"
							],
							[a ? `${Math.round((1 - o / a) * 100)}%` : "—", "Shorter"],
							...n ? [["Click", "See deliveries of this size"]] : []
						],
						onPick: n ? () => n(r[s]) : void 0,
						label: `${i}: see deliveries of this size`
					})
				] }, i);
			})] });
		}
	});
}
function Fi({ size: e, before: t, days: n, now: r }) {
	return /* @__PURE__ */ f(Mi, {
		label: `${e}, about ${Br(t)} days before, this one ${r}`,
		height: 26,
		children: (i, a) => {
			let o = Math.max(10, i - 40 - 132), s = (e) => 40 + Math.min(e, t) / Math.max(t, n, 1e-6) * o;
			return /* @__PURE__ */ p(d, { children: [
				/* @__PURE__ */ f("line", {
					x1: 40,
					x2: 40,
					y1: 2,
					y2: 24,
					stroke: "var(--border-strong)",
					strokeWidth: 1
				}),
				/* @__PURE__ */ f("text", {
					x: 0,
					y: 17,
					className: "is-strong",
					children: e
				}),
				/* @__PURE__ */ f("line", {
					x1: s(n),
					x2: s(t),
					y1: 13,
					y2: 13,
					stroke: "var(--border-strong)",
					strokeWidth: 2,
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ f("circle", {
					cx: s(t),
					cy: 13,
					r: 4.5,
					fill: "var(--deemph)",
					stroke: "var(--card)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ f("circle", {
					cx: s(n),
					cy: 13,
					r: 5,
					fill: "var(--s4)",
					stroke: "var(--card)",
					strokeWidth: 2
				}),
				/* @__PURE__ */ p("text", {
					x: i,
					y: 17,
					textAnchor: "end",
					children: [
						Br(t),
						" days → ",
						/* @__PURE__ */ f("tspan", {
							style: {
								fill: "var(--text-strong)",
								fontWeight: 600
							},
							children: r
						})
					]
				}),
				/* @__PURE__ */ f(Ai, {
					x: 0,
					y: 1,
					w: i,
					h: 24,
					onTip: a,
					rows: [[
						`${Br(t)} days`,
						`Before, same size (${e}) average`,
						"var(--deemph)"
					], [
						r,
						"This one",
						"var(--s4)"
					]]
				})
			] });
		}
	});
}
function Ii({ parts: e, total: t }) {
	let n = e.filter((e) => e.s > 0), r = n.reduce((e, t) => e + t.s, 0) || 1;
	return /* @__PURE__ */ f(Mi, {
		label: "Where the time went: " + n.map((e) => `${e.label} ${Li(e.s)}`).join(", "),
		height: 22,
		children: (e, i) => {
			let a = Math.max(10, e - 70 - 8), o = 0;
			return /* @__PURE__ */ p(d, { children: [n.map((e, t) => {
				let s = Math.max(2, e.s / r * a - (t < n.length - 1 ? 2 : 0)), c = o;
				o += e.s / r * a;
				let l = t === n.length - 1 ? /* @__PURE__ */ f(ji, {
					x: c,
					y: 4,
					w: s,
					h: 14,
					fill: e.color
				}) : /* @__PURE__ */ f("rect", {
					x: c,
					y: 4,
					width: s,
					height: 14,
					fill: e.color
				});
				return /* @__PURE__ */ p("g", { children: [l, /* @__PURE__ */ f(Ai, {
					x: c,
					y: 0,
					w: Math.max(8, s),
					h: 22,
					onTip: i,
					rows: [[
						Li(e.s),
						e.label,
						e.color
					], [`${Math.round(e.s / r * 100)}%`, "Share of the whole time"]],
					onPick: e.onPick,
					label: `${e.label} ${Li(e.s)}`
				})] }, e.label);
			}), /* @__PURE__ */ f("text", {
				x: a + 8,
				y: 16,
				className: "is-strong",
				children: t
			})] });
		}
	});
}
function Li(e) {
	let t = Math.max(0, Math.round(e));
	if (t < 60) return `${t} s`;
	let n = Math.round(t / 60);
	if (n < 60) return `${n} min`;
	let r = Math.floor(n / 60);
	return n % 60 ? `${r} h ${n % 60} min` : `${r} h`;
}
function Ri({ m: e }) {
	let t = e.steady, n = [[
		"Before",
		t.before,
		"var(--deemph)",
		t.defectsBefore,
		t.watchedBefore
	], [
		"Now",
		t.now,
		"var(--s4)",
		t.defectsNow,
		t.watchedNow
	]], r = Math.max(t.before, t.now, .1);
	return /* @__PURE__ */ f(Mi, {
		label: `Post-release defects per 100 new apps and new features: before ${t.before.toFixed(1)}, now ${t.now.toFixed(1)}`,
		height: 62,
		children: (e, t) => {
			let i = Math.max(10, e - 40 - 70);
			return n.map(([e, n, a, o, s], c) => {
				let l = 2 + c * 36, u = n / r * i;
				return /* @__PURE__ */ p("g", { children: [
					/* @__PURE__ */ f("text", {
						x: 0,
						y: l + 11 + 4,
						className: c === 1 ? "is-strong" : void 0,
						children: e
					}),
					/* @__PURE__ */ f(ji, {
						x: 40,
						y: l,
						w: Math.max(u, 1),
						h: 22,
						fill: a
					}),
					/* @__PURE__ */ f("text", {
						x: 40 + u + 8,
						y: l + 11 + 4,
						className: c === 1 ? "is-strong" : void 0,
						children: n.toFixed(1)
					}),
					/* @__PURE__ */ f(Ai, {
						x: 36,
						y: l - 3,
						w: u + 8,
						h: 28,
						onTip: t,
						rows: [
							[n.toFixed(1), "Post-release defects per 100"],
							[$(o), "Post-release defects"],
							[$(s), "New apps and new features"]
						]
					})
				] }, e);
			});
		}
	});
}
function zi({ m: e, meta: t }) {
	let n = e.eq ? e.human * t.dayRate / e.eq : 0, r = e.eq ? e.sub / e.eq : 0, i = [[
		"Before",
		t.dayRate,
		"var(--deemph)"
	], [
		"Now",
		e.unit,
		"var(--s4)"
	]];
	return /* @__PURE__ */ f(Mi, {
		label: `Cost per person-day of work: before $${$(t.dayRate)}, now $${$(e.unit)}`,
		height: 62,
		children: (e, a) => {
			let o = Math.max(10, e - 40 - 70);
			return i.map(([e, i, s], c) => {
				let l = 2 + c * 36, u = i / t.dayRate * o;
				return /* @__PURE__ */ p("g", { children: [
					/* @__PURE__ */ f("text", {
						x: 0,
						y: l + 11 + 4,
						className: c === 1 ? "is-strong" : void 0,
						children: e
					}),
					/* @__PURE__ */ f(ji, {
						x: 40,
						y: l,
						w: Math.max(u, 1),
						h: 22,
						fill: s
					}),
					/* @__PURE__ */ p("text", {
						x: 40 + u + 8,
						y: l + 11 + 4,
						className: c === 1 ? "is-strong" : void 0,
						children: ["$", $(i)]
					}),
					/* @__PURE__ */ f(Ai, {
						x: 36,
						y: l - 3,
						w: u + 8,
						h: 28,
						onTip: a,
						rows: c === 0 ? [[`$${$(i)}`, "Done by people, per person-day"]] : [
							[`$${$(i)}`, "With agent collaboration, per person-day"],
							[`$${$(n)}`, "Of which people's time"],
							[`$${$(r)}`, "Of which agent subscription"]
						]
					})
				] }, e);
			});
		}
	});
}
function Bi(e) {
	let t = 10 ** Math.floor(Math.log10(Math.max(e, 1)));
	for (let n of [
		1,
		1.5,
		2,
		2.5,
		3,
		4,
		5,
		6,
		8,
		10
	]) if (n * t >= e) return n * t;
	return 10 * t;
}
var Vi = (e) => Hr(e).replace(/^0/, "").replace("-0", "-").replace("-", "/");
function Hi({ weeks: e, today: t, onWeek: n }) {
	let [r, i] = o(!1), [a, s] = Oi(1100), [c, l] = o(null), u = Vr(e.slice(0, 12).map((e) => e.total)), d = Vr(e.slice(12).map((e) => e.total)), m = Math.max(10, s - 44 - 12) / e.length, h = Math.min(24, m * .56), g = Bi(Math.max(1, ...e.map((e) => e.total))), _ = (e) => 240 - e / g * 214, v = Math.round(44 + 12 * m) + .5;
	return /* @__PURE__ */ p("section", {
		className: "cto-card",
		"aria-label": "Weekly releases",
		"data-anchor": "weekly",
		children: [
			/* @__PURE__ */ p("div", {
				className: "cto-chart-head",
				children: [
					/* @__PURE__ */ f("h3", { children: "Weekly releases" }),
					/* @__PURE__ */ p("span", {
						className: "cto-dim",
						children: [
							"First 12 weeks average ",
							$(u),
							" per week → last 12 weeks average ",
							$(d),
							" per week; latest week ",
							$(e[e.length - 1]?.total ?? 0),
							" (as of ",
							Hr(t),
							")"
						]
					}),
					/* @__PURE__ */ f("span", { className: "cto-grow" }),
					/* @__PURE__ */ p("div", {
						className: "cto-seg cto-noprint",
						role: "group",
						"aria-label": "Chart or table",
						children: [/* @__PURE__ */ f("button", {
							type: "button",
							"aria-pressed": !r,
							onClick: () => i(!1),
							children: "Chart"
						}), /* @__PURE__ */ f("button", {
							type: "button",
							"aria-pressed": r,
							onClick: () => i(!0),
							children: "Table"
						})]
					})
				]
			}),
			!r && /* @__PURE__ */ f("div", {
				className: "cto-legend",
				children: Fr.map((e) => /* @__PURE__ */ p("span", { children: [/* @__PURE__ */ f("i", {
					className: "cto-sw",
					style: { background: Lr[e] }
				}), Pr[e]] }, e))
			}),
			/* @__PURE__ */ p("div", {
				className: "cto-plot",
				ref: a,
				hidden: r,
				children: [/* @__PURE__ */ p("svg", {
					viewBox: `0 0 ${s} 270`,
					role: "img",
					"aria-label": "Weekly releases, stacked by type",
					children: [
						[
							0,
							1,
							2,
							3,
							4
						].map((e) => {
							let t = g / 4 * e, n = Math.round(_(t)) + .5;
							return /* @__PURE__ */ p("g", { children: [/* @__PURE__ */ f("line", {
								x1: 44,
								x2: s - 12,
								y1: n,
								y2: n,
								stroke: e === 0 ? "var(--border-strong)" : "var(--border)",
								strokeWidth: 1
							}), /* @__PURE__ */ f("text", {
								x: 36,
								y: n + 4,
								textAnchor: "end",
								children: $(t)
							})] }, e);
						}),
						/* @__PURE__ */ f("line", {
							x1: v,
							x2: v,
							y1: 18,
							y2: 240,
							stroke: "var(--muted)",
							strokeWidth: 1
						}),
						/* @__PURE__ */ f("text", {
							x: v + 6,
							y: 16,
							className: "cto-mark",
							children: "AI-DLC introduced"
						}),
						/* @__PURE__ */ f("text", {
							x: 44 + 6 * m,
							y: 16,
							className: "cto-mark",
							textAnchor: "middle",
							children: "12 weeks before AI-DLC"
						}),
						e.map((e, t) => {
							let r = 44 + m * t + m / 2, i = r - h / 2, a = 0, o = Fr.filter((t) => e[t] > 0), s = o.map((t, n) => {
								let r = _(a) - (a > 0 ? 2 : 0), s = _(a + e[t]);
								a += e[t];
								let c = r - s;
								if (c <= .5) return null;
								if (n === o.length - 1) {
									let e = Math.min(4, c, h / 2);
									return /* @__PURE__ */ f("path", {
										d: `M${i},${r} V${s + e} Q${i},${s} ${i + e},${s} H${i + h - e} Q${i + h},${s} ${i + h},${s + e} V${r} Z`,
										fill: Lr[t]
									}, t);
								}
								return /* @__PURE__ */ f("rect", {
									x: i,
									y: s,
									width: h,
									height: c,
									fill: Lr[t]
								}, t);
							});
							return /* @__PURE__ */ p("g", { children: [
								s,
								t % 2 == 0 && /* @__PURE__ */ f("text", {
									x: r,
									y: 258,
									textAnchor: "middle",
									children: Vi(e.start)
								}),
								/* @__PURE__ */ f(Ai, {
									x: 44 + m * t,
									y: 26,
									w: m,
									h: 214,
									onTip: l,
									tipY: Math.max(0, _(e.total) - 110),
									when: `Week from ${Vi(e.start)} · ${t < 12 ? "before AI-DLC" : `week ${t - 11} after AI-DLC`}`,
									rows: [
										[$(e.total), "Total"],
										...Fr.map((t) => [
											$(e[t]),
											Pr[t],
											Lr[t]
										]),
										...n ? [["Click", "See this week's deliveries"]] : []
									],
									onPick: n ? () => n(e.start) : void 0,
									label: `Week from ${Vi(e.start)}: see this week's deliveries`
								})
							] }, e.start);
						})
					]
				}), /* @__PURE__ */ f(ki, {
					tip: c,
					width: s
				})]
			}),
			r && /* @__PURE__ */ f("div", {
				className: "cto-weeks",
				children: /* @__PURE__ */ p("table", {
					className: "cto-table",
					children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("th", { children: "Week start" }),
						Fr.map((e) => /* @__PURE__ */ f("th", {
							className: "is-num",
							children: Pr[e]
						}, e)),
						/* @__PURE__ */ f("th", {
							className: "is-num",
							children: "Total"
						})
					] }) }), /* @__PURE__ */ f("tbody", { children: e.map((e, t) => /* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ p("td", { children: [e.start, t === 12 ? " (AI-DLC introduced)" : ""] }),
						Fr.map((t) => /* @__PURE__ */ f("td", {
							className: "is-num",
							children: $(e[t])
						}, t)),
						/* @__PURE__ */ f("td", {
							className: "is-num",
							children: $(e.total)
						})
					] }, e.start)) })]
				})
			})
		]
	});
}
//#endregion
//#region src/cto/stream.tsx
var Ui = {
	agent: "var(--vs-agent)",
	rework: "var(--vs-rework)",
	person: "var(--vs-person)"
}, Wi = {
	agent: "Agent working",
	rework: "Rework",
	person: "Awaiting approval · sign-off"
}, Gi = (e) => e.who === "person" ? "person" : e.label === "Rework" ? "rework" : "agent", Ki = {
	gate: "wait",
	approved: "approved",
	bounce: "bounce",
	check: "tester",
	review: "reviewer",
	deployed: "deploy",
	signoff: "sign",
	merged: "merge"
}, qi = {
	gate: "is-wait",
	approved: "is-ok",
	bounce: "is-back",
	check: "is-back",
	review: "is-back",
	deployed: "is-ok",
	signoff: "is-ok",
	merged: "is-ok"
};
function Ji(e, t) {
	return t.gate === "signoff" ? {
		run: e,
		focus: "signoff"
	} : t.gate ? {
		run: e,
		gate: t.gate,
		at: Math.round(t.from)
	} : {
		run: e,
		...t.phase ? { phase: t.phase } : {},
		at: Math.round(t.from)
	};
}
function Yi(e, t) {
	return t.kind === "signoff" || t.kind === "merged" ? {
		run: e,
		focus: "signoff"
	} : {
		run: e,
		...t.role ? { role: t.role } : {},
		at: Math.round(t.at)
	};
}
function Xi(e, t) {
	if (t === void 0) return -1;
	let n = e.findIndex((e) => t >= e.from && t < e.to);
	return n >= 0 ? n : e.findIndex((e) => e.from > t);
}
var Zi = [
	30,
	60,
	120,
	300,
	600,
	900,
	1800,
	3600,
	7200,
	14400,
	28800,
	86400
];
function Qi({ flow: e, run: t, onBoard: n, hlAt: r }) {
	let [i, a] = Oi(1100), [s, c] = o(null), l = Math.max(1, e.end), u = Math.max(10, a - 6 - 6), m = (e) => 6 + Math.min(Math.max(e, 0), l) / l * u, h = Zi.find((e) => l / e <= 8) ?? Zi[Zi.length - 1], g = Array.from({ length: Math.floor(l / h) + 1 }, (e, t) => t * h), _ = (t) => e.team.find((e) => e.key === t)?.icon ?? t, v = (t) => t.who === "person" ? "Owner" : t.roles.map((t) => e.titles[t] ?? t).join(", "), y = [], b = e.marks.map((e) => {
		let t = Math.min(Math.max(m(e.at), 18), a - 6 - 12), n = y.findIndex((e) => t - e >= 26);
		return n < 0 && (n = y.length < 3 ? y.length : 2), y[n] = t, {
			m: e,
			mx: t,
			my: 148 + n * 26
		};
	}), x = 148 + Math.max(1, y.length) * 26 + 4, S = Xi(e.segments, r);
	return /* @__PURE__ */ p("div", {
		className: "cto-plot cto-vs-plot",
		ref: i,
		style: { height: x },
		children: [/* @__PURE__ */ p("svg", {
			viewBox: `0 0 ${a} ${x}`,
			role: "group",
			"aria-label": `Value stream: ${e.segments.map((e) => `${ei(e.label)} ${Li(e.to - e.from)}`).join(", ")}`,
			"data-testid": "item-stream",
			children: [
				g.map((e) => /* @__PURE__ */ p("g", { children: [/* @__PURE__ */ f("line", {
					x1: m(e),
					x2: m(e),
					y1: 30,
					y2: 112,
					stroke: "var(--border)",
					strokeWidth: 1
				}), /* @__PURE__ */ f("text", {
					x: m(e),
					y: 128,
					textAnchor: e === 0 ? "start" : "middle",
					children: I(e)
				})] }, e)),
				/* @__PURE__ */ f("line", {
					x1: 6,
					x2: a - 6,
					y1: 112,
					y2: 112,
					stroke: "var(--border-strong)",
					strokeWidth: 1
				}),
				e.segments.map((r, i) => {
					let a = Gi(r), o = m(r.from), s = m(r.to), l = Math.max(2, s - o - (i < e.segments.length - 1 ? 2 : 0)), u = i === 0, h = i === e.segments.length - 1, g = `M${o + (u ? 4 : 0)},36 H${o + l - (h ? 4 : 0)}${h ? ` Q${o + l},36 ${o + l},40 V56 Q${o + l},60 ${o + l - 4},60` : " V60"} H${o + (u ? 4 : 0)}${u ? ` Q${o},60 ${o},56 V40 Q${o},36 ${o + 4},36` : " V36"} Z`, y = r.who === "person" ? r.gate === "signoff" ? ["sign"] : ["wait"] : r.roles.map(_), b = Math.max(0, Math.floor((l + 2) / 22)), x = y.slice(0, b >= y.length ? y.length : Math.max(0, b - 1)), C = y.length - x.length, w = r.who === "person" ? ei(r.label).replace("Awaiting approval · ", "") : ei(r.label);
					return /* @__PURE__ */ p("g", {
						className: `cto-vs-seg is-${a}${i === S ? " is-hl" : ""}`,
						"data-hl": i === S ? "true" : void 0,
						children: [
							/* @__PURE__ */ f("path", {
								d: g,
								fill: Ui[a]
							}),
							x.map((e, t) => /* @__PURE__ */ p("g", {
								className: `cto-vs-chip ${r.who === "person" ? "is-wait" : "is-ok"}`,
								transform: `translate(${o + t * 22},8)`,
								children: [/* @__PURE__ */ f("rect", {
									width: 20,
									height: 20,
									rx: 6
								}), /* @__PURE__ */ f(Et, {
									role: e,
									cx: 10,
									cy: 10,
									size: 14
								})]
							}, t)),
							C > 0 && b > 0 && /* @__PURE__ */ p("text", {
								x: o + x.length * 22 + 2,
								y: 23,
								children: ["+", C]
							}),
							l >= 58 && /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("text", {
								x: o,
								y: 78,
								className: "is-strong",
								children: w.length * 13 > l ? `${w.slice(0, Math.max(1, Math.floor(l / 13) - 1))}…` : w
							}), /* @__PURE__ */ p("text", {
								x: o,
								y: 94,
								children: [Li(r.to - r.from), r.decision && r.decision !== "Signed" ? ` · ${ti(r.decision)}` : ""]
							})] }),
							/* @__PURE__ */ f(Ai, {
								x: o,
								y: 6,
								w: Math.max(6, l),
								h: 96,
								onTip: c,
								tipY: 100,
								when: `${I(r.from)}–${I(r.to)} · ${Wi[a]}`,
								rows: [
									[
										Li(r.to - r.from),
										w,
										Ui[a]
									],
									[v(r), r.who === "person" ? "Who decided" : "Who did it"],
									...r.decision ? [[ti(r.decision), "Verdict"]] : [],
									["Click", r.who === "person" ? "Go to this gate on the board" : "Go to this phase on the board"]
								],
								onPick: () => n(Ji(t, r)),
								label: `${w}, ${Li(r.to - r.from)}: go to this step on the team board`
							})
						]
					}, `${r.from}-${r.label}`);
				}),
				b.map(({ m: e, mx: r, my: i }) => /* @__PURE__ */ p("g", {
					className: `cto-vs-moment ${qi[e.kind]}`,
					children: [
						/* @__PURE__ */ f("line", {
							x1: r,
							x2: r,
							y1: 60,
							y2: i - 11,
							className: "cto-vs-tick"
						}),
						/* @__PURE__ */ f("circle", {
							cx: r,
							cy: i,
							r: 11
						}),
						/* @__PURE__ */ f(Et, {
							role: Ki[e.kind],
							cx: r,
							cy: i,
							size: 14
						}),
						/* @__PURE__ */ f(Ai, {
							x: r - 13,
							y: i - 13,
							w: 26,
							h: 26,
							onTip: c,
							tipY: i + 16,
							when: I(e.at),
							rows: [[$r(e.label), ""], ["Click", "Replay the board to this moment"]],
							onPick: () => n(Yi(t, e)),
							label: `${I(e.at)} ${$r(e.label)}: replay the board to this moment`
						})
					]
				}, `${e.at}-${e.kind}-${e.label}`))
			]
		}), /* @__PURE__ */ f(ki, {
			tip: s,
			width: a
		})]
	});
}
//#endregion
//#region src/cto/Flow.tsx
var $i = [
	["Backlog", "Submitted, waiting for a team"],
	["Ideation", "Intent · Constraints · Scope"],
	["Inception", "Requirements · Design · Work split"],
	["Construction", "Code · Tests · Independent review"],
	["Operation", "Deploy · Release · Sign-off"],
	["Delivered", "Last 7 days · click for the delivery detail"]
], ea = [
	"Ideation",
	"Inception",
	"Construction",
	"Operation"
], ta = {
	Ideation: "ideation",
	Inception: "inception",
	Construction: "construction",
	Operation: "operation"
}, na = {
	"Scope gate": "scope",
	"Requirements gate": "pm",
	"Plan gate": "architect",
	"Release gate": "compliance",
	"Security gate": "security",
	"Sign-off": "sign"
};
function ra({ w: e, lines: t, hl: n, h: r }) {
	let i = e.real ?? e.issue ?? "", a = e.live && e.real ? e.state === "wait" && e.role ? {
		run: e.real,
		gate: e.role
	} : { run: e.real } : null, o = () => (e.real || e.issue) && r.onItem(Di(e));
	return /* @__PURE__ */ p("div", {
		className: `cto-kcard cto-pick${a ? ` is-live is-${e.state}` : ""}${n === i ? " is-hl" : ""}`,
		"data-key": i,
		"data-testid": a ? "cto-live-card" : void 0,
		role: "button",
		tabIndex: 0,
		title: "Delivery detail",
		onClick: o,
		onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), o()),
		children: [
			/* @__PURE__ */ f("div", {
				className: "cto-ktop",
				children: e.state === "wait" ? /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ p("span", {
					className: "cto-gate",
					children: [/* @__PURE__ */ f(Z, {
						role: e.role || na[e.gate ?? ""] || "wait",
						size: 13
					}), $r(e.gate)]
				}), /* @__PURE__ */ p("span", { children: ["Waited ", Ur(e.hours ?? 0)] })] }) : e.state === "agent" ? /* @__PURE__ */ p("span", { children: [
					e.members,
					" member",
					e.members === 1 ? "" : "s",
					" · ",
					e.mins,
					" min used"
				] }) : /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("span", { children: "Waiting for a team" }), /* @__PURE__ */ p("span", { children: [
					"Submitted ",
					e.mins,
					" min ago"
				] })] })
			}),
			/* @__PURE__ */ f("div", {
				className: "cto-ktitle",
				title: e.t,
				children: e.t
			}),
			e.state === "wait" && /* @__PURE__ */ f("div", {
				className: "cto-kfocus",
				children: e.focus
			}),
			/* @__PURE__ */ p("div", {
				className: "cto-kmeta",
				title: e.reporter ? `${e.issue ?? ""} · raised by ${A(e.reporter)}` : void 0,
				children: [
					A(t[e.line]),
					e.issue ? ` · ${e.issue}` : "",
					e.pr ? ` · PR #${e.pr} waiting to merge` : "",
					e.state === "wait" ? ` · waiting for ${e.who}` : ""
				]
			}),
			a && /* @__PURE__ */ f("button", {
				type: "button",
				className: "kt-btn is-small is-primary",
				onClick: (e) => {
					e.stopPropagation(), r.onOpen(a);
				},
				children: e.state === "wait" ? "Go to approve ↗" : "Open ↗"
			})
		]
	});
}
function ia({ list: e, lines: t, hl: n, h: r, wait: i, empty: a }) {
	return /* @__PURE__ */ p("div", {
		className: `cto-cell${i ? " is-wait" : ""}`,
		children: [
			e.length === 0 && a && /* @__PURE__ */ f("div", {
				className: "cto-kempty",
				children: a
			}),
			e.slice(0, 2).map((e, i) => /* @__PURE__ */ f(ra, {
				w: e,
				lines: t,
				hl: n,
				h: r
			}, `${e.t}-${i}`)),
			e.length > 2 && /* @__PURE__ */ p("div", {
				className: "cto-kmore",
				children: [
					"+",
					e.length - 2,
					" more"
				]
			})
		]
	});
}
function aa({ data: e, line: t, fresh: n, hl: r = null, ...i }) {
	let a = e.meta, o = e.wip.filter(Kr(t)), s = o.filter((e) => e.state === "wait"), c = o.filter((e) => e.state === "agent"), l = o.filter((e) => e.state === "pool"), u = (e, t) => +!!t.live - !!e.live, d = Wr(a.today, 6), m = e.items.filter((e) => e.period === "agent" && e.ship >= d && Kr(t)(e)), h = (e) => e.real && n.has(e.real) ? 0 : e.real ? 1 : 2, g = [...m].sort((e, t) => h(e) - h(t) || (e.ship < t.ship ? 1 : -1)).slice(0, 4), _ = (e) => e === "Backlog" ? l.length : e === "Delivered" ? m.length : o.filter((t) => t.col === e && t.state !== "pool").length, v = e.items.find((e) => e.real && Kr(t)(e)) ?? e.items.find((e) => e.real), y = (e) => {
		if (e === "Backlog") return i.onOpen({ new: "promo" });
		if (e === "Delivered") return i.onLedger();
		let t = o.find((t) => t.live && t.real && t.col === e), n = t?.real ?? v?.real;
		n && i.onOpen({
			run: n,
			phase: ta[e],
			...t ? {} : { pick: "latest" }
		});
	}, b = () => {
		let e = [...s].filter((e) => e.live && e.real && e.role).sort((e, t) => (t.hours ?? 0) - (e.hours ?? 0))[0];
		e ? i.onOpen({
			run: e.real,
			gate: e.role
		}) : v?.real && i.onGateOf(v.real);
	}, x = () => {
		let e = c.find((e) => e.live && e.real);
		e ? i.onOpen({ run: e.real }) : v?.real && i.onOpen({
			run: v.real,
			replay: 30,
			pick: "latest"
		});
	}, S = (e) => e === "Backlog" ? "Raise a new requirement on the team board" : e === "Delivered" ? "See the delivery list below" : `See the "${$r(e)}" step on the team board (${o.some((t) => t.live && t.col === e) ? "the run that is here now" : "the latest measured delivery"})`;
	return /* @__PURE__ */ p("section", {
		className: "cto-card cto-flow",
		"aria-label": "Requirement flow",
		"data-anchor": "flow",
		children: [
			/* @__PURE__ */ p("div", {
				className: "cto-flow-head",
				children: [
					/* @__PURE__ */ f("span", {
						className: "cto-live",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ f("h3", { children: "Requirement flow" }),
					/* @__PURE__ */ f("span", {
						className: "cto-dim",
						children: "Now · from Kiro Crew · refreshes every 5 s · click a card for the delivery detail, click a column name for that step on the team board"
					}),
					/* @__PURE__ */ f("span", { className: "cto-grow" }),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-small cto-noprint cto-noproj",
						onClick: () => i.onOpen({ new: "promo" }),
						title: "Submit a new requirement on the team board (the Black Friday sale is filled in)",
						children: "New requirement ↗"
					})
				]
			}),
			/* @__PURE__ */ p("div", {
				className: "cto-stats",
				"data-testid": "cto-flow-stats",
				children: [
					"In progress ",
					$(s.length + c.length),
					/* @__PURE__ */ f("span", { children: "·" }),
					"Agent working ",
					$(c.length),
					/* @__PURE__ */ f("span", { children: "·" }),
					"Awaiting approval ",
					$(s.length),
					/* @__PURE__ */ f("span", { children: "·" }),
					"Backlog ",
					$(l.length)
				]
			}),
			/* @__PURE__ */ p("div", {
				className: "cto-dim",
				children: [
					"Items awaiting approval have waited ",
					Ur(Vr(s.map((e) => e.hours ?? 0))),
					" on average; an agent run takes ",
					a.realAvgMins,
					" min on average (measured)."
				]
			}),
			/* @__PURE__ */ p("div", {
				className: "cto-kanban",
				role: "table",
				"aria-label": "Requirement flow board",
				children: [
					/* @__PURE__ */ f("div", {}),
					$i.map(([e, t]) => /* @__PURE__ */ f("div", {
						className: "cto-kb-h",
						children: /* @__PURE__ */ p("button", {
							type: "button",
							onClick: () => y(e),
							title: S(e),
							children: [/* @__PURE__ */ p("div", { children: [/* @__PURE__ */ p("b", { children: [$r(e), e === "Delivered" ? "" : " ↗"] }), /* @__PURE__ */ f("span", {
								className: "cto-n",
								children: $(_(e))
							})] }), /* @__PURE__ */ f("div", {
								className: "cto-st",
								children: t
							})]
						})
					}, e)),
					/* @__PURE__ */ f("div", {
						className: "cto-lane is-wait",
						children: /* @__PURE__ */ p("button", {
							type: "button",
							onClick: b,
							title: "Go to the gates awaiting approval on the team board",
							children: [/* @__PURE__ */ f(Z, {
								role: "wait",
								size: 15
							}), "Awaiting approval ↗"]
						})
					}),
					/* @__PURE__ */ p("div", {
						className: "cto-cell is-span",
						children: [[...l].sort((e, t) => (e.mins ?? 0) - (t.mins ?? 0)).slice(0, 2).map((e, t) => /* @__PURE__ */ f(ra, {
							w: e,
							lines: a.lines,
							hl: r,
							h: i
						}, t)), l.length > 2 && /* @__PURE__ */ p("div", {
							className: "cto-kmore",
							children: [
								"+",
								l.length - 2,
								" more"
							]
						})]
					}),
					ea.map((e) => /* @__PURE__ */ f(ia, {
						wait: !0,
						lines: a.lines,
						hl: r,
						h: i,
						list: s.filter((t) => t.col === e).sort((e, t) => u(e, t) || (t.hours ?? 0) - (e.hours ?? 0)),
						empty: e === "Construction" ? "No human gate in this phase: failed checks are sent back to the agent automatically" : "None right now"
					}, `w-${e}`)),
					/* @__PURE__ */ p("div", {
						className: "cto-cell is-span",
						children: [g.map((e) => {
							let t = e.real ?? e.issue ?? e.t;
							return /* @__PURE__ */ p("button", {
								type: "button",
								"data-key": t,
								className: `cto-kcard${e.real ? " is-real" : ""}${e.real && n.has(e.real) ? " is-new" : ""}${r === t ? " is-hl" : ""}`,
								title: "Delivery detail",
								onClick: () => i.onItem(Di(e)),
								children: [
									/* @__PURE__ */ p("span", {
										className: "cto-ktop",
										children: [/* @__PURE__ */ f("span", { children: e.real && n.has(e.real) ? "just now" : Hr(e.ship) }), e.real ? /* @__PURE__ */ f("span", {
											className: "cto-tag is-real",
											children: "Measured"
										}) : /* @__PURE__ */ f("span", { children: "Simulated" })]
									}),
									/* @__PURE__ */ f("span", {
										className: "cto-ktitle",
										children: e.t
									}),
									/* @__PURE__ */ p("span", {
										className: "cto-kmeta",
										children: [
											A(a.lines[e.line]),
											" · ",
											e.mins == null ? `${Math.round(e.cyc * 10) / 10} days` : `${e.mins} min`
										]
									})
								]
							}, `${t}-${e.ship}`);
						}), m.length > g.length && /* @__PURE__ */ p("button", {
							type: "button",
							className: "cto-kmore cto-link",
							onClick: i.onLedger,
							children: [
								"+",
								$(m.length - g.length),
								" more (see the delivery list below)"
							]
						})]
					}),
					/* @__PURE__ */ f("div", {
						className: "cto-lane",
						children: /* @__PURE__ */ f("button", {
							type: "button",
							onClick: x,
							title: "See what the agents are doing on the team board",
							children: "Agent working ↗"
						})
					}),
					ea.map((e) => /* @__PURE__ */ f(ia, {
						lines: a.lines,
						hl: r,
						h: i,
						list: c.filter((t) => t.col === e).sort((e, t) => u(e, t) || (t.mins ?? 0) - (e.mins ?? 0))
					}, `a-${e}`))
				]
			})
		]
	});
}
//#endregion
//#region src/cto/styles.ts
var oa = "--bg: #fff; --bg-hover: #f0f0f0; --card: #fff; --text: #4a464f; --text-strong: #19161d; --muted: #5e5966;\n  --border: #e4e4e7; --border-strong: #d4d4d8; --kt-approve: #b8237a; --kt-ok: #0a7d45;", sa = "--s1: #2a78d6; --s2: #eb6834; --s3: #b9b6bf; --s4: #6250d6; --deemph: #b9b6bf; --cto-cell: #f7f7f8; --vs-person: #e87ba4; --vs-rework: #eda100;", ca = `
.cto-root { --s1: #3987e5; --s2: #d95926; --s3: #6b6673; --s4: #9085e9; --deemph: #6b6673; --cto-cell: var(--bg, #19161d);
  --vs-agent: var(--s4); --vs-person: #d55181; --vs-rework: #c98500;
  --cto-wash: color-mix(in srgb, var(--accent) 10%, transparent); --cto-fresh: color-mix(in srgb, var(--accent) 16%, transparent);
  --cto-glass: color-mix(in srgb, var(--text) 4%, transparent); gap: 16px; }
:root[data-mode="light"] .cto-root { ${sa} }
.cto-root.is-printing { ${oa} ${sa} background: #fff; color: #4a464f; }
.cto-root [hidden] { display: none !important; }
.cto-root .kt-btn.is-small { padding: 3px 10px; font-size: 13px; border-radius: 8px; }
.cto-tag { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; border: 1px solid var(--border); color: var(--text); }
.cto-tag.is-real { border-color: var(--accent); color: var(--text-strong); background: var(--cto-fresh); }
.cto-dim { color: var(--muted); }

.cto-top { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cto-top h1 { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); }
.cto-top .cto-org { color: var(--text); font-size: 14px; }
.cto-grow { flex: 1; }
.cto-dl { position: relative; }
.cto-dl summary { list-style: none; }
.cto-dl summary::-webkit-details-marker { display: none; }
.cto-menu { position: absolute; right: 0; top: calc(100% + 6px); z-index: 20; min-width: 280px; padding: 6px; border-radius: 12px; border: 1px solid var(--border-strong); background: var(--card); box-shadow: 0 12px 30px rgba(0,0,0,.3); display: grid; }
.cto-menu button { text-align: left; border: 0; background: transparent; padding: 8px 10px; border-radius: 8px; cursor: pointer; font: inherit; color: var(--text); }
.cto-menu button:hover { background: var(--bg-hover); }

.cto-hero h2 { margin: 6px 0 0; font-size: 32px; line-height: 1.3; font-weight: 700; color: var(--text-strong); }
.cto-hero p { margin: 6px 0 0; color: var(--text); }
.cto-lines { display: flex; flex-wrap: wrap; gap: 8px; }
.cto-lines button { display: inline-flex; align-items: baseline; gap: 8px; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--card); cursor: pointer; font: inherit; color: var(--text); }
.cto-lines button b { color: var(--text-strong); }
.cto-lines button span { color: var(--muted); font-size: 13px; }
.cto-lines button[aria-pressed="true"] { border-color: var(--accent); background: var(--cto-fresh); }

.cto-card { position: relative; } /* frame, padding, glass: kit.ts */
.cto-cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }

.cto-value { margin: 6px 0 2px; } /* type: kit.ts */
.cto-desc { color: var(--text); }
.cto-mini { position: relative; margin-top: 14px; }
.cto-mini svg { display: block; width: 100%; overflow: visible; }
.cto-mini text, .cto-plot text { font-size: 12px; fill: var(--muted); font-variant-numeric: tabular-nums; }
.cto-mini text.is-strong { fill: var(--text-strong); font-weight: 600; font-size: 13px; }
.cto-plot .cto-mark { fill: var(--text); }
.cto-hit { fill: transparent; outline: none; cursor: default; }
.cto-hit:hover, .cto-hit:focus { fill: var(--cto-wash); }
.cto-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 8px; font-size: 13px; color: var(--text); }
.cto-legend > span, .cto-legend > button { display: inline-flex; align-items: center; gap: 6px; }
.cto-legend > button { border: 0; background: transparent; padding: 2px 6px; margin-left: -6px; border-radius: 6px; cursor: pointer; color: inherit; font: inherit; }
.cto-legend > button b { color: var(--text-strong); font-weight: 600; font-variant-numeric: tabular-nums; }
.cto-legend > button:hover, .cto-legend > button[aria-pressed="true"] { background: var(--cto-fresh); }
.cto-sw { width: 10px; height: 10px; border-radius: 2px; display: inline-block; flex: none; }
.cto-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex: none; }
.cto-foot { margin-top: 8px; font-size: 13px; color: var(--text); display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.cto-link { border: 0; background: transparent; color: var(--accent); cursor: pointer; padding: 0; font: inherit; }
.cto-calc { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 6px; font-size: 13px; color: var(--text); }
.cto-calc input { width: 96px; padding: 3px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--cto-cell); color: var(--text-strong); font: inherit; }
.cto-calc b { color: var(--text-strong); }
.cto-flash { animation: cto-flash 1.6s ease-out; }
@keyframes cto-flash { 0% { background: var(--cto-fresh); } 100% { background: transparent; } }
.cto-tip { position: absolute; z-index: 10; pointer-events: none; background: var(--card); border: 1px solid var(--border-strong); border-radius: 10px; padding: 8px 10px; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.25); min-width: 200px; }
.cto-tip .cto-when { color: var(--muted); margin-bottom: 4px; white-space: nowrap; }
.cto-tip .cto-row { display: flex; align-items: center; gap: 8px; }
.cto-tip .cto-row b { min-width: 40px; text-align: right; font-variant-numeric: tabular-nums; color: var(--text-strong); }
.cto-tip .cto-key { width: 12px; height: 2px; border-radius: 1px; }
.cto-tip .cto-row span { color: var(--text); }

.cto-chart-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.cto-plot { position: relative; height: 270px; }
.cto-plot svg { display: block; width: 100%; height: 100%; }
.cto-seg { display: inline-flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.cto-seg button { border: 0; background: transparent; padding: 5px 12px; cursor: pointer; font: inherit; color: var(--text); }
.cto-seg button[aria-pressed="true"] { background: var(--cto-fresh); font-weight: 600; color: var(--text-strong); }
.cto-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.cto-table th { text-align: left; font-weight: 600; color: var(--text); padding: 8px 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
.cto-table td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; color: var(--text-strong); }
.cto-table .is-num { text-align: right; font-variant-numeric: tabular-nums; }
.cto-weeks { max-height: 270px; overflow: auto; }

.cto-flow-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cto-live { width: 8px; height: 8px; border-radius: 50%; background: var(--kt-ok); flex: none; animation: cto-pulse 1.6s infinite; }
@keyframes cto-pulse { 50% { opacity: .35; } }
.cto-stats { font-size: 18px; font-weight: 650; margin-top: 10px; color: var(--text-strong); }
.cto-stats span { color: var(--muted); font-weight: 400; margin: 0 6px; }
.cto-kanban { display: grid; grid-template-columns: 88px repeat(6, minmax(0, 1fr)); gap: 6px; margin-top: 12px; }
.cto-kb-h { padding: 4px 8px; }
.cto-kb-h b { font-size: 14px; color: var(--text-strong); }
.cto-kb-h .cto-n { color: var(--muted); margin-left: 6px; font-variant-numeric: tabular-nums; }
.cto-kb-h .cto-st { color: var(--muted); font-size: 12px; }
.cto-lane { white-space: nowrap; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 13px; font-weight: 600; color: var(--text); border-radius: 10px; background: var(--cto-cell); padding: 6px; }
.cto-lane.is-wait { color: var(--text-strong); background: color-mix(in srgb, var(--kt-approve) 16%, var(--cto-cell)); }
.cto-cell { background: var(--cto-cell); border-radius: 10px; padding: 6px; display: grid; gap: 6px; align-content: start; min-height: 60px; }
.cto-cell.is-wait { background: color-mix(in srgb, var(--kt-approve) 6%, var(--cto-cell)); }
.cto-cell.is-span { grid-row: span 2; }
.cto-kcard { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 6px 8px; font-size: 12.5px; display: grid; gap: 2px; min-width: 0; text-align: left; color: var(--text); font-family: inherit; }
.cto-kcard .cto-ktop { display: flex; justify-content: space-between; gap: 6px; color: var(--muted); font-size: 12px; white-space: nowrap; }
.cto-kcard .cto-gate { color: var(--kt-approve); font-weight: 600; }
.cto-kcard .cto-ktitle { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-strong); }
.cto-kcard .cto-kfocus { color: var(--text); }
.cto-kcard .cto-kmeta { color: var(--muted); font-size: 12px; }
.cto-kcard .kt-btn { justify-self: start; margin-top: 4px; }
.cto-kcard.is-live { cursor: pointer; } /* its border says its state: kit.ts */
.cto-kcard.is-real { cursor: pointer; } /* Measured is its tag, not its border */
.cto-kcard.is-new { animation: cto-flash 2.4s ease-out; }
.cto-kmore, .cto-kempty { color: var(--muted); font-size: 12px; padding: 0 4px; }
.cto-pop { position: absolute; z-index: 15; width: 440px; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--accent); background: var(--card); box-shadow: 0 16px 40px rgba(0,0,0,.35); display: grid; gap: 8px; }
.cto-pop-head { display: flex; align-items: center; gap: 8px; }
.cto-pop-head b { font-size: 15px; color: var(--text-strong); }
.cto-pop-head .cto-x { margin-left: auto; border: 0; background: transparent; color: var(--muted); font-size: 18px; cursor: pointer; line-height: 1; }
.cto-pop-facts { color: var(--text); font-size: 13px; }
.cto-decisions { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; font-size: 14px; color: var(--text-strong); }
.cto-decisions li { display: grid; grid-template-columns: 72px 1fr; gap: 8px; }
.cto-decisions li b { font-weight: 600; white-space: nowrap; }
.cto-pop-act { display: flex; gap: 8px; margin-top: 2px; }

.cto-ledger-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
.cto-kind { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.cto-was { color: var(--muted); font-size: 12px; }
.cto-defect { color: var(--kt-warn); font-size: 12px; }
.cto-ids { white-space: nowrap; font-size: 13px; }
.cto-ids .cto-was { font-family: var(--font-body, sans-serif); }
.cto-ids .cto-was.kt-mono { font-family: var(--mono, ui-monospace, monospace); }
.cto-table tr.is-real td { background: color-mix(in srgb, var(--accent) 6%, transparent); }
.cto-table tr.is-new td { animation: cto-flash 2.4s ease-out; }
.cto-src { display: flex; gap: 6px; align-items: center; white-space: nowrap; }
.cto-notes { color: var(--muted); font-size: 13px; }
.cto-notes summary { cursor: pointer; color: var(--text); }
.cto-notes ul { margin: 8px 0 0; padding-left: 18px; display: grid; gap: 4px; }
.cto-assume table, .cto-measured table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
.cto-assume th, .cto-assume td, .cto-measured th, .cto-measured td { text-align: left; padding: 6px 12px 6px 0; border-top: 1px solid var(--border); vertical-align: top; }
.cto-assume th, .cto-measured th { font-weight: 600; color: var(--text-strong); }
.cto-assume td:first-child { color: var(--text-strong); white-space: nowrap; }
.cto-measured h3 { margin: 0 0 4px; }
.cto-measured .cto-est { color: var(--muted); }
.cto-honest { margin: 6px 0 0; color: var(--muted); font-size: 13px; }
.cto-toast { position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%); z-index: 30; padding: 10px 16px; border-radius: 12px; background: var(--bg-hover); border: 1px solid var(--border); font-size: 14px; color: var(--text-strong); max-width: 640px; }

/* Delivery detail: built from the CTO view's cards and charts and the board's pills, chips and icons */
.cto-item-head { display: flex; align-items: center; gap: 8px 12px; flex-wrap: wrap; }
.cto-item-head .kt-run-title { margin: 0; }
.cto-item-head .cto-org { color: var(--text); font-size: 14px; }
.cto-item-now { margin: -6px 0 0; color: var(--text-strong); font-size: 14px; }
.cto-item-act { display: flex; gap: 8px; flex-wrap: wrap; }
.cto-item-cards { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.cto-value .cto-of { font-size: .5em; margin-left: 6px; } /* half the number: as big as the board's "/38" */
.cto-chips { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 14px; }
.cto-chip { width: 26px; height: 26px; display: inline-grid; place-items: center; flex: none; border-radius: 8px; border: 2px solid var(--kt-ok-solid); background: var(--kt-ok-solid); color: #fff; }
.cto-chip.is-small { width: 22px; height: 22px; border-radius: 7px; }
.cto-chip.is-idle { border-style: dashed; border-color: var(--border-strong); background: transparent; color: var(--muted); opacity: .7; }
.cto-chip.is-back { border-color: var(--vs-rework); background: color-mix(in srgb, var(--vs-rework) 18%, transparent); color: var(--text-strong); }
.cto-chip.is-wait { border-color: var(--vs-person); background: color-mix(in srgb, var(--vs-person) 18%, transparent); color: var(--text-strong); }
.cto-chip.is-plain { border-color: var(--border-strong); background: transparent; color: var(--text-strong); }
.cto-segs { border: 0; background: transparent; padding: 0; margin-top: 14px; width: 100%; cursor: pointer; }
.cto-segs i { height: 10px; }
.cto-legend > button:disabled { cursor: default; color: var(--muted); }
.cto-legend > button .kt-role-icon { color: var(--vs-rework); }
.cto-gatecell { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-weight: 600; }
.cto-item-chain { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; margin-top: 10px; }
.cto-chainpart { display: flex; gap: 10px; align-items: flex-start; }
.cto-chainpart b, .cto-chainpart .cto-link { font-size: 15px; color: var(--text-strong); }
.cto-chainpart .cto-link { color: var(--accent); }
.cto-item-arrow { font-size: 22px; color: var(--muted); }
.cto-item-twinrow { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-top: 12px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--cto-glass); }
.cto-item-twinrow > div { flex: 1 1 320px; }
.cto-vs-plot { margin-top: 10px; }
.cto-vs-plot text { font-size: 12px; fill: var(--muted); font-variant-numeric: tabular-nums; }
.cto-vs-plot text.is-strong { fill: var(--text-strong); font-weight: 600; font-size: 13px; }
.cto-vs-plot .cto-vs-lane { fill: var(--muted); }
.cto-vs-chip rect { fill: var(--kt-ok-solid); }
.cto-vs-chip .kt-role-icon { color: #fff; }
.cto-vs-chip.is-wait rect { fill: color-mix(in srgb, var(--vs-person) 22%, var(--card)); stroke: var(--vs-person); stroke-width: 1.5; }
.cto-vs-chip.is-wait .kt-role-icon { color: var(--text-strong); }
.cto-vs-tick { stroke: var(--border-strong); stroke-dasharray: 2 3; }
.cto-vs-moment circle { fill: var(--card); stroke: var(--border-strong); stroke-width: 1.5; }
.cto-vs-moment .kt-role-icon { color: var(--text-strong); }
.cto-vs-moment.is-wait circle { stroke: var(--vs-person); }
.cto-vs-moment.is-ok circle { stroke: var(--kt-ok); }
.cto-vs-moment.is-back circle { stroke: var(--vs-rework); }
.cto-vs-seg path { transition: filter .15s; }
.cto-vs-seg:hover path { filter: brightness(1.12); }
.cto-vs-seg.is-hl path { stroke: var(--text-strong); stroke-width: 2; }
.cto-vs-seg.is-hl text.is-strong { fill: var(--accent); }

/* the other two views: rows, cards and headings that open the next layer */
.cto-link-value { border: 0; background: transparent; padding: 0; font-family: inherit; color: var(--text-strong); cursor: pointer; text-align: left; display: block; }
.cto-link-value:hover { color: var(--accent); }
.cto-row-pick { cursor: pointer; }
.cto-row-pick:hover td { background: var(--cto-glass); }
.cto-row-pick:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.cto-link-value:hover { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 6px; }
.cto-table tr.is-hl td { animation: cto-flash 2.4s ease-out 2; background: var(--cto-fresh); }
.cto-kcard.is-hl { outline: 2px solid var(--accent); outline-offset: 2px; }
.cto-pick { cursor: pointer; }
.cto-kb-h button, .cto-lane button { border: 0; background: transparent; padding: 0; font: inherit; color: inherit; cursor: pointer; text-align: left; display: inline-flex; align-items: center; gap: 6px; }
.cto-kb-h button { display: block; }
.cto-kb-h button:hover b, .cto-lane button:hover { color: var(--accent); }
.cto-lane .kt-role-icon { color: var(--kt-approve); }
.cto-gate { display: inline-flex; align-items: center; gap: 4px; }
.cto-filter { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--accent); border-radius: 999px; padding: 1px 4px 1px 10px; font-size: 13px; color: var(--text-strong); background: var(--cto-fresh); }
.cto-filter button { border: 0; background: transparent; cursor: pointer; color: var(--muted); font: inherit; }
.cto-hit.is-pick { cursor: pointer; }
@media (max-width: 960px) { .cto-item-cards { grid-template-columns: 1fr 1fr; } }

.cto-root.is-projection { position: fixed; inset: 0; z-index: 2147483000; overflow: auto; background: var(--bg); font-size: 18px; padding: 24px 48px 60px; }
.cto-root.is-projection .cto-hero h2 { font-size: 46px; }
.cto-root.is-projection .cto-value { font-size: 56px; }
.cto-root.is-projection .cto-mini text { font-size: 15px; }
.cto-root.is-projection .cto-mini text.is-strong { font-size: 16px; }
.cto-root.is-projection .cto-noproj { display: none !important; }

.cto-print-only { display: none; }
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  body * { visibility: hidden; }
  .cto-root, .cto-root * { visibility: visible; }
  .cto-root { position: absolute; left: 0; top: 0; width: 100%; padding: 0; font-size: 11px; }
  .cto-root .cto-noprint, .cto-root .cto-tip, .cto-root .cto-pop, .cto-root .cto-toast, .cto-root .cto-calc, .cto-root .cto-link { display: none !important; }
  .cto-lines button:not([aria-pressed="true"]) { display: none; }
  .cto-print-only { display: block; color: var(--muted); margin: 4px 0 8px; }
  .cto-card, .cto-cell, .cto-kcard, .cto-table tr { break-inside: avoid; }
  .cto-flow { break-before: page; }
  .cto-hero h2 { font-size: 24px; } .cto-value { font-size: 28px; }
  .cto-plot { height: 220px; }
}
@media (max-width: 1180px) { .cto-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 960px) { .cto-cards { grid-template-columns: 1fr; } .cto-kanban { grid-template-columns: 1fr; } .cto-cell.is-span { grid-row: auto; } .cto-pop { width: auto; left: 12px !important; right: 12px !important; } }
`, la = ".kt-kpi, .cto-cards > .cto-card", ua = ".kt-card, .kt-experts, .kt-kb, .kt-sign, .kt-start, .cto-root > section.cto-card", da = `
.kt-root { --kit-r: 16px; --kit-r-cell: 10px; --kit-pad-kpi: 16px 18px; --kit-pad-block: 16px 20px; --kit-gap-row: 12px; --kit-gap-block: 16px;
  --kit-ok: color-mix(in srgb, var(--kt-ok) 55%, var(--border)); --kit-wait: color-mix(in srgb, var(--kt-approve) 55%, var(--border));
  --kit-run: color-mix(in srgb, var(--kt-run) 55%, var(--border)); --kit-bad: color-mix(in srgb, var(--kt-bad) 55%, var(--border)); gap: var(--kit-gap-block); }
${`${la}, ${ua}, .kt-graph, .kt-lane`} { border-radius: var(--kit-r); border: 1px solid var(--border); }
${la}, ${ua} { background-color: var(--card); }
${la} { position: relative; overflow: hidden; padding: var(--kit-pad-kpi); }
.kt-kpi::after, .cto-cards > .cto-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
  background: radial-gradient(90% 70% at 100% 0%, color-mix(in srgb, var(--text) 4%, transparent), transparent 70%); }
${ua} { padding: var(--kit-pad-block); margin: 0; }
.kt-kpis, .cto-cards { gap: var(--kit-gap-row); align-items: stretch; }
.cto-kcard, .kt-kb-chip, .cto-cell, .cto-lane { border-radius: var(--kit-r-cell); }

.kt-kpi-label, .cto-eyebrow { font-size: .93em; font-weight: 650; color: var(--muted); letter-spacing: .04em; }
.kt-kpi-big, .cto-value { font-size: 2.85em; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; font-variant-numeric: tabular-nums; color: var(--text-strong); text-shadow: none; }
.kt-kpi-of, .cto-of { font-weight: 700; letter-spacing: 0; color: var(--muted); }
.kt-kpi-of { font-size: 1.43em; } /* beside the number; the CTO view's "credits" and "/37" sit inside it at .5em: the same 20 px */
.kt-card-head h2, .kt-experts-title, .kt-kb-head b, .kt-sign-head h2, .cto-chart-head h3, .cto-flow-head h3, .cto-ledger-head h3 { margin: 0; font-size: 1.1em; font-weight: 700; color: var(--text-strong); letter-spacing: 0; }
.kt-kb-head b { display: inline-flex; align-items: center; gap: 6px; }
.kt-kb-head b .kt-role-icon { color: var(--kt-info); }
.kt-sign-done > .kt-role-icon { vertical-align: -3px; color: var(--kt-ok); }

/* the crumb of a view opened from another: where it is, the way back */
.kit-crumb { display: flex; align-items: center; gap: 6px 8px; flex-wrap: wrap; font-size: .93em; color: var(--muted); }
.kit-crumb button:not(.kt-btn) { border: 0; background: transparent; padding: 0; font: inherit; color: var(--accent); cursor: pointer; }
.kit-crumb button:not(.kt-btn):hover { text-decoration: underline; text-underline-offset: 3px; }
.kit-crumb b { color: var(--text-strong); font-weight: 600; }
.kit-crumb .kt-grow { flex: 1; }
.kt-where-why { padding: 2px 10px; border-radius: 999px; background: color-mix(in srgb, var(--text) 7%, transparent); color: var(--text); } /* a note, not a state: no border */

/* a border says a state */
/* (under .kt-root: a state outranks the frame rules above, \`.cto-root > section.cto-card\` among them) */
.kt-root .kt-kpi-tests.is-green, .kt-root .kt-wall.is-green, .kt-root .kt-sign.is-signed, .kt-root .cto-card.is-ok { border-color: var(--kit-ok); }
.kt-root .kt-sign:not(.is-signed), .kt-root .cto-card.is-wait { border-color: var(--kit-wait); }
.kt-root .cto-card.is-bad { border-color: var(--kit-bad); }
.kt-kpi-tests.is-green .kt-kpi-big, .kt-kpi-gates .kt-kpi-big, .cto-card.is-ok .cto-value { color: var(--kt-ok); }
.cto-card.is-bad .cto-value { color: var(--kt-bad); }
.cto-kcard { border-color: var(--border); box-shadow: none; }
.cto-kcard.is-live.is-wait { border-color: var(--kit-wait); }
.cto-kcard.is-live.is-agent { border-color: var(--kit-run); }
/* only a run in progress glows */
.kt-root.is-live .kt-kpi-tests.is-green, .kt-root.is-live .kt-wall.is-green { box-shadow: 0 0 34px -12px var(--kt-ok); }
.cto-kcard.is-live { box-shadow: 0 0 0 2px color-mix(in srgb, var(--kt-approve) 18%, transparent); }
.cto-kcard.is-live.is-agent { box-shadow: 0 0 0 2px color-mix(in srgb, var(--kt-run) 18%, transparent); }
`, fa = 5e3;
function pa(e, t, n) {
	if (typeof URL.createObjectURL != "function") return !1;
	let r = document.createElement("a");
	return r.href = URL.createObjectURL(new Blob([e], { type: n })), r.download = t, document.body.append(r), r.click(), setTimeout(() => {
		URL.revokeObjectURL(r.href), r.remove();
	}, 0), !0;
}
function ma({ onOpen: e, onItem: t = () => {}, onState: n, returning: s = !1, entry: l, pollMs: u = fa, projection: m = !1, onProjection: h }) {
	let g = c(), [_, y] = o(null), [b, x] = o(""), [S, C] = o(l?.line ?? -1), [w, T] = o(l?.type ?? "all"), [E, D] = o(!!l?.real), [O, k] = o(l?.size ?? null), [j, M] = o(l?.week ?? null), [N, P] = o(l?.defects ?? !1), [F, I] = o(null), [ee, L] = o(12), [R, z] = o(""), [B, te] = o(!1), [ne, re] = o(!1), [ie, ae] = o(!1), [oe, V] = o(""), [H, se] = o(/* @__PURE__ */ new Set()), ce = a(null), le = a(null), ue = a(null);
	r(() => {
		let e = !0, t, n = async () => {
			try {
				let t = await g.get(v.cto());
				if (!e) return;
				let n = new Set(t.items.flatMap((e) => e.real ? [e.real] : []));
				if (ce.current) {
					let e = [...n].filter((e) => !ce.current?.has(e));
					e.length && se((t) => /* @__PURE__ */ new Set([...t, ...e]));
				}
				ce.current = n, y(t), x("");
			} catch (t) {
				e && x(jt(t));
			}
			e && (t = setTimeout(() => void n(), u));
		};
		return n(), () => {
			e = !1, clearTimeout(t);
		};
	}, [g, u]), r(() => {
		if (!oe) return;
		let e = setTimeout(() => V(""), 3600);
		return () => clearTimeout(e);
	}, [oe]), r(() => {
		if (!m) return;
		let e = (e) => e.key === "Escape" && h?.(!1);
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [m, h]), r(() => {
		let e = () => ae(!0), t = () => ae(!1);
		return window.addEventListener("beforeprint", e), window.addEventListener("afterprint", t), () => {
			window.removeEventListener("beforeprint", e), window.removeEventListener("afterprint", t);
		};
	}, []);
	let de = i(() => _ ? Gr(_.items) : {
		S: 0,
		M: 0,
		L: 0
	}, [_]), U = i(() => _ ? qr(_, S, de) : null, [
		_,
		S,
		de
	]), fe = i(() => _ ? Xr(_.items, _.meta, S) : [], [_, S]), pe = i(() => _ ? Zr(_.items, S, w, E, H, {
		size: O,
		week: j,
		defects: N
	}) : [], [
		_,
		S,
		w,
		E,
		H,
		O,
		j,
		N
	]), me = () => ({
		...S >= 0 ? { line: S } : {},
		...w === "all" ? {} : { type: w },
		...O ? { size: O } : {},
		...j ? { week: j } : {},
		...E ? { real: !0 } : {},
		...N ? { defects: !0 } : {}
	}), he = a(me);
	he.current = me;
	let W = a(!0);
	r(() => {
		W.current ? W.current = !1 : n?.(me());
	}, [
		S,
		w,
		E,
		O,
		j,
		N
	]);
	let G = a(!1);
	if (r(() => {
		if (!_ || G.current || !l) return;
		G.current = !0;
		let e = (e, t = "start") => void (s || setTimeout(() => document.querySelector(e)?.scrollIntoView?.({
			behavior: "smooth",
			block: t
		}), 80));
		l.at && e(`[data-anchor="${l.at}"]`);
		let t = l.hl;
		if (!t) return;
		let r = (e) => e.real === t || e.issue === t;
		I(t), setTimeout(() => {
			I(null), n?.(he.current());
		}, 6e3);
		let i = Zr(_.items, S, w, E, H, {
			size: O,
			week: j,
			defects: N
		}).findIndex(r);
		if (i >= 0) {
			L((e) => Math.max(e, i + 1)), e(`[data-key="${t}"]`, "center");
			return;
		}
		let a = Zr(_.items, -1, "all", !1, H).findIndex(r), o = a < 0 ? _.items.find(r) : void 0;
		a >= 0 || o ? (Object.keys(me()).length && V("This item was not in the previous filter; now showing all business lines and types"), C(-1), T("all"), D(!1), k(null), P(!1), M(o ? _.meta.weeks.filter((e) => e <= o.ship).pop() ?? null : null), L(Math.max(12, o ? 30 : a + 1)), e(`[data-key="${t}"]`, "center")) : _.wip.some((e) => e.real === t || e.issue === t) && e(`[data-key="${t}"]`, "center");
	}, [_]), !_ || !U) return /* @__PURE__ */ p("div", {
		className: "kt-root cto-root",
		"data-testid": "cto-root",
		children: [
			/* @__PURE__ */ f("style", { children: Wn }),
			/* @__PURE__ */ f("style", { children: ca }),
			/* @__PURE__ */ f("style", { children: da }),
			/* @__PURE__ */ f("p", {
				className: "cto-dim",
				children: b ? `Could not get the CTO view data: ${b}` : "Reading delivery data…"
			})
		]
	});
	let K = _.meta, q = S < 0 ? "All business lines" : A(K.lines[S]), ge = S < 0 ? `R&D centre ${U.seats} people · ${K.lines.length} business lines` : `${A(K.lines[S])} · ${U.seats} people`, J = U.steady, _e = Number(R) > 0 ? `$${zr(U.built.length * U.adv * Number(R))}` : "—", ve = (e) => {
		T(e), L(12);
	}, Y = () => ue.current?.scrollIntoView?.({
		behavior: "smooth",
		block: "start"
	}), ye = _.items.filter((e) => e.real).sort((e, t) => e.ship < t.ship ? 1 : e.ship > t.ship ? -1 : 0), be = _.items.find((e) => e.real && (S < 0 || e.line === S)) ?? _.items.find((e) => e.real), xe = async (t) => {
		try {
			let n = (await g.get(v.ctoFlow(t))).segments.find((e) => e.who === "person" && e.gate !== "signoff");
			e({
				...n ? Ji(t, n) : { run: t },
				pick: "latest"
			});
		} catch {
			e({
				run: t,
				pick: "latest"
			});
		}
	}, Se = (e) => t(Di(e)), Ce = (e) => (t) => {
		t.stopPropagation(), e();
	}, we = async (e) => {
		if (le.current && (le.current.open = !1), e === "pdf") ae(!0), setTimeout(() => window.print(), 60);
		else if (e === "csv") {
			let e = Zr(_.items, S, w, E, H);
			pa(Qr(e, K, de), `CTO-view-delivery-list-${q}-${K.today}.csv`, "text/csv;charset=utf-8") && V(`Exported ${$(e.length)} row${e.length === 1 ? "" : "s"} (${q}${w === "all" ? "" : ` · ${Pr[w]}`}${E ? " · measured only" : ""})`);
		} else try {
			let e = await g.get(v.ctoOffline());
			pa(e.html, e.name, "text/html;charset=utf-8") && V("Offline version downloaded: the data is a snapshot of this moment and opens without Kiro Crew");
		} catch (e) {
			V(`Offline version was not downloaded: ${jt(e)}`);
		}
	};
	return /* @__PURE__ */ p("div", {
		className: `kt-root cto-root${m ? " is-projection" : ""}${ie ? " is-printing" : ""}`,
		"data-testid": "cto-root",
		children: [
			/* @__PURE__ */ f("style", { children: Wn }),
			/* @__PURE__ */ f("style", { children: ca }),
			/* @__PURE__ */ f("style", { children: da }),
			/* @__PURE__ */ p("header", {
				className: "cto-top",
				children: [
					/* @__PURE__ */ p("span", {
						className: "cto-tag",
						title: "Larkspur Outfitters is a fictitious company. Its past deliveries are generated from the assumptions listed under Assumptions, not measured. The deliveries marked Measured are real runs that were signed off (including runs imported from other computers)",
						children: [
							"Simulated company · ",
							U.real,
							" measured"
						]
					}),
					/* @__PURE__ */ p("span", {
						className: "cto-org",
						children: [
							K.company ?? "Larkspur Outfitters",
							" · ",
							ge,
							" · week 12 since AI-DLC was introduced"
						]
					}),
					/* @__PURE__ */ f("span", { className: "cto-grow" }),
					/* @__PURE__ */ p("details", {
						className: "cto-dl cto-noprint cto-noproj",
						ref: le,
						children: [/* @__PURE__ */ f("summary", {
							className: "kt-btn",
							children: "Download ▾"
						}), /* @__PURE__ */ p("div", {
							className: "cto-menu",
							children: [
								/* @__PURE__ */ f("button", {
									type: "button",
									onClick: () => void we("pdf"),
									children: "PDF (print version, A4 landscape)"
								}),
								/* @__PURE__ */ f("button", {
									type: "button",
									onClick: () => void we("csv"),
									children: "Delivery list (CSV, with the current filter)"
								}),
								/* @__PURE__ */ f("button", {
									type: "button",
									onClick: () => void we("html"),
									children: "Offline version (HTML, opens without Crew)"
								})
							]
						})]
					})
				]
			}),
			b && /* @__PURE__ */ p("div", {
				className: "kt-banner",
				role: "status",
				children: [
					"The CTO view failed to refresh: ",
					b,
					". Showing the last data received"
				]
			}),
			/* @__PURE__ */ p("section", {
				className: "cto-hero",
				children: [
					/* @__PURE__ */ p("h2", { children: [
						"Same ",
						U.seats,
						" people: the last 12 weeks against the 12 weeks before AI-DLC"
					] }),
					/* @__PURE__ */ p("p", { children: ["Simulated company: its history is generated from the assumptions below, not measured · only signed-off deliveries count", U.real ? /* @__PURE__ */ p(d, { children: [" · ", /* @__PURE__ */ p("button", {
						type: "button",
						className: "cto-link",
						onClick: () => {
							D(!0), L(12), Y();
						},
						title: "Show only measured deliveries in the delivery list",
						children: [
							U.real,
							" of them ",
							U.real === 1 ? "is a real run" : "are real runs",
							" (measured)"
						]
					})] }) : " · no measured run yet"] }),
					/* @__PURE__ */ p("p", {
						className: "cto-honest",
						children: ["Only what is marked Measured comes from a real run. ", /* @__PURE__ */ f("button", {
							type: "button",
							className: "cto-link",
							onClick: () => {
								re(!0), setTimeout(() => document.querySelector("[data-anchor=\"assumptions\"]")?.scrollIntoView?.({
									behavior: "smooth",
									block: "start"
								}), 60);
							},
							children: "See the assumptions ▾"
						})]
					}),
					/* @__PURE__ */ p("div", {
						className: "cto-print-only",
						children: [
							"Larkspur Outfitters · ",
							q,
							" · exported ",
							(/* @__PURE__ */ new Date()).toLocaleString("en-US", { hour12: !1 }),
							" · see Method at the end"
						]
					})
				]
			}),
			/* @__PURE__ */ f("nav", {
				className: "cto-lines",
				"aria-label": "Business lines",
				children: [-1, ...K.lines.map((e, t) => t)].map((e) => /* @__PURE__ */ p("button", {
					type: "button",
					"aria-pressed": S === e,
					onClick: () => {
						C(e), L(12);
					},
					children: [/* @__PURE__ */ f("b", { children: e < 0 ? "All" : A(K.lines[e]) }), /* @__PURE__ */ p("span", { children: [
						"Delivery volume ",
						Yr(_.items, e).toFixed(1),
						"×"
					] })]
				}, e))
			}),
			/* @__PURE__ */ p("section", {
				className: "cto-cards",
				children: [
					/* @__PURE__ */ p("article", {
						className: `cto-card${H.size ? " cto-flash" : ""}`,
						"aria-label": "More",
						"data-anchor": "more",
						children: [
							/* @__PURE__ */ f("div", {
								className: "cto-eyebrow",
								children: "More"
							}),
							/* @__PURE__ */ p("button", {
								type: "button",
								className: "cto-value cto-link-value",
								"data-testid": "cto-more",
								onClick: Y,
								title: "See the delivery list",
								children: [U.ratio.toFixed(1), "×"]
							}),
							/* @__PURE__ */ p("div", {
								className: "cto-desc",
								children: [
									"Delivery volume · same ",
									U.seats,
									" people"
								]
							}),
							/* @__PURE__ */ f(Ni, { m: U }),
							/* @__PURE__ */ f("div", {
								className: "cto-legend",
								children: Fr.map((e) => /* @__PURE__ */ p("button", {
									type: "button",
									"aria-pressed": w === e,
									title: `${U.count(U.before, e)} in the first 12 weeks; click to filter the delivery list below`,
									onClick: () => {
										ve(w === e ? "all" : e), ue.current?.scrollIntoView({ behavior: "smooth" });
									},
									children: [
										/* @__PURE__ */ f("i", {
											className: "cto-sw",
											style: { background: Lr[e] }
										}),
										Pr[e],
										/* @__PURE__ */ f("b", { children: $(U.count(U.agent, e)) })
									]
								}, e))
							})
						]
					}, `more-${H.size}`),
					/* @__PURE__ */ p("article", {
						className: "cto-card",
						"aria-label": "Faster",
						"data-anchor": "fast",
						children: [
							/* @__PURE__ */ f("div", {
								className: "cto-eyebrow",
								children: "Faster"
							}),
							/* @__PURE__ */ p("button", {
								type: "button",
								className: "cto-value cto-link-value",
								"data-testid": "cto-fast",
								onClick: () => {
									k("L"), L(12), Y();
								},
								title: "See the deliveries of large requirements",
								children: [
									Br(de.L),
									" days → ",
									U.cycle("L") ? `${Br(U.cycle("L"))} days` : "—"
								]
							}),
							/* @__PURE__ */ f("div", {
								className: "cto-desc",
								children: "Delivery cycle of large requirements · click a row to see deliveries of that size"
							}),
							/* @__PURE__ */ f(Pi, {
								m: U,
								base: de,
								onPick: (e) => {
									k(e), L(12), Y();
								}
							}),
							/* @__PURE__ */ p("div", {
								className: "cto-legend",
								children: [/* @__PURE__ */ p("span", { children: [/* @__PURE__ */ f("i", {
									className: "cto-dot",
									style: { background: "var(--deemph)" }
								}), "Before"] }), /* @__PURE__ */ p("span", { children: [/* @__PURE__ */ f("i", {
									className: "cto-dot",
									style: { background: "var(--s4)" }
								}), "Now"] })]
							}),
							/* @__PURE__ */ p("div", {
								className: "cto-foot",
								children: [/* @__PURE__ */ p("span", { children: [
									"New apps and new features ship ",
									Br(U.adv),
									" days earlier on average"
								] }), /* @__PURE__ */ f("button", {
									type: "button",
									className: "cto-link",
									onClick: () => te((e) => !e),
									children: B ? "Collapse ▾" : "Estimate value ▸"
								})]
							}),
							B && /* @__PURE__ */ p("label", {
								className: "cto-calc",
								children: [
									"Gross margin per item per day $",
									/* @__PURE__ */ f("input", {
										type: "number",
										min: 0,
										step: 100,
										value: R,
										onChange: (e) => z(e.target.value),
										placeholder: "Enter an amount",
										autoFocus: !0
									}),
									", which brings in about ",
									/* @__PURE__ */ f("b", {
										"data-testid": "cto-value",
										children: _e
									})
								]
							})
						]
					}),
					/* @__PURE__ */ p("article", {
						className: "cto-card",
						"aria-label": "Cheaper",
						"data-anchor": "cheap",
						children: [
							/* @__PURE__ */ f("div", {
								className: "cto-eyebrow",
								children: "Cheaper"
							}),
							/* @__PURE__ */ p("div", {
								className: "cto-value",
								"data-testid": "cto-cheap",
								children: [
									"−",
									Math.round((1 - U.unit / K.dayRate) * 100),
									"%"
								]
							}),
							/* @__PURE__ */ f("div", {
								className: "cto-desc",
								children: "Cost per person-day of work (modelled: see Assumptions)"
							}),
							/* @__PURE__ */ f(zi, {
								m: U,
								meta: K
							}),
							/* @__PURE__ */ p("div", {
								className: "cto-foot",
								children: [/* @__PURE__ */ p("span", { children: [
									"The last 12 weeks are equivalent to saving $",
									zr(U.save),
									" of R&D spend"
								] }), be?.real && /* @__PURE__ */ f("button", {
									type: "button",
									className: "cto-link",
									onClick: () => Se(be),
									title: `${be.t}: agent usage, people's time and decisions`,
									children: "See the consumption of one measured delivery ↗"
								})]
							})
						]
					}),
					/* @__PURE__ */ p("article", {
						className: "cto-card",
						"aria-label": "More stable",
						"data-anchor": "steady",
						children: [
							/* @__PURE__ */ f("div", {
								className: "cto-eyebrow",
								children: "More stable"
							}),
							/* @__PURE__ */ p("button", {
								type: "button",
								className: "cto-value cto-link-value",
								"data-testid": "cto-steady",
								onClick: () => {
									P(!0), L(12), Y();
								},
								title: "See deliveries with defects reported after release",
								children: [
									J.before.toFixed(1),
									" → ",
									J.now.toFixed(1)
								]
							}),
							/* @__PURE__ */ f("div", {
								className: "cto-desc",
								children: "Post-release defects per 100 new apps and new features"
							}),
							/* @__PURE__ */ f(Ri, { m: U }),
							/* @__PURE__ */ p("div", {
								className: "cto-foot cto-foot-steady",
								children: [/* @__PURE__ */ f("span", {
									"data-testid": "cto-caught",
									children: J.reals ? `${J.reals} measured deliver${J.reals === 1 ? "y" : "ies"} caught ${$(J.caughtAll)} problem${J.caughtAll === 1 ? "" : "s"} before release: checks ${J.caught.checks} · review ${J.caught.review} · people ${J.caught.person}` : "Problems caught before release: measured deliveries only"
								}), J.risks[0] && /* @__PURE__ */ p("button", {
									type: "button",
									className: "cto-link",
									"data-testid": "cto-risk",
									onClick: () => t({
										...Di(J.risks[0].item),
										at: Math.round(J.risks[0].at)
									}),
									title: `${J.risks[0].item.t}: noted by the owner when sending back at the ${$r(J.risks[0].gate)} gate`,
									children: [
										"Risk stopped: ",
										J.risks[0].what,
										J.risks[0].amount == null ? "" : ` ${Rr(J.risks[0].amount)}`,
										" ↗"
									]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ p("details", {
				className: "cto-notes cto-assume",
				"data-anchor": "assumptions",
				"data-testid": "cto-assumptions",
				open: ne || ie || void 0,
				onToggle: (e) => re(e.currentTarget.open),
				children: [/* @__PURE__ */ f("summary", { children: "Assumptions behind these numbers (simulated company)" }), /* @__PURE__ */ p("table", { children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ p("tr", { children: [
					/* @__PURE__ */ f("th", { children: "Assumption" }),
					/* @__PURE__ */ f("th", { children: "Value" }),
					/* @__PURE__ */ f("th", { children: "Used for" })
				] }) }), /* @__PURE__ */ p("tbody", { children: [
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "The company" }),
						/* @__PURE__ */ p("td", { children: [
							K.company ?? "Larkspur Outfitters",
							" (fictitious) · ",
							K.lines.length,
							" business lines × ",
							K.peoplePerLine,
							" people = ",
							K.lines.length * K.peoplePerLine
						] }),
						/* @__PURE__ */ f("td", { children: "Headcount in More and Cheaper" })
					] }),
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "Work, people alone" }),
						/* @__PURE__ */ p("td", { children: [
							"Small ",
							K.eq.S,
							" · Medium ",
							K.eq.M,
							" · Large ",
							K.eq.L,
							" person-days per delivery"
						] }),
						/* @__PURE__ */ f("td", { children: "The equivalent work behind Cheaper, and the estimate for a measured run" })
					] }),
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "Work, with the agent team" }),
						/* @__PURE__ */ p("td", { children: [
							"Small ",
							K.human.S,
							" · Medium ",
							K.human.M,
							" · Large ",
							K.human.L,
							" person-days of people's time per delivery"
						] }),
						/* @__PURE__ */ f("td", { children: "The people's cost behind Cheaper, and the estimate for a measured run" })
					] }),
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "One person-day costs" }),
						/* @__PURE__ */ p("td", { children: [
							"$",
							$(K.dayRate),
							" (",
							K.currency ?? "USD",
							", fully loaded)"
						] }),
						/* @__PURE__ */ f("td", { children: "Cheaper: before, and people's share now" })
					] }),
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "Agent seat" }),
						/* @__PURE__ */ p("td", { children: [
							"$",
							K.seatUsdMonth,
							" per person per month × ",
							K.months,
							" months (rate ",
							K.fx,
							")"
						] }),
						/* @__PURE__ */ f("td", { children: "Cheaper: the agent subscription" })
					] }),
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "Volume, cycle times, defects" }),
						/* @__PURE__ */ f("td", { children: "Generated with a fixed random seed (scripts/cto_history.py)" }),
						/* @__PURE__ */ f("td", { children: "More, Faster, More stable, the weekly chart and the Simulated rows: they show how the page reads, they do not measure a gain" })
					] }),
					/* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", { children: "Measured runs" }),
						/* @__PURE__ */ p("td", { children: [U.real, " so far"] }),
						/* @__PURE__ */ f("td", { children: "Their time, credits, checks and decisions are real; the work estimate beside them is the assumption above" })
					] })
				] })] })]
			}),
			/* @__PURE__ */ p("section", {
				className: "cto-card cto-measured",
				"aria-label": "Measured runs against the estimate",
				"data-anchor": "measured",
				"data-testid": "cto-measured",
				children: [/* @__PURE__ */ f("h3", { children: "Measured runs against the estimate" }), ye.length === 0 ? /* @__PURE__ */ p("p", {
					className: "cto-dim",
					children: [
						"No measured run yet. Raise a requirement on the team board and sign the delivery off: its real time, credits and checks appear here, next to what the same work would take people alone (an assumption).",
						" ",
						/* @__PURE__ */ f("button", {
							type: "button",
							className: "cto-link cto-noprint",
							onClick: () => e({ new: "promo" }),
							children: "New requirement ↗"
						})
					]
				}) : /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ p("table", { children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ p("tr", { children: [
					/* @__PURE__ */ f("th", { children: "Delivery" }),
					/* @__PURE__ */ f("th", { children: "Measured: this run" }),
					/* @__PURE__ */ f("th", { children: "Estimate: people alone" }),
					/* @__PURE__ */ f("th", { children: "Estimate: with the agent team" })
				] }) }), /* @__PURE__ */ f("tbody", { children: ye.map((e) => /* @__PURE__ */ p("tr", { children: [
					/* @__PURE__ */ p("td", { children: [/* @__PURE__ */ f("button", {
						type: "button",
						className: "cto-link",
						onClick: () => Se(e),
						children: e.t
					}), /* @__PURE__ */ p("div", {
						className: "cto-was",
						children: [
							Ir[e.size],
							" · ",
							Pr[e.kind]
						]
					})] }),
					/* @__PURE__ */ p("td", { children: [
						e.mins == null ? "—" : `${e.mins} min`,
						" run time · ",
						e.credits == null ? "credits not recorded" : `${$(e.credits)} credits`,
						e.tests ? ` · checks ${e.tests}` : "",
						e.members ? ` · ${e.members} members` : ""
					] }),
					/* @__PURE__ */ p("td", {
						className: "cto-est",
						children: [
							K.eq[e.size],
							" person-day",
							K.eq[e.size] === 1 ? "" : "s",
							" ≈ $",
							$(K.eq[e.size] * K.dayRate)
						]
					}),
					/* @__PURE__ */ p("td", {
						className: "cto-est",
						children: [
							K.human[e.size],
							" person-day",
							K.human[e.size] === 1 ? "" : "s",
							" of people's time ≈ $",
							$(K.human[e.size] * K.dayRate),
							", plus the run"
						]
					})
				] }, e.real)) })] }), /* @__PURE__ */ f("p", {
					className: "cto-dim",
					children: "The left column is measured from the run. The two estimates use the size you confirmed at the gate and the assumptions above; they are not measured."
				})] })]
			}),
			/* @__PURE__ */ f(Hi, {
				weeks: fe,
				today: K.today,
				onWeek: (e) => {
					M(e), L(12), Y();
				}
			}),
			/* @__PURE__ */ f(aa, {
				data: _,
				line: S,
				fresh: H,
				hl: F,
				onOpen: e,
				onItem: t,
				onGateOf: (e) => void xe(e),
				onLedger: Y
			}),
			/* @__PURE__ */ p("section", {
				className: "cto-card",
				ref: ue,
				"aria-label": "Delivery list",
				"data-anchor": "ledger",
				children: [
					/* @__PURE__ */ p("div", {
						className: "cto-ledger-head",
						children: [
							/* @__PURE__ */ f("h3", { children: "Delivery list" }),
							/* @__PURE__ */ f("div", {
								className: "cto-seg cto-noprint",
								role: "group",
								"aria-label": "Type",
								children: ["all", ...Fr].map((e) => /* @__PURE__ */ f("button", {
									type: "button",
									"aria-pressed": w === e,
									onClick: () => ve(e),
									children: e === "all" ? "All" : Pr[e]
								}, e))
							}),
							/* @__PURE__ */ f("button", {
								type: "button",
								className: `kt-btn is-small cto-noprint${E ? " is-on" : ""}`,
								"aria-pressed": E,
								onClick: () => {
									D((e) => !e), L(12);
								},
								children: "Measured only"
							}),
							O && /* @__PURE__ */ p("span", {
								className: "cto-filter",
								children: [Ir[O], /* @__PURE__ */ f("button", {
									type: "button",
									"aria-label": "Stop filtering by size",
									onClick: () => k(null),
									children: "✕"
								})]
							}),
							j && /* @__PURE__ */ p("span", {
								className: "cto-filter",
								children: [
									"Week from ",
									Hr(j),
									/* @__PURE__ */ f("button", {
										type: "button",
										"aria-label": "Stop filtering by week",
										onClick: () => M(null),
										children: "✕"
									})
								]
							}),
							N && /* @__PURE__ */ p("span", {
								className: "cto-filter",
								children: ["Has post-release defects", /* @__PURE__ */ f("button", {
									type: "button",
									"aria-label": "Stop filtering by post-release defects",
									onClick: () => P(!1),
									children: "✕"
								})]
							}),
							/* @__PURE__ */ p("span", {
								className: "cto-dim",
								"data-testid": "cto-ledger-count",
								children: [
									$(pe.length),
									" item",
									pe.length === 1 ? "" : "s",
									E ? "" : ", measured first",
									" · click a row for the delivery detail"
								]
							})
						]
					}),
					/* @__PURE__ */ p("table", {
						className: "cto-table",
						children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ p("tr", { children: [
							/* @__PURE__ */ f("th", { children: "Delivery" }),
							/* @__PURE__ */ f("th", { children: "Business line" }),
							/* @__PURE__ */ f("th", { children: "Type" }),
							/* @__PURE__ */ f("th", { children: "Size" }),
							/* @__PURE__ */ f("th", { children: "Released" }),
							/* @__PURE__ */ f("th", { children: "Cycle" }),
							/* @__PURE__ */ f("th", { children: "Signed by" }),
							/* @__PURE__ */ f("th", { children: "Issue · PR" }),
							/* @__PURE__ */ f("th", { children: "Source" })
						] }) }), /* @__PURE__ */ f("tbody", { children: pe.slice(0, ee).map((n) => {
							let r = !!n.real && H.has(n.real);
							return /* @__PURE__ */ p("tr", {
								"data-key": n.real ?? n.issue,
								className: `cto-row-pick${n.real ? " is-real" : ""}${r ? " is-new" : ""}${F && F === (n.real ?? n.issue) ? " is-hl" : ""}`,
								onClick: () => Se(n),
								title: "Delivery detail",
								tabIndex: 0,
								onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && e.target === e.currentTarget && (e.preventDefault(), Se(n)),
								children: [
									/* @__PURE__ */ p("td", { children: [
										/* @__PURE__ */ f("div", { children: n.t }),
										n.tests && (n.real ? /* @__PURE__ */ p("button", {
											type: "button",
											className: "cto-was cto-link",
											onClick: Ce(() => e({
												run: n.real,
												focus: "tests"
											})),
											title: "The test wall on the team board",
											children: [
												"Checks ",
												n.tests,
												" passed ↗"
											]
										}) : /* @__PURE__ */ p("div", {
											className: "cto-was",
											children: [
												"Checks ",
												n.tests,
												" passed"
											]
										})),
										n.defects?.length ? /* @__PURE__ */ p("div", {
											className: "cto-defect",
											title: `Defects reported after release: ${n.defects.join(", ")}`,
											children: [
												"Post-release defects ",
												n.defects.length,
												" · fixes in",
												" ",
												n.defects.map((e) => /* @__PURE__ */ f("button", {
													type: "button",
													className: "cto-link",
													onClick: Ce(() => t({ issue: e })),
													children: e
												}, e))
											]
										}) : null,
										n.origin && /* @__PURE__ */ p("button", {
											type: "button",
											className: "cto-was cto-link",
											onClick: Ce(() => t({ issue: n.origin })),
											children: ["Fix of the post-release defect of ", n.origin]
										})
									] }),
									/* @__PURE__ */ f("td", { children: K.lines[n.line] }),
									/* @__PURE__ */ f("td", { children: /* @__PURE__ */ p("span", {
										className: "cto-kind",
										children: [/* @__PURE__ */ f("i", {
											className: "cto-sw",
											style: { background: Lr[n.kind] }
										}), Pr[n.kind]]
									}) }),
									/* @__PURE__ */ f("td", { children: Ir[n.size] }),
									/* @__PURE__ */ f("td", {
										className: "is-num",
										children: r ? "just now" : Hr(n.ship)
									}),
									/* @__PURE__ */ p("td", { children: [/* @__PURE__ */ f("div", { children: n.mins == null ? `${Br(n.cyc)} days` : `${n.mins} min` }), /* @__PURE__ */ p("div", {
										className: "cto-was",
										children: [
											"Before: about ",
											Br(de[n.size]),
											" days"
										]
									})] }),
									/* @__PURE__ */ f("td", { children: n.real ? /* @__PURE__ */ p("button", {
										type: "button",
										className: "cto-link",
										onClick: Ce(() => e({
											run: n.real,
											focus: "signoff"
										})),
										title: "The sign-off sheet on the team board",
										children: [n.signer, " ↗"]
									}) : n.signer }),
									/* @__PURE__ */ f("td", {
										className: "cto-ids",
										children: n.issue ? /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ p("div", {
											title: n.reporter ? `Raised by ${A(n.reporter)}${n.created ? `, created ${Hr(n.created)}` : ""}` : void 0,
											children: [/* @__PURE__ */ f("span", {
												className: "kt-mono",
												children: n.issue
											}), n.reporter && /* @__PURE__ */ p("span", {
												className: "cto-was",
												children: [" ", A(n.reporter)]
											})]
										}), n.pr ? /* @__PURE__ */ p("div", {
											className: "cto-was kt-mono",
											children: ["PR #", n.pr]
										}) : null] }) : "—"
									}),
									/* @__PURE__ */ f("td", { children: /* @__PURE__ */ f("div", {
										className: "cto-src",
										children: n.real ? /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f("span", {
											className: "cto-tag is-real",
											children: "Measured"
										}), /* @__PURE__ */ f("button", {
											type: "button",
											className: "kt-btn is-small cto-noprint",
											onClick: Ce(() => e({
												run: n.real,
												replay: 30
											})),
											children: "▶ Replay ↗"
										})] }) : /* @__PURE__ */ f("span", {
											className: "cto-tag",
											children: "Simulated"
										})
									}) })
								]
							}, `${n.real ?? n.t}-${n.ship}`);
						}) })]
					}),
					pe.length > ee && /* @__PURE__ */ p("button", {
						type: "button",
						className: "kt-btn is-small cto-noprint",
						style: { marginTop: 10 },
						onClick: () => L((e) => e + 30),
						children: [
							"Show more (",
							$(pe.length - ee),
							" more)"
						]
					})
				]
			}),
			/* @__PURE__ */ p("details", {
				className: "cto-notes",
				open: ie || void 0,
				children: [/* @__PURE__ */ f("summary", { children: "Method" }), /* @__PURE__ */ p("ul", { children: [
					/* @__PURE__ */ f("li", { children: "Simulated, not measured: the deliveries before AI-DLC and the simulated ones after it are generated from the assumptions at the top of the page (fixed random seed). They show how the page reads and prove nothing about a team's efficiency. A delivery is measured only when it is marked Measured: a real run that a person signed off. The estimate beside a measured run uses the assumptions too." }),
					/* @__PURE__ */ p("li", { children: [
						"Data: delivery records of the last 12 weeks and the 12 weeks before AI-DLC for the simulated Larkspur Outfitters R&D centre (",
						K.lines.length,
						" business lines, ",
						K.peoplePerLine,
						" people each)",
						U.real ? `; plus ${U.real} deliver${U.real === 1 ? "y" : "ies"} from real runs that were signed off (including runs imported from other computers), marked Measured` : "",
						". Only signed-off deliveries count."
					] }),
					/* @__PURE__ */ f("li", { children: "More: items released in the last 12 weeks ÷ items released in the first 12 weeks, same organisation and headcount." }),
					/* @__PURE__ */ f("li", { children: "Faster: delivery cycle = release date − Issue creation date; \"Before\" is the average cycle of deliveries of the same size in the 12 weeks before AI-DLC. Cycles in the simulated history are sample values and do not stand for measured efficiency gains." }),
					/* @__PURE__ */ p("li", { children: [
						"Cheaper: cost per person-day of work = (actual person-days × $",
						$(K.dayRate),
						" + agent subscription) ÷ equivalent work completed. Equivalent work by size: small ",
						K.eq.S,
						", medium ",
						K.eq.M,
						", large ",
						K.eq.L,
						" person-days; human effort with agent collaboration: small ",
						K.human.S,
						", medium ",
						K.human.M,
						", large ",
						K.human.L,
						" person-days; the subscription is the agent seat at USD ",
						K.seatUsdMonth,
						" per person per month, converted at ",
						K.fx,
						". All of these are assumptions, listed under Assumptions at the top and in docs/cto-view-data.md."
					] }),
					/* @__PURE__ */ f("li", { children: "More stable: defects reported after release per 100 new apps and new features (a defect reported after release is recorded as a fix delivery and linked back to the original delivery); measured deliveries have no post-release observation period yet and are not counted in this ratio. Problems caught before release = send-backs by checks, independent review and people at the gates in measured deliveries; for a risk stopped, the owner fills in the content and the amount when sending back at a gate." }),
					/* @__PURE__ */ f("li", { children: "Value: this page does not estimate revenue. After you enter the gross margin per item per day, it is estimated as \"number of new apps and new features × average days earlier × daily gross margin\"." }),
					/* @__PURE__ */ f("li", { children: "Delivery tags (type, size, business line) are proposed by the role at the first gate and confirmed by the owner at the gate." }),
					/* @__PURE__ */ f("li", { children: "Issue and PR: each delivery has one Issue (raised by, creation date) and one PR merged into main; the PR of a measured run is its run branch, merged when the owner signs off. A defect reported after release is recorded as a fix delivery and linked both ways with the original delivery." })
				] })]
			}),
			oe && /* @__PURE__ */ f("div", {
				className: "cto-toast",
				role: "status",
				children: oe
			})
		]
	});
}
//#endregion
//#region src/cto/ItemView.tsx
var ha = 5e3;
function ga(e, t) {
	return t.run ? {
		item: e.items.find((e) => e.real === t.run),
		wip: e.wip.find((e) => e.real === t.run)
	} : {
		item: e.items.find((e) => e.issue === t.issue),
		wip: e.wip.find((e) => e.issue === t.issue)
	};
}
function _a(e, t) {
	let n = e.filter((e) => e.real);
	return n.find((e) => e.line === t.line && e.kind === t.kind) ?? n.find((e) => e.kind === t.kind) ?? n.find((e) => e.line === t.line) ?? n[0];
}
var va = /* @__PURE__ */ new Set([
	"bounce",
	"check",
	"review"
]), ya = {
	open: "Waiting to merge",
	merged: "Merged into main",
	signed: "Signed off"
}, ba = (e) => {
	let t = /* @__PURE__ */ new Date(e * 1e3);
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
};
function xa({ entry: e, onCto: t, onItem: n, onBoard: s, onBack: l, returning: u = !1, projection: m = !1, pollMs: h = ha }) {
	let g = c(), [_, y] = o(null), [b, x] = o(null), [S, C] = o(""), [w, T] = o(!1);
	r(() => {
		let t = !0, n, r = async () => {
			try {
				let [n, r] = await Promise.all([g.get(v.cto()), e.run ? g.get(v.ctoFlow(e.run)) : Promise.resolve(null)]);
				if (!t) return;
				y(n), x(r), C("");
			} catch (e) {
				t && C(jt(e));
			}
			t && (n = setTimeout(() => void r(), h));
		};
		return r(), () => {
			t = !1, clearTimeout(n);
		};
	}, [
		g,
		e.run,
		e.issue,
		h
	]);
	let E = i(() => _ ? Gr(_.items) : null, [_]), D = a(!1);
	r(() => {
		!b || D.current || e.at === void 0 || u || (D.current = !0, setTimeout(() => document.querySelector("[data-testid=\"item-root\"] section[aria-label=\"Value stream\"]")?.scrollIntoView?.({
			behavior: "smooth",
			block: "start"
		}), 80));
	}, [b]), r(() => {
		let t = !e.run && !e.issue ? _?.items.find((e) => e.real) : void 0;
		t?.real && n({ run: t.real });
	}, [_]);
	let O = l && /* @__PURE__ */ p("button", {
		type: "button",
		className: "kt-btn",
		onClick: l,
		children: ["← Back to ", e.from === "board" ? "the team board" : "the CTO view"]
	}), j = (e) => /* @__PURE__ */ p("div", {
		className: `kt-root cto-root cto-item${m ? " is-projection" : ""}`,
		"data-testid": "item-root",
		children: [
			/* @__PURE__ */ f("style", { children: Wn }),
			/* @__PURE__ */ f("style", { children: ca }),
			/* @__PURE__ */ f("style", { children: da }),
			e
		]
	});
	if (!_ || !E) return j(/* @__PURE__ */ f("p", {
		className: "cto-dim",
		children: S ? `Could not get the delivery detail data: ${S}` : "Reading delivery…"
	}));
	let { item: M, wip: N } = ga(_, e), P = M ?? N;
	if (!P) return j(/* @__PURE__ */ p(d, { children: [/* @__PURE__ */ p("div", {
		className: "cto-top",
		children: [
			/* @__PURE__ */ f(Sa, {
				name: "Delivery not found",
				onCto: () => t({})
			}),
			/* @__PURE__ */ f("span", { className: "cto-grow" }),
			O
		]
	}), /* @__PURE__ */ p("p", {
		className: "cto-dim",
		children: [
			"This delivery (",
			e.run ?? e.issue,
			") is not in the CTO view: it may have been removed from the list."
		]
	})] }));
	let F = _.meta, ee = e.run ?? e.issue ?? "", L = e.run, R = !!M?.real, z = !M && !!N?.live, B = L ? void 0 : _a(_.items, P), te = M ? M.mins == null ? `${Br(M.cyc)} days` : `${M.mins} min` : b ? Li(b.end) : "—", ne = M ? M.mins == null ? M.cyc : M.mins / 1440 : b ? b.end / 86400 : 0, re = M?.created ?? (b ? ba(b.issue.created_at) : void 0), ie = (e) => _.items.find((t) => t.issue === e), ae = `${Ir[P.size]}`, oe = b ? [
		"agent",
		"rework",
		"person"
	].map((e) => ({
		k: e,
		s: b.segments.filter((t) => Gi(t) === e).reduce((e, t) => e + t.to - t.from, 0)
	})) : [], V = b?.segments.find((e) => e.who === "person" && e.gate !== "signoff"), H = b?.marks.find((e) => va.has(e.kind)), se = b ? b.sent_back.person + b.sent_back.review + b.sent_back.checks : 0, ce = b?.team.filter((e) => !e.skipped) ?? [], le = b?.segments[Xi(b.segments, e.at)], ue = (e) => s(e === "person" && V ? Ji(L, V) : {
		run: L,
		replay: 30
	});
	return j(/* @__PURE__ */ p(d, { children: [
		/* @__PURE__ */ p("div", {
			className: "cto-top",
			children: [
				/* @__PURE__ */ f(Sa, {
					name: P.t,
					onCto: () => t({ hl: ee })
				}),
				/* @__PURE__ */ f("span", { className: "cto-grow" }),
				/* @__PURE__ */ p("div", {
					className: "cto-item-act cto-noprint",
					children: [
						z && N?.state === "wait" && N.role && /* @__PURE__ */ f("button", {
							type: "button",
							className: "kt-btn is-primary",
							onClick: () => s({
								run: L,
								gate: N.role
							}),
							children: "Go to approve ↗"
						}),
						L && /* @__PURE__ */ f("button", {
							type: "button",
							className: "kt-btn",
							onClick: () => s({ run: L }),
							children: "View on the team board ↗"
						}),
						R && /* @__PURE__ */ f("button", {
							type: "button",
							className: "kt-btn",
							onClick: () => s({
								run: L,
								replay: 30
							}),
							children: "▶ Replay ↗"
						}),
						O
					]
				})
			]
		}),
		/* @__PURE__ */ p("header", {
			className: "cto-item-head",
			children: [
				/* @__PURE__ */ f("h2", {
					className: "kt-run-title",
					children: P.t
				}),
				P.issue && /* @__PURE__ */ f("button", {
					type: "button",
					className: "kt-pill tone-info kt-mono kt-pill-btn",
					onClick: () => t({ hl: ee }),
					title: "Find this item in the delivery list of the CTO view",
					children: P.issue
				}),
				/* @__PURE__ */ p("span", {
					className: `kt-pill ${R ? "tone-ok" : z ? "tone-run is-live" : "tone-idle"}`,
					children: [/* @__PURE__ */ f("i", {
						"aria-hidden": "true",
						children: R ? "✔" : z ? "●" : "○"
					}), R ? "Measured" : z ? "In progress" : M ? "Simulated" : "Simulated · in progress"]
				}),
				/* @__PURE__ */ p("span", {
					className: "cto-org",
					children: [
						P.reporter ? `Raised by ${A(P.reporter)} · ` : "",
						A(F.lines[P.line]),
						" · ",
						Pr[P.kind],
						" · ",
						ae
					]
				})
			]
		}),
		N && /* @__PURE__ */ f("p", {
			className: "cto-item-now",
			"data-testid": "item-now",
			children: N.state === "wait" ? `Now: ${$r(N.gate)}, waited ${Ur(N.hours ?? 0)}, ${N.focus ?? ""}` : N.state === "agent" ? `Now: agent working · ${$r(N.col)} · ${N.members} member${N.members === 1 ? "" : "s"}` : `Now: in the backlog, submitted ${N.mins} min ago, waiting for a team`
		}),
		/* @__PURE__ */ p("section", {
			className: "cto-cards cto-item-cards",
			"aria-label": "The four numbers of this delivery",
			children: [
				/* @__PURE__ */ p("article", {
					className: "cto-card",
					"aria-label": "Cycle",
					children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "Cycle"
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-value",
							"data-testid": "item-cycle",
							children: te
						}),
						/* @__PURE__ */ p("div", {
							className: "cto-desc",
							children: [re ? `Issue created ${Hr(re)}` : "Issue created", M ? ` → signed off ${Hr(M.ship)}` : " → in progress"]
						}),
						/* @__PURE__ */ f(Fi, {
							size: ae,
							before: E[P.size],
							days: ne,
							now: te
						}),
						/* @__PURE__ */ p("div", {
							className: "cto-legend",
							children: [/* @__PURE__ */ p("span", { children: [/* @__PURE__ */ f("i", {
								className: "cto-dot",
								style: { background: "var(--deemph)" }
							}), "Before, same size"] }), /* @__PURE__ */ p("span", { children: [/* @__PURE__ */ f("i", {
								className: "cto-dot",
								style: { background: "var(--s4)" }
							}), "This one"] })]
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-foot",
							children: /* @__PURE__ */ f("button", {
								type: "button",
								className: "cto-link",
								onClick: () => t({ at: "fast" }),
								children: "CTO view \"Faster\" ↗"
							})
						})
					]
				}),
				b ? /* @__PURE__ */ p("article", {
					className: "cto-card",
					"aria-label": "Where the time went",
					children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "Where the time went"
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-value",
							children: Li(b.agent_s)
						}),
						/* @__PURE__ */ p("div", {
							className: "cto-desc",
							children: [
								"Agent working · awaiting approval ",
								Li(b.person_s),
								" (",
								b.gates,
								" gate",
								b.gates === 1 ? "" : "s",
								")"
							]
						}),
						/* @__PURE__ */ f(Ii, {
							total: Li(b.end),
							parts: oe.map(({ k: e, s: t }) => ({
								label: Wi[e],
								s: t,
								color: Ui[e],
								onPick: () => ue(e)
							}))
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-legend",
							children: oe.filter((e) => e.s > 0).map(({ k: e, s: t }) => /* @__PURE__ */ p("button", {
								type: "button",
								onClick: () => ue(e),
								title: e === "person" ? "Go to the first gate on the board" : "Replay on the board",
								children: [
									/* @__PURE__ */ f("i", {
										className: "cto-sw",
										style: { background: Ui[e] }
									}),
									Wi[e],
									/* @__PURE__ */ f("b", { children: Li(t) })
								]
							}, e))
						})
					]
				}) : /* @__PURE__ */ p("article", {
					className: "cto-card",
					"aria-label": "Sign-off",
					children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "Sign-off"
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-value",
							children: M ? Hr(M.ship) : "—"
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-desc",
							children: M?.signer ? `Signed by ${M.signer}` : "Not delivered yet"
						})
					]
				}),
				b ? /* @__PURE__ */ p("article", {
					className: "cto-card",
					"aria-label": "Cost",
					children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "Cost"
						}),
						/* @__PURE__ */ p("div", {
							className: "cto-value",
							children: [b.credits ?? "—", /* @__PURE__ */ f("span", {
								className: "cto-of",
								children: "credits"
							})]
						}),
						/* @__PURE__ */ p("div", {
							className: "cto-desc",
							children: [
								ce.length,
								" agent member",
								ce.length === 1 ? "" : "s",
								" · people made ",
								b.decisions.length,
								" decision",
								b.decisions.length === 1 ? "" : "s",
								M ? " and 1 sign-off" : ""
							]
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-chips",
							"aria-label": "Members",
							children: b.team.map((e) => /* @__PURE__ */ f("span", {
								className: `cto-chip${e.skipped ? " is-idle" : ""}`,
								title: e.skipped ? `${e.title}: not in this run` : `${e.title}: ${e.credits} credits`,
								children: /* @__PURE__ */ f(Z, {
									role: e.icon,
									size: 16
								})
							}, e.key))
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-foot",
							children: /* @__PURE__ */ f("button", {
								type: "button",
								className: "cto-link",
								onClick: () => s({
									run: L,
									focus: "lanes"
								}),
								children: "See each member's usage ↗"
							})
						})
					]
				}) : /* @__PURE__ */ p("article", {
					className: "cto-card",
					"aria-label": "Issue and PR",
					children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "Issue → PR"
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-value kt-mono",
							children: P.issue ?? "—"
						}),
						/* @__PURE__ */ f("div", {
							className: "cto-desc",
							children: P.pr ? `PR #${P.pr} merged into main` : "No PR yet"
						})
					]
				}),
				/* @__PURE__ */ p("article", {
					className: `cto-card${b && b.tests.total ? b.tests.passed === b.tests.total ? " is-ok" : " is-bad" : ""}`,
					"aria-label": "More stable",
					children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "More stable"
						}),
						b ? /* @__PURE__ */ p(d, { children: [
							/* @__PURE__ */ p("div", {
								className: "cto-value",
								children: [b.tests.passed, /* @__PURE__ */ p("span", {
									className: "cto-of",
									children: ["/", b.tests.total]
								})]
							}),
							/* @__PURE__ */ p("div", {
								className: "cto-desc",
								children: [
									"Checks ",
									b.tests.passed,
									"/",
									b.tests.total,
									" passed · ",
									b.tests.enterprise,
									" issued by the company, which the agent cannot change"
								]
							}),
							/* @__PURE__ */ f("button", {
								type: "button",
								className: "kt-segs cto-segs",
								"aria-label": "See every item on the test wall of the team board",
								onClick: () => s({
									run: L,
									focus: "tests"
								}),
								children: Array.from({ length: b.tests.total }, (e, t) => /* @__PURE__ */ f("i", { className: t < b.tests.passed ? "is-pass" : "is-fail" }, t))
							}),
							/* @__PURE__ */ f("div", {
								className: "cto-legend",
								children: /* @__PURE__ */ p("button", {
									type: "button",
									disabled: !H,
									onClick: () => H && s(Yi(L, H)),
									title: H ? "Replay the board to the first send-back" : void 0,
									children: [
										/* @__PURE__ */ f(Z, {
											role: "bounce",
											size: 14
										}),
										"Sent back ",
										se,
										"×: people ",
										b.sent_back.person,
										" · review ",
										b.sent_back.review,
										" · checks ",
										b.sent_back.checks,
										H ? " ↗" : ""
									]
								})
							}),
							b.risks.map((e, t) => /* @__PURE__ */ f("div", {
								className: "cto-legend",
								children: /* @__PURE__ */ p("button", {
									type: "button",
									"data-testid": "cto-item-risk",
									onClick: () => s({
										run: L,
										...e.role ? { role: e.role } : {},
										at: Math.round(e.at)
									}),
									title: "Replay the board to this send-back",
									children: [
										"Risk stopped: ",
										e.what,
										e.amount == null ? "" : ` ${Rr(e.amount)}`,
										" (",
										$r(e.gate),
										" gate) ↗"
									]
								})
							}, t))
						] }) : /* @__PURE__ */ p("div", {
							className: "cto-value",
							children: [M?.origin ? "Defect fix" : `${M?.defects?.length ?? 0}`, !M?.origin && /* @__PURE__ */ p("span", {
								className: "cto-of",
								children: ["post-release defect", M?.defects?.length === 1 ? "" : "s"]
							})]
						}),
						/* @__PURE__ */ f(Ca, {
							x: P,
							fix: ie,
							onItem: n
						})
					]
				})
			]
		}),
		/* @__PURE__ */ p("section", {
			className: "cto-card",
			"aria-label": "Value stream",
			children: [/* @__PURE__ */ p("div", {
				className: "cto-chart-head",
				children: [
					/* @__PURE__ */ f("h3", { children: "Value stream" }),
					/* @__PURE__ */ f("span", {
						className: "cto-dim",
						children: b ? `From Issue creation to ${b.marks.some((e) => e.kind === "signoff") ? "sign-off" : "now"}: ${Li(b.end)} in total · click a segment or a moment to go to that step on the team board` : "Simulated delivery with no run record: the step details only exist for real runs."
					}),
					/* @__PURE__ */ f("span", { className: "cto-grow" }),
					b && /* @__PURE__ */ p("div", {
						className: "cto-seg cto-noprint",
						role: "group",
						"aria-label": "Chart or table",
						children: [/* @__PURE__ */ f("button", {
							type: "button",
							"aria-pressed": !w,
							onClick: () => T(!1),
							children: "Chart"
						}), /* @__PURE__ */ f("button", {
							type: "button",
							"aria-pressed": w,
							onClick: () => T(!0),
							children: "Table"
						})]
					})
				]
			}), b && L ? /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ p("div", {
				className: "cto-legend",
				children: [
					[
						"agent",
						"rework",
						"person"
					].map((e) => /* @__PURE__ */ p("span", { children: [/* @__PURE__ */ f("i", {
						className: "cto-sw",
						style: { background: Ui[e] }
					}), Wi[e]] }, e)),
					/* @__PURE__ */ f("span", {
						className: "cto-dim",
						children: "· above the blocks are the roles involved, below them the key moments"
					}),
					le && e.at !== void 0 && /* @__PURE__ */ p("span", {
						className: "kt-where-why",
						"data-testid": "item-at",
						children: [
							I(e.at),
							" on the team board falls in \"",
							ei(le.label),
							"\", outlined"
						]
					})
				]
			}), w ? /* @__PURE__ */ p("table", {
				className: "cto-table",
				children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ p("tr", { children: [
					/* @__PURE__ */ f("th", { children: "Time" }),
					/* @__PURE__ */ f("th", { children: "Step" }),
					/* @__PURE__ */ f("th", { children: "Who" }),
					/* @__PURE__ */ f("th", {
						className: "is-num",
						children: "Duration"
					}),
					/* @__PURE__ */ f("th", { children: "Verdict" }),
					/* @__PURE__ */ f("th", {})
				] }) }), /* @__PURE__ */ f("tbody", { children: b.segments.map((t, n) => /* @__PURE__ */ p("tr", {
					className: n === Xi(b.segments, e.at) ? "is-hl" : void 0,
					children: [
						/* @__PURE__ */ p("td", {
							className: "kt-mono",
							children: [
								I(t.from),
								"–",
								I(t.to)
							]
						}),
						/* @__PURE__ */ f("td", { children: /* @__PURE__ */ p("span", {
							className: "cto-kind",
							children: [/* @__PURE__ */ f("i", {
								className: "cto-sw",
								style: { background: Ui[Gi(t)] }
							}), ei(t.label)]
						}) }),
						/* @__PURE__ */ f("td", { children: t.who === "person" ? "Owner" : t.roles.map((e) => b.titles[e] ?? e).join(", ") }),
						/* @__PURE__ */ f("td", {
							className: "is-num",
							children: Li(t.to - t.from)
						}),
						/* @__PURE__ */ f("td", { children: ti(t.decision) }),
						/* @__PURE__ */ f("td", { children: /* @__PURE__ */ f("button", {
							type: "button",
							className: "cto-link",
							onClick: () => s(Ji(L, t)),
							children: "Board ↗"
						}) })
					]
				}, `${t.from}-${t.label}`)) })]
			}) : /* @__PURE__ */ f(Qi, {
				flow: b,
				run: L,
				onBoard: s,
				hlAt: e.at
			})] }) : B?.real && /* @__PURE__ */ p("div", {
				className: "cto-item-twinrow",
				"data-testid": "item-twin",
				children: [
					/* @__PURE__ */ p("div", { children: [
						/* @__PURE__ */ f("div", {
							className: "cto-eyebrow",
							children: "Similar measured delivery"
						}),
						/* @__PURE__ */ f("b", { children: B.t }),
						/* @__PURE__ */ p("div", {
							className: "cto-dim",
							children: [
								A(F.lines[B.line]),
								" · ",
								Pr[B.kind],
								" · ",
								B.mins,
								" min · checks ",
								B.tests,
								" passed"
							]
						})
					] }),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn is-primary",
						onClick: () => n({ run: B.real }),
						children: "See its value stream ↗"
					}),
					/* @__PURE__ */ f("button", {
						type: "button",
						className: "kt-btn",
						onClick: () => s({
							run: B.real,
							replay: 30
						}),
						children: "Replay on the team board ↗"
					})
				]
			})]
		}),
		b && L && b.decisions.length > 0 && /* @__PURE__ */ p("section", {
			className: "cto-card",
			"aria-label": "Owner decisions",
			children: [/* @__PURE__ */ p("div", {
				className: "cto-chart-head",
				children: [/* @__PURE__ */ f("h3", { children: "Owner decisions" }), /* @__PURE__ */ p("span", {
					className: "cto-dim",
					children: [b.decisions.length, " · each can be replayed on the team board to that moment"]
				})]
			}), /* @__PURE__ */ p("table", {
				className: "cto-table",
				children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ p("tr", { children: [
					/* @__PURE__ */ f("th", { children: "Time" }),
					/* @__PURE__ */ f("th", { children: "Decision" }),
					/* @__PURE__ */ f("th", { children: "Comment" }),
					/* @__PURE__ */ f("th", {})
				] }) }), /* @__PURE__ */ f("tbody", { children: b.decisions.map((e) => {
					let t = e.gate.startsWith("Approved");
					return /* @__PURE__ */ p("tr", { children: [
						/* @__PURE__ */ f("td", {
							className: "kt-mono cto-dim",
							children: I(e.at)
						}),
						/* @__PURE__ */ f("td", { children: /* @__PURE__ */ p("span", {
							className: "cto-gatecell",
							children: [/* @__PURE__ */ f("span", {
								className: `cto-chip is-small${t ? "" : " is-back"}`,
								children: /* @__PURE__ */ f(Z, {
									role: t ? "approved" : "bounce",
									size: 14
								})
							}), ti(e.gate)]
						}) }),
						/* @__PURE__ */ f("td", { children: ti(e.note) }),
						/* @__PURE__ */ f("td", { children: /* @__PURE__ */ f("button", {
							type: "button",
							className: "cto-link",
							onClick: () => s({
								run: L,
								gate: e.role,
								at: Math.round(e.at)
							}),
							children: "Board · replay to this moment ↗"
						}) })
					] }, `${e.at}-${e.gate}`);
				}) })]
			})]
		}),
		b && /* @__PURE__ */ p("section", {
			className: `cto-card${b.pr?.state === "merged" ? " is-ok" : ""}`,
			"aria-label": "Issue and PR",
			children: [/* @__PURE__ */ p("div", {
				className: "cto-chart-head",
				children: [/* @__PURE__ */ f("h3", { children: "Issue → PR" }), /* @__PURE__ */ f("span", {
					className: "cto-dim",
					children: "Where the requirement came from and how the code gets into main"
				})]
			}), /* @__PURE__ */ p("div", {
				className: "cto-item-chain",
				children: [
					/* @__PURE__ */ p("div", {
						className: "cto-chainpart",
						children: [/* @__PURE__ */ f("span", {
							className: "cto-chip is-plain",
							children: /* @__PURE__ */ f(Z, {
								role: "issue",
								size: 16
							})
						}), /* @__PURE__ */ p("div", { children: [/* @__PURE__ */ f("b", {
							className: "kt-mono",
							children: P.issue ?? "—"
						}), /* @__PURE__ */ p("div", {
							className: "cto-dim",
							children: [
								k(b.issue.kind),
								P.reporter ? ` · raised by ${A(P.reporter)}` : "",
								re ? ` · created ${Hr(re)}` : ""
							]
						})] })]
					}),
					/* @__PURE__ */ f("span", {
						className: "cto-item-arrow",
						"aria-hidden": "true",
						children: "→"
					}),
					/* @__PURE__ */ p("div", {
						className: "cto-chainpart",
						children: [/* @__PURE__ */ f("span", {
							className: `cto-chip${b.pr?.state === "open" ? " is-wait" : ""}`,
							children: /* @__PURE__ */ f(Z, {
								role: b.pr?.state === "merged" ? "merge" : "pr",
								size: 16
							})
						}), /* @__PURE__ */ p("div", { children: [b.pr ? /* @__PURE__ */ p("button", {
							type: "button",
							className: "cto-link kt-mono",
							onClick: () => s({
								run: L,
								focus: "signoff"
							}),
							children: [
								"PR #",
								b.pr.number,
								" ↗"
							]
						}) : /* @__PURE__ */ f("b", {
							className: "kt-mono",
							children: "None yet"
						}), /* @__PURE__ */ f("div", {
							className: "cto-dim",
							children: b.pr ? `${b.pr.head} → main · ${b.pr.files} file${b.pr.files === 1 ? "" : "s"} +${b.pr.added} −${b.pr.removed} · ${ya[b.pr.state]}` : "Opened after delivery and merged into main on sign-off"
						})] })]
					})
				]
			})]
		}),
		S && /* @__PURE__ */ p("div", {
			className: "kt-banner",
			role: "status",
			children: [
				"The delivery detail failed to refresh: ",
				S,
				". Showing the last data received"
			]
		})
	] }));
}
function Sa({ name: e, onCto: t }) {
	return /* @__PURE__ */ p("nav", {
		className: "kit-crumb",
		"aria-label": "Location",
		children: [
			/* @__PURE__ */ f("button", {
				type: "button",
				onClick: t,
				children: "CTO view"
			}),
			/* @__PURE__ */ f("span", {
				"aria-hidden": "true",
				children: "›"
			}),
			/* @__PURE__ */ f("b", { children: e })
		]
	});
}
function Ca({ x: e, fix: t, onItem: n }) {
	let r = "ship" in e ? e : null;
	if (!r) return null;
	if (r.origin) return /* @__PURE__ */ f("div", {
		className: "cto-foot",
		children: /* @__PURE__ */ p("button", {
			type: "button",
			className: "cto-link",
			onClick: () => n({ issue: r.origin }),
			children: [
				"Fix of the post-release defect of ",
				r.origin,
				" ↗"
			]
		})
	});
	let i = r.defects ?? [];
	return i.length ? /* @__PURE__ */ p("div", {
		className: "cto-foot cto-defect",
		children: [
			"Post-release defects ",
			i.length,
			":",
			i.map((e) => {
				let r = t(e);
				return /* @__PURE__ */ p("button", {
					type: "button",
					className: "cto-link",
					onClick: () => n(r?.real ? { run: r.real } : { issue: e }),
					children: [e, " ↗"]
				}, e);
			})
		]
	}) : /* @__PURE__ */ f("div", {
		className: "cto-foot",
		children: "Post-release defects 0"
	});
}
//#endregion
//#region src/AppBar.tsx
var wa = "\n.kt-app { display: flex; flex-direction: column; min-height: 100%; color: var(--text); font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); }\n.kt-appbar { display: flex; align-items: center; gap: 6px 18px; flex-wrap: wrap; padding: 10px 20px 0; border-bottom: 1px solid var(--border); font-size: 14px; }\n.kt-appbar h1 { margin: 0; font-size: 14px; font-weight: 700; color: var(--muted); letter-spacing: .04em; white-space: nowrap; }\n.kt-tabs { display: flex; gap: 4px; align-self: stretch; }\n.kt-tabs button { appearance: none; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--text); font: inherit; font-weight: 650;\n  padding: 8px 12px 9px; margin-bottom: -1px; cursor: pointer; white-space: nowrap; }\n.kt-tabs button:hover { color: var(--text-strong); }\n.kt-tabs button[aria-selected=\"true\"] { border-bottom-color: var(--accent); color: var(--text-strong); }\n.kt-tabs button:focus-visible, .kt-appbar .kt-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }\n.kt-appbar-grow { flex: 1; }\n.kt-appbar .kt-btn { padding: 5px 12px; margin: 4px 0 6px; }\n.kt-app.is-projection { position: fixed; inset: 0; z-index: 2147483000; height: 100vh; background: var(--bg); }\n.kt-app.is-projection > .kt-appbar { flex: none; padding: 8px 26px 0; }\n.kt-app.is-projection > .kt-root.is-projection { position: relative; inset: auto; z-index: auto; flex: 1 1 auto; min-height: 0; height: auto; }\n", Ta = [
	[
		"cto",
		"CTO view",
		"All deliveries: results and requirement flow"
	],
	[
		"item",
		"Delivery detail",
		"One delivery: cycle time, where the time went, cost, quality, value stream, human decisions"
	],
	[
		"board",
		"Team board",
		"How the agent team delivers: roles, gates, checks, sign-off"
	]
];
function Ea({ view: e, projection: t, onView: n, onProjection: r, item: i }) {
	return /* @__PURE__ */ p("header", {
		className: "kt-appbar",
		"data-testid": "kt-appbar",
		children: [
			/* @__PURE__ */ f("h1", { children: "Agent R&D Team" }),
			/* @__PURE__ */ f("div", {
				className: "kt-tabs",
				role: "tablist",
				"aria-label": "Views",
				children: Ta.map(([t, r, a]) => /* @__PURE__ */ f("button", {
					type: "button",
					role: "tab",
					"aria-selected": e === t,
					title: t === "item" && i ? `${a} (${i})` : a,
					onClick: () => e !== t && n(t),
					children: r
				}, t))
			}),
			/* @__PURE__ */ f("span", { className: "kt-appbar-grow" }),
			/* @__PURE__ */ f("button", {
				type: "button",
				className: `kt-btn${t ? " is-on" : ""}`,
				onClick: r,
				title: t ? "Exit projection (Esc)" : "Full screen, large text; stays on when you switch views",
				children: t ? "Exit projection" : "Projection"
			})
		]
	});
}
//#endregion
//#region src/main.tsx
var Da = { Plan: "Approved. One more point: when stock is below 5, products in the list and on the detail page show \"Only N left\"." }, Oa = {
	run: null,
	flips: {},
	flashes: {},
	bumps: {},
	merges: /* @__PURE__ */ new Set(),
	fresh: /* @__PURE__ */ new Set(),
	announce: ""
};
function ka(e, t) {
	if (t.first || e.run !== t.run) return {
		...Oa,
		run: t.run
	};
	let n = { ...e.flips };
	for (let e of t.flips) n[e.id] = (n[e.id] ?? 0) + 1;
	let r = { ...e.flashes };
	for (let e of t.flashes) r[e.target] = {
		n: (r[e.target]?.n ?? 0) + 1,
		tone: e.tone
	};
	let i = { ...e.bumps };
	for (let e of t.lanes) i[e.key] = (i[e.key] ?? 0) + 1;
	return {
		run: t.run,
		flips: n,
		flashes: r,
		bumps: i,
		merges: new Set(t.merges),
		fresh: new Set(t.fresh.map((e) => e.seq)),
		announce: t.announce ?? e.announce
	};
}
function Aa(e) {
	let t = null, n = -Infinity;
	for (let r of e.roles) {
		if (!M.has(r.status) && r.status !== "queued") continue;
		let e = r.agent?.last_activity ?? r.agent?.started ?? r.started_at ?? 0;
		e > n && (n = e, t = r.key);
	}
	if (t) return t;
	for (let t = e.events.length - 1; t >= 0; t--) {
		let n = e.events[t].role;
		if (n && e.roles.some((e) => e.key === n)) return n;
	}
	return null;
}
var ja = (e) => `${e.roles.map((e) => `${e.key}${e.status === "skipped" ? "-" : ""}<${e.depends_on.join(",")}`).join(";")}|${e.edges.map((e) => e.join(">")).join(";")}|${(e.roster ?? []).map((e) => e.key).join(",")}`;
function Ma({ pollMs: e = g, entry: n, onCto: s, onItem: l, onRun: u, onBack: m, onPick: h, returning: _ = !1, projection: y, onProjection: b } = {}) {
	let x = c(), S = lt(), [C, w] = o(n?.run ?? null), [T, E] = o(n?.gate ?? n?.role ?? null), [D, O] = o(n?.phase ? dr(n.phase) : null), [k, A] = o(!1), [j, M] = o(!1), N = y !== void 0, P = N ? y : j, [I, ee] = o(!!n?.new), [L, R] = o(!1), [z, B] = o(null), [te, ne] = o(null), [re, ie] = o(""), [ae, oe] = o(!1), [V, H] = o(Oa), se = a(null), ce = a(null), le = a(!1), ue = a(!1), de = t((e) => {
		e.items.length && se.current?.(e.items), H((t) => ka(t, e));
	}, []), { board: U, error: fe, missing: pe, loading: me, receivedAt: he, reload: W } = Nt(x, {
		run: C,
		pollMs: e,
		onDiff: t((e) => void (ue.current || de(e)), [de])
	}), G = pi(x, U?.run ?? null, de);
	ue.current = !!G.id;
	let K = !!G.run, q = G.run ?? U?.run ?? null;
	r(() => H(Oa), [G.id]);
	let ge = a(!1), J = a(!1);
	r(() => {
		if (ge.current || !n?.run || U?.run?.id !== n.run) return;
		ge.current = !0, J.current = !F(U.run.status) && (n.at !== void 0 || !!n.phase), (n.replay || J.current) && G.start();
		let e = n.focus === "signoff" ? "#kt-signoff" : n.focus === "tests" ? "[data-testid=\"kt-wall\"]" : n.focus === "cost" ? ".kt-kpis" : n.focus === "lanes" ? "[data-testid=\"kt-lanes\"]" : n.gate || n.role || n.phase || J.current ? "[data-testid=\"kt-graph\"]" : "";
		e && !_ && setTimeout(() => ce.current?.querySelector(e)?.scrollIntoView({
			behavior: "smooth",
			block: "start"
		}), 50);
	}, [U?.run?.id]);
	let _e = a(!1);
	r(() => {
		if (!G.id || !G.span || _e.current || (_e.current = !0, n?.replay && G.setSpeed(n.replay), !J.current || !U?.run || !G.span)) return;
		let e = U.run, t = G.span, r = n?.at === void 0 ? null : e.started_at + n.at;
		if (r === null && D) {
			let t = e.roles.filter((e) => dr(e.phase) === D && e.started_at).map((e) => e.started_at);
			r = t.length ? Math.min(...t) : null;
		}
		r !== null && (G.seek(Math.max(t.start, Math.min(r, t.end))), n?.replay || G.pause()), _ || setTimeout(() => ce.current?.querySelector(n?.focus === "signoff" ? "#kt-signoff" : "[data-testid=\"kt-graph\"]")?.scrollIntoView?.({
			behavior: "smooth",
			block: "start"
		}), 200);
	}, [G.id, G.span]), r(() => {
		U?.run?.id && u?.(U.run.id);
	}, [U?.run?.id]), r(() => {
		U && !U.run && U.runs.length > 0 && C && w(null);
	}, [U, C]);
	let Y = q ? ja(q) : "", ye = i(() => {
		if (!q) return null;
		let e = ve(q.roles, q.edges);
		return Le(e.roles, e.edges, q.roster);
	}, [Y]), be = i(() => ({
		at: U?.at ?? Date.now() / 1e3,
		receivedAt: he || Date.now()
	}), [U?.at, he]), xe = G.clock ?? be, Se = t((e) => E((t) => t === e ? null : e), []), Ce = k && q ? Aa(q) : null, we = t(async () => {
		if (N) return b?.(!0);
		M(!0);
		let e = ce.current;
		if (e && typeof e.requestFullscreen == "function" && !document.fullscreenElement) try {
			await e.requestFullscreen(), le.current = !0;
		} catch {
			le.current = !1;
		}
	}, [N, b]), Te = t(async () => {
		if (N) return b?.(!1);
		M(!1);
		let e = le.current;
		if (le.current = !1, e && document.fullscreenElement && typeof document.exitFullscreen == "function") try {
			await document.exitFullscreen();
		} catch {}
	}, [N, b]);
	r(() => {
		let e = () => {
			!document.fullscreenElement && le.current && (le.current = !1, M(!1));
		};
		return document.addEventListener("fullscreenchange", e), () => document.removeEventListener("fullscreenchange", e);
	}, []), r(() => {
		let e = (e) => {
			e.key === "Escape" && (te ? ne(null) : P ? Te() : (E(null), O(null)));
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [
		P,
		Te,
		te
	]);
	let Ee = t(async (e, t) => {
		let n = {};
		e && (n.requirement = e), t?.source && (n.source = t.source), t?.team && (n.team = t.team), t?.model && (n.model = t.model);
		let r = await x.post(v.runs(), n), i = typeof r?.run == "string" ? r.run : null;
		ee(!1), E(null), w(i), W();
	}, [x, W]), De = t(async () => {
		q && (await x.post(v.stop(q.id), {}), R(!1), W());
	}, [
		x,
		q,
		W
	]), Oe = t((e) => {
		w(e), E(null), O(null), R(!1), ne(null), h?.(e);
	}, [h]), ke = t((e, t) => ne({
		role: e,
		path: t ?? null
	}), []), Ae = t(async (e) => {
		if (q) {
			ie("");
			try {
				await x.post(v.retry(q.id), e ? { roles: [e] } : {});
			} catch (e) {
				ie(jt(e));
			}
			W();
		}
	}, [
		x,
		q,
		W
	]), je = t(async (e, t, n, r) => {
		q && z && (await x.post(v.gate(q.id), {
			role: z.role,
			decision: z.decision,
			note: e,
			...t ? { delivery: t } : {},
			...n ? { answers: n } : {},
			...r ? { risk: r } : {}
		}), B(null), W());
	}, [
		x,
		q,
		z,
		W
	]), X = z && q ? q.roles.find((e) => e.key === z.role) : void 0, Me = X && q && X.writable.length > 0 ? q.roles.filter((e) => e.phase === X.phase && e.writable.length > 0 && (e.status === "merged" || e.key === X.key)).map((e) => ({
		key: e.key,
		title: e.title,
		icon: e.icon,
		onOpen: () => ke(e.key)
	})) : [], Ne = t(async (e, t) => {
		q && (await x.post(v.signoff(q.id), {
			by: e,
			note: t
		}), W());
	}, [
		x,
		q,
		W
	]), Pe = t((e) => x.post(v.route(), { requirement: e }), [x]), Fe = t(() => x.get(v.models()).then((e) => e?.models ?? []), [x]), Ie = t(async (e) => {
		await x.post(v.hide(e), {}), w(null), W();
	}, [x, W]), [Re, ze] = o(""), Be = t(async () => {
		ze("Cleaning up…");
		try {
			let e = await x.post(v.cleanup(), {});
			ze(`Cleaned up ${e.sessions} finished session${e.sessions === 1 ? "" : "s"} and collapsed ${e.folders} empty folder${e.folders === 1 ? "" : "s"}`);
		} catch (e) {
			ze(jt(e));
		}
	}, [x]);
	return /* @__PURE__ */ p("div", {
		ref: ce,
		className: `kt-root${P ? " is-projection" : ""}${k ? " is-following" : ""}${q && F(q.status) ? " is-live" : ""}`,
		"data-testid": "kt-root",
		"data-projection": P ? "true" : void 0,
		"data-motion": S ? "reduce" : void 0,
		children: [
			/* @__PURE__ */ f("style", { children: Wn }),
			/* @__PURE__ */ f("style", { children: da }),
			/* @__PURE__ */ p(ht.Provider, {
				value: xe,
				children: [
					!P && q && n?.from && q.id === n.run && /* @__PURE__ */ f(Fa, {
						run: q,
						entry: n,
						phase: D,
						focus: T,
						replayAt: G.id && G.span ? G.t - G.span.start : null,
						playing: G.playing,
						onCto: s ? () => s({ hl: q.id }) : void 0,
						onItem: l ? () => l({ run: q.id }) : void 0,
						onBack: m
					}),
					/* @__PURE__ */ f(an, {
						board: U,
						run: q,
						projection: P,
						follow: k,
						startOpen: I,
						onSelect: Oe,
						onProjection: N ? void 0 : () => void (P ? Te() : we()),
						onFollow: () => A((e) => !e),
						onStart: () => ee((e) => !e),
						onStop: () => R(!0),
						onOutputs: (e) => ne(e),
						onRetry: () => void Ae(),
						onFolder: () => oe((e) => !e),
						onCleanup: () => void Be(),
						onHide: (e) => void Ie(e),
						onReplay: G.start,
						inApp: N,
						onItem: l,
						replaying: !!G.id,
						folderOpen: ae
					}),
					G.id && /* @__PURE__ */ f(mi, {
						rp: G,
						projection: P
					}),
					!P && Re && /* @__PURE__ */ f("p", {
						className: "kt-dim kt-cleanup-msg",
						role: "status",
						onClick: () => ze(""),
						children: Re
					}),
					!P && ae && q && /* @__PURE__ */ f(Ft, {
						api: x,
						run: q.id,
						folder: q.folder,
						onClose: () => oe(!1)
					}),
					re && /* @__PURE__ */ p("div", {
						className: "kt-banner is-error",
						role: "alert",
						children: ["Retry failed: ", re]
					}),
					fe && /* @__PURE__ */ p("div", {
						className: "kt-banner",
						role: "status",
						children: [pe ? "The backend does not have the board endpoint yet (GET /board returned 404)" : `Board refresh failed: ${fe}`, U ? ". Showing the last data received" : ""]
					}),
					!U && me && /* @__PURE__ */ f("p", {
						className: "kt-loading",
						children: "Connecting to the board…"
					}),
					!P && !K && I && q && /* @__PURE__ */ f(bn, {
						onStart: Ee,
						preview: Pe,
						models: Fe,
						onCancel: () => ee(!1)
					}),
					!P && !K && L && q && /* @__PURE__ */ f(xn, {
						run: q,
						onConfirm: De,
						onCancel: () => R(!1)
					}),
					z && q && /* @__PURE__ */ f(Tn, {
						label: X?.gate_label || X?.title || z.role,
						who: X?.title,
						questions: X?.questions,
						talk: X?.talk,
						outputs: Me.length > 1 ? Me : [],
						decision: z.decision,
						preset: z.decision === "discuss" ? void 0 : (z.decision === "revise" ? X?.gate_revise_preset : X?.gate_preset) || Da[X?.gate_label || ""],
						presetRisk: z.decision === "revise" ? X?.gate_revise_risk : void 0,
						split: X && X.writable.length === 0 ? void 0 : q.roles.filter((e) => e.key !== z.role && e.status !== "skipped" && !(e.key in q.plan_skip)).map((e) => ({
							key: e.key,
							title: e.title,
							icon: e.icon,
							assignment: e.assignment
						})),
						skips: X && X.writable.length > 0 ? Object.entries(q.plan_skip).map(([e, t]) => ({
							key: e,
							title: q.roles.find((t) => t.key === e)?.title ?? e,
							why: t
						})) : void 0,
						overrule: X?.overrule,
						delivery: X?.delivery_gate && z.decision === "approve" ? q.delivery : void 0,
						report: X && X.writable.length === 0 ? X.summary || "" : void 0,
						onReport: X && X.writable.length === 0 ? () => ke(X.key) : void 0,
						onConfirm: je,
						onCancel: () => B(null)
					}, `${z.role}-${z.decision}-${X?.talk.length ?? 0}`),
					U && !q && U.runs.length === 0 && /* @__PURE__ */ f(Dn, {
						onStart: Ee,
						preview: Pe,
						models: Fe
					}),
					q && ye && /* @__PURE__ */ p(d, { children: [
						/* @__PURE__ */ f(sn, {
							run: q,
							reducedMotion: S,
							onRole: Se
						}, `${q.id}${K ? ":replay" : ""}`),
						q.roles.some((e) => e.phase) && /* @__PURE__ */ f(kn, { run: q }),
						/* @__PURE__ */ f(Nr, {
							run: q,
							onRole: Se
						}),
						!F(q.status) && q.tests.total > 0 && /* @__PURE__ */ f(ai, {
							run: q,
							onSign: Ne,
							onCto: s ? () => s({ hl: q.id }) : void 0,
							onItem: l ? () => l({ run: q.id }) : void 0
						}),
						/* @__PURE__ */ p("div", {
							className: "kt-body",
							children: [/* @__PURE__ */ p("div", {
								className: "kt-col",
								children: [
									/* @__PURE__ */ f(fr, {
										run: q,
										lay: ye,
										focus: T,
										onRole: Se,
										flashes: V.flashes,
										reducedMotion: S,
										feed: se,
										onRetry: P || K || q.imported ? void 0 : (e) => void Ae(e),
										onGate: K ? void 0 : (e, t) => B({
											role: e,
											decision: t
										}),
										quiet: P,
										onOutputs: (e) => ke(e),
										phase: D,
										onPhase: (e) => {
											E(null), O((t) => t === e ? null : e);
										}
									}, `${q.id}${K ? ":replay" : ""}`),
									T && /* @__PURE__ */ f(La, {
										run: q,
										focus: T,
										onClear: () => E(null),
										onItem: l ? () => l({
											run: q.id,
											at: Na(q, G, { role: T })
										}) : void 0
									}),
									!T && D && /* @__PURE__ */ f(Ia, {
										run: q,
										phase: D,
										onClear: () => O(null),
										onItem: l ? () => l({
											run: q.id,
											at: Na(q, G, { phase: D })
										}) : void 0
									}),
									!P && /* @__PURE__ */ f(Dt, {
										run: q,
										fresh: V.merges,
										focus: T,
										onRole: Se
									}),
									/* @__PURE__ */ f(An, {
										run: q,
										focus: T,
										phase: D,
										follow: Ce,
										bumps: V.bumps,
										onRole: Se,
										reducedMotion: S,
										projection: P,
										onOutputs: ke,
										onRetry: P || K || q.imported ? void 0 : (e) => void Ae(e)
									})
								]
							}), /* @__PURE__ */ p("aside", {
								className: "kt-side",
								"aria-label": "Tests and events",
								children: [/* @__PURE__ */ f(en, {
									tests: q.tests,
									roles: q.roles,
									focus: T,
									onRole: Se,
									flips: V.flips
								}), /* @__PURE__ */ f(kt, {
									run: q,
									focus: T,
									onRole: Se,
									fresh: V.fresh,
									milestones: P
								})]
							})]
						})
					] }),
					q && te && /* @__PURE__ */ f(Rt, {
						api: x,
						run: q,
						target: te,
						onTarget: ne,
						onClose: () => ne(null)
					}),
					/* @__PURE__ */ f("div", {
						className: "kt-sr",
						"aria-live": "polite",
						"data-testid": "kt-announce",
						children: V.announce
					})
				]
			})
		]
	});
}
function Na(e, t, n) {
	if (t.id) return Math.max(0, Math.round(t.t - e.started_at));
	let r = e.roles.filter((e) => e.started_at && (n.role ? e.key === n.role : dr(e.phase) === n.phase));
	return r.length ? Math.max(0, Math.round(Math.min(...r.map((e) => e.started_at)) - e.started_at)) : void 0;
}
var Pa = {
	signoff: "Sign-off sheet",
	tests: "Test wall",
	cost: "Metrics",
	lanes: "Member lanes"
};
function Fa({ run: e, entry: t, phase: n, focus: r, replayAt: i, playing: a, onCto: o, onItem: s, onBack: c }) {
	let l = r ? e.roles.find((e) => e.key === r) : void 0, u = n ? j.find((e) => e.key === n) : void 0, d = [
		u ? `${u.title} phase` : "",
		l ? l.gate_label ? `${l.gate_label} gate` : l.title : "",
		t.focus ? Pa[t.focus] : "",
		i === null ? "" : `Replay ${I(i)}${a ? "" : " (paused)"}`
	].filter(Boolean), m = t.pick === "latest" ? t.phase ? `No run is in the "${u?.title ?? t.phase}" column right now; this opens the latest measured delivery.` : t.gate ? "No run is waiting at a human gate right now; this opens the first gate of the latest measured delivery." : "No run has an agent working right now; this replays the latest measured delivery." : "";
	return /* @__PURE__ */ p("nav", {
		className: "kit-crumb kt-where",
		"aria-label": "Location",
		"data-testid": "kt-where",
		children: [
			o ? /* @__PURE__ */ f("button", {
				type: "button",
				onClick: o,
				children: "CTO view"
			}) : /* @__PURE__ */ f("span", { children: "CTO view" }),
			/* @__PURE__ */ f("span", {
				"aria-hidden": "true",
				children: "›"
			}),
			s ? /* @__PURE__ */ f("button", {
				type: "button",
				onClick: s,
				title: "The delivery detail of this delivery",
				children: e.delivery?.name || e.title
			}) : /* @__PURE__ */ f("span", { children: e.delivery?.name || e.title }),
			/* @__PURE__ */ f("span", {
				"aria-hidden": "true",
				children: "›"
			}),
			/* @__PURE__ */ p("b", { children: ["Team board", d.length ? ` · ${d.join(" · ")}` : ""] }),
			m && /* @__PURE__ */ f("span", {
				className: "kt-where-why",
				children: m
			}),
			/* @__PURE__ */ f("span", { className: "kt-grow" }),
			c && /* @__PURE__ */ p("button", {
				type: "button",
				className: "kt-btn",
				onClick: c,
				children: ["← Back to ", t.from === "item" ? "Delivery detail" : "the CTO view"]
			})
		]
	});
}
function Ia({ run: e, phase: t, onClear: n, onItem: r }) {
	let i = j.find((e) => e.key === t), a = e.roles.filter((e) => e.status !== "skipped" && dr(e.phase) === t).length;
	return /* @__PURE__ */ p("div", {
		className: "kt-focuschip",
		role: "status",
		"data-testid": "kt-phasebar",
		children: [
			i ? `${i.n} ${i.title}` : t,
			" · ",
			a,
			" role",
			a === 1 ? "" : "s",
			r && /* @__PURE__ */ f("button", {
				type: "button",
				className: "kt-chip-link",
				onClick: r,
				children: "Value stream of this delivery ↗"
			}),
			/* @__PURE__ */ f("button", {
				type: "button",
				onClick: n,
				"aria-label": "Show all",
				title: "Show all (Esc)",
				children: "✕"
			})
		]
	});
}
function La({ run: e, focus: t, onClear: n, onItem: r }) {
	let i = e.roles.find((e) => e.key === t);
	return i ? /* @__PURE__ */ p("div", {
		className: "kt-focuschip",
		role: "status",
		"data-testid": "kt-focusbar",
		children: [
			/* @__PURE__ */ f(Z, {
				role: i.icon || i.key,
				size: 14
			}),
			" ",
			i.title,
			r && /* @__PURE__ */ f("button", {
				type: "button",
				className: "kt-chip-link",
				onClick: r,
				children: "Value stream of this delivery ↗"
			}),
			/* @__PURE__ */ f("button", {
				type: "button",
				onClick: n,
				"aria-label": "Show all",
				title: "Show all (Esc)",
				children: "✕"
			})
		]
	}) : null;
}
function Ra({ pollMs: e } = {}) {
	let [n, i] = o(() => ({
		...Ci(window.location.search),
		n: 0
	})), [s, c] = o(() => za(Ci(window.location.search), {})), [l, d] = o(!1), m = u(), h = a(null), g = a(Ci(window.location.search)), _ = a(null), v = a(g.current.kind === "cto" ? Ti(g.current) : {}), y = t((e) => {
		g.current = e, e.kind === "cto" && (v.current = Ti(e)), c((t) => za(e, t));
	}, []), b = (e) => `${window.location.pathname}${Ei(e)}`, x = () => Number(window.history.state?.ktDepth ?? 0), S = t(() => {
		let e = h.current;
		if (!e) return null;
		let t = e.querySelector(":scope > .kt-root");
		if (t && t.scrollHeight > t.clientHeight && /auto|scroll/.test(getComputedStyle(t).overflowY)) return t;
		for (let t = e.parentElement; t; t = t.parentElement) if (t.scrollHeight > t.clientHeight && /auto|scroll/.test(getComputedStyle(t).overflowY)) return t;
		return document.scrollingElement;
	}, []), C = t(() => {
		try {
			window.history.replaceState({
				...window.history.state ?? {},
				ktScroll: Math.round(S()?.scrollTop ?? 0)
			}, "", window.location.href);
		} catch {}
	}, [S]), w = t((e) => {
		y(e), window.history.replaceState({
			...window.history.state ?? {},
			ktDepth: x()
		}, "", b(e));
	}, [y]), T = t((e) => {
		let t = g.current;
		if (t.kind === "cto" && e.kind !== "cto") {
			let n = e.kind === "item" ? e.run ?? e.issue : e.run;
			n && w({
				...t,
				hl: n,
				at: void 0
			});
		}
		C();
		let n = x() + 1, r = b(e);
		y(e), i((t) => ({
			...e,
			n: t.n + 1
		})), m(r);
		let a = () => {
			let e = window.history.state;
			`${window.location.pathname}${window.location.search}` === r && e?.ktDepth === void 0 && window.history.replaceState({
				...e ?? {},
				ktDepth: n
			}, "", r);
		};
		a(), setTimeout(a, 0), setTimeout(a, 60);
	}, [
		y,
		w,
		C,
		m
	]);
	r(() => {
		let e = () => {
			let e = Ci(window.location.search), t = window.history.state?.ktScroll;
			_.current = typeof t == "number" && t > 0 ? t : null, y(e), i((t) => ({
				...e,
				n: t.n + 1,
				returning: _.current !== null
			}));
		};
		return window.addEventListener("popstate", e), () => window.removeEventListener("popstate", e);
	}, [y]), r(() => {
		let e, t = (t) => {
			let n = S();
			(t.target === n || t.target === document && n === document.scrollingElement) && (clearTimeout(e), e = setTimeout(C, 300));
		};
		return window.addEventListener("scroll", t, {
			capture: !0,
			passive: !0
		}), () => {
			clearTimeout(e), window.removeEventListener("scroll", t, { capture: !0 });
		};
	}, [S, C]), r(() => {
		if (!n.n) return;
		document.querySelector(l ? "[data-testid=\"kt-app\"] > .kt-root" : "[data-testid=\"kt-app\"]")?.scrollIntoView?.({ block: "start" });
		let e = _.current;
		_.current = null;
		let t = S();
		if (e === null || !t) return;
		let r = 0, i = 0, a = setInterval(() => {
			let n = t.scrollHeight - t.clientHeight >= e;
			n && Math.abs(t.scrollTop - e) > 2 ? (t.scrollTop = e, i = 0) : n && (i += 1), i >= 6 ? o() : ++r >= 40 && (t.scrollTop = e, o());
		}, 100), o = () => {
			clearInterval(a);
			for (let e of [
				"wheel",
				"touchstart",
				"keydown"
			]) window.removeEventListener(e, o);
		};
		for (let e of [
			"wheel",
			"touchstart",
			"keydown"
		]) window.addEventListener(e, o, { passive: !0 });
		return o;
	}, [n.n]);
	let E = t(async (e) => {
		d(e);
		let t = h.current;
		try {
			e && t && typeof t.requestFullscreen == "function" && !document.fullscreenElement && await t.requestFullscreen(), !e && document.fullscreenElement && typeof document.exitFullscreen == "function" && await document.exitFullscreen();
		} catch {}
	}, []);
	r(() => {
		let e = () => !document.fullscreenElement && d(!1);
		return document.addEventListener("fullscreenchange", e), () => document.removeEventListener("fullscreenchange", e);
	}, []);
	let D = t((e) => void E(e), [E]), O = t((e = {}) => T({
		kind: "cto",
		...v.current,
		...e
	}), [T]), k = t((e) => {
		let t = g.current.kind;
		T({
			kind: "item",
			...e,
			...!e.from && t !== "item" ? { from: t } : {}
		});
	}, [T]), A = t((e) => {
		let t = g.current.kind;
		T({
			kind: "board",
			...e,
			...e.run && !e.from && t !== "board" ? { from: t } : {}
		});
	}, [T]), j = t((e) => x() > 0 ? window.history.back() : T(e), [T]), M = t((e) => c((t) => t.run === e ? t : { run: e }), []), N = t((e) => w({
		kind: "board",
		run: e
	}), [w]), P = t((e) => w({
		kind: "cto",
		...e
	}), [w]), F;
	if (n.kind === "board") {
		let { kind: t, n: r, returning: i, ...a } = n;
		F = /* @__PURE__ */ f(Ma, {
			pollMs: e,
			entry: a,
			returning: i,
			onCto: (e) => O(e),
			onItem: k,
			onRun: M,
			onPick: N,
			projection: l,
			onProjection: D,
			onBack: a.from ? () => j(a.from === "item" ? {
				kind: "item",
				run: a.run
			} : {
				kind: "cto",
				...v.current,
				hl: a.run
			}) : void 0
		}, r);
	} else if (n.kind === "item") {
		let { kind: t, n: r, returning: i, ...a } = n;
		F = /* @__PURE__ */ f(xa, {
			entry: a,
			returning: i,
			onCto: O,
			onBack: a.from ? () => j(a.from === "board" ? {
				kind: "board",
				run: a.run
			} : {
				kind: "cto",
				...v.current,
				hl: a.run ?? a.issue
			}) : void 0,
			onItem: k,
			onBoard: A,
			projection: l,
			pollMs: e
		}, r);
	} else {
		let { kind: e, n: t, returning: r, ...i } = n;
		F = /* @__PURE__ */ f(ma, {
			entry: i,
			returning: r,
			onOpen: A,
			onItem: k,
			onState: P,
			projection: l,
			onProjection: D
		}, t);
	}
	return /* @__PURE__ */ p("div", {
		ref: h,
		className: `kt-app${l ? " is-projection" : ""}`,
		"data-testid": "kt-app",
		children: [
			/* @__PURE__ */ f("style", { children: wa }),
			/* @__PURE__ */ f(Ea, {
				view: n.kind,
				projection: l,
				item: s.run ?? s.issue,
				onView: (e) => e === "item" ? k({
					run: s.run,
					issue: s.issue
				}) : e === "board" ? A(s.run ? { run: s.run } : {}) : O(s.run || s.issue ? { hl: s.run ?? s.issue } : {}),
				onProjection: () => D(!l)
			}),
			F
		]
	});
}
function za(e, t) {
	return e.kind === "item" ? e.run === t.run && e.issue === t.issue ? t : {
		run: e.run,
		issue: e.issue
	} : e.kind === "board" && e.run ? t.run === e.run ? t : { run: e.run } : t;
}
//#endregion
export { Ma as TeamPage, ka as applyDiff, Ra as default, Aa as mostActive };
