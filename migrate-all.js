const fs = require("fs");

const INPUT = "./main/ob/tokens.json";
const OUTPUT = "./main/ob/tokens.migrated.json";

const raw = fs.readFileSync(INPUT, "utf8");
let data = JSON.parse(raw);

// -----------------------------
// HELPERS
// -----------------------------

function ensureStates(obj) {
  if (!obj || !obj.default) return obj;

  return {
    default: obj.default,
    hover: obj.hover || obj.default,
    active: obj.active || obj.default,
    disabled: obj.disabled || obj.subtle || obj.default,
    ...(obj.subtle && { subtle: obj.subtle })
  };
}

// -----------------------------
// STEP 1: BUILD NEW SYS
// -----------------------------

const oldSys = (data['ob/system'] && data['ob/system'].sys) || data.sys || {};

const newSys = {
  color: {
    text: {},
    bg: {},
    border: {}
  }
};

// ---- TEXT
if (oldSys.content) {
  const c = oldSys.content;

  if (c.base) newSys.color.text.primary = c.base;
  if (c.subtle) newSys.color.text.secondary = c.subtle;
  if (c.weak) newSys.color.text.tertiary = c.weak;

  if (c.inverse) newSys.color.text.inverse = c.inverse;
  if (c["inverse-subtle"]) newSys.color.text["inverse-secondary"] = c["inverse-subtle"];

  if (c.disable) newSys.color.text.disabled = c.disable;

  if (c.accent) newSys.color.text.brand = c.accent;
  if (c.danger) newSys.color.text.danger = c.danger;
  if (c.warning) newSys.color.text.warning = c.warning;
  if (c.success) newSys.color.text.success = c.success;
}

// ---- BG
if (oldSys.background) {
  const b = oldSys.background;

  if (b.base) newSys.color.bg.primary = b.base;
  if (b.subtle) newSys.color.bg.secondary = b.subtle;
  if (b.weak) newSys.color.bg.tertiary = b.weak;

  if (b.dark) newSys.color.bg.inverse = b.dark;
  if (b["dark-light"]) newSys.color.bg["inverse-secondary"] = b["dark-light"];

  // BRAND
  newSys.color.bg.brand = ensureStates({
    default: b.accent,
    hover: b["accent-hover"],
    active: b["accent-active"],
    disabled: b["accent-disable"] || b["accent-light"]
  });

  // TRANSACTION
  if (b.transaction) {
    newSys.color.bg.transaction = ensureStates({
      default: b.transaction,
      hover: b["transaction-hover"],
      active: b.transaction,
      disabled: b["transaction-disable"]
    });
  }

  // INTENTS
  ["danger", "warning", "success"].forEach((intent) => {
    if (b[intent] || b[`${intent}-light`]) {
      const variant = {
        default: b[intent],
        subtle: b[`${intent}-light`]
      };

      newSys.color.bg[intent] = ensureStates(variant);
    }
  });
}

// ---- BORDER
if (oldSys.border) {
  const br = oldSys.border;

  if (br.base) newSys.color.border.default = br.base;
  if (br.subtle) newSys.color.border.subtle = br.subtle;
  if (br.strong) newSys.color.border.strong = br.strong;
  if (br.inverse) newSys.color.border.inverse = br.inverse;

  if (br.accent) newSys.color.border.brand = br.accent;
  if (br.focus) newSys.color.border.focus = br.focus;

  ["danger", "warning", "success"].forEach((intent) => {
    if (br[intent]) {
      newSys.color.border[intent] = br[intent];
    }
  });
}

// Replace sys in the correct location
if (data['ob/system']) {
  data['ob/system'].sys = newSys;
} else {
  data.sys = newSys;
}

// -----------------------------
// STEP 2: UPDATE REFERENCES
// -----------------------------

function replaceRefs(str) {
  return str
    // CONTENT → TEXT
    .replace(/sys\.content\.base-light/g, "sys.color.text.primary-subtle")
    .replace(/sys\.content\.base-hover/g, "sys.color.text.primary-hover")
    .replace(/sys\.content\.base-disable/g, "sys.color.text.primary-disabled")
    .replace(/sys\.content\.base-inverse/g, "sys.color.text.inverse")
    .replace(/sys\.content\.subtle-inverse/g, "sys.color.text.inverse-secondary")
    .replace(/sys\.content\.weak-inverse/g, "sys.color.text.inverse-tertiary")
    .replace(/sys\.content\.base/g, "sys.color.text.primary")
    .replace(/sys\.content\.subtle/g, "sys.color.text.secondary")
    .replace(/sys\.content\.weak/g, "sys.color.text.tertiary")
    .replace(/sys\.content\.inverse/g, "sys.color.text.inverse")
    .replace(/sys\.content\.disable/g, "sys.color.text.disabled")

    .replace(/sys\.content\.accent/g, "sys.color.text.brand")
    .replace(/sys\.content\.danger/g, "sys.color.text.danger")
    .replace(/sys\.content\.success/g, "sys.color.text.success")
    .replace(/sys\.content\.warning-disable/g, "sys.color.text.warning-disabled")
    .replace(/sys\.content\.warning/g, "sys.color.text.warning")

    // BACKGROUND
    .replace(/sys\.background\.base/g, "sys.color.bg.primary")
    .replace(/sys\.background\.subtle/g, "sys.color.bg.secondary")
    .replace(/sys\.background\.weak/g, "sys.color.bg.tertiary")

    .replace(/sys\.background\.dark-hover/g, "sys.color.bg.inverse-hover")
    .replace(/sys\.background\.dark-active/g, "sys.color.bg.inverse-active")
    .replace(/sys\.background\.dark-disable/g, "sys.color.bg.inverse-disabled")
    .replace(/sys\.background\.dark-light/g, "sys.color.bg.inverse-secondary")
    .replace(/sys\.background\.dark/g, "sys.color.bg.inverse")

    // BRAND
    .replace(/sys\.background\.accent-hover/g, "sys.color.bg.brand.hover")
    .replace(/sys\.background\.accent-active/g, "sys.color.bg.brand.active")
    .replace(/sys\.background\.accent-light-disable/g, "sys.color.bg.brand.disabled")
    .replace(/sys\.background\.accent-light/g, "sys.color.bg.brand.subtle")
    .replace(/sys\.background\.accent/g, "sys.color.bg.brand.default")

    // WHATSAPP
    .replace(/sys\.background\.whatsapp/g, "sys.color.bg.whatsapp")

    // TRANSACTION
    .replace(/sys\.background\.transaction-hover/g, "sys.color.bg.transaction.hover")
    .replace(/sys\.background\.transaction-disable/g, "sys.color.bg.transaction.disabled")
    .replace(/sys\.background\.transaction/g, "sys.color.bg.transaction.default")

    // INTENTS
    .replace(/sys\.background\.danger-light/g, "sys.color.bg.danger.subtle")
    .replace(/sys\.background\.danger/g, "sys.color.bg.danger.default")

    .replace(/sys\.background\.warning-light/g, "sys.color.bg.warning.subtle")
    .replace(/sys\.background\.warning/g, "sys.color.bg.warning.default")

    .replace(/sys\.background\.success-light/g, "sys.color.bg.success.subtle")
    .replace(/sys\.background\.success/g, "sys.color.bg.success.default")

    // BORDER
    .replace(/sys\.border\.dark-light/g, "sys.color.border.inverse-secondary")
    .replace(/sys\.border\.dark/g, "sys.color.border.inverse")
    .replace(/sys\.border\.base/g, "sys.color.border.default")
    .replace(/sys\.border\.subtle/g, "sys.color.border.subtle")
    .replace(/sys\.border\.weak/g, "sys.color.border.tertiary")
    .replace(/sys\.border\.strong/g, "sys.color.border.strong")
    .replace(/sys\.border\.accent/g, "sys.color.border.brand")
    .replace(/sys\.border\.focus/g, "sys.color.border.focus")
    .replace(/sys\.border\.danger/g, "sys.color.border.danger")
    .replace(/sys\.border\.success/g, "sys.color.border.success")
    .replace(/sys\.border\.warning/g, "sys.color.border.warning")
    .replace(/sys\.border\.inverse/g, "sys.color.border.inverse")

    // CLEANUP
    .replace(/-light(?![\w-])/g, ".subtle")
    .replace(/disable(?!d)/g, "disabled");
}

function deepReplace(obj) {
  if (typeof obj === "string") return replaceRefs(obj);

  if (Array.isArray(obj)) return obj.map(deepReplace);

  if (typeof obj === "object" && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = deepReplace(obj[key]);
    }
    return newObj;
  }

  return obj;
}

data = deepReplace(data);

// -----------------------------
// STEP 3: SAVE
// -----------------------------

fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2));

console.log("✅ Migration complete →", OUTPUT);