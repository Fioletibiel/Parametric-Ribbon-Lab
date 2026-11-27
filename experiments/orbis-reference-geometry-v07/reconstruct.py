"""
Orbis v07 — reference-calibrated source geometry (NOT another orbit of parametric leaves).

Source control: user-approved ORBIS Reconstruction Sheet / Motion Behavior Sheet.
The numerical curves below are deliberately traced on the original approved
render, in a 1000x986 rectified orb crop. Unlike v01-v06, EACH of the two edges
of EACH sculptural sheet is independently defined. Materials are generated
as Blender shader nodes; the source raster is NEVER used as texture data.

This is a stage-A STILL-only production study: verify appearance before motion.
Run: blender -b --python reconstruct.py -- --output out/exp07 --theme dark
"""
import bpy
import sys
import math
import argparse
from pathlib import Path
from mathutils import Vector

# Art-directed 2D boundary coordinates; same system as target reference crop.
# 1000x986 pixels, sphere center (500,500), physical radius 1.50.
# The z-depth function is independent for every membrane; the camera looks
# along +Y and observes genuine 3D geometry with correct parallax.
CURVES = [
  dict(name="A_PEARL_DOME",kind="rear",depth=.23,camber=.23,twist=.15,
       upper=[(44,554),(70,418),(186,251),(366,134),(554,70),(746,100),(907,255)],
       lower=[(45,554),(94,475),(235,377),(426,279),(600,194),(796,163),(953,285)]),
  dict(name="B_IVORY_SCULPTURAL_FOLD",kind="ivory",depth=-.15,camber=.22,twist=-.24,
       upper=[(57,544),(143,447),(296,340),(497,252),(684,176),(841,180),(986,385)],
       lower=[(57,548),(195,502),(373,466),(567,416),(737,350),(902,316),(983,366)]),
  dict(name="C_BURGUNDY_INTERNAL_VOLUME",kind="wine",depth=.06,camber=.29,twist=.22,
       upper=[(76,560),(197,520),(339,541),(503,584),(670,510),(819,438),(965,406)],
       lower=[(112,705),(214,816),(359,787),(503,666),(663,514),(835,454),(961,417)]),
  dict(name="D_LOWER_IVORY_RETURN",kind="ivory",depth=-.12,camber=-.30,twist=-.30,
       upper=[(262,933),(371,815),(530,719),(690,657),(858,604),(990,568)],
       lower=[(262,940),(389,984),(579,975),(754,887),(904,801),(990,573)])
]
WIDTH_SAMPLES = 34
LENGTH_SAMPLES = 140
SPHERE_R = 1.50

def add_input(node, candidates, value):
    for name in candidates:
        v=node.inputs.get(name)
        if v is not None:
            v.default_value=value
            return v
    return None

def smooth(a,b,t): return a*(1-t)+b*t

def catmull(points,t):
    # Centripetal Catmull-Rom with chord-length parametrization and no
    # dependency on scipy/external Python packages.
    if t<=0.:return points[0]
    if t>=1.:return points[-1]
    d=[0.]
    for i in range(1,len(points)):
        px,py=points[i-1];qx,qy=points[i]
        d.append(d[-1]+max(.0001,math.hypot(qx-px,qy-py)**.5))
    d=[x/d[-1] for x in d]
    k=next((i for i in range(len(d)-1) if d[i]<=t<=d[i+1]),len(d)-2)
    lo=max(0,k-1);hi=min(len(points)-1,k+2)
    p0,p1,p2,p3=points[lo],points[k],points[k+1],points[hi]
    t0=d[lo] if lo!=k else 2*d[k]-d[k+1]
    t1=d[k];t2=d[k+1]
    t3=d[hi] if hi!=k+1 else 2*d[k+1]-d[k]
    tau=(t-t1)/(t2-t1)
    result=[]
    for axis in (0,1):
        m1=(p2[axis]-p0[axis])/(t2-t0)*(t2-t1)
        m2=(p3[axis]-p1[axis])/(t3-t1)*(t2-t1)
        h00=2*tau**3-3*tau**2+1
        h10=tau**3-2*tau**2+tau
        h01=-2*tau**3+3*tau**2
        h11=tau**3-tau**2
        result.append(h00*p1[axis]+h10*m1+h01*p2[axis]+h11*m2)
    return tuple(result)

def world_from_px(x,y,depth):
    px=(x-500)/487*SPHERE_R
    pz=(500-y)/487*SPHERE_R
    # Preserve the traced 2D silhouette instead of radial-clipping all
    # control points (the kink-inducing mistake in V04-V06).
    rr=math.hypot(px,pz)
    if rr>SPHERE_R-.045:
        factor=(SPHERE_R-.045)/rr
        px*=factor;pz*=factor
    # Reduce depth smoothly near shell, preserving screen projected path.
    allowed=math.sqrt(max(.004,(SPHERE_R-.024)**2-px*px-pz*pz))-.005
    dy=max(-allowed,min(allowed,depth))
    return Vector((px,dy,pz))

def shape_location(d,u,v):
    a=catmull(d['upper'],u);b=catmull(d['lower'],u)
    x=smooth(a[0],b[0],v);y=smooth(a[1],b[1],v)
    arch=(math.sin(math.pi*v)**1.4)*d['camber']*(.45+.55*math.sin(math.pi*u))
    twist=d['twist']*(2*v-1)*math.sin(math.pi*u)
    return world_from_px(x,y,d['depth']+arch+twist)

def render_material(name,rgb,rough=.17,trans=0,ior=1.46,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    add_input(p,('Base Color',),(*rgb,1))
    add_input(p,('Roughness',),rough)
    add_input(p,('Transmission Weight','Transmission'),trans)
    add_input(p,('Metallic',),metal)
    add_input(p,('IOR',),ior)
    add_input(p,('Coat Weight','Clearcoat'),.11)
    add_input(p,('Coat Roughness','Clearcoat Roughness'),.05)
    return m

def optical_film(kind):
    red=kind=='wine';rear=kind=='rear'
    name=('C / Burgundy dielectric fabric' if red else 'A / Pearl background' if rear else 'B-D / Ivory dielectric silk')
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;links=m.node_tree.links;n.clear()
    out=n.new('ShaderNodeOutputMaterial')
    princ=n.new('ShaderNodeBsdfPrincipled')
    col=(.105,.007,.024) if red else ((.48,.37,.38) if rear else (.76,.57,.53))
    add_input(princ,('Base Color',),(*col,1))
    add_input(princ,('Roughness',),.16 if red else .13)
    add_input(princ,('Metallic',),.05)
    add_input(princ,('Transmission Weight','Transmission'),.33 if red else .52)
    add_input(princ,('IOR',),1.37)
    add_input(princ,('Coat Weight','Clearcoat'),.32)
    add_input(princ,('Coat Roughness','Clearcoat Roughness'),.07)
    translucent=n.new('ShaderNodeBsdfTransparent')
    mix=n.new('ShaderNodeMixShader')
    link=links.new
    link(translucent.outputs[0],mix.inputs[1]);link(princ.outputs[0],mix.inputs[2])
    link(mix.outputs[0],out.inputs['Surface'])
    # Facing-angle optics: broad transparent body with subtle lit edges.
    layer=n.new('ShaderNodeLayerWeight');layer.inputs['Blend'].default_value=.31
    ratio=n.new('ShaderNodeMapRange')
    ratio.inputs['From Min'].default_value=0.
    ratio.inputs['From Max'].default_value=1.
    ratio.inputs['To Min'].default_value=.24 if red else .21
    ratio.inputs['To Max'].default_value=.61 if red else .60
    ratio.clamp=True
    link(layer.outputs['Fresnel'],ratio.inputs['Value'])
    link(ratio.outputs['Result'],mix.inputs[0])
    # Microscopic material microstructure WITHOUT 210 visible line objects:
    tex=n.new('ShaderNodeTexWave');tex.wave_type='BANDS';tex.bands_direction='Y'
    tex.inputs['Scale'].default_value=78
    tex.inputs['Distortion'].default_value=.065
    tex.inputs['Detail Scale'].default_value=.7
    uv=n.new('ShaderNodeTexCoord');link(uv.outputs['UV'],tex.inputs['Vector'])
    bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.047
    bump.inputs['Distance'].default_value=.004
    link(tex.outputs['Fac'],bump.inputs['Height'])
    link(bump.outputs['Normal'],princ.inputs['Normal'])
    return m

def mesh_patch(d,material):
    vertices=[];faces=[];uv=[]
    for i in range(LENGTH_SAMPLES+1):
        u=i/LENGTH_SAMPLES
        for j in range(WIDTH_SAMPLES+1):
            v=j/WIDTH_SAMPLES
            vertices.append(shape_location(d,u,v))
            uv.append((u,v))
    for i in range(LENGTH_SAMPLES):
        for j in range(WIDTH_SAMPLES):
            a=i*(WIDTH_SAMPLES+1)+j
            faces.append((a,a+WIDTH_SAMPLES+1,a+WIDTH_SAMPLES+2,a+1))
    mesh=bpy.data.meshes.new(d['name']+'_mesh')
    mesh.from_pydata(vertices,[],faces);mesh.update()
    uv_layer=mesh.uv_layers.new(name='DESIGNED_SURFACE')
    for poly in mesh.polygons:
        poly.use_smooth=True
        for loop_index in poly.loop_indices:
            vertex_index=mesh.loops[loop_index].vertex_index
            uv_layer.data[loop_index].uv=uv[vertex_index]
    obj=bpy.data.objects.new(d['name'],mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj

def curve3d(name,points,material,radius=.004):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=16
    c.bevel_depth=radius;c.bevel_resolution=4
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for i,p in enumerate(points):s.points[i].co=(*p,1)
    obj=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(obj)
    c.materials.append(material);return obj

def emissive(name,color,strength):
    m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;n.clear()
    out=n.new('ShaderNodeOutputMaterial');e=n.new('ShaderNodeEmission')
    e.inputs['Color'].default_value=(*color,1)
    e.inputs['Strength'].default_value=strength
    m.node_tree.links.new(e.outputs[0],out.inputs['Surface'])
    return m

def add_lights():
    def area(name,location,power,sizex,sizey,color,focus=(0,0,0)):
        dat=bpy.data.lights.new(name,'AREA');dat.energy=power
        dat.shape='ELLIPSE';dat.size=sizex;dat.size_y=sizey
        dat.color=color
        ob=bpy.data.objects.new(name,dat)
        bpy.context.collection.objects.link(ob)
        ob.location=location
        ob.rotation_euler=(Vector(focus)-ob.location).to_track_quat('-Z','Y').to_euler()
        return ob
    return [
      area('01 large feathered key - left',(-3.2,-4.0,3.8),460,3.6,2.4,(1.,.86,.79)),
      area('02 narrow curved edge',(2.7,-2.0,1.8),340,.6,3.4,(1.,.79,.74)),
      area('03 rear ivory',(0.3,2.0,2.6),610,2.5,2.1,(1.,.87,.77)),
      area('04 warm bottom fill',(-.5,-4.0,-2.9),200,3.2,.7,(1.,.61,.62)),
      area('05 muted burgundy bounce',(1.0,-.8,-1.0),60,1.2,1.4,(1.,.12,.28))
    ]

def setup(theme,width,height,samples):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    sc=bpy.context.scene
    sc.render.engine='CYCLES'
    sc.cycles.device='CPU'
    sc.cycles.samples=samples
    sc.cycles.max_bounces=10
    sc.cycles.transmission_bounces=10
    sc.cycles.transparent_max_bounces=10
    if hasattr(sc.cycles,'use_denoising'):sc.cycles.use_denoising=False
    for layer in sc.view_layers:
        if hasattr(layer.cycles,'use_denoising'):layer.cycles.use_denoising=False
    sc.render.image_settings.file_format='PNG'
    sc.render.image_settings.color_mode='RGBA'
    sc.render.resolution_x=width;sc.render.resolution_y=height
    sc.render.resolution_percentage=100
    sc.render.film_transparent=False
    try:sc.view_settings.view_transform='AgX'
    except Exception:sc.view_settings.view_transform='Filmic'
    try:sc.view_settings.look='Medium High Contrast' if sc.view_settings.view_transform=='Filmic' else 'AgX - Medium High Contrast'
    except Exception:pass
    sc.view_settings.exposure=-.08 if theme=='dark' else -.2

    world=bpy.data.worlds.new('Studio World / '+theme)
    world.use_nodes=True
    background=world.node_tree.nodes.get('Background')
    background.inputs['Color'].default_value=((.018,.012,.017,1) if theme=='dark' else (.57,.51,.47,1))
    background.inputs['Strength'].default_value=(.24 if theme=='dark' else .58)
    sc.world=world
    film_ivory=optical_film('ivory')
    film_pearl=optical_film('rear')
    film_wine=optical_film('wine')
    glass=render_material('SHELL / real glass / IOR 1.48',
          (.73,.62,.61) if theme=='light' else (.37,.28,.31),.015,.98,1.48,0)
    # Substantial real glass shell with thickness generated by modifier.
    bpy.ops.mesh.primitive_uv_sphere_add(segments=192,ring_count=96,radius=SPHERE_R)
    orb=bpy.context.object;orb.name='SHELL / outer optical glass'
    for polygon in orb.data.polygons:polygon.use_smooth=True
    orb.data.materials.append(glass)
    solid=orb.modifiers.new('0.035m optical wall','SOLIDIFY')
    solid.thickness=.035;solid.offset=-1.
    bevel=orb.modifiers.new('subtle curvature continuity','SUBSURF')
    bevel.levels=1;bevel.render_levels=1

    mats={'rear':film_pearl,'ivory':film_ivory,'wine':film_wine}
    for d in CURVES:mesh_patch(d,mats[d['kind']])
    # Edge light follows real sheet boundary. A secondary broad low-intensity
    # emission strand provides a soft highlight without texture displacement.
    glow_ivory=emissive('Warm pearl glint',(.88,.64,.58),.7)
    glow_subtle=emissive('Fine ivory striation',(.58,.42,.42),.095)
    glow_wine=emissive('Burgundy signature',(.97,.075,.16),2.3)
    glow_redshadow=emissive('Red halo companion',(.35,.008,.035),.33)
    for d in CURVES:
        if d['kind']=='rear':continue
        edge_id='lower' if d['kind'] in ('wine','ivory') and d['name'].startswith('C_') else 'upper'
        if d['name'].startswith('B_'):edge_id='lower'
        if d['name'].startswith('D_'):edge_id='upper'
        edge=[shape_location(d,i/270,1. if edge_id=='lower' else 0.) for i in range(271)]
        if d['kind']=='wine':
            curve3d('SIGNATURE / red precise luminous contour',edge,glow_wine,.0037)
            curve3d('SIGNATURE / red wider subdued underedge',edge,glow_redshadow,.010)
        else:
            curve3d('PEARL / '+d['name'],edge,glow_ivory,.0028)
        # Real sub-millimetre fine grooves on the actual mesh surface;
        # restrained enough to never become visible as a wireframe network.
        if d['name'].startswith('B_') or d['name'].startswith('D_'):
            for v in (.14,.31,.52,.70,.84):
                line=[shape_location(d,i/200,v) for i in range(201)]
                curve3d('Micrograin / '+d['name']+' / '+str(v),line,glow_subtle,.0005)

    # Matte dark field, no bright rectangle reflection masquerading as glass.
    ground=render_material('Studio ground',(.019,.013,.018) if theme=='dark' else (.49,.43,.42),.53,0.,1.45,.05)
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.58))
    p=bpy.context.object;p.name='STUDIO / quiet floor';p.data.materials.append(ground)
    # Light sources are ellipse-shaped, never square/rectangular hotboxes.
    lamps=add_lights()
    if theme=='light':
        lamps[0].data.energy=530
        lamps[1].data.energy=350
        lamps[2].data.energy=360
        lamps[3].data.energy=140

    camdata=bpy.data.cameras.new('ORTHOGRAPHIC / fixed frontal image registration')
    cam=bpy.data.objects.new('Camera',camdata);bpy.context.collection.objects.link(cam)
    cam.location=(0,-8.7,0)
    cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    camdata.type='ORTHO';camdata.ortho_scale=3.48
    sc.camera=cam
    # These are clean static stills. Do not animate an unapproved geometry.
    sc.frame_start=1;sc.frame_end=1;sc.frame_set(1)
    return sc

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    ap=argparse.ArgumentParser()
    ap.add_argument('--output',default='out/orbis_reference_geom_v07')
    ap.add_argument('--theme',choices=['dark','light'],default='dark')
    ap.add_argument('--size',type=int,default=540)
    ap.add_argument('--samples',type=int,default=80)
    opt=ap.parse_args(args)
    out=Path(opt.output).resolve();out.mkdir(parents=True,exist_ok=True)
    scene=setup(opt.theme,opt.size,opt.size,opt.samples)
    file=out/('orbis_reference_geometry_'+opt.theme+'.blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(file))
    scene.render.filepath=str(out/('orbis_'+opt.theme+'_still.png'))
    print('RENDERING: '+str(scene.render.filepath),flush=True)
    bpy.ops.render.render(write_still=True)
    print('SOURCE_MODEL: '+str(file),flush=True)
    print('MESH OBJECTS: '+str(sum(1 for o in bpy.data.objects if o.type=='MESH')),flush=True)

if __name__=='__main__':main()
