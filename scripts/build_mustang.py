"""Low-poly 1965 Ford Mustang hardtop coupe.

The body is lofted from cross-sections taken front to back, so the wheel
arches, side cove, fender peaks and tumblehome all come from one shell.
Blender units are meters: +X is the nose, +Y is the driver (left) side, Z is up.

Run inside Blender (Blender MCP or the Text editor). Set EXPORT = True to write
the GLB into public/models and src/assets/models.
"""
import math
import os

import bmesh
import bpy
from mathutils import Vector

EXPORT = True
GLB_NAME = "1965-ford-mustang-coupe.glb"

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    for block in list(collection):
        collection.remove(block)


# --------------------------------------------------------------------------- materials

def principled(name, color, metallic=0.0, roughness=0.5, coat=0.0, alpha=1.0, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    node.inputs["Base Color"].default_value = (*color, 1.0)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Coat Weight"].default_value = coat
    node.inputs["Alpha"].default_value = alpha
    if emission:
        node.inputs["Emission Color"].default_value = (*color, 1.0)
        node.inputs["Emission Strength"].default_value = emission
    if alpha < 1.0:
        for attr, value in (("surface_render_method", "BLENDED"), ("blend_method", "BLEND")):
            try:
                setattr(mat, attr, value)
            except (AttributeError, TypeError):
                pass
    mat.diffuse_color = (*color, alpha)
    return mat


MAT = {
    "paint": principled("Paint", (0.045, 0.10, 0.13), metallic=0.45, roughness=0.22, coat=0.8),
    "chrome": principled("Chrome", (0.82, 0.84, 0.86), metallic=1.0, roughness=0.08),
    "rubber": principled("Rubber", (0.025, 0.025, 0.025), roughness=0.9),
    "whitewall": principled("Whitewall", (0.86, 0.86, 0.83), roughness=0.6),
    "glass": principled("Glass", (0.05, 0.07, 0.08), metallic=0.2, roughness=0.05, alpha=0.55),
    "under": principled("Underside", (0.03, 0.03, 0.03), roughness=0.8),
    "interior": principled("Interior", (0.06, 0.055, 0.05), roughness=0.75),
    "grille": principled("Grille", (0.02, 0.02, 0.02), metallic=0.3, roughness=0.5),
    "headlight": principled("Headlight", (0.95, 0.95, 0.9), metallic=0.3, roughness=0.05, emission=0.6),
    "amber": principled("Amber", (0.9, 0.45, 0.08), roughness=0.3, emission=0.3),
    "taillight": principled("Taillight", (0.6, 0.03, 0.03), roughness=0.25, emission=0.6),
    "engine": principled("EngineBlack", (0.022, 0.022, 0.024), metallic=0.25, roughness=0.42),
    "bay": principled("BayBlack", (0.018, 0.018, 0.02), roughness=0.55),
    "gold": principled("FordGold", (0.62, 0.43, 0.13), metallic=0.85, roughness=0.32, coat=0.4),
    "stainless": principled("Stainless", (0.80, 0.81, 0.82), metallic=1.0, roughness=0.16),
    "cast": principled("CastIron", (0.16, 0.15, 0.14), metallic=0.55, roughness=0.8),
    "alloy": principled("Alloy", (0.58, 0.57, 0.54), metallic=0.85, roughness=0.42),
    "filter": principled("FilterElement", (0.82, 0.8, 0.74), roughness=0.9),
    "trunk": principled("TrunkMat", (0.075, 0.075, 0.08), roughness=0.95),
    "lead": principled("Lead", (0.42, 0.42, 0.44), metallic=0.6, roughness=0.55),
    "plate": principled("Plate", (0.85, 0.82, 0.6), roughness=0.5),
    "trim": principled("Trim", (0.04, 0.04, 0.045), metallic=0.3, roughness=0.5),
    "hub": principled("Hub", (0.05, 0.05, 0.05), metallic=0.4, roughness=0.5),
}


# --------------------------------------------------------------------------- mesh helpers

def oriented_faces(verts, faces):
    mesh = bpy.data.meshes.new("_orient")
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    out = [tuple(v.index for v in f.verts) for f in bm.faces]
    bm.free()
    bpy.data.meshes.remove(mesh)
    return out


def mesh_object(name, verts, faces, mat, pivot=(0.0, 0.0, 0.0)):
    pv = Vector(pivot)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(Vector(v) - pv) for v in verts], [], faces)
    mesh.materials.append(MAT[mat])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = pv
    bpy.context.collection.objects.link(obj)
    return obj


def split_objects(names, verts, faces, face_mats, pivot=(0.0, 0.0, 0.0)):
    """One object per material so only Paint_* meshes get recolored by the viewer."""
    faces = oriented_faces(verts, faces)
    objects = {}
    for key in dict.fromkeys(face_mats):
        remap = {}
        picked = []
        for face, mat in zip(faces, face_mats):
            if mat != key:
                continue
            picked.append(tuple(remap.setdefault(i, len(remap)) for i in face))
        local = [None] * len(remap)
        for old, new in remap.items():
            local[new] = verts[old]
        objects[key] = mesh_object(names[key], local, picked, key, pivot)
    return objects


def loft(rings, closed=True, cap_start=False, cap_end=False):
    n = len(rings[0])
    verts = [v for ring in rings for v in ring]
    faces = []
    info = []
    span = n if closed else n - 1
    for s in range(len(rings) - 1):
        for i in range(span):
            j = (i + 1) % n
            faces.append((s * n + i, s * n + j, (s + 1) * n + j, (s + 1) * n + i))
            info.append((s, i))
    if cap_start:
        faces.append(tuple(range(n))[::-1])
        info.append(("cap", 0))
    if cap_end:
        last = (len(rings) - 1) * n
        faces.append(tuple(range(last, last + n)))
        info.append(("cap", 1))
    return verts, faces, info


def solid(name, rings, mat, pivot=(0.0, 0.0, 0.0)):
    verts, faces, _ = loft(rings, closed=True, cap_start=True, cap_end=True)
    return mesh_object(name, verts, oriented_faces(verts, faces), mat, pivot)


def box(name, center, dims, mat):
    cx, cy, cz = center
    hx, hy, hz = (d / 2 for d in dims)
    verts = [
        (cx + sx * hx, cy + sy * hy, cz + sz * hz)
        for sx in (-1, 1)
        for sy in (-1, 1)
        for sz in (-1, 1)
    ]
    faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return mesh_object(name, verts, oriented_faces(verts, faces), mat)


def bar_geometry(p0, p1, radius, sides=6):
    a = Vector(p0)
    b = Vector(p1)
    rot = Vector((0, 0, 1)).rotation_difference((b - a).normalized())
    verts = []
    for base in (a, b):
        for k in range(sides):
            ang = 2 * math.pi * k / sides + math.pi / sides
            verts.append(base + rot @ Vector((math.cos(ang) * radius, math.sin(ang) * radius, 0)))
    faces = [(k, (k + 1) % sides, sides + (k + 1) % sides, sides + k) for k in range(sides)]
    faces += [tuple(range(sides))[::-1], tuple(range(sides, 2 * sides))]
    return verts, oriented_faces(verts, faces)


def bar(name, p0, p1, radius, mat, sides=6):
    verts, faces = bar_geometry(p0, p1, radius, sides)
    return mesh_object(name, verts, faces, mat)


def tubes(name, paths, radius, mat, sides=5):
    """One mesh for many polylines (hoses, plug wires, runners)."""
    verts, faces = [], []
    for path in paths:
        for p0, p1 in zip(path, path[1:]):
            v, f = bar_geometry(p0, p1, radius, sides)
            base = len(verts)
            verts += v
            faces += [tuple(base + i for i in face) for face in f]
    return mesh_object(name, verts, faces, mat)


def tilted_box(name, center, dims, mat, tilt=0.0, twist=0.0):
    """Box rotated about X (tilt), after an optional spin about its own Z (twist)."""
    obj = box(name, (0.0, 0.0, 0.0), dims, mat)
    obj.location = center
    obj.rotation_mode = "ZXY"
    obj.rotation_euler = (tilt, 0.0, twist)
    return obj


def zlathe(name, center, profile, mat, segments=24, pleat=0.0):
    """Revolve (radius, height) pairs around a vertical axis; pleat alternates the radius."""
    cx, cy, cz = center
    verts = []
    for k in range(segments):
        t = 2 * math.pi * k / segments
        s = 1.0 + (pleat if k % 2 else -pleat)
        for r, dz in profile:
            verts.append((cx + r * s * math.cos(t), cy + r * s * math.sin(t), cz + dz))
    m = len(profile)
    faces = []
    for k in range(segments):
        k2 = (k + 1) % segments
        for i in range(m - 1):
            faces.append((k * m + i, k * m + i + 1, k2 * m + i + 1, k2 * m + i))
    return mesh_object(name, verts, oriented_faces(verts, faces), mat)


def belt(name, pulleys, x, width, mat, samples=16):
    """Flat band wrapped around the convex hull of (y, z, radius) pulleys at station x."""
    pts = []
    for py, pz, r in pulleys:
        for k in range(samples):
            t = 2 * math.pi * k / samples
            pts.append((py + r * math.cos(t), pz + r * math.sin(t)))
    pts = sorted(set(pts))

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    hull = lower[:-1] + upper[:-1]
    n = len(hull)
    verts = [(x + dx, y, z) for dx in (-width / 2, width / 2) for y, z in hull]
    faces = [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    return mesh_object(name, verts, oriented_faces(verts, faces), mat)


def disc(name, center, axis, radius, depth, mat, sides=16):
    c = Vector(center)
    d = Vector(axis).normalized() * depth / 2
    return bar(name, c - d, c + d, radius, mat, sides)


def lathe(name, center, side, profile, mat, segments=20):
    """Revolve (radius, outward offset) pairs around the Y axis at a wheel center."""
    cx, cy, cz = center
    verts = []
    for k in range(segments):
        t = 2 * math.pi * k / segments
        for r, a in profile:
            verts.append((cx + r * math.cos(t), cy + side * a, cz + r * math.sin(t)))
    m = len(profile)
    faces = []
    for k in range(segments):
        k2 = (k + 1) % segments
        for i in range(m - 1):
            faces.append((k * m + i, k * m + i + 1, k2 * m + i + 1, k2 * m + i))
    return mesh_object(name, verts, oriented_faces(verts, faces), mat)


def table(points, x):
    if x >= points[0][0]:
        return points[0][1]
    if x <= points[-1][0]:
        return points[-1][1]
    for (x0, v0), (x1, v1) in zip(points, points[1:]):
        if x1 <= x <= x0:
            t = (x - x0) / (x1 - x0)
            return v0 + (v1 - v0) * t
    return points[-1][1]


# --------------------------------------------------------------------------- body profile

FLOOR = 0.22
WHEEL_X = (1.38, -1.38)
WHEEL_Z = 0.33
WHEEL_Y = 0.735
ARCH_R = 0.41
APRON_Y = 0.55
BAY_FLOOR = 0.34
TRUNK_Y = 0.55
TRUNK_FLOOR = 0.42

STATIONS = [
    2.26, 2.21, 2.14, 2.05, 1.94, 1.84, 1.78, 1.70, 1.60, 1.49, 1.38, 1.27, 1.16,
    1.06, 0.98, 0.88, 0.74, 0.60, 0.52, 0.42, 0.20, -0.05, -0.30, -0.55, -0.62,
    -0.80, -0.90, -0.98, -1.06, -1.14, -1.27, -1.38, -1.49, -1.60, -1.70, -1.78,
    -1.86, -1.96, -2.06, -2.15, -2.21, -2.26,
]


def half_width(x):
    return table(
        [(2.26, 0.76), (2.21, 0.81), (2.10, 0.845), (1.60, 0.862), (0.0, 0.87),
         (-1.60, 0.87), (-2.05, 0.85), (-2.20, 0.82), (-2.26, 0.78)],
        x,
    )


def belt_z(x):
    return table(
        [(2.26, 0.77), (2.18, 0.80), (2.00, 0.815), (1.40, 0.82), (0.60, 0.83),
         (-0.40, 0.84), (-1.00, 0.855), (-1.50, 0.87), (-2.05, 0.87), (-2.20, 0.84),
         (-2.26, 0.80)],
        x,
    )


def bottom_z(x):
    z = table([(2.26, 0.36), (2.16, 0.30), (2.00, 0.25), (-2.00, 0.25), (-2.16, 0.30), (-2.26, 0.36)], x)
    for cx in WHEEL_X:
        dx = x - cx
        if abs(dx) < ARCH_R:
            z = max(z, WHEEL_Z + math.sqrt(ARCH_R ** 2 - dx * dx) * 0.94)
    return z


def cove(x):
    """Signature side sculpt that sweeps forward from the rear scoop into the door."""
    if x > 0.45 or x < -0.96:
        return 0.0
    if x > 0.05:
        return 0.04 * (0.45 - x) / 0.40
    return 0.04


def hood_z(x):
    return table([(2.14, 0.758), (2.05, 0.772), (1.60, 0.80), (1.00, 0.822), (0.60, 0.845)], x)


def deck_z(x):
    return table([(-1.38, 0.880), (-1.70, 0.878), (-2.06, 0.866), (-2.15, 0.852)], x)


def region(x):
    if x > 2.15:
        return "nose"
    if x >= 0.60:
        return "hood"
    if x > 0.45:
        return "cowl"
    if x >= -0.98:
        return "tub"
    if x > -1.37:
        return "shelf"
    if x >= -2.16:
        return "deck"
    return "tail"


def body_half(x):
    w = half_width(x)
    zb = bottom_z(x)
    belt = belt_z(x)
    reg = region(x)
    z4 = max(0.60, zb + 0.02)
    z5 = min(max(0.73, z4 + 0.025), belt - 0.015)
    pts = [
        (0.0, FLOOR),
        (w - 0.30, FLOOR),
        (w - 0.29, max(zb, FLOOR + 0.01)),
        (w - 0.045, zb),
        (w - cove(x), z4),
        (w, z5),
        (w - 0.012, belt),
    ]
    if reg == "tub":
        pts += [(w - 0.075, belt + 0.02), (w - 0.11, 0.48), (0.0, 0.46)]
    elif reg == "hood":
        zc = hood_z(x)
        return pts + [
            (w - 0.075, belt + 0.012),
            (w - 0.13, zc - 0.075),
            (APRON_Y, zc - 0.09),
            (APRON_Y, BAY_FLOOR),
            (0.0, BAY_FLOOR),
        ]
    elif reg == "deck":
        zc = deck_z(x)
        return pts + [
            (w - 0.075, belt + 0.012),
            (w - 0.13, zc - 0.07),
            (TRUNK_Y, zc - 0.085),
            (TRUNK_Y, TRUNK_FLOOR),
            (0.0, TRUNK_FLOOR),
        ]
    elif reg == "cowl":
        pts += [(w - 0.075, belt + 0.02), (w - 0.13, 0.855), (0.0, 0.862)]
    elif reg == "shelf":
        pts += [(w - 0.075, belt + 0.02), (w - 0.12, 0.80), (0.0, 0.80)]
    elif reg == "nose":
        zc = table([(2.26, 0.66), (2.21, 0.705)], x)
        pts += [(w - 0.075, belt + 0.028), (w - 0.13, zc + 0.015), (0.0, zc)]
    else:
        zc = table([(-2.21, 0.835), (-2.26, 0.80)], x)
        pts += [(w - 0.075, belt + 0.02), (w - 0.13, zc + 0.01), (0.0, zc)]
    (ay, az), (by, bz) = pts[-2], pts[-1]
    pts[-1:-1] = [(ay + (by - ay) * t, az + (bz - az) * t) for t in (1 / 3, 2 / 3)]
    return pts


def full_ring(x, half):
    left = [(x, y, z) for y, z in half]
    right = [(x, -y, z) for y, z in reversed(half[1:-1])]
    return left + right


def body_material(seg, ra, rb):
    if seg <= 2:
        return "under"
    if seg <= 6:
        return "paint"
    pair = {ra, rb}
    if "tub" in pair or pair == {"shelf"}:
        return "interior"
    if seg == 7:
        return "paint"
    if "deck" in pair:
        return "trunk"
    if pair & {"hood", "shelf"}:
        return "under"
    return "paint"


parts = []
root = bpy.data.objects.new("Mustang_1965", None)
bpy.context.collection.objects.link(root)

rings = [full_ring(x, body_half(x)) for x in STATIONS]
ring_len = len(rings[0])
verts, faces, info = loft(rings, closed=True, cap_start=True, cap_end=True)
face_mats = []
for s, i in info:
    if s == "cap":
        face_mats.append("paint")
        continue
    half_seg = i if i < ring_len // 2 else ring_len - 1 - i
    face_mats.append(body_material(half_seg, region(STATIONS[s]), region(STATIONS[s + 1])))
body = split_objects(
    {"paint": "Paint_Body", "under": "Body_Underside", "interior": "Body_Interior", "trunk": "Body_TrunkWell"},
    verts,
    faces,
    face_mats,
)
parts += body.values()


# --------------------------------------------------------------------------- hood, trunk, doors

def lid_ring(x, w_edge, zc, thickness=0.025):
    top = [(w_edge, zc - 0.02), (0.36, zc - 0.004), (0.0, zc), (-0.36, zc - 0.004), (-w_edge, zc - 0.02)]
    bottom = [(y, z - thickness) for y, z in reversed(top)]
    return [(x, y, z) for y, z in top + bottom]


hood_stations = [x for x in STATIONS if 0.60 <= x <= 2.14]
hood = solid(
    "Paint_Hood",
    [lid_ring(x, half_width(x) - 0.13, hood_z(x)) for x in hood_stations],
    "paint",
    pivot=(0.60, 0.0, hood_z(0.60)),
)
parts.append(hood)

trunk_stations = [x for x in STATIONS if -2.15 <= x <= -1.38]
trunk = solid(
    "Paint_Trunk",
    [lid_ring(x, half_width(x) - 0.13, deck_z(x)) for x in trunk_stations],
    "paint",
    pivot=(-1.38, 0.0, deck_z(-1.38)),
)
parts.append(trunk)

door_stations = [x for x in STATIONS if -0.62 <= x <= 0.52]
doors = {}
for side, label in ((1, "L"), (-1, "R")):
    door_rings = []
    for x in door_stations:
        half = body_half(x)
        w = half_width(x)
        outer = [(w - 0.04, 0.29), half[4], half[5], half[6]]
        outer = [(y + 0.006, z) for y, z in outer]
        inner = [(y - 0.035, z) for y, z in reversed(outer)]
        door_rings.append([(x, side * y, z) for y, z in outer + inner])
    door = solid(
        f"Paint_Door_{label}",
        door_rings,
        "paint",
        pivot=(0.52, side * half_width(0.52), 0.60),
    )
    doors[label] = door
    parts.append(door)


# --------------------------------------------------------------------------- greenhouse

# Hardtop greenhouse: long flat roof, pillarless side glass (vent + door glass on
# the door, quarter glass behind it with a forward-leaning rear edge), wide C-pillar
# sails and a notchback rear window that lands on the deck above the rear axle.
CABIN = [
    # x, base z, roof z, base half-width, roof-edge half-width, rear-glass half-width, sill x
    (0.60, 0.845, 0.850, 0.745, 0.745, 0.44, 0.60),
    (0.30, 0.845, 1.040, 0.750, 0.695, 0.44, 0.30),
    (-0.03, 0.848, 1.262, 0.755, 0.618, 0.44, -0.03),
    (-0.20, 0.850, 1.290, 0.757, 0.628, 0.44, -0.20),
    (-0.42, 0.852, 1.298, 0.758, 0.632, 0.44, -0.42),
    (-0.60, 0.855, 1.298, 0.760, 0.632, 0.44, -0.60),
    (-0.76, 0.862, 1.292, 0.760, 0.630, 0.44, -0.90),
    (-0.97, 0.866, 1.270, 0.758, 0.628, 0.43, -0.97),
    (-1.12, 0.872, 1.130, 0.755, 0.675, 0.41, -1.12),
    (-1.26, 0.878, 0.990, 0.750, 0.715, 0.395, -1.26),
    (-1.38, 0.880, 0.884, 0.745, 0.745, 0.38, -1.38),
]
DOOR_SEGS = range(0, 5)
QUARTER_SEG = 5
BACKLIGHT_ROW = 7


def cabin_half(row):
    """Points from the belt up to the roof center: base, sill, glass top, drip, glass edge, crown."""
    x, zb, zt, wb, we, wi, xs = row
    h = zt - zb
    return [
        (xs, wb, zb),
        (xs, wb - 0.012, zb + min(0.035, h * 0.2)),
        (x, we + 0.012, zt - min(0.06, h * 0.3)),
        (x, we, zt - min(0.028, h * 0.15)),
        (x, wi, zt - min(0.008, h * 0.05)),
        (x, 0.0, zt),
    ]


def mirror(points, side):
    return [(x, side * y, z) for x, y, z in points]


def cabin_material(seg, edge):
    if edge == 1 and seg <= QUARTER_SEG:
        return None
    if edge == 0 and seg in DOOR_SEGS:
        return None
    if edge in (3, 4) and seg <= 1:
        return "glass"
    if edge == 4 and seg >= BACKLIGHT_ROW:
        return "glass"
    return "paint"


halves = [cabin_half(row) for row in CABIN]
cabin_rings = [h + mirror(reversed(h[:-1]), -1) for h in halves]
verts, faces, info = loft(cabin_rings, closed=False)
edges_per_half = len(halves[0]) - 1
kept_faces, face_mats = [], []
for face, (seg, i) in zip(faces, info):
    edge = i if i < edges_per_half else 2 * edges_per_half - 1 - i
    mat = cabin_material(seg, edge)
    if mat:
        kept_faces.append(face)
        face_mats.append(mat)
cabin = split_objects({"paint": "Paint_Cabin", "glass": "Glass_Windshield_Backlight"}, verts, kept_faces, face_mats)
parts += cabin.values()


def cabin_strip(name, segs, edge, side, mat, grow=0.0, pivot=(0.0, 0.0, 0.0)):
    verts, faces = [], []
    for s in segs:
        a, b = halves[s], halves[s + 1]
        base = len(verts)
        quad = [a[edge], a[edge + 1], b[edge + 1], b[edge]]
        verts += [(x, side * (y + grow), z) for x, y, z in quad]
        faces.append((base, base + 1, base + 2, base + 3))
    return mesh_object(name, verts, oriented_faces(verts, faces), mat, pivot)


def cabin_point(x, edge):
    """Interpolate a cabin ring point at station x (by the row's own x)."""
    for a, b in zip(halves, halves[1:]):
        xa, xb = a[edge][0], b[edge][0]
        if xb <= x <= xa:
            t = (xa - x) / (xa - xb) if xa != xb else 0.0
            return tuple(pa + (pb - pa) * t for pa, pb in zip(a[edge], b[edge]))
    return halves[-1][edge]


door_glass = {}
for side, label in ((1, "L"), (-1, "R")):
    pivot = (0.52, side * half_width(0.52), 0.60)
    door_glass[label] = [
        cabin_strip(f"Glass_Door_{label}", DOOR_SEGS, 1, side, "glass", pivot=pivot),
        cabin_strip(f"Paint_DoorSill_{label}", DOOR_SEGS, 0, side, "paint", pivot=pivot),
        tubes(f"Chrome_DoorGlassTrim_{label}", [
            mirror([halves[s][1] for s in range(0, QUARTER_SEG + 1)], side),
            mirror([cabin_point(0.36, 1), cabin_point(0.36, 2)], side),
            mirror([halves[QUARTER_SEG][1], halves[QUARTER_SEG][2]], side),
        ], 0.007, "chrome", sides=5),
    ]
    parts.append(cabin_strip(f"Glass_Quarter_{label}", [QUARTER_SEG], 1, side, "glass"))
    parts.append(tubes(f"Chrome_CabinTrim_{label}", [
        mirror([h[3] for h in halves[:BACKLIGHT_ROW + 1]], side),
        mirror([h[4] for h in halves[BACKLIGHT_ROW:]], side),
        mirror([halves[QUARTER_SEG][1], halves[QUARTER_SEG + 1][1], halves[QUARTER_SEG + 1][2]], side),
    ], 0.009, "chrome", sides=5))
for row, name in ((2, "Header"), (0, "Cowl"), (BACKLIGHT_ROW, "RearHeader"), (len(halves) - 1, "RearSill")):
    edge_row = halves[row]
    across = [edge_row[3], edge_row[4], edge_row[5]] if row <= 2 else [edge_row[4], edge_row[5]]
    parts.append(tubes(f"Chrome_{name}", [mirror(across, 1) + mirror(reversed(across[:-1]), -1)], 0.009, "chrome", sides=5))
parts.append(bar("Wiper_L", (0.548, 0.04, 0.885), (0.528, 0.44, 0.896), 0.008, "trim", sides=4))
parts.append(bar("Wiper_R", (0.548, -0.40, 0.885), (0.528, 0.0, 0.896), 0.008, "trim", sides=4))


# --------------------------------------------------------------------------- front end

parts.append(box("Grille", (2.264, 0.0, 0.555), (0.012, 0.92, 0.24), "grille"))
for name, p0, p1 in (
    ("Top", (2.27, -0.46, 0.675), (2.27, 0.46, 0.675)),
    ("Bottom", (2.27, -0.46, 0.435), (2.27, 0.46, 0.435)),
    ("L", (2.27, 0.46, 0.435), (2.27, 0.46, 0.675)),
    ("R", (2.27, -0.46, 0.435), (2.27, -0.46, 0.675)),
):
    parts.append(bar(f"Chrome_GrilleFrame_{name}", p0, p1, 0.012, "chrome", sides=5))
for name, p0, p1 in (
    ("Top", (2.276, -0.10, 0.61), (2.276, 0.10, 0.61)),
    ("Bottom", (2.276, -0.10, 0.50), (2.276, 0.10, 0.50)),
    ("L", (2.276, 0.10, 0.50), (2.276, 0.10, 0.61)),
    ("R", (2.276, -0.10, 0.50), (2.276, -0.10, 0.61)),
):
    parts.append(bar(f"Chrome_Corral_{name}", p0, p1, 0.008, "chrome", sides=4))
parts.append(bar("Chrome_GrilleBar_L", (2.276, 0.10, 0.555), (2.276, 0.46, 0.555), 0.008, "chrome", sides=4))
parts.append(bar("Chrome_GrilleBar_R", (2.276, -0.10, 0.555), (2.276, -0.46, 0.555), 0.008, "chrome", sides=4))
parts.append(box("Chrome_Pony", (2.281, 0.0, 0.555), (0.012, 0.10, 0.05), "chrome"))

for side, label in ((1, "L"), (-1, "R")):
    parts.append(disc(f"Chrome_HeadlightBezel_{label}", (2.268, side * 0.62, 0.665), (1, 0, 0), 0.10, 0.05, "chrome"))
    parts.append(disc(f"Headlight_{label}", (2.29, side * 0.62, 0.665), (1, 0, 0), 0.082, 0.03, "headlight"))
    parts.append(box(f"ParkLamp_{label}", (2.263, side * 0.50, 0.30), (0.012, 0.15, 0.045), "amber"))
    parts.append(bar(f"Chrome_BumperEnd_F{label}", (2.30, side * 0.62, 0.40), (2.19, side * 0.86, 0.40), 0.043, "chrome"))
parts.append(box("Chrome_Bumper_Front", (2.30, 0.0, 0.40), (0.06, 1.24, 0.085), "chrome"))
parts.append(box("Paint_Valance_Front", (2.22, 0.0, 0.30), (0.08, 1.30, 0.14), "paint"))


# --------------------------------------------------------------------------- rear end

for side, label in ((1, "L"), (-1, "R")):
    parts.append(box(f"Chrome_TailBezel_{label}", (-2.263, side * 0.52, 0.63), (0.012, 0.30, 0.16), "chrome"))
    for i, y in enumerate((0.43, 0.52, 0.61)):
        parts.append(box(f"Taillight_{label}{i}", (-2.27, side * y, 0.63), (0.012, 0.075, 0.13), "taillight"))
    parts.append(bar(f"Chrome_BumperEnd_R{label}", (-2.30, side * 0.65, 0.395), (-2.18, side * 0.86, 0.395), 0.043, "chrome"))
    parts.append(disc(f"Exhaust_{label}", (-2.20, side * 0.42, 0.20), (1, 0, 0), 0.03, 0.12, "hub", sides=8))
parts.append(box("Chrome_Bumper_Rear", (-2.30, 0.0, 0.395), (0.06, 1.30, 0.085), "chrome"))
parts.append(box("Paint_Valance_Rear", (-2.22, 0.0, 0.30), (0.08, 1.30, 0.14), "paint"))
parts.append(disc("Chrome_FuelCap", (-2.268, 0.0, 0.62), (1, 0, 0), 0.06, 0.02, "chrome"))
parts.append(box("Plate_Rear", (-2.265, 0.0, 0.30), (0.012, 0.30, 0.15), "plate"))


# --------------------------------------------------------------------------- side trim

for side, label in ((1, "L"), (-1, "R")):
    parts.append(bar(f"Chrome_Rocker_{label}", (0.92, side * 0.832, 0.285), (-0.94, side * 0.832, 0.285), 0.012, "chrome", sides=4))
    parts.append(box(f"Paint_Scoop_{label}", (-0.90, side * 0.852, 0.60), (0.14, 0.045, 0.09), "paint"))
    for i, z in enumerate((0.575, 0.60, 0.625)):
        parts.append(bar(f"Chrome_Scoop_{label}{i}", (-0.84, side * 0.878, z), (-0.95, side * 0.878, z), 0.009, "chrome", sides=4))
    parts.append(box(f"Chrome_FenderBadge_{label}", (0.78, side * 0.872, 0.64), (0.10, 0.008, 0.04), "chrome"))

parts.append(bar("Chrome_Antenna", (1.25, -0.80, 0.84), (1.25, -0.80, 1.30), 0.004, "chrome", sides=4))

door_children = {"L": list(door_glass["L"]), "R": list(door_glass["R"])}
for side, label in ((1, "L"), (-1, "R")):
    door_children[label].append(
        bar(f"Chrome_DoorHandle_{label}", (-0.44, side * 0.878, 0.775), (-0.56, side * 0.878, 0.775), 0.01, "chrome", sides=5)
    )
door_children["L"].append(bar("Chrome_MirrorStalk", (0.40, 0.87, 0.86), (0.40, 0.92, 0.91), 0.008, "chrome", sides=4))
door_children["L"].append(box("Chrome_Mirror", (0.40, 0.935, 0.93), (0.04, 0.06, 0.05), "chrome"))

hood_children = [
    box(f"Chrome_HoodLetter_{i}", (2.09, y, hood_z(2.09) + 0.004), (0.035, 0.05, 0.008), "chrome")
    for i, y in enumerate((-0.135, -0.045, 0.045, 0.135))
]


# --------------------------------------------------------------------------- interior + engine

for side, label in ((1, "L"), (-1, "R")):
    parts.append(box(f"Seat_Front_{label}", (-0.12, side * 0.34, 0.54), (0.50, 0.46, 0.14), "interior"))
    back = box(f"SeatBack_Front_{label}", (-0.36, side * 0.34, 0.78), (0.12, 0.46, 0.50), "interior")
    parts.append(back)
parts.append(box("Seat_Rear", (-0.78, 0.0, 0.55), (0.42, 1.20, 0.14), "interior"))
parts.append(box("SeatBack_Rear", (-0.97, 0.0, 0.76), (0.12, 1.24, 0.44), "interior"))
parts.append(box("Dash", (0.47, 0.0, 0.80), (0.16, 1.40, 0.16), "interior"))

bpy.ops.mesh.primitive_torus_add(
    major_radius=0.19,
    minor_radius=0.018,
    major_segments=16,
    minor_segments=6,
    location=(0.28, 0.36, 0.87),
    rotation=(0.0, math.radians(65), 0.0),
)
wheel = bpy.context.active_object
wheel.name = "SteeringWheel"
wheel.data.materials.clear()
wheel.data.materials.append(MAT["trim"])
parts.append(wheel)
parts.append(bar("SteeringColumn", (0.30, 0.36, 0.86), (0.46, 0.36, 0.74), 0.02, "trim", sides=5))


# --------------------------------------------------------------------------- 289 V8 (4V) + engine bay
# 1965 A-code 289: semi-gloss black block, heads, timing cover and pump, Ford gold
# valve covers, Autolite 4100 four-barrel, here with a stainless open-element air cleaner.

CRANK_Z = 0.33
BLOCK_X = (1.03, 1.57)
CARB_X = 1.28
BANK = math.radians(45)


def bank_point(side, d, perp=0.0):
    """(y, z) at distance d up a cylinder bank, offset perp outboard of the bank axis."""
    s, c = math.sin(BANK), math.cos(BANK)
    return side * (s * d + c * perp), CRANK_Z + c * d - s * perp


block_half = [(0.19, 0.26), (0.225, 0.34), bank_point(1, 0.21, 0.09), bank_point(1, 0.21, -0.09), (0.0, 0.50)]
block_ring = block_half + [(-y, z) for y, z in reversed(block_half[:-1])]
parts.append(solid("Engine_Block", [[(x, y, z) for y, z in block_ring] for x in BLOCK_X], "engine"))

wire_paths = {1: [], -1: []}
for side, label in ((1, "L"), (-1, "R")):
    tilt = -side * BANK
    y, z = bank_point(side, 0.26)
    parts.append(tilted_box(f"Engine_Head_{label}", (1.30, y, z), (0.52, 0.18, 0.10), "engine", tilt))
    y, z = bank_point(side, 0.335)
    parts.append(tilted_box(f"Gold_ValveCover_{label}", (1.30, y, z), (0.50, 0.15, 0.05), "gold", tilt))
    y, z = bank_point(side, 0.362)
    parts.append(tilted_box(f"Gold_ValveCoverRib_{label}", (1.30, y, z), (0.40, 0.09, 0.012), "gold", tilt))
    for i, x in enumerate((1.12, 1.24, 1.36, 1.48)):
        y, z = bank_point(side, 0.363, -0.06)
        parts.append(tilted_box(f"Chrome_ValveCoverBolt_{label}{i}", (x, y, z), (0.018, 0.018, 0.014), "chrome", tilt))

    port_x = (1.11, 1.24, 1.37, 1.50)
    log_y = side * 0.29
    parts.append(bar(f"Cast_ExhaustLog_{label}", (1.06, log_y, 0.405), (1.55, log_y, 0.405), 0.034, "cast", sides=8))
    runners = [[(x, side * 0.245, 0.452), (x, log_y, 0.412)] for x in port_x]
    runners.append([(1.30, log_y, 0.40), (1.26, side * 0.30, 0.30)])
    parts.append(tubes(f"Cast_ExhaustRunners_{label}", runners, 0.024, "cast", sides=6))

    for x in (1.17, 1.30, 1.43, 1.56):
        plug = (x - 0.05, side * 0.292, 0.472)
        parts.append(bar(f"Engine_PlugBoot_{label}{len(wire_paths[side])}", plug, (x - 0.05, side * 0.31, 0.50), 0.012, "rubber", sides=5))
        wire_paths[side].append([
            (1.00, side * 0.03, 0.665),
            (1.05, side * 0.20, 0.655),
            (x - 0.05, side * 0.305, 0.548),
            (x - 0.05, side * 0.31, 0.50),
        ])

parts.append(tubes("Engine_PlugWires", wire_paths[1] + wire_paths[-1], 0.0065, "rubber", sides=4))

parts.append(box("Engine_Intake", (1.28, 0.0, 0.53), (0.52, 0.24, 0.12), "engine"))
parts.append(box("Engine_ThermostatHousing", (1.565, 0.03, 0.57), (0.06, 0.07, 0.05), "engine"))
parts.append(disc("Engine_Distributor", (1.00, 0.0, 0.575), (0, 0, 1), 0.035, 0.09, "cast", sides=10))
parts.append(disc("Engine_DistributorCap", (1.00, 0.0, 0.645), (0, 0, 1), 0.052, 0.05, "engine", sides=12))
parts.append(bar("Engine_Coil", (1.50, 0.15, 0.585), (1.50, 0.15, 0.665), 0.026, "engine", sides=8))
y, z = bank_point(1, 0.378)
parts.append(disc("Chrome_OilCap", (1.47, y, z), (0, math.sin(BANK), math.cos(BANK)), 0.034, 0.03, "chrome", sides=12))

parts.append(box("Alloy_Carburetor", (CARB_X, 0.0, 0.628), (0.15, 0.17, 0.075), "alloy"))
parts.append(box("Alloy_CarbFloatBowl", (CARB_X + 0.09, 0.0, 0.62), (0.035, 0.15, 0.06), "alloy"))
parts.append(bar("Chrome_ThrottleLink", (CARB_X, -0.09, 0.61), (1.05, -0.12, 0.64), 0.005, "chrome", sides=4))

AC_Z = 0.668
parts.append(zlathe(
    "Stainless_AirCleanerBase",
    (CARB_X, 0.0, AC_Z),
    [(0.0, 0.0), (0.16, 0.0), (0.186, 0.004), (0.19, 0.012), (0.184, 0.014)],
    "stainless",
    segments=28,
))
parts.append(zlathe(
    "AirCleaner_Element",
    (CARB_X, 0.0, AC_Z + 0.012),
    [(0.148, 0.0), (0.176, 0.0), (0.176, 0.055), (0.148, 0.055), (0.148, 0.0)],
    "filter",
    segments=56,
    pleat=0.02,
))
parts.append(zlathe(
    "Stainless_AirCleanerLid",
    (CARB_X, 0.0, AC_Z + 0.066),
    [(0.184, -0.002), (0.19, 0.004), (0.186, 0.011), (0.12, 0.016), (0.035, 0.02), (0.0, 0.02)],
    "stainless",
    segments=28,
))
parts.append(disc("Chrome_AirCleanerNut", (CARB_X, 0.0, AC_Z + 0.094), (0, 0, 1), 0.022, 0.014, "chrome", sides=6))
parts.append(bar("Chrome_AirCleanerWing", (CARB_X, -0.04, AC_Z + 0.098), (CARB_X, 0.04, AC_Z + 0.098), 0.005, "chrome", sides=4))

# front accessory drive
BELT_X = 1.705
parts.append(box("Engine_TimingCover", (1.60, 0.0, 0.40), (0.06, 0.26, 0.22), "engine"))
parts.append(box("Engine_WaterPump", (1.655, 0.0, 0.43), (0.05, 0.18, 0.12), "engine"))
parts.append(disc("Engine_Damper", (1.655, 0.0, CRANK_Z), (1, 0, 0), 0.085, 0.04, "engine", sides=16))
parts.append(disc("Engine_CrankPulley", (BELT_X, 0.0, CRANK_Z), (1, 0, 0), 0.07, 0.022, "engine", sides=16))
parts.append(disc("Engine_PumpPulley", (BELT_X, 0.0, 0.44), (1, 0, 0), 0.065, 0.022, "engine", sides=16))
parts.append(disc("Alloy_Alternator", (1.63, -0.25, 0.50), (1, 0, 0), 0.066, 0.13, "alloy", sides=14))
parts.append(disc("Engine_AltPulley", (BELT_X, -0.25, 0.50), (1, 0, 0), 0.04, 0.022, "engine", sides=12))
parts.append(bar("Engine_AltBracket", (1.62, -0.10, 0.44), (1.62, -0.20, 0.48), 0.012, "engine", sides=4))
parts.append(belt("Engine_FanBelt", [(0.0, CRANK_Z, 0.072), (0.0, 0.44, 0.067), (-0.25, 0.50, 0.042)], BELT_X, 0.016, "rubber"))

FAN_X = 1.79
parts.append(bar("Engine_FanSpacer", (1.715, 0.0, 0.44), (FAN_X, 0.0, 0.44), 0.03, "engine", sides=8))
parts.append(disc("Engine_FanHub", (FAN_X, 0.0, 0.44), (1, 0, 0), 0.055, 0.012, "engine", sides=12))
for i in range(4):
    theta = math.pi / 4 + i * math.pi / 2
    r = 0.12
    center = (FAN_X, r * math.cos(theta), 0.44 + r * math.sin(theta))
    parts.append(tilted_box(f"Engine_FanBlade{i}", center, (0.006, 0.075, 0.16), "engine", theta - math.pi / 2, math.radians(28)))

# cooling
parts.append(box("Radiator_Core", (1.955, 0.0, 0.53), (0.05, 0.64, 0.34), "grille"))
parts.append(box("Radiator_Tank", (1.955, 0.0, 0.713), (0.07, 0.66, 0.03), "engine"))
parts.append(disc("Chrome_RadiatorCap", (1.955, 0.20, 0.735), (0, 0, 1), 0.028, 0.016, "chrome", sides=12))
parts.append(tubes("Hose_Radiator", [[(1.57, 0.04, 0.58), (1.70, 0.12, 0.625), (1.93, 0.20, 0.672)]], 0.022, "rubber", sides=8))
parts.append(tubes(
    "Hose_Heater",
    [
        [(1.52, -0.08, 0.59), (1.10, -0.14, 0.612), (0.85, -0.22, 0.64), (0.64, -0.30, 0.62)],
        [(1.66, -0.07, 0.40), (1.60, -0.34, 0.40), (1.45, -0.37, 0.45), (0.95, -0.37, 0.55), (0.64, -0.37, 0.58)],
    ],
    0.014,
    "rubber",
    sides=6,
))

# bay structure
parts.append(box("Bay_RadiatorSupport", (2.03, 0.0, 0.535), (0.04, 1.20, 0.39), "bay"))
parts.append(box("Bay_HeaterBox", (0.625, -0.33, 0.58), (0.05, 0.28, 0.16), "bay"))
for side, label in ((1, "L"), (-1, "R")):
    parts.append(box(f"Bay_ShockTower_{label}", (1.38, side * 0.495, 0.535), (0.26, 0.11, 0.39), "bay"))
    parts.append(disc(f"Bay_ShockTowerCap_{label}", (1.38, side * 0.495, 0.735), (0, 0, 1), 0.075, 0.014, "bay", sides=12))
    parts.append(bar(f"Bay_CowlBrace_{label}", (1.38, side * 0.47, 0.738), (0.62, side * 0.36, 0.79), 0.012, "bay", sides=6))

parts.append(box("Cast_MasterCylinder", (0.69, 0.40, 0.62), (0.14, 0.09, 0.08), "cast"))
parts.append(box("Cast_MasterCylinderCap", (0.69, 0.40, 0.666), (0.12, 0.075, 0.012), "cast"))
parts.append(bar("Chrome_MasterCylinderBail", (0.69, 0.35, 0.672), (0.69, 0.45, 0.672), 0.004, "chrome", sides=4))

parts.append(box("Battery_Case", (1.80, -0.43, 0.46), (0.18, 0.17, 0.20), "bay"))
parts.append(box("Battery_Caps", (1.80, -0.43, 0.563), (0.12, 0.03, 0.008), "engine"))
for i, x in enumerate((1.735, 1.865)):
    parts.append(disc(f"Lead_BatteryPost{i}", (x, -0.39, 0.568), (0, 0, 1), 0.012, 0.02, "lead", sides=8))
parts.append(tubes("Battery_Cables", [
    [(1.735, -0.39, 0.575), (1.70, -0.33, 0.56), (1.64, -0.30, 0.44)],
    [(1.865, -0.39, 0.575), (1.93, -0.36, 0.52), (1.96, -0.40, 0.40)],
], 0.009, "rubber", sides=5))


# --------------------------------------------------------------------------- wheels

TIRE = [(0.245, -0.10), (0.30, -0.108), (0.325, -0.095), (0.335, -0.05),
        (0.335, 0.05), (0.325, 0.095), (0.30, 0.108), (0.245, 0.10)]
COVER = [(0.25, 0.098), (0.245, 0.108), (0.215, 0.112), (0.17, 0.104),
         (0.10, 0.112), (0.06, 0.125), (0.03, 0.13), (0.0, 0.132)]

for label, x, side in (("FL", 1.38, 1), ("FR", 1.38, -1), ("RL", -1.38, 1), ("RR", -1.38, -1)):
    center = (x, side * WHEEL_Y, WHEEL_Z)
    parts.append(lathe(f"Wheel_{label}_Tire", center, side, TIRE, "rubber"))
    parts.append(lathe(f"Wheel_{label}_Whitewall", center, side, [(0.265, 0.1095), (0.295, 0.1095)], "whitewall"))
    parts.append(lathe(f"Wheel_{label}_Cover", center, side, COVER, "chrome"))
    parts.append(lathe(f"Wheel_{label}_Back", center, side, [(0.245, -0.10), (0.0, -0.10)], "hub"))
    for i, ang in enumerate((90, 210, 330)):
        t = math.radians(ang)
        p0 = (x + 0.02 * math.cos(t), side * (WHEEL_Y + 0.13), WHEEL_Z + 0.02 * math.sin(t))
        p1 = (x + 0.08 * math.cos(t), side * (WHEEL_Y + 0.128), WHEEL_Z + 0.08 * math.sin(t))
        parts.append(bar(f"Wheel_{label}_Spinner{i}", p0, p1, 0.008, "chrome", sides=4))

SPARE = (-1.79, 0.19, TRUNK_FLOOR)
parts.append(zlathe("Trunk_SpareTire", SPARE, [(r, a + 0.108) for r, a in TIRE], "rubber", segments=20))
parts.append(zlathe("Trunk_SpareWheel", SPARE, [(0.245, 0.2), (0.12, 0.19), (0.05, 0.205), (0.0, 0.205)], "hub", segments=20))
parts.append(box("Trunk_Jack", (-1.62, -0.36, TRUNK_FLOOR + 0.04), (0.30, 0.08, 0.08), "cast"))
parts.append(bar("Trunk_JackHandle", (-1.48, -0.44, TRUNK_FLOOR + 0.015), (-2.02, -0.44, TRUNK_FLOOR + 0.015), 0.011, "cast", sides=5))


# --------------------------------------------------------------------------- hierarchy

bpy.context.view_layer.update()
back_rotation = math.radians(-13)
for obj in parts:
    if obj.name.startswith("SeatBack_Front"):
        obj.rotation_euler = (0.0, back_rotation, 0.0)
    if obj.name == "SeatBack_Rear":
        obj.rotation_euler = (0.0, math.radians(-17), 0.0)


def attach(child, parent):
    bpy.context.view_layer.update()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


for child in hood_children:
    attach(child, hood)
for label, children in door_children.items():
    for child in children:
        attach(child, doors[label])
for obj in parts:
    attach(obj, root)
hood["part"] = "hood"
trunk["part"] = "trunk"
doors["L"]["part"] = "door_l"
doors["R"]["part"] = "door_r"


# --------------------------------------------------------------------------- preview scene

bpy.ops.object.camera_add(location=(6.6, -5.4, 2.3), rotation=(math.radians(72), 0, math.radians(51)))
bpy.context.scene.camera = bpy.context.active_object
bpy.ops.object.light_add(type="SUN", location=(5.0, -3.0, 7.0))
sun = bpy.context.active_object
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(40), math.radians(10), math.radians(30))
world = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.55, 0.58, 0.6, 1.0)
bg.inputs[1].default_value = 0.8

for area in bpy.context.screen.areas if bpy.context.screen else []:
    if area.type == "VIEW_3D":
        area.spaces.active.shading.type = "MATERIAL"
        region = next(r for r in area.regions if r.type == "WINDOW")
        with bpy.context.temp_override(area=area, region=region):
            bpy.ops.view3d.view_camera()
        break


# --------------------------------------------------------------------------- export

def export_glb(path):
    for obj in bpy.context.view_layer.objects:
        obj.select_set(False)
    root.select_set(True)
    for obj in root.children_recursive:
        obj.select_set(True)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_cameras=False,
        export_lights=False,
        export_yup=True,
    )


tri_count = sum(len(o.data.polygons) for o in root.children_recursive if o.type == "MESH")
if EXPORT and "__file__" in globals():
    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for folder in (("public", "models"), ("src", "assets", "models")):
        export_glb(os.path.join(repo, *folder, GLB_NAME))
print("mustang ok", len(root.children_recursive), "objects", tri_count, "faces")
