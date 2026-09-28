"""Low-poly 1965 Ford Mustang coupe with named parts for later animation."""
import math

import bpy
from mathutils import Vector

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for mesh in list(bpy.data.meshes):
    bpy.data.meshes.remove(mesh)
for mat in list(bpy.data.materials):
    bpy.data.materials.remove(mat)


def principled(name, color, metallic=0.0, roughness=0.45, coat=0.0, alpha=1.0, emission=0.0):
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
        mat.blend_method = "BLEND"
    return mat


paint = principled("Paint", (0.62, 0.04, 0.05), metallic=0.35, roughness=0.22, coat=0.55)
chrome = principled("Chrome", (0.82, 0.84, 0.86), metallic=1.0, roughness=0.08)
rubber = principled("Rubber", (0.03, 0.03, 0.03), roughness=0.85)
glass = principled("Glass", (0.05, 0.07, 0.09), metallic=0.15, roughness=0.05, alpha=0.42)
trim = principled("Trim", (0.08, 0.08, 0.09), metallic=0.4, roughness=0.35)
light_front = principled("Headlight", (0.95, 0.95, 0.9), metallic=0.3, roughness=0.12, emission=0.35)
light_rear = principled("Taillight", (0.7, 0.05, 0.05), metallic=0.2, roughness=0.25, emission=0.45)
interior = principled("Interior", (0.12, 0.08, 0.07), roughness=0.7)


def box(name, loc, dims, mat):
    sx, sy, sz = [d / 2 for d in dims]
    verts = [
        (-sx, -sy, -sz),
        (sx, -sy, -sz),
        (sx, sy, -sz),
        (-sx, sy, -sz),
        (-sx, -sy, sz),
        (sx, -sy, sz),
        (sx, sy, sz),
        (-sx, sy, sz),
    ]
    faces = [
        (0, 1, 2, 3),
        (4, 7, 6, 5),
        (0, 4, 5, 1),
        (1, 5, 6, 2),
        (2, 6, 7, 3),
        (3, 7, 4, 0),
    ]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.data.materials.append(mat)
    return obj


def cylinder(name, loc, radius, depth, mat, rotation=(0, 0, 0), vertices=12):
    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=loc,
        rotation=rotation,
        scale=(1, 1, 1),
    )
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


def set_origin(obj, world_point):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    cursor = bpy.context.scene.cursor
    old = cursor.location.copy()
    cursor.location = Vector(world_point)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    cursor.location = old
    obj.select_set(False)


def parent_keep(obj, parent):
    obj.parent = parent
    obj.matrix_parent_inverse = parent.matrix_world.inverted()


root = bpy.data.objects.new("Mustang_1965", None)
bpy.context.collection.objects.link(root)

W = 1.72
parts = []

parts.append(box("Paint_Rocker", (0.05, 0, 0.34), (4.05, W - 0.18, 0.28), paint))
parts.append(box("Trim_Sills", (0.05, 0, 0.2), (3.95, W - 0.12, 0.08), trim))
parts.append(box("Paint_Fender_FL", (1.45, 0.78, 0.5), (1.35, 0.18, 0.42), paint))
parts.append(box("Paint_Fender_FR", (1.45, -0.78, 0.5), (1.35, 0.18, 0.42), paint))
parts.append(box("Paint_Fender_RL", (-1.25, 0.78, 0.5), (1.15, 0.18, 0.42), paint))
parts.append(box("Paint_Fender_RR", (-1.25, -0.78, 0.5), (1.15, 0.18, 0.42), paint))
parts.append(box("Paint_Cowl", (0.42, 0, 0.72), (0.38, W - 0.28, 0.22), paint))

hood = box("Paint_Hood", (1.28, 0, 0.78), (1.62, W - 0.42, 0.08), paint)
set_origin(hood, (0.47, 0, 0.78))
hood["part"] = "hood"
parts.append(hood)

parts.append(box("Paint_Scoop_L", (0.05, 0.86, 0.58), (0.55, 0.08, 0.14), paint))
parts.append(box("Paint_Scoop_R", (0.05, -0.86, 0.58), (0.55, 0.08, 0.14), paint))
parts.append(box("Paint_Cabin", (-0.18, 0, 0.98), (1.28, W - 0.38, 0.55), paint))
parts.append(box("Paint_Roof", (-0.22, 0, 1.28), (1.05, W - 0.55, 0.1), paint))

trunk = box("Paint_Trunk", (-1.42, 0, 0.78), (1.05, W - 0.38, 0.1), paint)
set_origin(trunk, (-0.9, 0, 0.78))
trunk["part"] = "trunk"
parts.append(trunk)

parts.append(box("Paint_Deck", (-1.42, 0, 0.58), (1.0, W - 0.32, 0.28), paint))

door_l = box("Paint_Door_L", (-0.05, 0.86, 0.62), (1.05, 0.08, 0.52), paint)
set_origin(door_l, (0.45, 0.86, 0.62))
door_l["part"] = "door_l"
door_r = box("Paint_Door_R", (-0.05, -0.86, 0.62), (1.05, 0.08, 0.52), paint)
set_origin(door_r, (0.45, -0.86, 0.62))
door_r["part"] = "door_r"
parts += [door_l, door_r]

parts.append(box("Window_Front", (0.38, 0, 1.12), (0.08, W - 0.62, 0.38), glass))
parts.append(box("Window_Side_L", (-0.18, 0.7, 1.08), (0.95, 0.05, 0.32), glass))
parts.append(box("Window_Side_R", (-0.18, -0.7, 1.08), (0.95, 0.05, 0.32), glass))
parts.append(box("Window_Rear", (-0.78, 0, 1.1), (0.08, W - 0.62, 0.34), glass))
parts.append(box("Bumper_Front", (2.18, 0, 0.32), (0.14, W + 0.04, 0.16), chrome))
parts.append(box("Bumper_Rear", (-2.12, 0, 0.32), (0.14, W + 0.04, 0.16), chrome))
parts.append(box("Grill", (2.08, 0, 0.48), (0.08, 0.95, 0.22), trim))
parts.append(box("Grill_Bar", (2.1, 0, 0.48), (0.04, 0.92, 0.03), chrome))
parts.append(box("Pony", (2.12, 0, 0.48), (0.03, 0.12, 0.08), chrome))
parts.append(cylinder("Headlight_L", (2.12, 0.52, 0.5), 0.11, 0.06, light_front, rotation=(0, math.pi / 2, 0), vertices=10))
parts.append(cylinder("Headlight_R", (2.12, -0.52, 0.5), 0.11, 0.06, light_front, rotation=(0, math.pi / 2, 0), vertices=10))
parts.append(cylinder("Bezel_L", (2.1, 0.52, 0.5), 0.13, 0.04, chrome, rotation=(0, math.pi / 2, 0), vertices=10))
parts.append(cylinder("Bezel_R", (2.1, -0.52, 0.5), 0.13, 0.04, chrome, rotation=(0, math.pi / 2, 0), vertices=10))
parts.append(box("Taillight_L", (-2.12, 0.48, 0.48), (0.05, 0.28, 0.1), light_rear))
parts.append(box("Taillight_R", (-2.12, -0.48, 0.48), (0.05, 0.28, 0.1), light_rear))
parts.append(box("Mirror_L", (0.42, 0.96, 0.95), (0.12, 0.08, 0.08), chrome))
parts.append(box("Mirror_R", (0.42, -0.96, 0.95), (0.12, 0.08, 0.08), chrome))
parts.append(box("Seats", (-0.15, 0, 0.72), (0.7, 1.05, 0.22), interior))

for wx, wy, name in [
    (1.32, 0.78, "Wheel_FR"),
    (1.32, -0.78, "Wheel_FL"),
    (-1.38, 0.78, "Wheel_RR"),
    (-1.38, -0.78, "Wheel_RL"),
]:
    tire = cylinder(name, (wx, wy, 0.32), 0.32, 0.2, rubber, rotation=(math.pi / 2, 0, 0), vertices=12)
    hub = cylinder(
        name.replace("Wheel", "Hub"),
        (wx, wy, 0.32),
        0.16,
        0.22,
        chrome,
        rotation=(math.pi / 2, 0, 0),
        vertices=10,
    )
    tire["part"] = "wheel"
    parts += [tire, hub]

for obj in parts:
    parent_keep(obj, root)

bpy.ops.object.camera_add(location=(6.2, -5.2, 2.8), rotation=(math.radians(72), 0, math.radians(50)))
cam = bpy.context.active_object
cam.name = "Camera"
bpy.context.scene.camera = cam

bpy.ops.object.light_add(type="SUN", location=(4.0, -2.5, 6.0), scale=(1, 1, 1))
sun = bpy.context.active_object
sun.name = "Light"
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(40), math.radians(15), math.radians(25))

bpy.ops.object.light_add(type="AREA", location=(-2.5, 3.0, 3.5), scale=(1, 1, 1))
fill = bpy.context.active_object
fill.name = "Fill"
fill.data.energy = 250.0
fill.data.size = 4.0

world = bpy.context.scene.world
if world is None:
    world = bpy.data.worlds.new("World")
    bpy.context.scene.world = world
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.07, 0.07, 0.075, 1.0)
bg.inputs[1].default_value = 0.6

bpy.ops.object.select_all(action="DESELECT")
for obj in parts:
    obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        space = area.spaces.active
        space.shading.type = "MATERIAL"
        region = next(r for r in area.regions if r.type == "WINDOW")
        with bpy.context.temp_override(area=area, region=region):
            bpy.ops.view3d.view_selected()
        break

dims = [obj.dimensions[:] for obj in parts[:3]]
print("ok", len(parts), "dims", dims)
