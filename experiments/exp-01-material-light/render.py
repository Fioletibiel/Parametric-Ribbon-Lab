"""Public, brand-neutral study: parametric ribbon materials under two lighting contexts.

Requires Blender >=4.0. No reference images, raster displacement, or external assets.
Expected use: blender -b --python render.py -- --out results --width 960 --height 540
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector

STUDIES = ("soft_satin", "silk_veil", "pearl_film", "satin_fiber")
THEMES = ("light", "dark")
CONTROL = {
    "ribbon_front": [
        (-3.0, -0.45, -0.30),
        (-2.1, -0.48,  0.53),
        (-1.0, -0.50,  0.83),
        ( 0.2, -0.55, -0.30),
        ( 1.35,-0.25, -0.37),
        ( 2.4, -0.30,  0.74),
        ( 3.05,-0.15,  0.48),
    ],
    "ribbon_back": [
        (-2.95, 0.45, -0.60),
        (-2.0,  0.55, -0.87),
        (-0.70, 0.55, -0.48),
        ( 0.40, 0.65,  0.68),
        ( 1.65, 0.50,  0.82),
        ( 2.60, 0.48,  0.06),
        ( 3.05, 0.42, -0.38),
    ],
}


def catmull_rom(knots, t):
    n = len(knots)
    t = max(0.0, min(1.0, t)) * (n - 1)
    i = min(n - 2, int(t))
    u = t - i
    a = Vector(knots[max(i - 1, 0)])
    b = Vector(knots[i])
    c = Vector(knots[i + 1])
    d = Vector(knots[min(i + 2, n - 1)])
    # Uniform Catmull-Rom. This is an *exploratory* shape, not an approved character mesh.
    return 0.5 * (
        2 * b + (-a + c) * u
        + (2*a - 5*b + 4*c - d) * u*u
        + (-a + 3*b - 3*c + d) * u*u*u
    )


def ribbon_mesh(name, knots, index, rows=192, cols=28):
    verts, faces, uv_data = [], [], []
    for i in range(rows + 1):
        t = i / rows
        p = catmull_rom(knots, t)
        tangent = (
            catmull_rom(knots, min(1.0, t + 0.001))
            - catmull_rom(knots, max(0.0, t - 0.001))
        ).normalized()
        width_axis = Vector((-tangent.z, 0.0, tangent.x)).normalized()
        twist = 0.74 * math.sin(math.tau * (t * 0.72 + index * 0.21))
        twist += 0.35 * math.sin(math.tau * (t * 1.34 - index * 0.19))
        width_axis.rotate(Quaternion(tangent, twist))
        normal_axis = tangent.cross(width_axis).normalized()
        tip = max(0.0, min(1.0, t / 0.13, (1-t) / 0.13))
        width = (0.72 + 0.13 * math.sin(math.tau * (t + 0.17 * index))) * (0.32 + 0.68 * tip)
        for j in range(cols + 1):
            v = j / cols
            lateral = (v - .5) * width
            camber = 0.17 * (1.0 - (2*v - 1)**2) * math.cos(math.tau * (t * .9 + index * .17))
            point = p + width_axis * lateral + normal_axis * camber
            verts.append(tuple(point))
    for i in range(rows):
        for j in range(cols):
            v0 = i*(cols+1)+j
            faces.append((v0, v0+cols+1, v0+cols+2, v0+1))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    uv = mesh.uv_layers.new(name="Surface UV")
    for polygon in mesh.polygons:
        for loop_id in polygon.loop_indices:
            idx = mesh.loops[loop_id].vertex_index
            u = (idx // (cols+1)) / rows
            v = (idx % (cols+1)) / cols
            uv.data[loop_id].uv = (u, v)
    return obj


def sock(node, names, value):
    for name in names:
        s = node.inputs.get(name)
        if s is not None:
            s.default_value = value
            return name
    return None


def make_material(name):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (0.81, 0.77, 0.73, 1)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    nodes.clear()
    links = m.node_tree.links
    out = nodes.new("ShaderNodeOutputMaterial")
    main = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(main.outputs["BSDF"], out.inputs["Surface"])
    main.inputs["Base Color"].default_value = (0.73, 0.71, 0.69, 1)
    if name == "pearl_film":
        main.inputs["Base Color"].default_value = (0.84, 0.80, 0.78, 1)
    elif name == "silk_veil":
        main.inputs["Base Color"].default_value = (0.77, 0.70, 0.70, 1)
    sock(main, ("Metallic",), 0.00)
    sock(main, ("IOR",), 1.43)
    sock(main, ("Specular IOR Level",), 0.55)

    config = {
        "soft_satin":  (.23, .025, .30, .62, .010),
        "silk_veil":   (.36, .25,  .44, .35, .00),
        "pearl_film":  (.13, .055, .10, .24, .20),
        "satin_fiber": (.23, .025, .30, .62, .010),
        "clay":        (.72, .00,  .00, .00, .00),
    }
    roughness, trans, sheen, anisotropy, coat = config[name]
    if name == "clay":
        main.inputs["Base Color"].default_value = (0.68, .67, .65, 1)
    sock(main, ("Roughness",), roughness)
    sock(main, ("Transmission Weight", "Transmission"), trans)
    sock(main, ("Sheen Weight", "Sheen"), sheen)
    sock(main, ("Anisotropic IOR Level", "Anisotropic", "Anisotropy"), anisotropy)
    sock(main, ("Coat Weight", "Clearcoat"), coat)

    if name == "silk_veil":
        transparent = nodes.new("ShaderNodeBsdfTransparent")
        mixer = nodes.new("ShaderNodeMixShader")
        mixer.inputs[0].default_value = 0.22
        links.remove(out.inputs["Surface"].links[0])
        links.new(main.outputs["BSDF"], mixer.inputs[1])
        links.new(transparent.outputs["BSDF"], mixer.inputs[2])
        links.new(mixer.outputs[0], out.inputs["Surface"])

    if name == "satin_fiber":
        # Very subtle texture-space roughness variation. NOT geometry lines.
        # No normal displacement; samples must still be inspected at phone scale.
        coord = nodes.new("ShaderNodeTexCoord")
        mapping = nodes.new("ShaderNodeVectorMath")
        mapping.operation = "MULTIPLY"
        mapping.inputs[1].default_value = (1.0, 6.0, 1.0)
        links.new(coord.outputs["UV"], mapping.inputs[0])
        wave = nodes.new("ShaderNodeTexWave")
        wave.wave_type = "BANDS"
        wave.bands_direction = "Y"
        wave.inputs["Scale"].default_value = 5.0
        wave.inputs["Distortion"].default_value = .08
        links.new(mapping.outputs["Vector"], wave.inputs["Vector"])
        mix = nodes.new("ShaderNodeMapRange")
        mix.inputs["From Min"].default_value = 0.0
        mix.inputs["From Max"].default_value = 1.0
        mix.inputs["To Min"].default_value = 0.21
        mix.inputs["To Max"].default_value = 0.25
        links.new(wave.outputs["Fac"], mix.inputs["Value"])
        links.new(mix.outputs["Result"], main.inputs["Roughness"])
    return m


def point_at(obj, p):
    obj.location = tuple(p)
    return obj


def area_light(name, xyz, power, size, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    point_at(obj, xyz)
    direction = -obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return obj


def create_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    geometry = []
    for i, (name, points) in enumerate(CONTROL.items()):
        geometry.append(ribbon_mesh(name, points, i))
    for obj in geometry:
        mod = obj.modifiers.new("Thin material thickness", "SOLIDIFY")
        mod.thickness = .012
        mod.offset = 0

    cam_data = bpy.data.cameras.new("Orthographic studio camera")
    camera = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(camera)
    scene = bpy.context.scene
    scene.camera = camera
    # Automatic framing based on projected source-space X/Z bounding box
    world_points = [obj.matrix_world @ v.co for obj in geometry for v in obj.data.vertices]
    minx = min(v.x for v in world_points); maxx = max(v.x for v in world_points)
    minz = min(v.z for v in world_points); maxz = max(v.z for v in world_points)
    cx = (minx + maxx) / 2; cz = (minz + maxz) / 2
    camera.location = (cx, -15.0, cz)
    camera.rotation_euler = (Vector((cx, 0, cz)) - camera.location).to_track_quat("-Z", "Y").to_euler()
    cam_data.type = "ORTHO"
    scene["bounds_x"] = maxx-minx
    scene["bounds_z"] = maxz-minz
    scene["center_x"] = cx
    scene["center_z"] = cz

    area_light("White key softbox", (-4.0, -2.4, 4.3), 580, 2.4)
    area_light("White edge", (2.4, 0.6, 3.3), 450, 2.7)
    area_light("Soft fill", (-.2, -5.3, -2.4), 105, 4.5)
    area_light("Muted red accent", (1.75, -2.6, -1.6), 165, 1.35, (.50, .055, .087))
    materials = {m: make_material(m) for m in (*STUDIES, "clay")}
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    return geometry, materials


def theme_scene(name):
    scene = bpy.context.scene
    world = bpy.data.worlds.new("World " + name) if bpy.data.worlds.get("World " + name) is None else bpy.data.worlds["World " + name]
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if name == "dark":
        bg.inputs["Color"].default_value = (.028, .030, .034, 1)
        bg.inputs["Strength"].default_value = .18
        scene.view_settings.exposure = .10
    else:
        bg.inputs["Color"].default_value = (.86, .81, .77, 1)
        bg.inputs["Strength"].default_value = .40
        scene.view_settings.exposure = .00
    scene.world = world


def render_variant(meshes, materials, mode, theme, out, width, height, samples):
    scene = bpy.context.scene
    for obj in meshes:
        obj.data.materials.clear()
        obj.data.materials.append(materials[mode])
    theme_scene(theme)
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = 100
    # Fit by vertical extent and x-extent; a 15% margin avoids cropping.
    aspect = width / height
    # In Blender, ortho_scale is horizontal view width, not vertical view height.
    scene.camera.data.ortho_scale = max(scene["bounds_x"], scene["bounds_z"] * aspect) * 1.28
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False   # Ubuntu apt Blender may lack OIDN
    scene.render.filepath = str(out / f"{mode}__{theme}.png")
    print("RENDER", mode, theme, "size", width, height,
          "samples", samples, "ortho_scale", scene.camera.data.ortho_scale, flush=True)
    bpy.ops.render.render(write_still=True)


def parse():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="out/exp01")
    p.add_argument("--width", type=int, default=900)
    p.add_argument("--height", type=int, default=520)
    p.add_argument("--samples", type=int, default=20)
    p.add_argument("--modes", nargs="+", default=["clay", *STUDIES])
    return p.parse_args(args)


def main():
    opt = parse()
    out = Path(opt.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    meshes, materials = create_scene()
    for mode in opt.modes:
        assert mode in materials, mode
        for theme in THEMES:
            render_variant(meshes, materials, mode, theme, out,
                           opt.width, opt.height, opt.samples)
    bpy.ops.wm.save_as_mainfile(filepath=str(out / "exp01-ribbon-study.blend"))
    print("DONE — this is an engineering/material study, not an approved character", flush=True)


if __name__ == "__main__":
    main()
