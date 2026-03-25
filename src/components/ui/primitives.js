import React from "react";

export const Section = ({ title, emoji, subtitle, children }) => (
  <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 className="font-bold text-gray-800 text-sm">{emoji} {title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

export const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
    {children}
  </div>
);

export const TextInput = ({ value, onChange, placeholder }) => (
  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);

export const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none overflow-hidden"
    value={value}
    onChange={e => { onChange(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
    onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
    placeholder={placeholder} rows={rows} />
);

export const Select = ({ value, onChange, options }) => (
  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
    value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export const Chips = ({ value, onChange, options, single }) => {
  const toggle = v => {
    if (single) { onChange(value === v ? "" : v); return; }
    const arr = Array.isArray(value) ? value : [];
    onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };
  const isSelected = v => single ? value === v : Array.isArray(value) && value.includes(v);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} onClick={() => toggle(o.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-all ${isSelected(o.value) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
};

export const AdvancedToggle = ({ isOpen, onToggle, t, sectionCount }) => (
  <button onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all group mb-5">
    <div className="flex items-center gap-2">
      <span className="text-base">{isOpen ? "🔼" : "🔽"}</span>
      <div className="text-left">
        <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
          {isOpen ? t.btnHideAdvanced : t.btnShowAdvanced}
        </p>
        <p className="text-xs text-gray-400">
          {isOpen ? t.hintAdvancedCollapse : t.hintAdvancedSub(sectionCount)}
        </p>
      </div>
    </div>
    <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${isOpen ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"}`}>
      {isOpen ? "Hide" : "Optional"}
    </span>
  </button>
);

export const LangSelector = ({ lang, setLang }) => (
  <div className="flex gap-1">
    {[["en", "EN"], ["zh", "中文"], ["bm", "BM"]].map(([code, label]) => (
      <button key={code} onClick={() => setLang(code)}
        className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${lang === code ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
        {label}
      </button>
    ))}
  </div>
);
