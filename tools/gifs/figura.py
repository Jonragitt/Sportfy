"""Figuras de pie con la silueta anatómica (perfil y frente/espalda)."""
from base import rot
from anat import (seg, head_side, head_front, foot_side, leg_side, arm_side, torso_side,
                  THIGH_F, SHIN_F, UARM_F, FARM_F, HAND_F)

GROUND = 462
CX = 180


def standing(c, head=0.0, sh=0.0, pelvis=0.0, knee=0.0, kyph=0.0, arm=True):
    """De perfil mirando a la derecha. head: adelanto de cabeza (px). sh: + antepulsión / - retropulsión.
    pelvis: grados (+ anteversión). knee: + flexo / - recurvatum."""
    drop = max(knee, 0) * 0.45
    A = (176, 446)
    K = (182 + knee, 344 + drop * 0.25)
    Hp = (178 - max(-knee, 0) * 0.25, 248 + drop)
    Sh = (Hp[0], Hp[1] - 126)
    kyph = kyph + max(sh, 0) * 0.8
    leg_side(c, Hp, K, A, GROUND)
    t = torso_side(c, Hp, Sh, pelvis=pelvis, kyph=kyph, lord=pelvis * 0.5, chest=max(-sh, 0) * 0.35 - max(sh, 0) * 0.25,
                   belly=pelvis * 0.3)
    E = (Hp[0] + 2 + head + max(sh, 0) * 0.3, Sh[1] - 48 + head * 0.12)
    seg(c, (Hp[0] + 1 - kyph * 0.3, Sh[1] + 6), (E[0] + 3, E[1] + 14), [(-0.1, 18, 13), (0, 22, 15), (0.3, 17, 14), (0.65, 14.5, 12.5), (1.0, 14, 12), (1.15, 10, 9)], (1, 0))
    head_side(c, E)
    pel = (rot((Hp[0] - 27, Hp[1] - 16), Hp, pelvis), rot((Hp[0] + 25, Hp[1] - 16), Hp, pelvis))
    j = dict(ear=E, shoulder=(Hp[0] + sh, Sh[1]), hip=Hp, knee=K, ankle=A, pelvis=pel, torso=t)
    if arm:
        Sj = (Hp[0] + 1 + sh, Sh[1] + 8)
        El = (Sj[0] + 1 + sh * 0.4, Sj[1] + 72)
        Wr = (El[0] + 6 + sh * 0.25, El[1] + 64)
        arm_side(c, Sj, El, Wr)
    return j


def standing_front(c, sh_up=0.0, pelvis=0.0, knee_in=0.0, heel=0.0, scap=None, back=False, arms_out=0.0):
    """De frente (o de espaldas con back=True). sh_up: sube el hombro derecho de la figura (px).
    pelvis: grados (+ sube la cresta derecha). knee_in: + valgo / - varo. heel: + eversión / - inversión."""
    R = -1 if not back else 1
    Lf = -R
    sy = {R: -sh_up, Lf: 0}
    pc = (CX, 258)
    pr = lambda p: rot(p, pc, pelvis * (-R))
    hipj = {s: pr((CX + s * 25, 270)) for s in (R, Lf)}
    crest = {s: pr((CX + s * 42, 236)) for s in (R, Lf)}
    knee = {s: (CX + s * (22 - knee_in), 352) for s in (R, Lf)}
    ankle = {s: (CX + s * 21, 440) for s in (R, Lf)}
    for s in (R, Lf):
        seg(c, hipj[s], knee[s], THIGH_F, (s, 0))
        seg(c, knee[s], ankle[s], SHIN_F, (s, 0))
        A = ankle[s]
        if back:
            hb = (A[0] + s * heel, GROUND)
            seg(c, (A[0], A[1] - 14), hb, [(-0.1, 5, 5), (0.0, 7, 7), (0.5, 8, 8), (0.9, 9, 9), (1.0, 7, 7)], (s, 0))
        else:
            c.shape([(A[0] - s * 8, A[1] - 8), (A[0] + s * 8, A[1] - 8), (A[0] + s * 13, GROUND - 6), (A[0] + s * 13, GROUND - 1),
                     (A[0] + s * 3, GROUND), (A[0] - s * 10, GROUND - 1), (A[0] - s * 11, GROUND - 6)])
    # tronco en V: trapecio, dorsales, cintura, crestas y cadera
    half = lambda s: [(CX + s * 12, 100), (CX + s * 20, 99 + sy[s] * 0.3), (CX + s * 38, 106 + sy[s] * 0.8), (CX + s * 52, 113 + sy[s]), (CX + s * 59, 117 + sy[s]),
                      (CX + s * 63.5, 126 + sy[s]), (CX + s * 65, 137 + sy[s]), (CX + s * 60, 152 + sy[s] * 0.6), (CX + s * 47, 156 + sy[s] * 0.5),
                      (CX + s * 49, 174 + sy[s] * 0.3), (CX + s * 44, 198),
                      (CX + s * 39, 220), (crest[s][0] + s * 2, crest[s][1]), pr((CX + s * 47, 254)), pr((CX + s * 47, 276)), pr((CX + s * 36, 294)), pr((CX + s * 16, 302))]
    pts = half(R) + [pr((CX, 310))] + half(Lf)[::-1]
    c.shape(pts)
    sl = {s: (CX + s * 50, 116 + sy[s]) for s in (R, Lf)}
    for s in (R, Lf):
        Sj = (CX + s * 53, 132 + sy[s])
        E = (CX + s * (63 + arms_out), 200 + sy[s])
        Wr = (CX + s * (70 + arms_out * 1.4), 263 + sy[s])
        seg(c, Sj, E, UARM_F, (s, 0))
        seg(c, E, Wr, FARM_F, (s, 0))
        seg(c, Wr, (Wr[0] + s * 1, Wr[1] + 26), HAND_F, (s, 0))
    seg(c, (CX, 106), (CX, 78), [(-0.1, 15, 15), (0, 17, 17), (0.6, 14, 14), (1.0, 13.5, 13.5), (1.1, 10, 10)], (1, 0))
    head_front(c, (CX, 58))
    shade = (84, 84, 84)
    if back:
        c.line((CX, 100), (CX, 292), (78, 78, 78), 2)
        if scap is not None:
            for s in (R, Lf):
                x0 = CX + s * (18 + scap)
                c.shape([(x0, 132), (x0 + s * 30, 128), (x0 + s * 26, 140), (x0 + s * 6, 196), (x0 - s * 1, 170)], shade)
    return dict(sh=sl, crest=crest, knee=knee, ankle=ankle, R=R, L=Lf)
