"""EXP-03 — generic editable glass-presence prototype, NOT approved KONSTANTIN art.
Blender Cycles render from actual 3D mesh with animated SHAPE KEYS.
Unlike raster glow or screen-space shader, all structure has 3D coordinates.
To reproduce: blender -b --python render.py -- --out out/exp03
"""
import argparse, math, sys
from pathlib import Path
import bpy
from mathutils import Vector

RADIUS=1.48
ROWS=96
COLS=22
POSES=("Basis","Listen","SpeakA","SpeakB")

def set_input(node, names, value):
    for name in names:
        inp=node.inputs.get(name)
        if inp is not None:
            inp.default_value=value
            return

def principled(name, color, roughness, transmission=0.0, metallic=0.0, ior=1.45):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    set_input(p,("Base Color",),(*color,1))
    set_input(p,("Roughness",),roughness)
    set_input(p,("Transmission Weight","Transmission"),transmission)
    set_input(p,("Metallic",),metallic)
    set_input(p,("IOR",),ior)
    set_input(p,("Coat Weight","Clearcoat"),0.02)
    return m

def glow_mat(name, color, strength):
    m=bpy.data.materials.new(name)
    m.use_nodes=True
    n=m.node_tree.nodes;n.clear()
    out=n.new("ShaderNodeOutputMaterial")
    em=n.new("ShaderNodeEmission")
    em.inputs["Color"].default_value=(*color,1)
    em.inputs["Strength"].default_value=strength
    m.node_tree.links.new(em.outputs[0],out.inputs["Surface"])
    return m

def mix_film(name, color, opacity, roughness=0.16):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;n.clear()
    out=n.new("ShaderNodeOutputMaterial")
    p=n.new("ShaderNodeBsdfPrincipled")
    set_input(p,("Base Color",),(*color,1))
    set_input(p,("Roughness",),roughness)
    set_input(p,("Metallic",),0.06)
    t=n.new("ShaderNodeBsdfTransparent")
    mix=n.new("ShaderNodeMixShader")
    mix.inputs[0].default_value=opacity
    l=m.node_tree.links
    l.new(t.outputs[0],mix.inputs[1])
    l.new(p.outputs[0],mix.inputs[2])
    l.new(mix.outputs[0],out.inputs["Surface"])
    return m

def loc(layer,u,v,pose):
    x=-1.15+2.30*u
    bell=max(0.0, math.sin(math.pi*u))**0.72
    base=.43*(u-.47)+.32*math.sin(math.pi*1.35*u-.60+layer*.52)
    shift=(.075*math.sin(math.tau*1.30*u+.4) if pose=="Listen" else
           .14*math.sin(math.tau*1.55*u+1.2) if pose=="SpeakA" else
          -.16*math.cos(math.tau*1.20*u+.20) if pose=="SpeakB" else 0.0)
    z=base+shift+v*bell*(.39 if layer==0 else .51)
    y=(-.21 if layer==0 else .24) + .21*math.sin(math.pi*1.7*u+layer*.8)
    y+=v*.20*math.cos(2.6*math.pi*u+layer*.55)
    y+= (.065 if pose.startswith("Speak") else .025 if pose=="Listen" else 0)*math.sin(math.pi*u)
    return (x,y,z)

def animated_obj(name, verts_by_pose, faces, material):
    mesh=bpy.data.meshes.new(name+"_mesh")
    mesh.from_pydata(verts_by_pose["Basis"],[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    for poly in mesh.polygons:poly.use_smooth=True
    for pose in POSES:
        key=obj.shape_key_add(name=pose,from_mix=False)
        for i,co in enumerate(verts_by_pose[pose]):
            key.data[i].co=co
    kb=obj.data.shape_keys.key_blocks
    for pose,steps in {
       "Listen":[(1,0),(12,0),(22,1),(29,1),(35,0),(70,0),(80,0)],
       "SpeakA":[(1,0),(34,0),(42,1),(48,0),(55,.85),(61,0),(80,0)],
       "SpeakB":[(1,0),(34,0),(42,0),(48,.82),(55,0),(61,1),(70,0),(80,0)]
    }.items():
        for f,val in steps:
            kb[pose].value=val
            kb[pose].keyframe_insert(data_path="value",frame=f)
    return obj

def sheet(layer,material):
    v_by={}
    for pose in POSES:
        v_by[pose]=[loc(layer,i/ROWS,2*j/COLS-1,pose) for i in range(ROWS+1) for j in range(COLS+1)]
    faces=[]
    for i in range(ROWS):
        for j in range(COLS):
            a=i*(COLS+1)+j
            faces.append((a,a+COLS+1,a+COLS+2,a+1))
    return animated_obj("InternalFilm_"+str(layer),v_by,faces,material)

def filament(name,layer,v,material,rad=.0055):
    segments=150; sides=6
    poses={}
    for pose in POSES:
        points=[]
        for i in range(segments+1):
            u=.025+.95*i/segments
            p=Vector(loc(layer,u,v,pose))
            tangent=(Vector(loc(layer,min(1.,u+.003),v,pose))-Vector(loc(layer,max(0,u-.003),v,pose))).normalized()
            a=Vector((0,1,0))
            normal=tangent.cross(a).normalized()
            binormal=tangent.cross(normal).normalized()
            for q in range(sides):
                phi=2*math.pi*q/sides
                point=p+rad*(math.cos(phi)*normal+math.sin(phi)*binormal)
                points.append(tuple(point))
        poses[pose]=points
    faces=[]
    for i in range(segments):
        for q in range(sides):
            a=i*sides+q;b=i*sides+(q+1)%sides
            c=(i+1)*sides+(q+1)%sides;d=(i+1)*sides+q
            faces.append((a,b,c,d))
    return animated_obj(name,poses,faces,material)

def aim(obj,at):
    obj.rotation_euler=(Vector(at)-obj.location).to_track_quat("-Z","Y").to_euler()

def area(name, xyz, energy, w,h, color=(1,1,1), target=(0,0,0)):
    data=bpy.data.lights.new(name,"AREA")
    data.energy=energy;data.shape="RECTANGLE"
    data.size=w;data.size_y=h;data.color=color
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    obj.location=xyz;aim(obj,target)
    return obj

def scene_setup():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene
    scene.render.engine="CYCLES"
    scene.cycles.device="CPU"
    # Ubuntu apt Blender is built without OpenImageDenoiser; force it off.
    if hasattr(scene.cycles,"use_denoising"):
        scene.cycles.use_denoising=False
    for layer in scene.view_layers:
        if hasattr(layer.cycles,"use_denoising"):
            layer.cycles.use_denoising=False
    scene.cycles.max_bounces=8
    scene.cycles.transparent_max_bounces=8
    scene.cycles.transmission_bounces=8
    scene.render.image_settings.file_format="PNG"
    scene.render.image_settings.color_mode="RGB"
    try: scene.view_settings.view_transform="AgX"
    except Exception: scene.view_settings.view_transform="Filmic"
    scene.view_settings.look="Medium High Contrast" if scene.view_settings.view_transform=="Filmic" else "AgX - Medium High Contrast"
    scene.view_settings.exposure=0.
    scene.view_settings.gamma=1.
    # The shell is a CLOSED refractive glass surface, not an alpha-composited fake sphere.
    glass=principled("01 - Clear smoky glass / physical transmission",(.51,.48,.49),.022,.965,0.,1.47)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128,ring_count=72,radius=RADIUS)
    shell=bpy.context.object
    shell.name="GLASS_SHELL - ray-traced"
    for p in shell.data.polygons:p.use_smooth=True
    shell.data.materials.append(glass)
    # Make rear region readable and avoid visual clash of too many strands.
    wine=mix_film("02 - Wine microfilm",(.27,.018,.035),.32,.16)
    pearl=mix_film("03 - Transparent graphite-ivory film",(.70,.61,.60),.25,.10)
    sheet(0,wine)
    sheet(1,pearl)
    red=glow_mat("04 - Luminous narrow burgundy signature",(.64,.023,.063),2.6)
    white=glow_mat("05 - Warm restrained ivory rim",(.87,.72,.63),.42)
    filament("Luminous flowing signature",0,-.27,red,.008)
    filament("Fine secondary specular",1,.86,white,.004)
    # A limited set of surface-registered microfilaments, NOT 2D sine wave overlays.
    for track in (-.65,-.3,.2,.62):
        filament("Warm trace "+str(track),1,track,white,.0018)
    # Lower neutral surface is minimal and nearly non-reflective.
    floor=principled("Matte background ground",(.04,.035,.038),.7,0.)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.56))
    bpy.context.object.name="Backdrop";bpy.context.object.data.materials.append(floor)
    # Camera is fixed. Geometry contains the actual animated shape keys.
    cam_data=bpy.data.cameras.new("Fixed camera")
    cam=bpy.data.objects.new("Camera",cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location=(0,-7.5,.05);aim(cam,(0,0,0))
    cam_data.type="ORTHO";cam_data.ortho_scale=3.72
    scene.camera=cam
    area("Key softbox – bright broad upper left",(-2.9,-2.5,3.1),940,2.45,1.55)
    area("Crescent strip – left edge",(-3.1,-.4,1.3),500,.5,3.3)
    area("Long rear ivory rim",(1.9,1.2,2.6),790,1.6,2.0)
    area("Underfill neutral",(1.5,-3.,-1.2),270,2.6,.65)
    area("Muted red bounce",(.45,-.4,-.7),40,1.4,1.,(.75,.12,.18))
    scene.frame_start=1;scene.frame_end=80;scene.render.fps=24
    return scene

def change_theme(theme):
    scene=bpy.context.scene
    if not scene.world:scene.world=bpy.data.worlds.new("World")
    scene.world.use_nodes=True
    bg=scene.world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value=((.015,.013,.017,1) if theme=="dark" else (.48,.44,.42,1))
    bg.inputs["Strength"].default_value=(.35 if theme=="dark" else .74)
    floor=bpy.data.objects.get("Backdrop")
    p=floor.data.materials[0].node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value= ((.021,.018,.025,1) if theme=="dark" else (.71,.66,.64,1))
    scene.view_settings.exposure=(0.0 if theme=="dark" else -.13)

def main():
    argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    p=argparse.ArgumentParser()
    p.add_argument("--out",default="out/exp03")
    p.add_argument("--width",type=int,default=480)
    p.add_argument("--height",type=int,default=480)
    p.add_argument("--samples",type=int,default=24)
    opt=p.parse_args(argv)
    out=Path(opt.out).resolve();out.mkdir(parents=True,exist_ok=True)
    scene=scene_setup()
    scene.cycles.samples=opt.samples
    scene.render.resolution_x=opt.width;scene.render.resolution_y=opt.height
    scene.render.resolution_percentage=100
    scene.frame_set(1)
    change_theme("dark")
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"orbital-glass-animated-source.blend"))
    for theme in ("dark","light"):
        change_theme(theme)
        for frame in (1,22,42,48,55,61):
            scene.frame_set(frame)
            scene.render.filepath=str(out / ("%s_frame_%03d.png"%(theme,frame)))
            print("RENDER %s frame %d"%(theme,frame),flush=True)
            bpy.ops.render.render(write_still=True)
    scene.frame_set(1)
    change_theme("dark")
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"orbital-glass-animated-source.blend"))
    print("DONE: all images and an EDITABLE Blender project with animated shape keys",flush=True)
if __name__=="__main__":main()
