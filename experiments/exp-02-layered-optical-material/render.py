"""EXP-02: three optical-material candidates on *real*, two-surface ribbon geometry.

Headless Blender 4.x; no proprietary references or raster warping.
Imported EXP-01 solely as an independent shape/control generator.
"""
from __future__ import annotations

import argparse
import importlib.util
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "exp-01-material-light" / "render.py"
spec = importlib.util.spec_from_file_location("ribbon_base", str(BASE))
base = importlib.util.module_from_spec(spec)
sys.modules["ribbon_base"] = base
spec.loader.exec_module(base)

LOOKS = ("satin_veil", "pearl_membrane", "optical_fibers")


def nodes_for(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    output = nodes.new("ShaderNodeOutputMaterial")
    return mat, nodes, links, output


def pbr(nodes, links, name, rgba, roughness, transmission, sheen, coat):
    node = nodes.new("ShaderNodeBsdfPrincipled")
    node.label = name
    base.sock(node, ("Base Color",), rgba)
    base.sock(node, ("Roughness",), roughness)
    base.sock(node, ("IOR",), 1.43)
    base.sock(node, ("Metallic",), 0.015)
    base.sock(node, ("Specular IOR Level",), 0.58)
    base.sock(node, ("Transmission Weight", "Transmission"), transmission)
    base.sock(node, ("Sheen Weight", "Sheen"), sheen)
    base.sock(node, ("Coat Weight", "Clearcoat"), coat)
    base.sock(node, ("Anisotropic", "Anisotropy", "Anisotropic IOR Level"), 0.64)
    return node


def make_carrier(kind):
    mat, nodes, links, out = nodes_for(kind + "_body")
    values = {
        "satin_veil": ((.78,.75,.73,1), .26, .035, .24, .018),
        "pearl_membrane": ((.85,.81,.78,1), .19, .045, .13, .09),
        "optical_fibers": ((.76,.74,.73,1), .27, .035, .23, .018),
    }
    rgba, r, trans, sheen, coat = values[kind]
    principled = pbr(nodes,links,"Continuous satin body",rgba,r,trans,sheen,coat)
    links.new(principled.outputs["BSDF"],out.inputs["Surface"])
    # Ultra-low-contrast directional micro-roughness, tied to UV of the surface.
    if kind == "optical_fibers":
        uv = nodes.new("ShaderNodeTexCoord")
        stretch = nodes.new("ShaderNodeVectorMath")
        stretch.operation = "MULTIPLY"
        stretch.inputs[1].default_value = (1., 7., 1.)
        links.new(uv.outputs["UV"],stretch.inputs[0])
        waves = nodes.new("ShaderNodeTexWave")
        waves.wave_type = "BANDS"
        waves.bands_direction = "Y"
        waves.inputs["Scale"].default_value = 2.4
        waves.inputs["Distortion"].default_value = .03
        links.new(stretch.outputs[0],waves.inputs["Vector"])
        ramp = nodes.new("ShaderNodeMapRange")
        ramp.inputs["To Min"].default_value = .245
        ramp.inputs["To Max"].default_value = .285
        links.new(waves.outputs["Fac"],ramp.inputs["Value"])
        links.new(ramp.outputs[0],principled.inputs["Roughness"])
    return mat


def make_veil(kind):
    mat, nodes, links, out = nodes_for(kind + "_optical_layer")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    glossy = nodes.new("ShaderNodeBsdfGlossy")
    glossy.inputs["Roughness"].default_value = {
        "satin_veil": .18, "pearl_membrane": .09, "optical_fibers": .22
    }[kind]
    glossy.inputs["Color"].default_value = {
        "satin_veil": (.92,.89,.86,1),
        "pearl_membrane": (.96,.93,.91,1),
        "optical_fibers": (.91,.89,.88,1)
    }[kind]
    layer = nodes.new("ShaderNodeLayerWeight")
    layer.inputs["Blend"].default_value = .34
    mask = nodes.new("ShaderNodeMapRange")
    mask.inputs["From Min"].default_value = .03
    mask.inputs["From Max"].default_value = .85
    # Leave much of the face transparent; keep edge glint.
    mask.inputs["To Min"].default_value = {
        "satin_veil": .025,"pearl_membrane": .07,"optical_fibers": .015
    }[kind]
    mask.inputs["To Max"].default_value = {
        "satin_veil": .37,"pearl_membrane": .61,"optical_fibers": .27
    }[kind]
    links.new(layer.outputs["Fresnel"], mask.inputs["Value"])
    mix = nodes.new("ShaderNodeMixShader")
    links.new(mask.outputs["Result"],mix.inputs[0])
    links.new(transparent.outputs["BSDF"],mix.inputs[1])
    links.new(glossy.outputs["BSDF"],mix.inputs[2])
    links.new(mix.outputs[0],out.inputs["Surface"])
    return mat


def make_fiber():
    mat, nodes, links, out = nodes_for("surface_bound_filament")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = (.94,.89,.88,1)
    emission.inputs["Strength"].default_value = .19
    links.new(emission.outputs[0],out.inputs["Surface"])
    return mat


def add_filaments(src, mat, group):
    # Exactly 6 surface-bound tracks per ribbon; physical source coordinates,
    # not freehand 2D overlay. This deliberately tests aliasing at mobile scale.
    num_cols = 28
    rows = 192
    for track in (4,8,12,16,20,24):
        curve = bpy.data.curves.new(f"{group}_track_{track}",type="CURVE")
        curve.dimensions = "3D"
        curve.resolution_u = 1
        curve.bevel_depth = .0017
        curve.bevel_resolution = 1
        spl = curve.splines.new("POLY")
        spl.points.add(rows)
        for i in range(rows+1):
            co = src.data.vertices[i*(num_cols+1)+track].co.copy()
            co.y -= .017
            spl.points[i].co = (co.x, co.y, co.z, 1)
        obj = bpy.data.objects.new(curve.name,curve)
        bpy.context.collection.objects.link(obj)
        obj.data.materials.append(mat)


def base_scene():
    objects, _ = base.create_scene()
    scene = bpy.context.scene
    # Cleaner directional source highlights, not global pink pigment.
    # EXP-01 already makes three white areas and one red area.
    for obj in bpy.data.objects:
        if obj.type == "LIGHT":
            if "red" in obj.name.lower():
                obj.data.energy = 85
                obj.data.size = 1.1
                obj.location = (.85,-.4,-1.25)
            elif "White key" in obj.name:
                obj.data.energy = 830
                obj.data.size = 2.0
                obj.location = (-2.8,-3.7,3.8)
            elif "White edge" in obj.name:
                obj.data.energy = 480
                obj.data.size = 2.25
    return objects


def clear_material_variant(objects):
    for obj in list(bpy.data.objects):
        if obj.get("EXP02"):
            bpy.data.objects.remove(obj, do_unlink=True)
    for obj in objects:
        obj.data.materials.clear()


def apply_material_variant(objects, look):
    clear_material_variant(objects)
    carrier = make_carrier(look)
    veil = make_veil(look)
    filament = make_fiber() if look == "optical_fibers" else None
    for idx, obj in enumerate(objects):
        obj.data.materials.append(carrier)
        layer = obj.copy()
        layer.data = obj.data.copy()
        bpy.context.collection.objects.link(layer)
        layer.name = obj.name + "_optical_shell"
        layer.location.y -= .028 if look != "pearl_membrane" else .042
        layer.data.materials.clear()
        layer.data.materials.append(veil)
        layer["EXP02"] = True
        for mod in list(layer.modifiers):
            layer.modifiers.remove(mod)
        if filament:
            before = {o.name for o in bpy.data.objects}
            add_filaments(obj, filament, idx)
            for o in bpy.data.objects:
                if o.name not in before: o["EXP02"] = True


def theme(name):
    base.theme_scene(name)
    scene = bpy.context.scene
    world = scene.world
    bg = world.node_tree.nodes.get("Background")
    if name == "light":
        bg.inputs["Color"].default_value=(.82,.79,.76,1)
        bg.inputs["Strength"].default_value=.78
        scene.view_settings.exposure=-.15
    else:
        bg.inputs["Color"].default_value=(.04,.039,.044,1)
        bg.inputs["Strength"].default_value=.58
        scene.view_settings.exposure=-.12


def render(objects,look,th,out,width,height,samples):
    apply_material_variant(objects,look)
    theme(th)
    scene=bpy.context.scene
    scene.render.resolution_x=width
    scene.render.resolution_y=height
    scene.render.resolution_percentage=100
    aspect=width/height
    scene.camera.data.ortho_scale=max(scene["bounds_x"],scene["bounds_z"]*aspect)*1.23
    scene.cycles.samples=samples
    scene.cycles.use_denoising=False
    scene.render.image_settings.file_format="PNG"
    scene.render.filepath=str(out / f"{look}__{th}.png")
    print(f"EXP02_RENDER {look} {th} samples={samples}",flush=True)
    bpy.ops.render.render(write_still=True)


def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p=argparse.ArgumentParser()
    p.add_argument("--out",default="out/exp02")
    p.add_argument("--width",type=int,default=900)
    p.add_argument("--height",type=int,default=520)
    p.add_argument("--samples",type=int,default=36)
    opt=p.parse_args(args)
    out=Path(opt.out).resolve()
    out.mkdir(parents=True,exist_ok=True)
    objects=base_scene()
    for look in LOOKS:
        for th in base.THEMES:
            render(objects,look,th,out,opt.width,opt.height,opt.samples)
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"exp02-layered-optical.blend"))
    print("EXP02_COMPLETE",flush=True)


if __name__=="__main__":
    main()
