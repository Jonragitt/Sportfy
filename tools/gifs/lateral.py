"""Silueta de perfil (mirando a la derecha) para el plano sagital."""
from base import Canvas, rot, lerp

GROUND = 462
PLUMB_X = 178


def standing(c, head=0.0, sh=0.0, pelvis=0.0, knee=0.0, kyph=0.0, arm=True):
    """head: adelanto de cabeza (px). sh: + antepulsión / - retropulsión.
    pelvis: grados (+ anteversión, - retroversión). knee: + flexo / - recurvatum."""
    drop = max(knee, 0) * 0.45                      # el flexo baja la cadera
    A = (176, 446)                                  # tobillo
    K = (182 + knee, 344 + drop * 0.25)
    Hp = (178 - max(-knee, 0) * 0.25, 248 + drop)
    Sx = 178 + sh
    Sh = (Sx, 122 + drop + abs(sh) * 0.1)
    kyph = kyph + max(sh, 0) * 0.9
    lord = pelvis * 0.9

    r = lambda p: rot(p, Hp, pelvis)
    # Pierna (detrás del tronco)
    c.limb((Hp[0] + 1, Hp[1] + 12), K, 32, 19)
    c.ellipse((K[0] + (A[0] - K[0]) * 0.33 - 8, K[1] + (A[1] - K[1]) * 0.33), 17, 36, angle=0)
    c.limb(K, A, 18, 11)
    c.blob([(A[0] - 15, GROUND - 3), (A[0] - 13, A[1] - 8), (A[0] + 10, A[1] - 5), (A[0] + 30, GROUND - 10),
            (A[0] + 50, GROUND - 4), (A[0] + 50, GROUND), (A[0] - 14, GROUND)])

    # Tronco
    torso = [
        (Sh[0] - 12, Sh[1] - 24),
        (Sh[0] - 33 - kyph, Sh[1] + 16),
        (Sh[0] - 31 - kyph * 0.4, Sh[1] + 58),
        (Hp[0] - 21 + lord, Hp[1] - 34),
        r((Hp[0] - 31, Hp[1] - 14)),
        r((Hp[0] - 37, Hp[1] + 16)),
        r((Hp[0] - 22, Hp[1] + 42)),
        r((Hp[0] + 16, Hp[1] + 38)),
        r((Hp[0] + 27, Hp[1] + 2)),
        (Hp[0] + 31 + lord * 0.35, Hp[1] - 40),
        (Sh[0] + 34 - max(sh, 0) * 0.5, Sh[1] + 60),
        (Sh[0] + 40 - max(sh, 0) * 0.4 + max(-sh, 0) * 0.5, Sh[1] + 26),
        (Sh[0] + 22, Sh[1] - 6),
        (Sh[0] + 9, Sh[1] - 24),
    ]
    c.blob(torso)

    # Cuello y cabeza
    Hc = (Sh[0] + 6 + head + max(sh, 0) * 0.3, Sh[1] - 56 + head * 0.12)
    c.limb((Sh[0] - 1, Sh[1] - 12), (Hc[0] - 4, Hc[1] + 22), 15, 13)
    c.ellipse(Hc, 25, 30)
    c.blob([(Hc[0] + 14, Hc[1] - 18), (Hc[0] + 22, Hc[1] - 5), (Hc[0] + 28, Hc[1] + 3), (Hc[0] + 22, Hc[1] + 7),
            (Hc[0] + 22, Hc[1] + 17), (Hc[0] + 16, Hc[1] + 27), (Hc[0] + 2, Hc[1] + 30), (Hc[0] + 4, Hc[1]) ])

    pel = (r((Hp[0] - 27, Hp[1] - 16)), r((Hp[0] + 25, Hp[1] - 16)))
    if not arm:
        return dict(ear=(Hc[0] - 4, Hc[1] + 2), shoulder=Sh, hip=Hp, knee=K, ankle=A, pelvis=pel)
    # Brazo (delante del tronco)
    Sj = (Sh[0] + 1, Sh[1] + 6)
    E = (Sj[0] + 2 + sh * 0.5, Sj[1] + 74)
    Wr = (E[0] + 7 + sh * 0.3, E[1] + 66)
    c.ellipse((Sj[0] + 1, Sj[1] + 10), 17, 22)
    c.limb(Sj, E, 15, 11)
    c.limb(E, Wr, 11, 8)
    c.ellipse((Wr[0] + 2, Wr[1] + 12), 7, 13)
    return dict(ear=(Hc[0] - 4, Hc[1] + 2), shoulder=Sh, hip=Hp, knee=K, ankle=A, pelvis=pel)


FULL = (180, 250, 0.95)      # cuerpo entero
UPPER = (185, 150, 1.75)     # cabeza y tronco, como el ejemplo


def scene(t, draw_fn, bad_text, plumb=True, side=None, view=FULL, title="Vista lateral", mirror=False):
    from base import labels
    c = Canvas(view, mirror)
    if plumb:
        c.plumb((PLUMB_X, 0), (PLUMB_X, GROUND))
    c.line((40, GROUND), (320, GROUND), (170, 170, 170), 2)
    draw_fn(c, t)
    labels(c, t, bad_text, side, title=title)
    return c.frame()
