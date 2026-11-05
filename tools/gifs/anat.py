"""Silueta anatómica: cada segmento lleva un perfil de anchuras (músculo delante/detrás)
en lugar de cápsulas, y la cabeza, manos y pies tienen forma propia."""
import math
from base import FIG, rot

EDGE = (88, 88, 88)        # filo claro que separa un miembro de lo que tiene detrás


def _u(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dy) or 1
    return (dx / L, dy / L), L


def seg(c, a, b, prof, fdir, edge=False):  # edge se ignora: el filo lo pone end_group
    """prof: [(t, ancho_atrás, ancho_delante)] a lo largo de a→b; fdir indica dónde está 'delante'."""
    u, L = _u(a, b)
    n = (-u[1], u[0])
    if n[0] * fdir[0] + n[1] * fdir[1] < 0:
        n = (-n[0], -n[1])
    front = [(a[0] + u[0] * t * L + n[0] * wf, a[1] + u[1] * t * L + n[1] * wf) for t, wb, wf in prof]
    back = [(a[0] + u[0] * t * L - n[0] * wb, a[1] + u[1] * t * L - n[1] * wb) for t, wb, wf in prof]
    c.shape(front + back[::-1], edge=edge)


# Perfiles de perfil (lateral): (t, detrás, delante)
THIGH = [(-0.1, 10, 12), (0.0, 23, 25), (0.16, 24, 27), (0.42, 22, 25), (0.7, 18, 20), (0.88, 14, 15.5), (1.0, 13, 14), (1.08, 8, 9)]
SHIN = [(-0.07, 8, 9), (0.0, 13, 13), (0.12, 18, 11), (0.27, 21, 10.5), (0.45, 17, 9), (0.66, 11.5, 8), (0.86, 8, 6.5), (1.0, 7.5, 7.5), (1.07, 4, 4)]
UARM = [(-0.16, 10, 11), (0.0, 16, 16), (0.15, 14, 13.5), (0.4, 13, 12.5), (0.66, 11, 10), (0.9, 8.5, 8), (1.0, 8, 8), (1.08, 5, 5)]
FARM = [(-0.07, 6, 7), (0.0, 8, 8), (0.2, 10, 9.5), (0.45, 8.5, 7.5), (0.8, 6, 5.5), (1.0, 5, 4.5), (1.05, 3, 3)]
HAND = [(-0.05, 4, 4), (0.25, 5.5, 5), (0.65, 5, 4.5), (0.92, 3.5, 2.5), (1.0, 1, 1)]
NECK = [(-0.12, 12, 11), (0.0, 14, 13), (0.5, 11.5, 11), (1.0, 11, 11), (1.12, 8, 8)]
# De frente: (t, interior, exterior)
THIGH_F = [(-0.12, 18, 14), (0.0, 23, 22), (0.12, 23.5, 25), (0.3, 21, 26), (0.5, 18.5, 24.5), (0.72, 15.5, 21), (0.9, 13.5, 15.5), (1.0, 12.5, 14), (1.08, 8, 9)]
SHIN_F = [(-0.06, 10, 10), (0.0, 13, 13), (0.15, 16.5, 15.5), (0.3, 17, 15), (0.5, 13.5, 11.5), (0.75, 9, 8), (0.95, 7.5, 7.5), (1.05, 4, 4)]
UARM_F = [(-0.14, 9, 12), (0.0, 13, 18), (0.12, 12, 17), (0.3, 11, 13), (0.55, 11, 12), (0.85, 9, 9), (1.0, 8, 8), (1.08, 5, 5)]
FARM_F = [(-0.06, 6, 7), (0.0, 8, 8.5), (0.2, 9, 10.5), (0.5, 8, 8), (0.85, 5.5, 5.5), (1.0, 5, 5), (1.05, 3, 3)]
HAND_F = [(-0.05, 4.5, 4.5), (0.3, 5.5, 6), (0.7, 5, 5), (0.94, 3, 3), (1.0, 1, 1)]


def head_side(c, E, ang=0.0, k=1.04):
    """Cabeza de perfil mirando a la derecha; E = centro de la oreja."""
    pts = [(2, -31), (12, -28.5), (19, -21), (22, -12), (21, -8), (23.5, -5), (29, 5), (25, 9), (25, 12.5), (24.5, 15.5),
           (24.5, 18.5), (22, 21.5), (23, 25), (17, 29), (9, 29.5), (3, 27), (-6, 23), (-14, 18), (-19.5, 10), (-23, 0),
           (-23, -12), (-18, -24), (-9, -30)]
    c.shape([rot((E[0] + x * k, E[1] + y * k), E, ang) for x, y in pts])


def head_front(c, C):
    """Cabeza de frente con mandíbula, pómulos y orejas."""
    half = [(0, -31), (14, -29), (21, -20), (23, -6), (22.5, 5), (21, 15), (16, 24), (8, 29), (0, 30.5)]
    pts = [(C[0] + x, C[1] + y) for x, y in half] + [(C[0] - x, C[1] + y) for x, y in half[::-1][1:-1]]
    c.shape(pts)
    for s in (-1, 1):
        c.shape([(C[0] + s * x, C[1] + y) for x, y in [(19, -6), (24, -9), (26, -2), (24.5, 7), (20, 10)]])


def foot_side(c, A, G, lift=0.0):
    """Pie de perfil mirando a la derecha. lift: el talón se despega (px)."""
    pts = [(-11, -8), (-15, G - A[1] - 11), (-13, G - A[1] - 1.5), (4, G - A[1]), (38, G - A[1]), (49, G - A[1] - 1),
           (51, G - A[1] - 5), (45, G - A[1] - 9), (27, G - A[1] - 13), (14, -1), (8, -9)]
    ball = (A[0] + 38, G)
    ang = -math.degrees(math.atan2(lift, 40)) if lift else 0
    c.shape([rot((A[0] + x, A[1] + y), ball, ang) for x, y in pts])


def foot_free(c, A, d, k=1.0):
    """Pie en el aire: d = dirección de los dedos."""
    seg(c, (A[0] - d[0] * 12, A[1] - d[1] * 12), (A[0] + d[0] * 44 * k, A[1] + d[1] * 44 * k),
        [(-0.05, 5, 5), (0.15, 9, 9), (0.4, 7, 9), (0.8, 5, 6), (1.0, 2, 3)], (d[1], -d[0]))


def leg_side(c, Hp, K, A, G=None, fdir=(1, 0), lift=0.0, edge=False):
    c.begin_group()
    seg(c, Hp, K, THIGH, fdir)
    seg(c, K, A, SHIN, fdir)
    if G is not None:
        foot_side(c, A, G, lift)
    c.end_group(edge)


def arm_side(c, Sj, E, Wr, fdir=(1, 0), edge=True, hand=None):
    c.begin_group()
    seg(c, Sj, E, UARM, fdir)
    seg(c, E, Wr, FARM, fdir)
    u, _ = _u(E, Wr) if hand is None else (hand, 0)
    seg(c, Wr, (Wr[0] + u[0] * 26, Wr[1] + u[1] * 26), HAND, fdir)
    c.end_group(edge)


# Tronco de perfil en coordenadas locales: (delante, altura sobre la cadera), cadera→hombro = 126 px
_BACK = [("B1", -14, -54), ("B2", -28, -42), ("B3", -36, -16), ("B4", -32, 8), ("B5", -22, 34), ("B6", -26, 58),
         ("B7", -33, 86), ("B8", -33, 112), ("B9", -25, 130), ("B10", -14, 141)]
_FRONT = [("F1", 15, 146), ("F2", 28, 132), ("F3", 39, 108), ("F4", 35, 88), ("F5", 29, 70), ("F6", 27, 44),
          ("F7", 26, 18), ("F8", 22, -4), ("F9", 25, -22), ("F10", 6, -54)]
_PELVIS = {"B1", "B2", "B3", "B4", "F7", "F8", "F9", "F10"}


def torso_side(c, Hp, Sh, pelvis=0.0, kyph=0.0, lord=0.0, chest=0.0, belly=0.0):
    """Hp: cadera, Sh: base del cuello sobre la columna. pelvis en grados (+ anteversión)."""
    u, L = _u(Hp, Sh)
    n = (-u[1], u[0])                      # delante (figura mirando a la derecha)
    s = L / 126
    off = {"B5": (lord, 0), "F6": (belly, 0), "F7": (belly * 0.7, 0), "B7": (-kyph, 0), "B8": (-kyph * 0.9, 0),
           "B9": (-kyph * 0.45, 0), "B6": (-kyph * 0.2, 0), "F3": (chest, 0), "F2": (chest * 0.6, 0)}
    pts = []
    for name, x, y in _BACK + _FRONT:
        dx, dy = off.get(name, (0, 0))
        x, y = x + dx, y + dy
        p = (Hp[0] + n[0] * x + u[0] * y * s, Hp[1] + n[1] * x + u[1] * y * s)
        if name in _PELVIS and pelvis:
            p = rot(p, Hp, pelvis * (1 if n[0] >= 0 else -1))
        pts.append(p)
    c.shape(pts)
    return {k: p for (k, _, _), p in zip(_BACK + _FRONT, pts)}
