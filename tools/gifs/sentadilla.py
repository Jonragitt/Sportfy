"""GIFs de la sentadilla profunda (SOH), lado izquierdo y derecho."""
import math, os
from base import Canvas, labels, save_gif, lerp, BAD, rot

OUT = os.environ.get("OUT", "out")
G = 462
SIDES = {"I": ("izquierdo", 1), "D": ("derecho", -1)}   # signo x en vista anterior (derecha de la figura = izquierda de pantalla)


def v(a, b, k=1.0):
    return (a[0] + b[0] * k, a[1] + b[1] * k)


def squat_side(c, lean=40, lord=0.0, wink=0.0, heel=0.0):
    """Sentadilla de perfil mirando a la derecha. lean: inclinación del tronco (°)."""
    A = (150, 440 - heel * 0.6)
    sa = math.radians(38)
    K = (A[0] + 104 * math.sin(sa), A[1] - 104 * math.cos(sa))
    ta = math.radians(10)
    Hp = (K[0] - 106 * math.cos(ta), K[1] + 106 * math.sin(ta))
    tr = math.radians(lean - wink * 0.4)
    u = (math.sin(tr), -math.cos(tr))
    nb = (-math.cos(tr), -math.sin(tr))     # hacia la espalda
    nf = (-nb[0], -nb[1])
    Sh = v(Hp, u, 130)
    ax = lambda f: v(Hp, u, 130 * f)
    # pie
    c.blob([(A[0] - 16, G - 2 - heel), (A[0] - 12, A[1] - 8), (A[0] + 10, A[1] - 6), (A[0] + 34, G - 10), (A[0] + 52, G - 4), (A[0] + 52, G), (A[0] - 6, G - heel * 0.2)])
    c.limb(K, A, 18, 11)
    c.ellipse(v(K, (A[0] - K[0], A[1] - K[1]), 0.35), 16, 34, angle=-38)
    c.limb(Hp, K, 32, 19)
    back = [
        v(v(Hp, u, -18 + wink * 0.6), nb, 30 - wink * 0.5),          # glúteo
        v(ax(0.05), nb, 37 + lord * 0.6 - wink * 0.7),
        v(ax(0.36), nb, 24 - lord + wink * 0.9),                      # lumbar
        v(ax(0.72), nb, 33),
        v(ax(1.0), nb, 20),
    ]
    front = [
        v(ax(1.02), nf, 16),
        v(ax(0.76), nf, 34),
        v(ax(0.3), nf, 30),
        v(ax(0.02), nf, 22),
    ]
    c.blob(back + front)
    spine = [v(v(Hp, u, -4 + wink * 0.4), nb, 16 - wink * 0.4), v(ax(0.36), nb, 13 - lord * 0.9 + wink * 0.8), v(ax(0.72), nb, 20), v(ax(0.98), nb, 11)]
    # cabeza y brazos por encima de la cabeza
    Hc = v(v(Sh, u, 42), nf, 8)
    c.limb(Sh, v(Hc, u, -18), 15, 13)
    c.ellipse(Hc, 25, 30, angle=math.degrees(tr) * 0.5)
    c.blob([v(Hc, (22, -8)), v(Hc, (30, 2)), v(Hc, (22, 8)), v(Hc, (20, 22)), v(Hc, (6, 28)), v(Hc, (6, 0))])
    arm_dir = (math.sin(tr * 0.72), -math.cos(tr * 0.72))
    E = v(Sh, arm_dir, 70)
    Wr = v(E, arm_dir, 66)
    c.ellipse(Sh, 17, 20)
    c.limb(Sh, E, 14, 10)
    c.limb(E, Wr, 10, 8)
    c.ellipse(v(Wr, arm_dir, 12), 7, 13, angle=math.degrees(tr))
    c.curve(spine, (150, 150, 150), 3)
    return dict(A=A, K=K, Hp=Hp, Sh=Sh, lumbar=v(ax(0.36), nb, 24 - lord + wink * 0.9), u=u, nb=nb, Wr=Wr)


def squat_front(c, side=1, rotf=0.0, arch=0.0, cavo=0.0, shift=0.0, knee_in=0.0):
    """Sentadilla de frente. Solo el lado `side` (+1 pantalla derecha) muestra la alteración."""
    CX = 180 + shift * side
    pts = {}
    for s in (-1, 1):
        on = s == side
        A = (180 + s * 44 + (-s * arch * 6 + s * cavo * 5 if on else 0), 440)
        Kx = 180 + s * 54 - (s * knee_in if on else 0) + (shift * side * 0.3)
        K = (Kx, 362)
        Hp = (CX + s * 30, 366 - (6 if on and shift else 0))
        pts[s] = (A, K, Hp)
        # pie: elipse que mira al frente y gira hacia fuera
        ang = (rotf * 40 if on else 0) * s
        c.ellipse((A[0] + s * (rotf * 10 if on else 0), G - 7), 13 + (rotf * 9 if on else 0), 9, angle=ang * 0.4)
        c.limb(K, A, 17, 10)
        c.ellipse(((K[0] + A[0]) / 2 + s * 5, K[1] + 32), 14, 30)
        c.limb(Hp, K, 30, 22)
    # tronco acortado por la inclinación
    torso = [(CX - 40, 380), (CX - 46, 340), (CX - 52, 270), (CX - 58, 248), (CX - 16, 236), (CX + 16, 236), (CX + 58, 248), (CX + 52, 270), (CX + 46, 340), (CX + 40, 380), (CX, 392)]
    c.blob(torso)
    for s in (-1, 1):
        Sj = (CX + s * 56, 252)
        E = (CX + s * 66, 176)
        Wr = (CX + s * 64, 106)
        c.ellipse(Sj, 17, 19)
        c.limb(Sj, E, 14, 10)
        c.limb(E, Wr, 10, 8)
        c.ellipse((Wr[0], Wr[1] - 12), 7, 13)
    c.limb((CX, 240), (CX, 222), 15, 14)
    c.ellipse((CX, 200), 24, 29)
    return pts


def front_gif(key, name, side_key, **dev):
    side_name, sgn = SIDES[side_key]

    def f(t):
        c = Canvas((180, 290, 1.12))
        c.line((40, G), (320, G), (170, 170, 170), 2)
        kw = {k: val * t for k, val in dev.items()}
        pts = squat_front(c, side=sgn, **kw)
        A, K, Hp = pts[sgn]
        if "knee_in" in dev:
            c.ring(K, 20, alpha=t)
            d = 1 if dev["knee_in"] > 0 else -1
            c.arrow((K[0] + sgn * d * 46, K[1] - 36), (K[0] + sgn * d * 14, K[1] - 36), alpha=t)
        elif "shift" in dev:
            c.arrow((180, 300), (180 + sgn * 40, 300), alpha=t)
        else:
            c.ring((A[0], G - 10), 22, alpha=t)
        labels(c, t, name, side_name, title="Vista anterior")
        return c.frame()
    return f


def side_gif(name, side_key, **dev):
    side_name, sgn = SIDES[side_key]

    def f(t):
        c = Canvas((180, 285, 1.05), mirror=(side_key == "I"))
        c.line((20, G), (340, G), (170, 170, 170), 2)
        kw = {k: (lerp(40, val, t) if k == "lean" else val * t) for k, val in dev.items()}
        j = squat_side(c, **kw)
        if "lean" in dev:
            c.arrow(v(j["Sh"], j["u"], 60), (v(j["Sh"], j["u"], 60)[0] + 34, v(j["Sh"], j["u"], 60)[1] + 18), alpha=t)
            c.dashed(j["A"], (j["A"][0], 60), (150, 150, 150), 5, 4, 1)
        else:
            c.ring(j["lumbar"], 24, alpha=t)
        labels(c, t, name, side_name, title="Vista lateral")
        return c.frame()
    return f


SPECS = {}
for sk in ("I", "D"):
    SPECS[f"sohPiesRotan-{sk}"] = front_gif("rot", "Pie rota hacia fuera", sk, rotf=1.0)
    SPECS[f"sohArcoCae-{sk}"] = front_gif("arch", "Caída del arco plantar", sk, arch=1.0, knee_in=6)
    SPECS[f"sohPieCavo-{sk}"] = front_gif("cavo", "Pie cavo", sk, cavo=1.0)
    SPECS[f"sohCargaAsimetrica-{sk}"] = front_gif("shift", "Carga asimétrica", sk, shift=22)
    SPECS[f"sohValgo-{sk}"] = front_gif("valgo", "Rodilla en valgo", sk, knee_in=28)
    SPECS[f"sohVaro-{sk}"] = front_gif("varo", "Rodilla en varo", sk, knee_in=-22)
    SPECS[f"sohInclinacion-{sk}"] = side_gif("Inclinación anterior excesiva", sk, lean=58)
    SPECS[f"sohHiperlordosis-{sk}"] = side_gif("Hiperlordosis lumbar", sk, lord=16)
    SPECS[f"sohRetroversion-{sk}"] = side_gif("Retroversión pélvica precoz", sk, wink=18)

if __name__ == "__main__":
    import sys
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    for k, f in SPECS.items():
        if only and not any(k.startswith(o) for o in only):
            continue
        save_gif(f"{OUT}/{k}.gif", f)
        print(k, os.path.getsize(f"{OUT}/{k}.gif") // 1024, "KB")
