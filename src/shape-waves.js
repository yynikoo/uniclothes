// ShapeWaves background (ported from the React Bits <ShapeWaves /> component, JS + CSS variant).
// The site has no React or bundler, so this is the same effect as plain browser JavaScript using
// WebGPU directly instead of the `vgpu` helper package: same shaders, ripple simulation, intro wave
// and text cutout. `shapeWavesClient` is serialized with .toString() and inlined into the home page,
// so it must stay self-contained (no references to anything outside the function).
//
// Colours follow the site theme (html[data-theme] or the system setting) and update live when the
// theme toggle is used. Without WebGPU the hero shows a plain "UNICLOTHES" title instead.
export function shapeWavesClient(opts) {
  "use strict";
  var root = document.getElementById(opts.id);
  if (!root) return;
  var canvas = root.querySelector("canvas");
  if (!navigator.gpu || !canvas) { root.dataset.fallback = "true"; return; }

  var SHAPE_MODES = { mixed: 0, squares: 1, circles: 2, triangles: 3 };
  var MAX_DPR = 2, MAX_MASK_SIZE = 1024, NOISE_CELLS = 32, TIME_RATE = 0.1, SIMULATION_STEP = 1 / 60;
  var WAVE_SPEED = 0.42, WAVE_FRICTION = 0.94, WAVE_DECAY = 0.972, SETTLED_THRESHOLD = 0.01;
  var INTRO_BAND = 0.2, INTRO_WARP = 0.3, INTRO_JITTER = 0.16;
  var INTRO_END = 1 + INTRO_WARP + INTRO_JITTER + INTRO_BAND;

  var settings = {
    text: String(opts.text || ""),
    fontFamily: opts.fontFamily || "system-ui, sans-serif",
    fontWeight: opts.fontWeight || 500,
    textSize: opts.textSize || 0.6,
    shapes: opts.shapes || "mixed",
    cellSize: Math.max(2, opts.cellSize || 10),
    dotSize: opts.dotSize == null ? 0.75 : opts.dotSize,
    speed: opts.speed == null ? 1 : opts.speed,
    scale: Math.max(0.05, opts.scale || 1),
    contrast: opts.contrast == null ? 1 : opts.contrast,
    brightness: opts.brightness == null ? 0.4 : opts.brightness,
    flow: opts.flow || 0,
    direction: opts.direction || 0,
    fade: opts.fade == null ? 0.25 : opts.fade,
    interactive: opts.interactive !== false,
    splashRadius: opts.splashRadius || 40,
    splashStrength: opts.splashStrength == null ? 0.4 : opts.splashStrength,
    intro: opts.intro !== false,
    introDuration: Math.max(0.1, opts.introDuration || 1.6)
  };

  function themeColors() {
    var dark = (window.currentTheme ? window.currentTheme() : "light") === "dark";
    return dark ? opts.dark : opts.light;
  }

  var VERTEX_WGSL = `
struct VertexOut { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn vs_main(@builtin(vertex_index) index: u32) -> VertexOut {
  var points = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var out: VertexOut;
  out.position = vec4f(points[index], 0.0, 1.0);
  out.uv = vec2f(points[index].x * 0.5 + 0.5, 0.5 - points[index].y * 0.5);
  return out;
}
`;

  var NOISE_WGSL = `
fn mod289v3(x: vec3f) -> vec3f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn mod289v4(x: vec4f) -> vec4f { return x - floor(x * (1.0 / 289.0)) * 289.0; }
fn permute(x: vec4f) -> vec4f { return mod289v4(((x * 34.0) + 10.0) * x); }
fn taylorInvSqrt(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }
fn fadeCurve(t: vec3f) -> vec3f { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

fn cnoise(P: vec3f) -> f32 {
  var Pi0 = floor(P);
  var Pi1 = Pi0 + vec3f(1.0);
  Pi0 = mod289v3(Pi0);
  Pi1 = mod289v3(Pi1);
  let Pf0 = fract(P);
  let Pf1 = Pf0 - vec3f(1.0);
  let ix = vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  let iy = vec4f(Pi0.yy, Pi1.yy);
  let iz0 = Pi0.zzzz;
  let iz1 = Pi1.zzzz;

  let ixy = permute(permute(ix) + iy);
  let ixy0 = permute(ixy + iz0);
  let ixy1 = permute(ixy + iz1);

  var gx0 = ixy0 * (1.0 / 7.0);
  var gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  let gz0 = vec4f(0.5) - abs(gx0) - abs(gy0);
  let sz0 = step(gz0, vec4f(0.0));
  gx0 -= sz0 * (step(vec4f(0.0), gx0) - 0.5);
  gy0 -= sz0 * (step(vec4f(0.0), gy0) - 0.5);

  var gx1 = ixy1 * (1.0 / 7.0);
  var gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  let gz1 = vec4f(0.5) - abs(gx1) - abs(gy1);
  let sz1 = step(gz1, vec4f(0.0));
  gx1 -= sz1 * (step(vec4f(0.0), gx1) - 0.5);
  gy1 -= sz1 * (step(vec4f(0.0), gy1) - 0.5);

  var g000 = vec3f(gx0.x, gy0.x, gz0.x);
  var g100 = vec3f(gx0.y, gy0.y, gz0.y);
  var g010 = vec3f(gx0.z, gy0.z, gz0.z);
  var g110 = vec3f(gx0.w, gy0.w, gz0.w);
  var g001 = vec3f(gx1.x, gy1.x, gz1.x);
  var g101 = vec3f(gx1.y, gy1.y, gz1.y);
  var g011 = vec3f(gx1.z, gy1.z, gz1.z);
  var g111 = vec3f(gx1.w, gy1.w, gz1.w);

  let norm0 = taylorInvSqrt(vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  let norm1 = taylorInvSqrt(vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  let n000 = dot(g000, Pf0);
  let n100 = dot(g100, vec3f(Pf1.x, Pf0.yz));
  let n010 = dot(g010, vec3f(Pf0.x, Pf1.y, Pf0.z));
  let n110 = dot(g110, vec3f(Pf1.xy, Pf0.z));
  let n001 = dot(g001, vec3f(Pf0.xy, Pf1.z));
  let n101 = dot(g101, vec3f(Pf1.x, Pf0.y, Pf1.z));
  let n011 = dot(g011, vec3f(Pf0.x, Pf1.yz));
  let n111 = dot(g111, Pf1);

  let f = fadeCurve(Pf0);
  let nz = mix(vec4f(n000, n100, n010, n110), vec4f(n001, n101, n011, n111), f.z);
  let ny = mix(nz.xy, nz.zw, f.y);
  return 2.2 * mix(ny.x, ny.y, f.x);
}

fn fbm(p: vec3f) -> f32 {
  var total = 0.0;
  var amplitude = 1.0;
  var weight = 0.0;
  var frequency = 1.0;
  for (var i = 0; i < 2; i++) {
    total += amplitude * cnoise(p * frequency);
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total / weight;
}
`;

  var SCENE_WGSL = `
struct Params {
  resolution: vec4f,
  placement: vec4f,
  grid: vec4f,
  field: vec4f,
  motion: vec4f,
  color: vec4f,
  hover: vec4f,
  background: vec4f,
}
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var maskTexture: texture_2d<f32>;
@group(0) @binding(2) var maskSampler: sampler;
@group(0) @binding(3) var<storage, read> charges: array<f32>;

const SEED = vec2f(12.9898, 78.233);
const GLOW_THRESHOLD = 0.6;
${NOISE_WGSL}

fn sdIsoscelesTriangle(point: vec2f, q: vec2f) -> f32 {
  let p = vec2f(abs(point.x), point.y);
  let a = p - q * clamp(dot(p, q) / dot(q, q), 0.0, 1.0);
  let b = p - q * vec2f(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  let s = -sign(q.y);
  let d = min(vec2f(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2f(dot(b, b), s * (p.y - q.y)));
  return -sqrt(d.x) * sign(d.y);
}

fn shapeDistance(p: vec2f, shape: i32, c: f32) -> f32 {
  if (shape == 0) { return max(abs(p.x), abs(p.y)) - c; }
  if (shape == 1) { return length(p) - c; }
  return sdIsoscelesTriangle(vec2f(p.x, p.y + c), vec2f(c, 2.0 * c));
}

fn hash21(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let resolution = params.resolution.xy;
  let cellPx = params.grid.x;
  let dotSize = params.grid.y;
  let mode = i32(params.grid.z + 0.5);
  let cols = i32(params.grid.w + 0.5);
  let background = params.background.rgb;
  let toSurface = params.hover.w < 0.5;

  let pixel = uv * resolution;
  let origin = params.placement.xy;
  let rows = i32(params.placement.z + 0.5);
  let cell = floor((pixel - origin) / cellPx);
  if (cell.y < 0.0 || i32(cell.y) >= rows || cell.x < 0.0 || i32(cell.x) >= cols) {
    return vec4f(background, select(0.0, 1.0, toSurface));
  }
  let center = origin + (cell + 0.5) * cellPx;
  let local = (pixel - center) / (cellPx * 0.5);
  let cellUv = center / resolution;

  if (params.motion.z > 0.5 && textureSampleLevel(maskTexture, maskSampler, cellUv, 0.0).r > 0.5) {
    return vec4f(background, select(0.0, 1.0, toSurface));
  }

  var level = 1.0;
  let fade = params.motion.w;
  if (fade > 0.0) {
    let q = abs(uv * 2.0 - 1.0);
    let radius = pow(pow(q.x, 2.5) + pow(q.y, 2.5), 1.0 / 2.5) / pow(2.0, 1.0 / 2.5);
    level = 1.0 - smoothstep(max(0.0, 1.0 - fade * 2.2), 1.0, radius);
  }
  let noise = fbm(vec3f((center + params.motion.xy) / params.field.x + SEED, params.field.w));
  let tone = clamp((noise * 0.5 + 0.5 - params.field.y) * params.field.z + 0.5, 0.0, 1.0);
  let band = i32(min(tone, 0.999999) * 3.0);

  var charge = 0.0;
  let index = i32(cell.y) * cols + i32(cell.x);
  if (index >= 0 && index < i32(arrayLength(&charges))) { charge = charges[index]; }
  let stepped = (band + i32(clamp(charge, 0.0, 0.999) * 3.0)) % 3;

  var shape = 2 - stepped;
  var size = dotSize;
  if (mode != 0) {
    shape = mode - 1;
    size = dotSize * mix(0.45, 1.0, f32(stepped) / 2.0);
  }
  let introProgress = params.placement.w;
  var front = 0.0;
  if (introProgress < ${INTRO_END.toFixed(2)}) {
    let radial = length((center - resolution * 0.5) / (resolution * 0.5)) * 0.70710678;
    let warp = cnoise(vec3f(cellUv * vec2f(3.2, 2.4) + SEED, 4.7)) * ${INTRO_WARP.toFixed(2)};
    let jitter = hash21(cell) * ${INTRO_JITTER.toFixed(2)};
    let spread = radial + warp + jitter + ${INTRO_WARP.toFixed(2)};
    let band = ${INTRO_BAND.toFixed(2)} * (0.6 + 0.8 * hash21(cell + vec2f(17.0, 9.0)));
    let t = clamp((introProgress - spread) / band, 0.0, 1.0);
    if (t <= 0.0) {
      return vec4f(background, select(0.0, 1.0, toSurface));
    }
    let back = t - 1.0;
    size = max(size * (1.0 + 2.70158 * back * back * back + 1.70158 * back * back), 0.02);
    front = 1.0 - smoothstep(0.0, 1.0, abs(introProgress - spread) / band);
  }
  let aa = 2.0 / cellPx;
  let coverage = smoothstep(aa, -aa, shapeDistance(local, shape, size));

  let tint = mix(params.color.rgb, params.hover.rgb, max(smoothstep(0.15, 0.85, charge), front * 0.35));

  let rgb = mix(background, tint, coverage * level);
  if (toSurface) { return vec4f(rgb, 1.0); }
  let luminance = dot(tint * level, vec3f(0.2126, 0.7152, 0.0722));
  let glow = max(0.0, (luminance - GLOW_THRESHOLD) / (1.0 - GLOW_THRESHOLD)) * coverage;
  return vec4f(rgb, glow);
}
`;

  var BLUR_WGSL = `
struct Blur { direction: vec4f }
@group(0) @binding(0) var<uniform> blur: Blur;
@group(0) @binding(1) var sourceTexture: texture_2d<f32>;
@group(0) @binding(2) var sourceSampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let sigma = blur.direction.z;
  let radius = i32(ceil(3.0 * sigma));
  var sum = vec3f(0.0);
  var weight = 0.0;
  for (var i = -radius; i <= radius; i++) {
    let offset = f32(i);
    let w = exp(-(offset * offset) / (2.0 * sigma * sigma));
    let sample = textureSampleLevel(sourceTexture, sourceSampler, uv + offset * blur.direction.xy, 0.0);
    sum += select(sample.rgb, sample.rgb * sample.a, blur.direction.w > 0.5) * w;
    weight += w;
  }
  return vec4f(sum / weight, 1.0);
}
`;

  var COMPOSITE_WGSL = `
struct Composite { strength: vec4f }
@group(0) @binding(0) var<uniform> composite: Composite;
@group(0) @binding(1) var sceneTexture: texture_2d<f32>;
@group(0) @binding(2) var glowTexture: texture_2d<f32>;
@group(0) @binding(3) var linearSampler: sampler;

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let scene = textureSampleLevel(sceneTexture, linearSampler, uv, 0.0).rgb;
  let glow = textureSampleLevel(glowTexture, linearSampler, uv, 0.0).rgb;
  return vec4f(scene + glow * composite.strength.x, 1.0);
}
`;

  function parseColor(value, fallback) {
    var source = typeof value === "string" ? value.trim() : "";
    var match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(source) || /^#?([\da-f]{6})$/i.exec(fallback);
    var hex = match[1];
    if (hex.length === 3) hex = hex.replace(/./g, function (c) { return c + c; });
    return [0, 2, 4].map(function (o) { return parseInt(hex.slice(o, o + 2), 16) / 255; });
  }

  var disposed = false, failed = false, device = null, frameId = 0, lastFrameTime = 0, time = 0;
  var drift = [0, 0], dpr = 1, visible = true, presented = false;
  var cols = 1, rows = 1, cellPx = 10, gridOrigin = [0, 0];
  var charges = new Float32Array(1), heights = new Float32Array(1), previousHeights = new Float32Array(1);
  var simulationBacklog = 0, introStart = 0, introProgress = INTRO_END, introArmed = false;
  var chargesActive = false, bounds = null, glowStrength = 0;
  var resizeObserver, visibilityObserver, themeObserver;
  var wakeRenderer = function () {};
  var pointer = { x: 0, y: 0, at: 0, inside: false };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  var systemDark = matchMedia("(prefers-color-scheme: dark)");
  var maskCanvas = document.createElement("canvas");
  var maskContext = maskCanvas.getContext("2d");
  var handleWake = function () { wakeRenderer(); };
  var invalidateBounds = function () { bounds = null; };
  var handleTheme = function () { applyColors(); };
  var applyColors = function () {};

  function cleanup() {
    disposed = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    wakeRenderer = function () {};
    document.removeEventListener("visibilitychange", handleWake);
    reduceMotion.removeEventListener("change", handleWake);
    systemDark.removeEventListener("change", handleTheme);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("scroll", invalidateBounds, { capture: true });
    if (resizeObserver) resizeObserver.disconnect();
    if (visibilityObserver) visibilityObserver.disconnect();
    if (themeObserver) themeObserver.disconnect();
    if (device) device.destroy();
    device = null;
  }

  function fail(error) {
    if (failed) return;
    failed = true;
    cleanup();
    root.dataset.ready = "false";
    root.dataset.fallback = "true";
    if (window.console) console.warn("ShapeWaves unavailable:", error && error.message ? error.message : error);
  }

  function splash(x, y, strength) {
    var sigma = Math.max(0.5, ((settings.splashRadius * dpr) / cellPx) * 0.5);
    var reach = Math.ceil(sigma * 2.5);
    var centerCol = (x * dpr - gridOrigin[0]) / cellPx - 0.5;
    var centerRow = (y * dpr - gridOrigin[1]) / cellPx - 0.5;
    var minRow = Math.max(0, Math.floor(centerRow - reach)), maxRow = Math.min(rows - 1, Math.ceil(centerRow + reach));
    var minCol = Math.max(0, Math.floor(centerCol - reach)), maxCol = Math.min(cols - 1, Math.ceil(centerCol + reach));
    for (var row = minRow; row <= maxRow; row++) {
      var dy = row - centerRow;
      for (var col = minCol; col <= maxCol; col++) {
        var dx = col - centerCol;
        var bump = strength * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        var index = row * cols + col;
        heights[index] = Math.min(1.2, heights[index] + bump);
      }
    }
    chargesActive = true;
  }

  function handlePointerMove(event) {
    if (!settings.interactive) return;
    if (!bounds) bounds = root.getBoundingClientRect();
    var now = performance.now();
    var x = event.clientX - bounds.left, y = event.clientY - bounds.top;
    var inside = x >= 0 && y >= 0 && x <= bounds.width && y <= bounds.height;
    if (inside) {
      var elapsed = pointer.inside ? Math.max(8, now - pointer.at) : 16;
      var travelled = pointer.inside ? Math.hypot(x - pointer.x, y - pointer.y) : 0;
      var speed = (travelled / elapsed) * 1000;
      splash(x, y, Math.min(1, 0.22 + speed * 0.0006) * settings.splashStrength);
      wakeRenderer();
    }
    pointer.x = x; pointer.y = y; pointer.at = now; pointer.inside = inside;
  }

  (async function () {
    try {
      var adapter = await navigator.gpu.requestAdapter({ powerPreference: "low-power" });
      if (!adapter) throw new Error("No WebGPU adapter");
      device = await adapter.requestDevice();
      if (disposed) return;
      device.lost.then(function (info) { if (!disposed) fail(new Error("GPU device lost: " + info.message)); });
      device.addEventListener("uncapturederror", function (event) { fail(event.error); });

      var context = canvas.getContext("webgpu");
      if (!context) throw new Error("No WebGPU canvas context");
      var outputFormat = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device: device, format: outputFormat, alphaMode: "opaque" });

      var U = GPUBufferUsage, T = GPUTextureUsage;
      var linearSampler = device.createSampler({
        minFilter: "linear", magFilter: "linear", addressModeU: "clamp-to-edge", addressModeV: "clamp-to-edge"
      });
      var paramsData = new Float32Array(32);
      var paramsBuffer = device.createBuffer({ size: 128, usage: U.UNIFORM | U.COPY_DST });
      var blurXBuffer = device.createBuffer({ size: 16, usage: U.UNIFORM | U.COPY_DST });
      var blurYBuffer = device.createBuffer({ size: 16, usage: U.UNIFORM | U.COPY_DST });
      var compositeBuffer = device.createBuffer({ size: 16, usage: U.UNIFORM | U.COPY_DST });
      var chargeBuffer = device.createBuffer({ size: 4, usage: U.STORAGE | U.COPY_DST });

      function setParam(offset, values) { paramsData.set(values, offset); }
      function createTexture(size, usage, label) {
        return device.createTexture({ size: size, format: "rgba8unorm", usage: usage, label: label });
      }
      var maskTexture = createTexture([1, 1], T.TEXTURE_BINDING | T.COPY_DST | T.RENDER_ATTACHMENT, "shape-waves-mask");
      var targetUsage = T.TEXTURE_BINDING | T.RENDER_ATTACHMENT;
      var sceneTexture, glowA, glowB;

      function makePipeline(code, format, label) {
        var module = device.createShaderModule({ code: VERTEX_WGSL + code, label: label });
        return device.createRenderPipelineAsync({
          label: label, layout: "auto",
          vertex: { module: module, entryPoint: "vs_main" },
          fragment: { module: module, entryPoint: "fs_main", targets: [{ format: format }] },
          primitive: { topology: "triangle-list" }
        });
      }
      var pipelines = await Promise.all([
        makePipeline(SCENE_WGSL, outputFormat, "shape-waves-scene-out"),
        makePipeline(SCENE_WGSL, "rgba8unorm", "shape-waves-scene-target"),
        makePipeline(BLUR_WGSL, "rgba8unorm", "shape-waves-blur"),
        makePipeline(COMPOSITE_WGSL, outputFormat, "shape-waves-composite")
      ]);
      if (disposed) return;
      var sceneOut = pipelines[0], sceneTarget = pipelines[1], blurPipeline = pipelines[2], compositePipeline = pipelines[3];

      var bind = {};
      function bindGroup(pipeline, resources) {
        return device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: resources.map(function (resource, binding) { return { binding: binding, resource: resource }; })
        });
      }
      function rebuildBindGroups() {
        var sceneResources = [{ buffer: paramsBuffer }, maskTexture.createView(), linearSampler, { buffer: chargeBuffer }];
        bind.sceneOut = bindGroup(sceneOut, sceneResources);
        bind.sceneTarget = bindGroup(sceneTarget, sceneResources);
        bind.blurX = bindGroup(blurPipeline, [{ buffer: blurXBuffer }, sceneTexture.createView(), linearSampler]);
        bind.blurY = bindGroup(blurPipeline, [{ buffer: blurYBuffer }, glowA.createView(), linearSampler]);
        bind.composite = bindGroup(compositePipeline,
          [{ buffer: compositeBuffer }, sceneTexture.createView(), glowB.createView(), linearSampler]);
      }

      function measureSurface() {
        dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        return [Math.max(1, Math.round(canvas.clientWidth * dpr)), Math.max(1, Math.round(canvas.clientHeight * dpr))];
      }
      var glowSize = function (s) { return [Math.max(1, Math.ceil(s[0] / 2)), Math.max(1, Math.ceil(s[1] / 2))]; };

      function configureGrid() {
        var width = canvas.width, height = canvas.height;
        var nextCols = Math.max(1, Math.round(width / (settings.cellSize * dpr)));
        cellPx = width / nextCols;
        var nextRows = Math.max(1, Math.floor(height / cellPx));
        gridOrigin = [0, (height - nextRows * cellPx) / 2];
        if (nextCols === cols && nextRows === rows && charges.length === cols * rows) return false;
        cols = nextCols; rows = nextRows;
        charges = new Float32Array(cols * rows);
        heights = new Float32Array(cols * rows);
        previousHeights = new Float32Array(cols * rows);
        chargesActive = false;
        chargeBuffer.destroy();
        chargeBuffer = device.createBuffer({ size: charges.byteLength, usage: U.STORAGE | U.COPY_DST });
        device.queue.writeBuffer(chargeBuffer, 0, charges);
        return true;
      }

      function stepRipples() {
        var lastCol = cols - 1, lastRow = rows - 1, peak = 0;
        for (var row = 0; row < rows; row++) {
          var up = (row === 0 ? row : row - 1) * cols;
          var down = (row === lastRow ? row : row + 1) * cols;
          var base = row * cols;
          for (var col = 0; col < cols; col++) {
            var index = base + col;
            var left = base + (col === 0 ? col : col - 1);
            var right = base + (col === lastCol ? col : col + 1);
            var height = heights[index];
            var laplacian = heights[left] + heights[right] + heights[up + col] + heights[down + col] - 4 * height;
            var velocity = (height - previousHeights[index]) * WAVE_FRICTION;
            var next = (height + velocity + WAVE_SPEED * laplacian) * WAVE_DECAY;
            previousHeights[index] = next;
            var charge = Math.min(1, Math.max(0, next));
            charges[index] = charge;
            if (charge > peak) peak = charge;
          }
        }
        var swap = heights; heights = previousHeights; previousHeights = swap;
        return peak;
      }

      function updateCharges(deltaSeconds) {
        if (!chargesActive) return false;
        simulationBacklog = Math.min(simulationBacklog + deltaSeconds, SIMULATION_STEP * 4);
        var peak = 1;
        while (simulationBacklog >= SIMULATION_STEP) {
          simulationBacklog -= SIMULATION_STEP;
          peak = stepRipples();
        }
        if (peak < SETTLED_THRESHOLD) {
          heights.fill(0); previousHeights.fill(0); charges.fill(0);
          chargesActive = false;
        }
        device.queue.writeBuffer(chargeBuffer, 0, charges);
        return chargesActive;
      }

      function isAnimating() {
        return visible && !document.hidden && settings.speed > 0 && !reduceMotion.matches;
      }

      function pass(encoder, view, pipeline, group) {
        var p = encoder.beginRenderPass({
          colorAttachments: [{ view: view, loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 1 } }]
        });
        p.setPipeline(pipeline);
        p.setBindGroup(0, group);
        p.draw(3);
        p.end();
      }

      function render(now) {
        frameId = 0;
        if (disposed || failed) return;
        var deltaSeconds = lastFrameTime ? Math.min(0.1, (now - lastFrameTime) / 1000) : 0;
        lastFrameTime = now;
        var animating = isAnimating();
        if (animating) {
          time += deltaSeconds * TIME_RATE * settings.speed;
          var angle = (settings.direction * Math.PI) / 180;
          var distance = settings.flow * cellPx * deltaSeconds;
          drift = [drift[0] + Math.cos(angle) * distance, drift[1] + Math.sin(angle) * distance];
        }
        var hovering = visible && !document.hidden && updateCharges(deltaSeconds);
        if (introArmed) { introArmed = false; introStart = now; introProgress = 0; }
        var introPlaying = introProgress < INTRO_END;
        if (introPlaying) {
          introProgress = Math.min(INTRO_END, ((now - introStart) / 1000 / settings.introDuration) * INTRO_END);
        }
        setParam(4, [gridOrigin[0], gridOrigin[1], rows, introProgress]);
        setParam(12, [NOISE_CELLS * cellPx * settings.scale, 0.5 - (settings.brightness - 0.5) * 0.4, 2.8 * settings.contrast, time]);
        setParam(16, [drift[0], drift[1], settings.text.trim() ? 1 : 0, settings.fade]);
        device.queue.writeBuffer(paramsBuffer, 0, paramsData);

        var encoder = device.createCommandEncoder();
        var output = context.getCurrentTexture().createView();
        if (glowStrength > 0) {
          pass(encoder, sceneTexture.createView(), sceneTarget, bind.sceneTarget);
          pass(encoder, glowA.createView(), blurPipeline, bind.blurX);
          pass(encoder, glowB.createView(), blurPipeline, bind.blurY);
          pass(encoder, output, compositePipeline, bind.composite);
        } else {
          pass(encoder, output, sceneOut, bind.sceneOut);
        }
        device.queue.submit([encoder.finish()]);

        if (!presented) { presented = true; root.dataset.ready = "true"; }
        if (animating || hovering || introPlaying) frameId = requestAnimationFrame(render);
        else lastFrameTime = 0;
      }

      wakeRenderer = function () {
        if (disposed || failed || frameId) return;
        var requested = requestAnimationFrame(render);
        frameId = requested;
        // Chrome can drop animation frames requested while a cross-page View Transition is starting.
        // If the frame hasn't run shortly, draw directly so the field never stays blank.
        setTimeout(function () {
          if (frameId !== requested || disposed || failed) return;
          cancelAnimationFrame(requested);
          render(performance.now());
        }, 250);
      };

      function drawMask() {
        var content = settings.text.trim();
        var surfaceWidth = canvas.width, surfaceHeight = canvas.height;
        var hasText = content.length > 0;
        var maskScale = hasText ? Math.min(1, MAX_MASK_SIZE / Math.max(surfaceWidth, surfaceHeight)) : 0;
        var maskWidth = hasText ? Math.max(1, Math.round(surfaceWidth * maskScale)) : 1;
        var maskHeight = hasText ? Math.max(1, Math.round(surfaceHeight * maskScale)) : 1;
        maskCanvas.width = maskWidth;
        maskCanvas.height = maskHeight;
        maskContext.fillStyle = "#000";
        maskContext.fillRect(0, 0, maskWidth, maskHeight);
        if (hasText) {
          var fontPx = Math.max(1, settings.textSize * maskHeight);
          maskContext.font = settings.fontWeight + " " + fontPx + "px " + settings.fontFamily;
          var measured = maskContext.measureText(content).width;
          var maxWidth = maskWidth * 0.9;
          if (measured > maxWidth) {
            fontPx = Math.max(1, (fontPx * maxWidth) / measured);
            maskContext.font = settings.fontWeight + " " + fontPx + "px " + settings.fontFamily;
          }
          maskContext.textAlign = "center";
          maskContext.textBaseline = "alphabetic";
          var metrics = maskContext.measureText(content);
          var x = (maskWidth + metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2;
          var y = (maskHeight + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
          maskContext.fillStyle = "#fff";
          maskContext.fillText(content, x, y);
        }
        var nextTexture = createTexture([maskWidth, maskHeight], T.TEXTURE_BINDING | T.COPY_DST | T.RENDER_ATTACHMENT, "shape-waves-mask");
        device.queue.copyExternalImageToTexture({ source: maskCanvas }, { texture: nextTexture }, [maskWidth, maskHeight]);
        maskTexture.destroy();
        maskTexture = nextTexture;
      }

      applyColors = function () {
        if (disposed || failed) return;
        var colors = themeColors();
        glowStrength = colors.glow || 0;
        setParam(20, parseColor(colors.color, "#929292").concat([1]));
        setParam(24, parseColor(colors.hover, "#ffffff").concat([glowStrength > 0 ? 1 : 0]));
        setParam(28, parseColor(colors.background, "#000000").concat([1]));
        device.queue.writeBuffer(compositeBuffer, 0, new Float32Array([2 * glowStrength, 0, 0, 0]));
        wakeRenderer();
      };

      function applySettings() {
        configureGrid();
        setParam(8, [cellPx, Math.min(1, Math.max(0.1, settings.dotSize)), SHAPE_MODES[settings.shapes] || 0, cols]);
        rebuildBindGroups();
        applyColors();
      }

      function resize() {
        if (disposed || failed) return;
        invalidateBounds();
        var size = measureSurface();
        canvas.width = size[0];
        canvas.height = size[1];
        if (sceneTexture) { sceneTexture.destroy(); glowA.destroy(); glowB.destroy(); }
        var half = glowSize(size);
        sceneTexture = createTexture(size, targetUsage, "shape-waves-scene");
        glowA = createTexture(half, targetUsage, "shape-waves-glow-a");
        glowB = createTexture(half, targetUsage, "shape-waves-glow-b");
        device.queue.writeBuffer(blurXBuffer, 0, new Float32Array([1 / half[0], 0, 4, 1]));
        device.queue.writeBuffer(blurYBuffer, 0, new Float32Array([0, 1 / half[1], 4, 0]));
        setParam(0, [size[0], size[1], 1 / size[0], 1 / size[1]]);
        drawMask();
        applySettings();
      }

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(root);
      visibilityObserver = new IntersectionObserver(function (entries) {
        visible = entries.some(function (entry) { return entry.isIntersecting; });
        if (visible) wakeRenderer();
      }, { threshold: 0 });
      visibilityObserver.observe(root);
      themeObserver = new MutationObserver(handleTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      systemDark.addEventListener("change", handleTheme);
      document.addEventListener("visibilitychange", handleWake);
      reduceMotion.addEventListener("change", handleWake);
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("scroll", invalidateBounds, { capture: true, passive: true });

      if (settings.intro && !reduceMotion.matches) introArmed = true;
      resize();
      if (settings.text.trim() && document.fonts && document.fonts.load) {
        document.fonts.load(settings.fontWeight + " 32px " + settings.fontFamily).then(function () {
          if (disposed || failed) return;
          drawMask();
          rebuildBindGroups();
          wakeRenderer();
        }).catch(function () {});
      }
    } catch (error) {
      fail(error);
    }
  })();
}
