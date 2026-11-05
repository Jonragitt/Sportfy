"""Silueta de frente / de espaldas para el plano frontal."""
from base import Canvas, rot, lerp, labels

GROUND = 462
CX = 180


def standing_front(c, sh_up=0.0, pelvis=0.0, knee_in=0.0, heel=0.0, scap=None, back=False, arms_out=0.0):
    """sh_up: el hombro derecho de la figura sube (px). pelvis: grados (+ cresta derecha sube).
    knee_in: + valgo / - varo (px). heel: + eversión / - inversión (px en la base del talón).
    scap: None o separación extra de escápulas (+ abducción / - aducción). back: vista posterior."""
    # En vista anterior el lado derecho de la figura está a la izquierda de la pantalla.
    R = -1 if not back else 1          # signo x del lado derecho de la figura
    Lft = -R
    sy = {R: -sh_up, Lft: 0}
    Hc = (CX, 60)
    pc = (CX, 258)
    hipj = {s: rot((CX + s * 24, 268), pc, pelvis * (-R)) for s in (R, Lft)}
    crest = {s: rot((CX + s * 44, 238), pc, pelvis * (-R)) for s in (R, Lft)}
    knee = {s: (CX + s * (22 - knee_in), 352) for s in (R, Lft)}
    ankle = {s: (CX + s * 22, 440) for s in (R, Lft)}

    # piernas
    for s in (R, Lft):
        c.limb(hipj[s], knee[s], 27, 16)
        c.ellipse(((knee[s][0] + ankle[s][0]) / 2 + s * 4, knee[s][1] + 30), 14, 32)
        c.limb(knee[s], ankle[s], 16, 10)
        if back:
            hb = (ankle[s][0] + s * heel, GROUND - 6)
            c.limb(ankle[s], hb, 10, 9)
            c.blob([(ankle[s][0] - 12, GROUND - 2), (ankle[s][0] + 12, GROUND - 2), (ankle[s][0] + 10, GROUND), (ankle[s][0] - 10, GROUND)])
        else:
            c.blob([(ankle[s][0] - 11, ankle[s][1] - 4), (ankle[s][0] + 11, ankle[s][1] - 4), (ankle[s][0] + s * 8 + 14 * s * 0.0 + 12, GROUND),
                    (ankle[s][0] - 12 + s * 0, GROUND)])
    # pelvis y tronco
    sl = {s: (CX + s * 58, 118 + sy[s]) for s in (R, Lft)}
    torso = [
        (CX + R * 14, 98 + sy[R] * 0.4), sl[R], (CX + R * 50, 150 + sy[R] * 0.5), (CX + R * 37, 222),
        crest[R], rot((CX + R * 46, 270), pc, pelvis * (-R)), rot((CX + R * 10, 300), pc, pelvis * (-R)),
        rot((CX + Lft * 10, 300), pc, pelvis * (-R)), rot((CX + Lft * 46, 270), pc, pelvis * (-R)), crest[Lft],
        (CX + Lft * 37, 222), (CX + Lft * 50, 150 + sy[Lft] * 0.5), sl[Lft], (CX + Lft * 14, 98 + sy[Lft] * 0.4),
    ]
    c.blob(torso)
    # brazos
    for s in (R, Lft):
        Sj = (CX + s * 56, 128 + sy[s])
        E = (CX + s * (66 + arms_out), 202 + sy[s])
        Wr = (CX + s * (70 + arms_out * 1.4), 266 + sy[s])
        c.ellipse((Sj[0] - s * 2, Sj[1] + 6), 16, 20)
        c.limb(Sj, E, 14, 10)
        c.limb(E, Wr, 10, 8)
        c.ellipse((Wr[0], Wr[1] + 12), 7, 13)
    # cuello y cabeza
    c.limb((CX, 108), (CX, 82), 15, 14)
    c.ellipse(Hc, 24, 30)
    for s in (R, Lft):
        c.ellipse((CX + s * 24, 64), 5, 9)    # orejas
    shade = (95, 95, 95)
    if scap is not None and back:
        for s in (R, Lft):
            x0 = CX + s * (22 + scap)
            c.poly([(x0, 140), (x0 + s * 30, 136), (x0 + s * 6, 196)], shade)
        c.line((CX, 104), (CX, 290), (70, 70, 70), 2)
    return dict(sh=sl, crest=crest, knee=knee, ankle=ankle, R=R, L=Lft)


def scene_front(t, fn, bad_text, view=None, side=None, title=None):
    c = Canvas(view)
    c.line((40, GROUND), (320, GROUND), (170, 170, 170), 2)
    fn(c, t)
    labels(c, t, bad_text, side, title=title)
    return c.frame()
