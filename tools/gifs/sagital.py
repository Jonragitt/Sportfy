"""GIFs del plano sagital."""
import os
from base import Canvas, labels, save_gif, lerp, BAD, FIG, BG
from lateral import standing, scene, FULL, UPPER, GROUND

OUT = os.environ.get("OUT", "out")
MID = (180, 240, 1.2)
LOW = (180, 360, 1.55)


def cabeza(t):
    def d(c, t):
        j = standing(c, head=28 * t)
        c.ring(j["ear"], 8, alpha=t)
        c.arrow((178, j["ear"][1] - 46), (j["ear"][0] + 8, j["ear"][1] - 46), alpha=t)
    return scene(t, d, "Cabeza anteriorizada", view=UPPER)


def hombro(sign, name):
    def f(t):
        def d(c, t):
            j = standing(c, sh=sign * 15 * t, head=sign * 6 * t if sign > 0 else 0)
            s = j["shoulder"]
            c.ring((s[0] + 1, s[1] + 10), 15, alpha=t)
            y = s[1] - 2
            c.arrow((s[0] - sign * 10 + 40, y - 30) if False else (178, y - 34), (178 + sign * 26, y - 34), alpha=t)
        return scene(t, d, name, view=UPPER)
    return f


def cadera(sign, name):
    def f(t):
        def d(c, t):
            j = standing(c, pelvis=sign * 18 * t, arm=False)
            h = j["hip"]
            a, b = j["pelvis"]
            # línea de la pelvis (espina ilíaca posterior → anterior) y referencia horizontal
            c.dashed((a[0] - 14, h[1] - 16), (b[0] + 14, h[1] - 16), (150, 150, 150), 5, 4, 1)
            col = tuple(int(235 + (BAD[i] - 235) * t) for i in range(3))
            c.line(a, b, col, 4)
            c.circle(a, 4, col); c.circle(b, 4, col)
            c.arrow((h[0] + 54, h[1] - 34 * sign), (h[0] + 54, h[1] + 2 * sign), alpha=t)
            c.arrow((h[0] - 60, h[1] + 2 * sign), (h[0] - 60, h[1] - 34 * sign), alpha=t)
        return scene(t, d, name, view=MID)
    return f


def rodilla(knee, name):
    def f(t):
        def d(c, t):
            j = standing(c, knee=knee * t)
            k = j["knee"]
            c.ring(k, 20, alpha=t)
            c.arrow((k[0] - 44 * (1 if knee < 0 else -1) * -1 if False else k[0] + (30 if knee < 0 else -34), k[1]),
                    (k[0] + (8 if knee < 0 else -10) * -1 + (0), k[1]) if False else (k[0] + (34 if knee < 0 else -34), k[1]), alpha=0)
            dx = 1 if knee > 0 else -1
            c.arrow((k[0] - dx * 4 + dx * 30, k[1] - 40), (k[0] + dx * 52, k[1] - 40), alpha=t)
        return scene(t, d, name, view=LOW)
    return f


def navicular(t):
    """Vista medial del pie: el arco y el navicular bajan al cargar."""
    c = Canvas((180, 300, 1.9))
    g = 380
    arch = lerp(26, 7, t)
    nav_y = g - 18 - arch
    # pierna
    c.limb((150, 232), (150, g - 52), 22, 15)
    pts = [(120, g - 30), (128, g - 52), (160, g - 62), (196, g - 48 + (26 - arch) * 0.2), (232, g - 28), (262, g - 14),
           (270, g - 4), (262, g), (232, g), (214, g - 3), (190, g - arch), (160, g - arch * 0.9), (138, g - 2), (122, g - 4)]
    c.blob(pts)
    c.line((90, g), (290, g), (150, 150, 150), 2)
    c.circle((180, nav_y), 5, BAD)
    c.dashed((150, g - 18 - 26), (230, g - 18 - 26), (110, 110, 110), 5, 4, 1)
    if t > 0.05:
        c.line((236, g - 44), (236, nav_y), BAD, 2)
        c.line((230, g - 44), (242, g - 44), BAD, 2)
        c.line((230, nav_y), (242, nav_y), BAD, 2)
    c.text((290, (g - 44 + nav_y) / 2 * 1.9 - 300 * 1.9 + 232), f"{round(lerp(0, 14, t))} mm" if t > 0.05 else "", 15, BAD) if False else None
    labels(c, t, "Caída del arco plantar", title="Navicular drop · vista medial")
    c.text((180, 40), f"Descenso del navicular: {round(lerp(3, 14, t))} mm", 15, BAD if t > 0.5 else FIG)
    return c.frame()


SPECS = {
    "cabezaAnteriorizada": cabeza,
    "hombrosAntepulsion": hombro(1, "Hombros en antepulsión"),
    "hombrosRetropulsion": hombro(-1, "Hombros en retropulsión"),
    "caderaAnteversion": cadera(1, "Anteversión pélvica"),
    "caderaRetroversion": cadera(-1, "Retroversión pélvica"),
    "genuRecurvatum": rodilla(-14, "Genu recurvatum"),
    "genuFlexo": rodilla(18, "Genu flexo"),
    "navicularDrop": navicular,
}

if __name__ == "__main__":
    import sys
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for k, f in SPECS.items():
        if only and k not in only:
            continue
        save_gif(f"{OUT}/{k}.gif", f)
        print(k, os.path.getsize(f"{OUT}/{k}.gif") // 1024, "KB")
