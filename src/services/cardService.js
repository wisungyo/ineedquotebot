/**
 * Quote cards: render a quote as a PNG image (1080x1350, IG portrait 4:5).
 *
 * Pure template rendering with @napi-rs/canvas. No AI or image generation:
 * fixed layouts, bundled open-source fonts (OFL, see assets/fonts), and
 * programmatic shapes/gradients. The same quote + style always produces the
 * same image (decorations use a PRNG seeded from the quote text).
 */
const path = require("path");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");

const FONT_DIR = path.join(__dirname, "../../assets/fonts");
const FONTS = [
    ["EBGaramond12-Regular.otf", "Garamond"],
    ["EBGaramond12-Italic.otf", "Garamond Italic"],
    ["Inter-Medium.otf", "Inter Medium"],
    ["Inter-SemiBold.otf", "Inter SemiBold"],
    ["Inter-ExtraBold.otf", "Inter ExtraBold"],
    ["Inter-Black.otf", "Inter Black"],
];
for (const [file, family] of FONTS) {
    if (!GlobalFonts.registerFromPath(path.join(FONT_DIR, file), family)) {
        console.error(`⚠️ Failed to load font ${file}`);
    }
}

const BOT_USERNAME = process.env.TL_BOT_USERNAME || "ineedquotebot";
const W = 1080;
const H = 1350;

/** Word-wrap text into lines that fit maxWidth, avoiding a one-word last line */
function wrap(ctx, text, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = w;
        } else line = test;
    }
    if (line) lines.push(line);
    if (lines.length > 1 && !lines[lines.length - 1].includes(" ")) {
        const prev = lines[lines.length - 2].split(" ");
        if (prev.length > 2) {
            const candidate = `${prev[prev.length - 1]} ${lines[lines.length - 1]}`;
            if (ctx.measureText(candidate).width <= maxWidth) {
                prev.pop();
                lines[lines.length - 2] = prev.join(" ");
                lines[lines.length - 1] = candidate;
            }
        }
    }
    return lines;
}

/** Narrow the measure as far as possible without adding a line → even rag */
function balance(ctx, text, maxWidth, count) {
    let best = wrap(ctx, text, maxWidth);
    for (let w = maxWidth; w > maxWidth * 0.55; w -= 10) {
        const l = wrap(ctx, text, w);
        if (l.length > count) break;
        best = l;
    }
    return best;
}

/** Largest font size (step 2) where the wrapped text fits the box */
function fitText(ctx, text, family, maxWidth, maxHeight, maxSize, minSize, lineHeight) {
    for (let size = maxSize; size >= minSize; size -= 2) {
        ctx.font = `${size}px "${family}"`;
        const lines = wrap(ctx, text, maxWidth);
        if (lines.length * size * lineHeight <= maxHeight) {
            return { size, lines: balance(ctx, text, maxWidth, lines.length) };
        }
    }
    ctx.font = `${minSize}px "${family}"`;
    return { size: minSize, lines: wrap(ctx, text, maxWidth) };
}

/** Deterministic PRNG so a quote always gets the same decoration */
function rng(seed) {
    let s = 0;
    for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/** Collapse whitespace and trim, so layout math is predictable */
function clean(q) {
    return {
        text: String(q.text || "").replace(/\s+/g, " ").trim(),
        author: String(q.author || "Unknown").replace(/\s+/g, " ").trim(),
    };
}

// ── Style: Classic ── warm paper, serif italic, big quote mark, thin rule
function classic(q) {
    const c = createCanvas(W, H);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#F5EFE6";
    ctx.fillRect(0, 0, W, H);
    const r = rng(q.text);
    for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = `rgba(120,90,60,${r() * 0.05})`;
        ctx.fillRect(r() * W, r() * H, 1.5, 1.5);
    }
    ctx.strokeStyle = "#C9B79C";
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    ctx.textAlign = "left";
    const LH = 1.32;
    const { size, lines } = fitText(ctx, q.text, "Garamond Italic", W - 260, 640, 78, 40, LH);
    let y = 380 + (640 - lines.length * size * LH) / 2 + size;

    ctx.fillStyle = "#B08D57";
    ctx.font = `260px "Garamond"`;
    const mark = ctx.measureText("“");
    ctx.fillText("“", 116, y - size * 0.72 - 28 - mark.actualBoundingBoxDescent);

    ctx.font = `${size}px "Garamond Italic"`;
    ctx.fillStyle = "#2E2A24";
    for (const l of lines) {
        ctx.fillText(l, 130, y);
        y += size * LH;
    }
    y += 30;
    ctx.fillStyle = "#B08D57";
    ctx.fillRect(130, y, 90, 3);
    ctx.fillStyle = "#5B5247";
    ctx.font = `36px "Inter Medium"`;
    ctx.fillText(q.author.toUpperCase().split("").join(String.fromCharCode(8202)), 130, y + 70);

    ctx.fillStyle = "#7D6F5E";
    ctx.font = `28px "Inter Medium"`;
    ctx.fillText(`@${BOT_USERNAME}`, 130, H - 120);
    return c;
}

// ── Style: Sunrise ── gradient, bold sans, rounded white card
function sunrise(q) {
    const c = createCanvas(W, H);
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#FF9A62");
    g.addColorStop(0.5, "#F2617A");
    g.addColorStop(1, "#7B4BC4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = rng(q.author + q.text);
    for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(r() * W, r() * H, 80 + r() * 260, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.07})`;
        ctx.fill();
    }
    const x = 90;
    const y0 = 230;
    const w = W - 180;
    const h = 830;
    ctx.save();
    ctx.shadowColor = "rgba(40,10,60,0.25)";
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 20;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(x, y0, w, h, 48);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#F2617A";
    ctx.font = `30px "Inter SemiBold"`;
    ctx.textAlign = "left";
    ctx.fillText("☀  QUOTE OF THE DAY", x + 70, y0 + 100);

    const LH = 1.22;
    const { size, lines } = fitText(ctx, q.text, "Inter ExtraBold", w - 140, 520, 72, 36, LH);
    ctx.fillStyle = "#1F1B2E";
    let y = y0 + 170 + (520 - lines.length * size * LH) / 2 + size;
    for (const l of lines) {
        ctx.fillText(l, x + 70, y);
        y += size * LH;
    }
    ctx.fillStyle = "#6B6480";
    ctx.font = `36px "Inter Medium"`;
    ctx.fillText(`— ${q.author}`, x + 70, Math.min(y - size * LH + 110, y0 + h - 70));

    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = `34px "Inter SemiBold"`;
    ctx.textAlign = "center";
    ctx.fillText(`@${BOT_USERNAME}`, W / 2, H - 150);
    ctx.font = `26px "Inter Medium"`;
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(60,10,60,0.35)";
    ctx.shadowBlur = 8;
    ctx.fillText("a fresh quote every morning", W / 2, H - 105);
    ctx.shadowBlur = 0;
    return c;
}

// Words never worth highlighting in the Midnight style
const HIGHLIGHT_SKIP = new Set([
    "believes",
    "because",
    "without",
    "through",
    "someone",
    "something",
    "everything",
    "anything",
    "yourself",
    "themselves",
    "another",
    "between",
    "whatever",
    "whenever",
]);

// ── Style: Midnight ── dark, huge type, one highlighted keyword
function midnight(q) {
    const c = createCanvas(W, H);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0F1115";
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.85, H * 0.1, 50, W * 0.85, H * 0.1, 900);
    g.addColorStop(0, "rgba(255,200,87,0.22)");
    g.addColorStop(1, "rgba(255,200,87,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const LH = 1.18;
    const { size, lines } = fitText(ctx, q.text, "Inter Black", W - 200, 800, 96, 44, LH);
    ctx.textAlign = "left";
    let y = 250 + (800 - lines.length * size * LH) / 2 + size;
    ctx.fillStyle = "#FFC857";
    ctx.fillRect(100, y - size - 70, 70, 10);

    const words = q.text.replace(/[^\w\s']/g, "").split(/\s+/);
    const key = words
        .filter((w) => !HIGHLIGHT_SKIP.has(w.toLowerCase()))
        .reduce((a, b) => (b.length > a.length ? b : a), "");
    ctx.font = `${size}px "Inter Black"`;
    for (const l of lines) {
        let xx = 100;
        for (const [i, w] of l.split(" ").entries()) {
            const m = w.match(/^([\w']+)(.*)$/);
            const parts = m && m[1] === key ? [[m[1], "#FFC857"], [m[2], "#F4F1EA"]] : [[w, "#F4F1EA"]];
            if (i) xx += ctx.measureText(" ").width;
            for (const [txt, color] of parts) {
                ctx.fillStyle = color;
                ctx.fillText(txt, xx, y);
                xx += ctx.measureText(txt).width;
            }
        }
        y += size * LH;
    }
    ctx.fillStyle = "#C3C8D0";
    ctx.font = `38px "Inter Medium"`;
    ctx.fillText(`— ${q.author}`, 100, H - 200);
    ctx.fillStyle = "#7B8494";
    ctx.font = `28px "Inter Medium"`;
    ctx.fillText(`@${BOT_USERNAME}`, 100, H - 145);
    return c;
}

const STYLES = { classic, sunrise, midnight };
const STYLE_NAMES = Object.keys(STYLES);

/**
 * Style for a given day: rotates classic → sunrise → midnight, one per day
 * (Asia/Jakarta date), so everyone sees the same style on the same day.
 * @param {String} [dateKey] - YYYY-MM-DD
 */
function styleForDate(dateKey) {
    const key = dateKey || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
    const day = Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000);
    return STYLE_NAMES[((day % STYLE_NAMES.length) + STYLE_NAMES.length) % STYLE_NAMES.length];
}

/**
 * Render a quote card
 * @param {Object} quote - { text, author }
 * @param {String} [style] - classic | sunrise | midnight (default: today's style)
 * @returns {Buffer} PNG
 */
function renderQuoteCard(quote, style) {
    const name = STYLES[style] ? style : styleForDate();
    return STYLES[name](clean(quote)).toBuffer("image/png");
}

module.exports = {
    renderQuoteCard,
    styleForDate,
    STYLE_NAMES,
};
