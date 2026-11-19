#!/usr/bin/env python3
"""KONSTANTY / Sculptural Presence: authored 3-D reconstruction v1.
Run headless inside Blender 4.x:
  blender -b -t 4 --python sculptural-presence/build_scene.py -- --out sculptural-presence/preview --quality draft

One 3D scene, five distinct artist-authored folded surfaces. Reference artwork is
NOT opened by the renderer. It is NOT used as texture, displacement or animation.
The explicit control cages are a starting reconstruction, not an approved match.
"""
from __future__ import annotations

import argparse
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

# UV coordinates refer to the *art area* of the approved Sculptural Flow card.
# v rises upward. Unlike earlier sine-based families, each sheet has TWO
# independently authored nonuniform border curves and true depth in Blender.
# Each curve below is a hand-authored geometric estimate, not image pixels.
FOLDS = [
    dict(name="LEFT_RETURN", depth=.37, relief=.20, opacity=.30, filament_count=47,
         top=[(.02,.39),(.04,.60),(.12,.76),(.23,.72),(.32,.56),(.42,.50),(.53,.62),(.68,.74),(.81,.73),(.97,.57)],
         bottom=[(.11,.28),(.08,.44),(.13,.57),(.22,.54),(.31,.38),(.40,.31),(.51,.41),(.67,.59),(.83,.66),(.99,.51)]),
    dict(name="UPPER_ARCH", depth=.70, relief=.30, opacity=.30, filament_count=49,
         top=[(.19,.64),(.27,.77),(.37,.91),(.47,.94),(.57,.86),(.63,.70),(.69,.63),(.79,.77),(.89,.82),(.99,.57)],
         bottom=[(.18,.59),(.29,.62),(.39,.73),(.49,.77),(.57,.64),(.64,.43),(.72,.46),(.82,.63),(.93,.68),(.99,.50)]),
    dict(name="CENTER_CROSSING", depth=-.67, relief=.30, opacity=.39, filament_count=54,
         top=[(.06,.65),(.18,.71),(.30,.65),(.40,.51),(.49,.46),(.60,.60),(.72,.79),(.83,.80),(.94,.69),(.98,.47)],
         bottom=[(.10,.45),(.20,.49),(.32,.32),(.43,.28),(.53,.33),(.64,.49),(.75,.62),(.84,.69),(.94,.59),(.97,.34)]),
    dict(name="INNER_CRIMSON", depth=-.10, relief=.22, opacity=.30, filament_count=47, crimson=True,
         top=[(.16,.37),(.27,.31),(.37,.27),(.46,.36),(.55,.52),(.65,.68),(.76,.75),(.87,.72),(.95,.53),(.98,.34)],
         bottom=[(.18,.25),(.29,.17),(.39,.18),(.47,.29),(.56,.40),(.68,.55),(.78,.64),(.89,.62),(.97,.46),(.98,.29)]),
    dict(name="LOWER_RETURN", depth=.53, relief=.17, opacity=.23, filament_count=45,
         top=[(.06,.37),(.14,.28),(.25,.21),(.36,.20),(.45,.30),(.54,.45),(.63,.54),(.73,.51),(.87,.42),(.98,.34)],
         bottom=[(.08,.29),(.16,.18),(.27,.12),(.37,.13),(.48,.18),(.58,.29),(.67,.35),(.77,.34),(.89,.29),(.98,.24)]),
]

DARK = {
    "background":(0.026,.026,.030,1),
    "silk":(.85,.81,.78,1),"red_silk":(.52,.21,.30,1),
    "fiber":(.93,.88,.85,1),"red_fiber":(.74,.30,.36,1),
    "glint":(1.0,.88,.83,1),"red_glint":(.84,.16,.29,1),
    "white_key":430,"rim":275,"red_key":160,
}
LIGHT = {
    "background":(.79,.74,.70,1),
    "silk":(.55,.43,.42,1),"red_silk":(.48,.18,.26,1),
    "fiber":(.50,.38,.37,1),"red_fiber":(.60,.17,.28,1),
    "glint":(1.,.92,.87,1),"red_glint":(.72,.14,.23,1),
    "white_key":340,"rim":190,"red_key":110,
}

def catmull(knots,t):
    """Cubic Catmull-Rom for separate boundary contours, clamped ends."""
    x=max(0.,min(.999999,t))*(len(knots)-1)
    i=int(x);u=x-i
    a=knots[max(0,i-1)];b=knots[i];c=knots[min(len(knots)-1,i+1)];d=knots[min(len(knots)-1,i+2)]
    return tuple(.5*((2*b[j])+(-a[j]+c[j])*u+(2*a[j]-5*b[j]+4*c[j]-d[j])*u*u+(-a[j]+3*b[j]-3*c[j]+d[j])*u*u*u) for j in range(2))

def xyz(fold,t,s):
    """Loft from two independent outlines, with actual depth and smooth cross-camber."""
    a=catmull(fold["top"],t);b=catmull(fold["bottom"],t)
    # The surfaces have distinct boundaries and local twist/depth; the geometry,
    # not an image, is what is rendered and animated.
    x=a[0]*(1-s)+b[0]*s
    z=a[1]*(1-s)+b[1]*s
    depth=fold["depth"]+fold["relief"]*(s-.5)*math.cos(math.pi*t)
    depth+=.095*math.sin(math.pi*s)*math.sin(math.pi*t) # shallow controlled camber
    return ((x-.5)*7.9,depth,(z-.5)*3.65)

def mat_socket(p,*names):
    for name in names:
        q=p.inputs.get(name)
        if q is not None: return q
    raise RuntimeError("Missing sockets "+str(names))

def surface_material(name,color,opacity):
    m=bpy.data.materials.new(name);m.use_nodes=True
    tree=m.node_tree;tree.nodes.clear()
    out=tree.nodes.new("ShaderNodeOutputMaterial")
    base=tree.nodes.new("ShaderNodeBsdfPrincipled")
    mat_socket(base,"Base Color").default_value=color
    mat_socket(base,"Roughness").default_value=.34
    mat_socket(base,"Metallic").default_value=.015
    for names,value in [(("Coat Weight","Clearcoat"),.24),(("Coat Roughness","Clearcoat Roughness"),.20),
        (("Sheen Weight","Sheen"),.32),(("Transmission Weight","Transmission"),.12)]:
        try:mat_socket(base,*names).default_value=value
        except RuntimeError:pass
    trans=tree.nodes.new("ShaderNodeBsdfTransparent")
    mix=tree.nodes.new("ShaderNodeMixShader")
    layer=tree.nodes.new("ShaderNodeLayerWeight");layer.inputs["Blend"].default_value=.45
    mult=tree.nodes.new("ShaderNodeMath");mult.operation="MULTIPLY";mult.inputs[1].default_value=.20
    add=tree.nodes.new("ShaderNodeMath");add.operation="ADD";add.inputs[1].default_value=opacity
    tree.links.new(layer.outputs["Fresnel"],mult.inputs[0])
    tree.links.new(mult.outputs[0],add.inputs[0])
    tree.links.new(add.outputs[0],mix.inputs[0])
    tree.links.new(trans.outputs[0],mix.inputs[1])
    tree.links.new(base.outputs[0],mix.inputs[2])
    tree.links.new(mix.outputs[0],out.inputs["Surface"])
    return m

def light_material(name,color,strength=0.14):
    m=bpy.data.materials.new(name);m.use_nodes=True
    tree=m.node_tree;tree.nodes.clear()
    out=tree.nodes.new("ShaderNodeOutputMaterial")
    em=tree.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value=color
    em.inputs["Strength"].default_value=strength
    trans=tree.nodes.new("ShaderNodeBsdfTransparent")
    mix=tree.nodes.new("ShaderNodeMixShader");mix.inputs[0].default_value=.56
    tree.links.new(trans.outputs[0],mix.inputs[1])
    tree.links.new(em.outputs[0],mix.inputs[2])
    tree.links.new(mix.outputs[0],out.inputs["Surface"])
    return m

def new_mesh(fold,collection):
    cols=36;rows=138
    verts=[];faces=[]
    for i in range(rows+1):
        for j in range(cols+1):
            verts.append(xyz(fold,i/rows,j/cols))
    for i in range(rows):
        for j in range(cols):
            p=i*(cols+1)+j
            faces.append((p,p+1,p+cols+2,p+cols+1))
    mesh=bpy.data.meshes.new(fold["name"]+"__DATA")
    mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new("FOLD__"+fold["name"],mesh);collection.objects.link(obj)
    for poly in mesh.polygons:poly.use_smooth=True
    obj["fold_role"]=fold["name"]
    obj["reconstruction"]="two independently drawn contour splines, actual 3D loft"
    return obj

def make_fibers(fold,collection,material,red_material):
    """Real spline curves following exactly the same loft as their carrier."""
    n=fold["filament_count"];res=150
    c=bpy.data.curves.new("SILK__"+fold["name"],"CURVE");c.dimensions="3D"
    c.bevel_resolution=2;c.resolution_u=1;c.bevel_depth=.00145
    c.materials.append(material);c.materials.append(red_material)
    for j in range(n):
        # Jitter spacing in PARAMETRIC coordinates, not random on-screen pixels.
        center=(j+.5)/n
        s=max(.015,min(.985,center+.005*math.sin(j*2.23)))
        sp=c.splines.new("POLY");sp.points.add(res)
        sp.material_index=1 if fold.get("crimson") and j%5 in (0,1) else 0
        for i,p in enumerate(sp.points):
            t=i/res
            v=xyz(fold,t,s)
            # Offset just in front of the same actual 3D surface to avoid z-fight.
            p.co=(v[0],v[1]-.0075,v[2],1.)
            p.radius=(.26+.73*math.sin(math.pi*t)**.58)*(.68+.25*math.sin(j*1.31)**2)
    o=bpy.data.objects.new("FIBERS__"+fold["name"],c);collection.objects.link(o)
    return o

def make_glints(fold,collection,white_mat,red_mat):
    """Sparse continuous 3D highlight guide splines, following real contours."""
    c=bpy.data.curves.new("SPECULAR__"+fold["name"],"CURVE");c.dimensions="3D"
    c.resolution_u=1;c.bevel_resolution=3;c.bevel_depth=.006
    c.materials.append(white_mat);c.materials.append(red_mat)
    # Only few highlights. Most of a fold should remain in half-shadow.
    lanes=(.06,.90) if fold["name"]=="CENTER_CROSSING" else (.085,)
    for s in lanes:
        sp=c.splines.new("POLY");sp.points.add(155)
        sp.material_index=1 if fold.get("crimson") else 0
        for i,p in enumerate(sp.points):
            t=i/155
            v=xyz(fold,t,s)
            p.co=(v[0],v[1]-.012,v[2],1.)
            # Localized strong shine rather than constant neon outline
            peak=.75*math.exp(-((t-(.47 if s>.5 else .66))/.20)**2)
            p.radius=(.09+.91*peak)*math.sin(math.pi*t)**.52
    obj=bpy.data.objects.new("SPECULAR__"+fold["name"],c);collection.objects.link(obj)
    return obj

def target(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()

def area(name,loc,at,size,energy,color,size_y=None):
    d=bpy.data.lights.new(name,"AREA");d.energy=energy;d.color=color
    d.shape="RECTANGLE";d.size=size;d.size_y=size_y or size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o)
    o.location=loc;target(o,at);return o

def background_material(color):
    m=bpy.data.materials.new("BACKGROUND");m.use_nodes=True
    n=m.node_tree.nodes;n.clear();out=n.new("ShaderNodeOutputMaterial")
    em=n.new("ShaderNodeEmission");em.inputs["Color"].default_value=color
    m.node_tree.links.new(em.outputs[0],out.inputs[0]);return m

def configure_render(quality):
    s=bpy.context.scene
    s.render.engine="CYCLES";s.cycles.device="CPU"
    s.cycles.samples=18 if quality=="draft" else 56
    # Ubuntu Blender packages may be compiled without OpenImageDenoiser.
    s.cycles.use_denoising=False
    try: s.view_layers[0].cycles.use_denoising=False
    except Exception: pass
    s.cycles.max_bounces=7
    s.cycles.transparent_max_bounces=16
    s.render.resolution_x=1120 if quality=="draft" else 1480
    s.render.resolution_y=520 if quality=="draft" else 685
    s.render.resolution_percentage=100
    s.render.image_settings.file_format="PNG"
    s.render.film_transparent=False
    s.view_settings.view_transform="AgX"
    try:s.view_settings.look="Medium High Contrast"
    except Exception:pass
    if s.world is None:s.world=bpy.data.worlds.new("WORLD__KONSTANTY")
    s.world.use_nodes=True
    bg=s.world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value=(.27,.25,.26,1)
    bg.inputs["Strength"].default_value=.45
    # Gentle highlight bloom on real geometry, never a fake raster displacement.
    s.use_nodes=True;nt=s.node_tree;nt.nodes.clear()
    inp=nt.nodes.new("CompositorNodeRLayers");out=nt.nodes.new("CompositorNodeComposite")
    glare=nt.nodes.new("CompositorNodeGlare")
    glare.glare_type="FOG_GLOW";glare.quality="HIGH";glare.threshold=1.10
    glare.mix=-.86
    nt.links.new(inp.outputs["Image"],glare.inputs["Image"])
    nt.links.new(glare.outputs["Image"],out.inputs["Image"])
    return s

def make_scene(quality):
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    scene=configure_render(quality)
    fold_collection=bpy.data.collections.new("01 / SEMANTIC FOLDS")
    scene.collection.children.link(fold_collection)
    filament_collection=bpy.data.collections.new("02 / MICROFIBERS 3D")
    scene.collection.children.link(filament_collection)
    crest_collection=bpy.data.collections.new("03 / OPTICAL CRESTS")
    scene.collection.children.link(crest_collection)
    # Recreate materials per theme, without changing geometry.
    data={}
    for label,palette in (("dark",DARK),("light",LIGHT)):
        data[label]=dict(
            fabric=surface_material("SILK__"+label,palette["silk"],.28 if label=="dark" else .37),
            redfabric=surface_material("INNER__"+label,palette["red_silk"],.29 if label=="dark" else .34),
            fiber=light_material("FIBER__"+label,palette["fiber"],.20 if label=="dark" else .14),
            redfiber=light_material("RED_FIBER__"+label,palette["red_fiber"],.19),
            crest=light_material("CREST__"+label,palette["glint"],1.8 if label=="dark" else 1.22),
            redcrest=light_material("RED_CRESt__"+label,palette["red_glint"],1.1 if label=="dark" else .78)
        )
    objects=[]
    for fold in FOLDS:
        surf=new_mesh(fold,fold_collection)
        fiber=make_fibers(fold,filament_collection,data["dark"]["fiber"],data["dark"]["redfiber"])
        crest=make_glints(fold,crest_collection,data["dark"]["crest"],data["dark"]["redcrest"])
        surf.data.materials.append(data["dark"]["redfabric"] if fold.get("crimson") else data["dark"]["fabric"])
        objects.append((fold,surf,fiber,crest))
    camdata=bpy.data.cameras.new("CAMERA__frontal_hero")
    cam=bpy.data.objects.new("CAMERA__frontal_hero",camdata)
    bpy.context.collection.objects.link(cam)
    cam.location=(0,-13,0);target(cam,(0,0,.015))
    camdata.type="ORTHO";camdata.ortho_scale=3.95
    scene.camera=cam
    # Background is emission-only; angle neutral; no screen-space pasted graphics.
    backdrop=bpy.data.meshes.new("BACKGROUND__mesh")
    backdrop.from_pydata([(-8,3,-4),(8,3,-4),(8,3,4),(-8,3,4)],[],[(0,1,2,3)])
    bgobj=bpy.data.objects.new("BACKGROUND__emissive",backdrop)
    bpy.context.collection.objects.link(bgobj)
    bgdark=background_material(DARK["background"]);bglight=background_material(LIGHT["background"])
    bgobj.data.materials.append(bgdark)
    lights=[
        area("LIGHT__pearlescent_key",(-2.1,-3.8,3.3),(0,0,0),4.5,430,(1,.93,.88),2.2),
        area("LIGHT__cool_rim",(2.9,.15,3.5),(.2,0,0),3.2,275,(.88,.92,1),1.4),
        area("LIGHT__recess_crimson",(1.55,-1.3,-1.05),(.6,.1,0),1.4,160,(.72,.08,.15),.75),
    ]
    scene["art_direction"]="Sculptural Flow approved image; construction is NOT approved"
    scene["raster_used"]="none"
    return objects,data,(bgobj,bgdark,bglight),lights

def theme_scene(objects,data,background,lights,theme):
    mat=data[theme];bgobj,bgdark,bglight=background
    for fold,surf,fib,crest in objects:
        surf.data.materials.clear()
        surf.data.materials.append(mat["redfabric"] if fold.get("crimson") else mat["fabric"])
        fib.data.materials.clear();fib.data.materials.append(mat["fiber"]);fib.data.materials.append(mat["redfiber"])
        crest.data.materials.clear();crest.data.materials.append(mat["crest"]);crest.data.materials.append(mat["redcrest"])
    bgobj.data.materials.clear();bgobj.data.materials.append(bgdark if theme=="dark" else bglight)
    colors=DARK if theme=="dark" else LIGHT
    for light,key in zip(lights,("white_key","rim","red_key")):light.data.energy=colors[key]
    bpy.context.scene["theme"]=theme

def render_clay(objects,background,out):
    folds=[f for _,f,_,_ in objects];other=[o for _,_,fiber,crest in objects for o in (fiber,crest)]
    for o in other:o.hide_render=True
    old=[list(o.data.materials) for o in folds]
    claycolors=[(.49,.54,.57,1),(.65,.57,.48,1),(.83,.83,.79,1),(.53,.35,.42,1),(.34,.45,.48,1)]
    clays=[]
    for color in claycolors:
        m=bpy.data.materials.new("DIAGNOSTIC_CLAY__"+str(len(clays)));m.diffuse_color=color
        m.use_nodes=True;bsdf=m.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value=color;bsdf.inputs["Roughness"].default_value=.88
        clays.append(m)
    for o,m in zip(folds,clays):o.data.materials.clear();o.data.materials.append(m)
    backdrop=background[0];oldbg=list(backdrop.data.materials)
    backdrop.data.materials.clear();backdrop.data.materials.append(background_material((.07,.07,.075,1)))
    bpy.context.scene.render.filepath=str(out/"sculptural-clay.png")
    bpy.ops.render.render(write_still=True)
    for o,original in zip(folds,old):
        o.data.materials.clear()
        for m in original:o.data.materials.append(m)
    backdrop.data.materials.clear()
    for m in oldbg:backdrop.data.materials.append(m)
    for o in other:o.hide_render=False

def main():
    args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p=argparse.ArgumentParser();p.add_argument("--out",type=Path,default=Path("sculptural-presence/preview"))
    p.add_argument("--quality",choices=("draft","review"),default="draft")
    o=p.parse_args(args);o.out.mkdir(parents=True,exist_ok=True)
    objects,data,background,lights=make_scene(o.quality)
    render_clay(objects,background,o.out)
    for theme in ("dark","light"):
        theme_scene(objects,data,background,lights,theme)
        bpy.context.scene.render.filepath=str(o.out/f"sculptural-{theme}.png")
        bpy.ops.render.render(write_still=True)
    theme_scene(objects,data,background,lights,"dark")
    bpy.ops.wm.save_as_mainfile(filepath=str(o.out/"KONSTANTY_sculptural_presence.blend"))
    try:
        bpy.ops.export_scene.gltf(filepath=str(o.out/"KONSTANTY_sculptural_presence.glb"),
            export_format="GLB",export_apply=True)
    except Exception as e:print("GLB_EXPORT_WARNING",repr(e))
    print("RESULT_OK",[(x.name,x.stat().st_size) for x in sorted(o.out.glob("*"))])
if __name__=="__main__":
    main()
