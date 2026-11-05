"""GIFs del plano frontal."""
import os
from base import BAD, lerp
from frente import standing_front, scene_front, CX

OUT = os.environ.get("OUT", "out")
UP = (180, 170, 1.3)
LEGS = (180, 375, 1.6)


def hline(c, a, b, t):
    col = tuple(int(235 + (BAD[i] - 235) * t) for i in range(3))
    c.line(a, b, col, 3)
    c.circle(a, 4, col); c.circle(b, 4, col)


def acromios(t):
    def d(c, t):
        j = standing_front(c, sh_up=11 * t)
        a, b = j["sh"][j["R"]], j["sh"][j["L"]]
        c.dashed((CX - 90, b[1]), (CX + 90, b[1]), (150, 150, 150), 5, 4, 1)
        hline(c, a, b, t)
        c.arrow((a[0] - 20, a[1] + 6), (a[0] - 20, a[1] - 22), alpha=t)
    return scene_front(t, d, "Acromios asimétricos", UP, title="Vista anterior")


def escapulas(sign, name):
    def f(t):
        def d(c, t):
            standing_front(c, scap=sign * 12 * t, back=True)
            for s in (-1, 1):
                x = CX + s * (40 + sign * 12 * t)
                c.arrow((x - s * sign * 4, 120), (x + s * sign * 18, 120), alpha=t)
        return scene_front(t, d, name, UP, title="Vista posterior")
    return f


def crestas(t):
    def d(c, t):
        j = standing_front(c, pelvis=7 * t)
        a, b = j["crest"][j["R"]], j["crest"][j["L"]]
        c.dashed((CX - 90, b[1]), (CX + 90, b[1]), (150, 150, 150), 5, 4, 1)
        hline(c, a, b, t)
    return scene_front(t, d, "Crestas ilíacas asimétricas", (180, 260, 1.3), title="Vista anterior")


def rodillas(sign, name):
    def f(t):
        def d(c, t):
            j = standing_front(c, knee_in=sign * 11 * t)
            for s in (-1, 1):
                k = j["knee"][s]
                c.ring(k, 15, alpha=t)
                c.arrow((k[0] + s * 34 * (1 if sign > 0 else 0.4), k[1] - 34), (k[0] + s * (10 if sign > 0 else 40), k[1] - 34), alpha=t)
        return scene_front(t, d, name, LEGS, title="Vista anterior")
    return f


def tobillo(sign, name):
    def f(t):
        def d(c, t):
            j = standing_front(c, heel=sign * 9 * t, back=True)
            for s in (-1, 1):
                a = j["ankle"][s]
                col = tuple(int(235 + (BAD[i] - 235) * t) for i in range(3))
                c.line((a[0], a[1] - 34), (a[0] + s * sign * 9 * t, 456), col, 3)
        return scene_front(t, d, name, (180, 405, 2.4), title="Vista posterior")
    return f


SPECS = {
    "acromionAsimetrico": acromios,
    "escapulasAbduccion": escapulas(1, "Escápulas en abducción"),
    "escapulasAduccion": escapulas(-1, "Escápulas en aducción"),
    "crestasAsimetricas": crestas,
    "genuValgo": rodillas(1, "Rodillas en valgo"),
    "genuVaro": rodillas(-1, "Rodillas en varo"),
    "tobilloEversion": tobillo(1, "Tobillos en eversión"),
    "tobilloInversion": tobillo(-1, "Tobillos en inversión"),
}

if __name__ == "__main__":
    import sys
    from base import save_gif
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for k, f in SPECS.items():
        if only and k not in only:
            continue
        save_gif(f"{OUT}/{k}.gif", f)
        print(k, os.path.getsize(f"{OUT}/{k}.gif") // 1024, "KB")
