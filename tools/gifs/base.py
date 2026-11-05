"""Utilidades para dibujar siluetas y montar GIFs de la evaluación postural de Forty5."""
import math
from PIL import Image, ImageDraw, ImageFont

S = 3                      # supermuestreo para suavizar bordes
W, H = 360, 520            # tamaño final del GIF
BG = (229, 229, 229)
FIG = (51, 51, 51)
LINE = (120, 120, 120)
OK = (31, 157, 85)
BAD = (228, 87, 46)
FONT = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FONT_R = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"


def lerp(a, b, t):
    return a + (b - a) * t


def ease(t):
    return t * t * (3 - 2 * t)


def P(x, y):
    return (x * S, y * S)


def rot(p, c, deg):
    a = math.radians(deg)
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def catmull(points, closed=True, steps=10):
    pts = list(points)
    n = len(pts)
    out = []
    rng = range(n) if closed else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if closed else pts[max(i - 1, 0)]
        p1 = pts[i]
        p2 = pts[(i + 1) % n] if closed else pts[min(i + 1, n - 1)]
        p3 = pts[(i + 2) % n] if closed else pts[min(i + 2, n - 1)]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            x = 0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x, y))
    if not closed:
        out.append(pts[-1])
    return out


class Canvas:
    """Dibuja en coordenadas de modelo; view=(cx, cy, zoom) encuadra la zona de interés."""

    def __init__(self, view=None, mirror=False):
        self.im = Image.new("RGB", (W * S, H * S), BG)
        self.d = ImageDraw.Draw(self.im)
        self.view = view
        self.mirror = mirror
        self.overlay = []      # líneas de referencia que se pintan encima de la silueta

    def T(self, x, y):
        if not self.view:
            X, Y = x * S, y * S
        else:
            cx, cy, z = self.view
            X, Y = ((x - cx) * z + W / 2) * S, ((y - cy) * z + 226) * S
        return ((W * S - X) if self.mirror else X, Y)

    def Z(self):
        return self.view[2] if self.view else 1

    def blob(self, pts, fill=FIG):
        self.d.polygon([self.T(*p) for p in catmull(pts)], fill=fill)

    def shape(self, pts, fill=FIG, edge=False):
        """Contorno suave (Catmull-Rom)."""
        q = [self.T(*p) for p in catmull(pts, steps=8)]
        if getattr(self, "_grp", None) is not None:
            self._grp.polygon(q, fill=255)
        else:
            self.d.polygon(q, fill=fill)

    def begin_group(self):
        """Las formas siguientes se unen en una sola pieza (un brazo, una pierna)."""
        self._mask = Image.new("L", self.im.size, 0)
        self._grp = ImageDraw.Draw(self._mask)

    def end_group(self, edge=True):
        """Pinta la pieza y, con edge, un filo claro en su contorno para separarla del cuerpo."""
        from PIL import ImageFilter
        from anat import EDGE
        m = self._mask
        self._grp = None
        self.im.paste(FIG, mask=m)
        if edge:
            inner = m.filter(ImageFilter.MinFilter(2 * S - 1 if S > 1 else 3))
            import numpy as np
            e = (np.asarray(m) > 127) & (np.asarray(inner) < 128)
            a = np.asarray(self.im).copy()
            a[e] = EDGE
            self.im = Image.fromarray(a)
            self.d = ImageDraw.Draw(self.im)

    def poly(self, pts, fill=FIG):
        self.d.polygon([self.T(*p) for p in pts], fill=fill)

    def circle(self, c, r, fill=FIG):
        (x0, y0), (x1, y1) = self.T(c[0] - r, c[1] - r), self.T(c[0] + r, c[1] + r)
        self.d.ellipse([min(x0, x1), y0, max(x0, x1), y1], fill=fill)

    def ellipse(self, c, rx, ry, fill=FIG, angle=0):
        pts = [rot((c[0] + rx * math.cos(a), c[1] + ry * math.sin(a)), c, angle) for a in [i * math.pi / 24 for i in range(48)]]
        self.poly(pts, fill)

    def limb(self, a, b, ra, rb, fill=FIG):
        """Cápsula con radios distintos en cada extremo."""
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        self.poly([(a[0] + nx * ra, a[1] + ny * ra), (b[0] + nx * rb, b[1] + ny * rb),
                   (b[0] - nx * rb, b[1] - ny * rb), (a[0] - nx * ra, a[1] - ny * ra)], fill)
        self.circle(a, ra, fill)
        self.circle(b, rb, fill)

    def dashed(self, a, b, color=LINE, dash=9, gap=7, width=2):
        dx, dy = b[0] - a[0], b[1] - a[1]
        L = math.hypot(dx, dy)
        n = int(L // (dash + gap)) + 1
        for i in range(n):
            s = i * (dash + gap) / L
            e = min((i * (dash + gap) + dash) / L, 1)
            self.d.line([self.T(a[0] + dx * s, a[1] + dy * s), self.T(a[0] + dx * e, a[1] + dy * e)], fill=color, width=width * S)

    def curve(self, pts, color=LINE, width=3):
        self.d.line([self.T(*p) for p in catmull(pts, closed=False)], fill=color, width=width * S, joint="curve")

    def line(self, a, b, color=LINE, width=2):
        self.d.line([self.T(*a), self.T(*b)], fill=color, width=width * S)

    def arrow(self, a, b, color=BAD, width=4, alpha=1.0):
        if alpha <= 0.02:
            return
        col = tuple(int(lerp(BG[i], color[i], alpha)) for i in range(3))
        self.line(a, b, col, width)
        ang = math.atan2(b[1] - a[1], b[0] - a[0])
        h = 11
        p1 = (b[0] - h * math.cos(ang - 0.5), b[1] - h * math.sin(ang - 0.5))
        p2 = (b[0] - h * math.cos(ang + 0.5), b[1] - h * math.sin(ang + 0.5))
        self.poly([b, p1, p2], col)

    def ring(self, c, r, color=BAD, alpha=1.0, width=3):
        if alpha <= 0.02:
            return
        col = tuple(int(lerp(BG[i], color[i], alpha)) for i in range(3))
        (x0, y0), (x1, y1) = self.T(c[0] - r, c[1] - r), self.T(c[0] + r, c[1] + r)
        self.d.ellipse([min(x0, x1), y0, max(x0, x1), y1], outline=col, width=width * S)

    def text(self, xy, s, size=20, color=FIG, bold=True, anchor="mm", alpha=1.0):
        if alpha <= 0.02:
            return
        col = tuple(int(lerp(BG[i], color[i], alpha)) for i in range(3))
        f = ImageFont.truetype(FONT if bold else FONT_R, size * S)
        self.d.text(P(*xy), s, font=f, fill=col, anchor=anchor)

    def plumb(self, a, b):
        """Línea de plomada discontinua: gris sobre el fondo y clara sobre la silueta."""
        self.overlay.append((a, b))

    def finish_overlay(self):
        if not self.overlay:
            return
        layer = Image.new("L", self.im.size, 0)
        ld = ImageDraw.Draw(layer)
        for a, b in self.overlay:
            dx, dy = b[0] - a[0], b[1] - a[1]
            L = math.hypot(dx, dy)
            step = 16 / self.Z()
            k = 0.0
            while k < L:
                e = min(k + 9 / self.Z(), L)
                ld.line([self.T(a[0] + dx * k / L, a[1] + dy * k / L), self.T(a[0] + dx * e / L, a[1] + dy * e / L)], fill=255, width=2 * S)
                k += step
        import numpy as np
        a = np.asarray(self.im).copy()
        m = np.asarray(layer) > 0
        m[456 * S:, :] = False
        dark = a[..., 0] < 120
        a[m & dark] = (235, 235, 235)
        a[m & ~dark] = (110, 110, 110)
        self.im = Image.fromarray(a)
        self.d = ImageDraw.Draw(self.im)

    def frame(self):
        self.finish_overlay()
        return self.im.resize((W, H), Image.LANCZOS)


def labels(c, t, bad_text, side=None, ok_text="Correcto", title=None, bad_color=BAD):
    """Banda inferior: vista y lado arriba; 'Correcto' se funde con el nombre de la alteración."""
    c.d.rectangle([0, 456 * S, W * S, H * S], fill=BG)
    c.d.line([(24 * S, 456 * S), ((W - 24) * S, 456 * S)], fill=(205, 205, 205), width=S)
    sub = " · ".join(x for x in [title, f"Lado {side}" if side else None] if x)
    if sub:
        c.text((W / 2, 473), sub, 13, (105, 105, 105), bold=False)
    y = 499 if sub else 488
    if t < 0.5:
        c.text((W / 2, y), ok_text, 21, OK, alpha=1 - 2 * t)
    else:
        c.text((W / 2, y), bad_text, 21 if len(bad_text) < 24 else 17, bad_color, alpha=2 * t - 1)


def timeline(fps=12, hold0=0.8, go=1.1, hold1=1.3, back=0.8):
    ts = []
    for n, f in [(hold0, lambda u: 0), (go, ease), (hold1, lambda u: 1), (back, lambda u: 1 - ease(u))]:
        k = max(1, round(n * fps))
        ts += [f(i / k) for i in range(k)]
    return ts, int(1000 / fps)


def save_gif(path, draw, fps=12):
    ts, dur = timeline(fps)
    frames = [draw(t) for t in ts]
    pal = frames[len(frames) // 2].quantize(colors=32, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    q[0].save(path, save_all=True, append_images=q[1:], duration=dur, loop=0, optimize=True, disposal=1)
