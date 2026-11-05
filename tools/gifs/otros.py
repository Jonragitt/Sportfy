"""GIFs del puente a una pierna (SLB), wall angel y lunge test, lado izquierdo y derecho."""
import math, os
from base import Canvas, labels, save_gif, lerp, BAD, OK, FIG, BG
from lateral import standing

OUT = os.environ.get("OUT", "out")
G = 462
SIDE = {"I": "izquierdo", "D": "derecho"}


def bridge(c, hip_drop=0.0, lumbar=0.0, low=0.0):
    """Puente a una pierna de perfil: cabeza a la izquierda, pierna de apoyo flexionada."""
    Sh = (96, 432)
    Hp = (212, 366 + low + hip_drop * 0.5)
    F = (300 + low * 0.8, 450)
    K = (272 + low * 0.3, 352 + low * 0.2)
    # pierna estirada en línea con el muslo de apoyo
    d = (K[0] - Hp[0], K[1] - Hp[1]); L = math.hypot(*d); u = (d[0] / L, d[1] / L)
    Ext = (Hp[0] + u[0] * 178, Hp[1] + u[1] * 178 + hip_drop * 1.2)
    c.limb(Hp, (Hp[0] + u[0] * 100, Hp[1] + u[1] * 100 + hip_drop * 0.6), 26, 17)
    c.limb((Hp[0] + u[0] * 100, Hp[1] + u[1] * 100 + hip_drop * 0.6), Ext, 16, 10)
    c.ellipse((Ext[0] + 8, Ext[1] - 6), 8, 16, angle=-30)
    # pierna de apoyo
    c.limb(Hp, K, 30, 18)
    c.limb(K, (F[0], F[1] - 12), 17, 10)
    c.ellipse((F[0] + 16, G - 6), 26, 7)
    # tronco: de los hombros (en el suelo) a la cadera elevada
    mid = ((Sh[0] + Hp[0]) / 2, (Sh[1] + Hp[1]) / 2 - lumbar)
    c.blob([(Sh[0] - 10, G - 2), (Sh[0] - 14, Sh[1] - 26), (mid[0], mid[1] - 34), (Hp[0] + 8, Hp[1] - 30),
            (Hp[0] + 26, Hp[1] + 6), (Hp[0] - 8, Hp[1] + 30), (mid[0], mid[1] + 24 + lumbar * 0.6), (Sh[0] + 30, G - 2)])
    c.ellipse((46, 436), 26, 22)                       # cabeza apoyada
    c.blob([(Sh[0] + 6, Sh[1] - 22), (Sh[0] + 56, Sh[1] - 44), (Sh[0] + 66, Sh[1] - 34), (Sh[0] + 20, Sh[1] - 8)])  # brazos cruzados
    c.curve([(Sh[0] + 6, Sh[1] - 4), (mid[0], mid[1] - 2 - lumbar * 0.6), (Hp[0] - 6, Hp[1] - 4)], (150, 150, 150), 3)
    return dict(Hp=Hp, K=K, mid=mid, Sh=Sh)


def pelvis_inset(c, t, kind):
    """Recuadro en pantalla (arriba a la derecha): la pelvis vista desde los pies."""
    from base import S, BG
    d = c.d
    x0, y0, w, h = 206, 28, 136, 104
    d.rounded_rectangle([x0 * S, y0 * S, (x0 + w) * S, (y0 + h) * S], radius=16 * S, fill=(212, 212, 212))
    cx, cy = x0 + w / 2, y0 + 52
    if kind == "drop":
        a, b = (cx - 40, cy), (cx + 40, cy + 20 * t)
    else:
        a, b = (cx - 40 + 12 * t, cy - 12 * t), (cx + 40 - 12 * t, cy + 12 * t)
    for k in range(0, 92, 10):
        d.line([((cx - 46 + k) * S, cy * S), ((cx - 41 + k) * S, cy * S)], fill=(150, 150, 150), width=S)
    col = tuple(int(FIG[i] + (BAD[i] - FIG[i]) * t) for i in range(3))
    d.line([(a[0] * S, a[1] * S), (b[0] * S, b[1] * S)], fill=col, width=5 * S)
    for p in (a, b):
        d.ellipse([(p[0] - 7) * S, (p[1] - 7) * S, (p[0] + 7) * S, (p[1] + 7) * S], fill=col)
    c.text((cx, y0 + 88), "Pelvis vista desde los pies", 10, (90, 90, 90), bold=False)


def slb_gif(name, sk, kind):
    def f(t):
        c = Canvas((196, 318, 0.86), mirror=(sk == "I"))
        c.line((10, G), (350, G), (170, 170, 170), 2)
        if kind in ("drop", "rot"):
            j = bridge(c, hip_drop=(14 if kind == "drop" else 6) * t)
            pelvis_inset(c, t, kind)
            c.ring(j["Hp"], 26, alpha=t)
        elif kind == "lumbar":
            j = bridge(c, lumbar=16 * t)
            c.ring(j["mid"], 30, alpha=t)
        else:
            j = bridge(c, low=26 * t)
            c.ring(((j["Hp"][0] + j["K"][0]) / 2, (j["Hp"][1] + j["K"][1]) / 2 + 22), 22, alpha=t)
            c.arrow((j["Hp"][0], 300), (j["Hp"][0], 330), alpha=t)
        labels(c, t, name, SIDE[sk], title="Pierna de apoyo · vista lateral")
        return c.frame()
    return f


def wall_gif(name, sk, kind):
    def f(t):
        c = Canvas((180, 210, 1.15), mirror=(sk == "I"))
        c.d.rectangle([*c.T(118, 0)[0:1], 0, *c.T(132, 0)[0:1], 470 * 3], fill=(190, 190, 190)) if not c.mirror else None
        wx = 132
        # pared
        xa, xb = sorted([c.T(112, 0)[0], c.T(wx, 0)[0]])
        c.d.rectangle([xa, 0, xb, 456 * 3], fill=(196, 196, 196))
        j = standing(c, pelvis=(14 * t if kind == "comp" else 0), kyph=(-4 * t if kind == "comp" else 0), arm=False)
        Sh = j["shoulder"]
        off = 30 * t if kind == "noapoya" else 0
        Sj = (Sh[0] - 8, Sh[1] + 4)
        E = (wx + 12 + off * 0.7, Sh[1] + 6)
        Wr = (wx + 12 + off, Sh[1] - 66)
        c.limb(Sj, E, 15, 11)
        c.limb(E, Wr, 11, 8)
        c.ellipse((Wr[0], Wr[1] - 12), 7, 13)
        if kind == "noapoya":
            c.ring(Wr, 18, alpha=t)
            c.arrow((wx + 6, Sh[1] - 100), (wx + 40, Sh[1] - 100), alpha=t)
        else:
            c.ring((j["hip"][0] - 24, j["hip"][1] - 46), 22, alpha=t)
        labels(c, t, name, SIDE[sk], title="Vista lateral")
        return c.frame()
    return f


def lunge(c, k, heel=0.0):
    """Lunge frente a la pared. k: 0 rodilla sobre el tobillo, 1 rodilla en la pared."""
    wall = 300
    A = (214, 446 - heel * 0.5)
    K = (lerp(214, wall - 17, k), lerp(352, 372, k))
    Hp = (lerp(160, 176, k), lerp(272, 300, k))
    Sh = (Hp[0] + 6, Hp[1] - 128)
    # pierna de atrás
    c.limb(Hp, (110, 372), 28, 17)
    c.limb((110, 372), (70, 446), 17, 10)
    c.ellipse((82, G - 6), 18, 7, angle=-20)
    # pie delantero
    c.blob([(A[0] - 16, G - 2 - heel), (A[0] - 12, A[1] - 8), (A[0] + 10, A[1] - 6), (A[0] + 30, G - 10), (A[0] + 48, G - 4), (A[0] + 48, G), (A[0] - 6, G - heel * 0.2)])
    c.limb(K, A, 18, 11)
    c.limb(Hp, K, 30, 19)
    c.blob([(Hp[0] - 34, Hp[1] + 14), (Hp[0] - 30, Hp[1] - 40), (Sh[0] - 30, Sh[1] + 40), (Sh[0] - 24, Sh[1]), (Sh[0] - 6, Sh[1] - 20),
            (Sh[0] + 16, Sh[1] - 18), (Sh[0] + 34, Sh[1] + 22), (Sh[0] + 28, Sh[1] + 70), (Hp[0] + 28, Hp[1] - 20), (Hp[0] + 22, Hp[1] + 20)])
    Hc = (Sh[0] + 6, Sh[1] - 50)
    c.limb((Sh[0], Sh[1] - 10), (Hc[0] - 2, Hc[1] + 20), 14, 12)
    c.ellipse(Hc, 24, 29)
    c.blob([(Hc[0] + 14, Hc[1] - 16), (Hc[0] + 28, Hc[1] + 2), (Hc[0] + 20, Hc[1] + 8), (Hc[0] + 18, Hc[1] + 22), (Hc[0] + 4, Hc[1] + 28), (Hc[0] + 4, Hc[1])])
    c.limb((Sh[0] + 2, Sh[1] + 8), (Sh[0] + 40, Sh[1] + 60), 13, 10)          # brazo hacia la pared
    c.limb((Sh[0] + 40, Sh[1] + 60), (wall - 8, Sh[1] + 40), 10, 8)
    return dict(A=A, K=K, wall=wall)


def lunge_gif(sk, positive):
    def f(t):
        c = Canvas((190, 262, 0.98), mirror=(sk == "I"))
        c.line((10, G), (350, G), (170, 170, 170), 2)
        xa, xb = sorted([c.T(300, 0)[0], c.T(322, 0)[0]])
        c.d.rectangle([xa, 0, xb, 456 * 3], fill=(196, 196, 196))
        k = t * (0.62 if positive else 1.0)
        heel = 12 * max(0, t - 0.45) / 0.55 if positive else 0
        j = lunge(c, k, heel)
        # cota de 10 cm entre el dedo gordo y la pared
        c.line((262, G + 8), (300, G + 8), (110, 110, 110), 2)
        c.text((c.T(281, 0)[0] / 3, 446), "10 cm", 12, (90, 90, 90), bold=False)
        if positive:
            c.ring(j["K"], 22, alpha=t)
            if heel > 1:
                c.arrow((j["A"][0] - 14, G - 2), (j["A"][0] - 14, G - 26), alpha=min(1, heel / 8))
            labels(c, t, "Positivo: no llega a la pared", SIDE[sk], ok_text="Inicio", title="Lunge test · vista lateral")
        else:
            c.ring((j["wall"] - 2, j["K"][1]), 20, OK, alpha=t)
            labels(c, t, "Negativo: toca la pared", SIDE[sk], ok_text="Inicio", title="Lunge test · vista lateral", bad_color=OK)
        return c.frame()
    return f


SPECS = {}
for sk in ("I", "D"):
    SPECS[f"slbCaidaPelvis-{sk}"] = slb_gif("Caída de la pelvis", sk, "drop")
    SPECS[f"slbRotacion-{sk}"] = slb_gif("Rotación de la pelvis", sk, "rot")
    SPECS[f"slbLumbar-{sk}"] = slb_gif("Compensación lumbar", sk, "lumbar")
    SPECS[f"slbIsquios-{sk}"] = slb_gif("Dominancia de isquiotibiales", sk, "isquios")
    SPECS[f"waNoApoya-{sk}"] = wall_gif("No apoya codo / mano", sk, "noapoya")
    SPECS[f"waCompensacion-{sk}"] = wall_gif("Compensación lumbar / dorsal", sk, "comp")
    SPECS[f"lungePositivo-{sk}"] = lunge_gif(sk, True)
    SPECS[f"lungeNegativo-{sk}"] = lunge_gif(sk, False)

if __name__ == "__main__":
    import sys
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for k, f in SPECS.items():
        if only and not any(k.startswith(o) for o in only):
            continue
        save_gif(f"{OUT}/{k}.gif", f)
        print(k, os.path.getsize(f"{OUT}/{k}.gif") // 1024, "KB")
