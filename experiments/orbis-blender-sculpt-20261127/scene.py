"""
KONSTANTIN / ORBIS / SCULPTURAL SOURCE 01 — Blender 3.4+.
A camera-registered, genuinely editable 3D study, NOT the final approved avatar.
NO source raster is placed in the scene or used as a texture.

The approved 1000x986 Orbis crop is a reference for art-directed XYZ
coordinates. Nine individually lofted spatial surfaces form the main sculpt,
with independent upper/lower boundaries and variable depth. Materials are
geometry- and angle-aware; all transitions are carried by real 3D meshes.
A slender independent burgundy flow and actual 3D edge geometry accent the
layering. Under no condition deform a static reference image.
"""
import bpy
import sys
import math
import argparse
from pathlib import Path
from mathutils import Vector

# Each visible layer is specified by FRONT-VIEW upper/lower shape boundaries.
# Independent Y depth for BOTH boundaries creates genuine twisting 3D folds.
# Points: (screen_x,screen_y,depth_y). Camera looks along world +Y from -Y.
PROFILES=[
 dict(name='01 / high rear shell fold',family='pearl',alpha=.14,edge='upper',glow=.22,
   upper=[(70,520,.17),(92,370,.32),(210,210,.43),(380,102,.46),(580,46,.40),(765,102,.32),(918,250,.16)],
   lower=[(70,520,.12),(166,405,.54),(336,295,.57),(508,192,.60),(680,149,.47),(866,189,.26),(949,294,.08)]),
 dict(name='02 / recessed diagonal glass sail',family='smoke',alpha=.12,edge='upper',glow=.13,
   upper=[(44,555,.08),(116,289,.30),(271,160,.45),(458,65,.54),(651,57,.41),(833,126,.23),(957,289,.06)],
   lower=[(44,555,.06),(111,448,.38),(257,311,.59),(453,228,.63),(657,169,.48),(835,177,.29),(971,341,.02)]),
 dict(name='03 / broad high ivory fold',family='ivory',alpha=.22,edge='lower',glow=.40,
   upper=[(44,559,-.03),(113,463,-.07),(262,339,-.16),(454,258,-.12),(669,173,.02),(849,179,-.08),(988,360,-.09)],
   lower=[(44,560,-.03),(179,510,-.22),(329,466,-.16),(530,405,-.14),(710,331,-.01),(889,321,-.16),(994,393,-.06)]),
 dict(name='04 / exposed reflective crest',family='pearl',alpha=.32,edge='lower',glow=.52,
   upper=[(56,561,-.22),(172,475,-.35),(359,414,-.30),(534,362,-.29),(728,275,-.33),(878,292,-.21),(981,392,-.10)],
   lower=[(56,564,-.22),(201,533,-.44),(367,559,-.44),(540,567,-.30),(725,431,-.21),(861,350,-.25),(977,410,-.09)]),
 dict(name='05 / inner smoky folding chamber',family='smoke',alpha=.095,edge='none',glow=.06,
   upper=[(76,561,.34),(139,504,.39),(313,446,.45),(530,423,.60),(716,450,.35),(892,413,.25),(960,397,.10)],
   lower=[(98,732,.32),(195,821,.50),(362,812,.48),(502,677,.55),(699,526,.33),(875,475,.23),(962,439,.10)]),
 dict(name='06 / wine volume behind current',family='wine',alpha=.20,edge='none',glow=.08,
   upper=[(81,576,-.19),(227,545,-.14),(383,515,-.09),(551,472,-.10),(705,454,-.12),(864,405,-.07),(970,384,-.02)],
   lower=[(120,748,-.08),(214,801,-.07),(364,785,-.01),(527,638,-.07),(713,526,-.08),(879,466,-.08),(978,409,-.02)]),
 dict(name='07 / main burgundy blade',family='wine',alpha=.18,edge='lower',glow=.28,
   upper=[(155,816,-.36),(264,787,-.35),(395,724,-.41),(526,607,-.47),(654,506,-.42),(785,451,-.28),(948,389,-.09)],
   lower=[(177,840,-.36),(275,805,-.35),(410,743,-.41),(550,633,-.43),(684,517,-.38),(799,470,-.26),(949,401,-.09)]),
 dict(name='08 / lower illuminated ivory return',family='ivory',alpha=.27,edge='upper',glow=.56,
   upper=[(241,933,-.19),(347,819,-.16),(506,715,-.23),(686,650,-.33),(858,598,-.21),(989,563,-.05)],
   lower=[(241,937,-.19),(348,964,-.16),(524,950,-.19),(728,867,-.35),(870,816,-.26),(977,574,-.05)]),
 dict(name='09 / bottom transparent enclosure',family='smoke',alpha=.12,edge='lower',glow=.18,
   upper=[(198,897,.33),(359,842,.39),(570,781,.47),(766,711,.51),(905,691,.30),(970,565,.10)],
   lower=[(215,928,.30),(361,967,.31),(585,963,.44),(791,907,.43),(907,793,.22),(980,574,.09)]),
]
R=1.53; CX=500.;CY=500.; IMAGE_RADIUS=487.
NU=160;NV=38
def lerp(a,b,t):return a+(b-a)*t
def smoothstep(t):return t*t*(3-2*t)
def pcurve(points,t):
    # Smooth interpolation with bounded local Hermite tangents. Endpoints
    # are part of the authored model, not implicitly generated from waves.
    n=len(points)
    if t<=0:return points[0]
    if t>=1:return points[-1]
    pos=t*(n-1);i=min(n-2,int(pos));q=pos-i
    a=points[i];b=points[i+1]
    p0=points[max(0,i-1)];p3=points[min(n-1,i+2)]
    out=[]
    for axis in range(3):
        m0=(b[axis]-p0[axis])*.5
        m1=(p3[axis]-a[axis])*.5
        out.append((2*q**3-3*q*q+1)*a[axis]
                   +(q**3-2*q*q+q)*m0
                   +(-2*q**3+3*q*q)*b[axis]
                   +(q**3-q*q)*m1)
    return tuple(out)
def pos(d,u,v):
    a=pcurve(d['upper'],u);b=pcurve(d['lower'],u)
    # Progressive spatial fold (actual Y displacement), not time movement.
    px=lerp(a[0],b[0],v)
    py=lerp(a[1],b[1],v)
    depth=lerp(a[2],b[2],v)
    arch=(math.sin(math.pi*v)**1.25)*math.sin(math.pi*u)
    depth+=arch*(.12 if d['family']!='wine' else .065)
    # Preserve spatially sculpted cross-section rather than a planar loft.
    depth+=(v-.5)*math.sin(math.pi*u)*.035
    x=(px-CX)/IMAGE_RADIUS*R
    z=(CY-py)/IMAGE_RADIUS*R
    # Only DEPTH tapers as it nears the spherical wall; do not kink/clip
    # the visible silhouette by radially projecting mesh vertices.
    rr=x*x+z*z
    max_depth=math.sqrt(max(.004,(R-.014)**2-rr))
    depth=max(-max_depth,min(max_depth,depth))
    return Vector((x,depth,z))
def mk_mesh(d):
    verts=[];faces=[];uv=[]
    for i in range(NU+1):
        u=i/NU
        for j in range(NV+1):
            v=j/NV
            verts.append(pos(d,u,v))
            uv.append((u,v))
    for i in range(NU):
        for j in range(NV):
            a=i*(NV+1)+j;b=a+(NV+1)
            faces.append((a,b,b+1,a+1))
    me=bpy.data.meshes.new(d['name']+' / true 3D geometry')
    me.from_pydata(verts,[],faces);me.update()
    tex=me.uv_layers.new(name='SurfaceUV')
    for poly in me.polygons:
        poly.use_smooth=True
        for k in poly.loop_indices:
            tex.data[k].uv=uv[me.loops[k].vertex_index]
    obj=bpy.data.objects.new(d['name'],me)
    bpy.context.collection.objects.link(obj)
    return obj

def mat_translucent(name,family,opacity):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;n.clear();L=m.node_tree.links.new
    out=n.new('ShaderNodeOutputMaterial')
    tr=n.new('ShaderNodeBsdfTransparent')
    glossy=n.new('ShaderNodeBsdfGlossy')
    base={'ivory':(.83,.64,.59),'pearl':(.61,.51,.51),
          'smoke':(.25,.20,.23),'wine':(.34,.018,.063)}[family]
    glossy.inputs['Color'].default_value=(*base,1)
    glossy.inputs['Roughness'].default_value=.22 if family in ('ivory','pearl') else .32
    e=n.new('ShaderNodeEmission')
    light={'ivory':(.78,.57,.53),'pearl':(.50,.37,.38),
           'smoke':(.23,.18,.21),'wine':(.45,.016,.045)}[family]
    e.inputs['Color'].default_value=(*light,1)
    e.inputs['Strength'].default_value=.27 if family!='wine' else .17
    sheen=n.new('ShaderNodeMixShader')
    sheen.inputs[0].default_value=.24
    L(glossy.outputs[0],sheen.inputs[1]);L(e.outputs[0],sheen.inputs[2])
    w=n.new('ShaderNodeLayerWeight');w.inputs['Blend'].default_value=.24
    uv=n.new('ShaderNodeTexCoord')
    g=n.new('ShaderNodeSeparateXYZ');L(uv.outputs['UV'],g.inputs[0])
    # Small smooth increase toward band edges; a broad translucent face.
    diff=n.new('ShaderNodeMath');diff.operation='SUBTRACT';diff.inputs[1].default_value=.5
    L(g.outputs['Y'],diff.inputs[0])
    absn=n.new('ShaderNodeMath');absn.operation='ABSOLUTE';L(diff.outputs[0],absn.inputs[0])
    boundary=n.new('ShaderNodeMapRange')
    boundary.inputs['From Min'].default_value=.19
    boundary.inputs['From Max'].default_value=.49
    boundary.inputs['To Min'].default_value=0.
    boundary.inputs['To Max'].default_value=.12
    boundary.clamp=True
    L(absn.outputs[0],boundary.inputs[0])
    f=n.new('ShaderNodeMath');f.operation='MULTIPLY'
    f.inputs[1].default_value=.36
    L(w.outputs['Fresnel'],f.inputs[0])
    add=n.new('ShaderNodeMath');add.operation='ADD'
    L(f.outputs[0],add.inputs[0]);L(boundary.outputs[0],add.inputs[1])
    add2=n.new('ShaderNodeMath');add2.operation='ADD'
    add2.inputs[0].default_value=opacity
    L(add.outputs[0],add2.inputs[1])
    mix=n.new('ShaderNodeMixShader')
    L(add2.outputs[0],mix.inputs[0])
    L(tr.outputs[0],mix.inputs[1])
    L(sheen.outputs[0],mix.inputs[2])
    L(mix.outputs[0],out.inputs[0])
    return m

def emissive(name,color,power):
    m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;n.clear()
    a=n.new('ShaderNodeEmission');a.inputs['Color'].default_value=(*color,1)
    a.inputs['Strength'].default_value=power
    o=n.new('ShaderNodeOutputMaterial');m.node_tree.links.new(a.outputs[0],o.inputs[0])
    return m

def trace_curve(name,points,material,radius):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=16
    c.bevel_depth=radius;c.bevel_resolution=4
    spline=c.splines.new('POLY');spline.points.add(len(points)-1)
    for k,p in enumerate(points):spline.points[k].co=(*p,1)
    obj=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(obj)
    c.materials.append(material)
    return obj

def edge_lights(d,i,light_edge,dim_edge,wine):
    # A true 3D curve follows the mesh; no 2D halo / raster flare.
    if d['edge']!='none':
        v=0 if d['edge']=='upper' else 1
        verts=[pos(d,u/280,v) for u in range(281)]
        material=light_edge if d['family']!='wine' else wine
        trace_curve('highlight / '+d['name'],verts,material,.0027 if d['family']!='wine' else .0045)
    # Nested delicate filaments stay attached to actual surface topology.
    # Keep nearly invisible at normal viewing size, unlike the failed V04.
    if d['family'] in ('ivory','pearl'):
        for j in (0.13,.25,.38,.54,.69,.82):
            trace_curve('subtle fibrous contour / %s / %02d'%(d['name'],round(j*100)),
                [pos(d,u/180,j) for u in range(181)],dim_edge,.00034)
    if d['family']=='wine' and d['name'].startswith('07'):
        # The unmistakable narrow red signature is spatial 3D geometry, not
        # the edge of a big opaque pink leaf.
        trace_curve('signature / central red energy',
            [pos(d,u/300,.12) for u in range(301)],wine,.0038)

def glass_mat():
    # Optical hero asset: glass visible mostly at grazing angles. A full
    # physically refracting ball obscured interior in V07. This source
    # material intentionally blends transparent and glossy BSDF on an
    # actual spherical mesh. It is not a two-dimensional effect.
    m=bpy.data.materials.new('OPTICAL SHELL / grazing angle reflection')
    m.use_nodes=True;n=m.node_tree.nodes;n.clear();L=m.node_tree.links.new
    out=n.new('ShaderNodeOutputMaterial')
    tr=n.new('ShaderNodeBsdfTransparent')
    sh=n.new('ShaderNodeBsdfGlossy')
    sh.inputs['Color'].default_value=(.65,.53,.53,1)
    sh.inputs['Roughness'].default_value=.18
    w=n.new('ShaderNodeLayerWeight');w.inputs['Blend'].default_value=.15
    remap=n.new('ShaderNodeMapRange')
    remap.inputs['From Min'].default_value=0
    remap.inputs['From Max'].default_value=1
    remap.inputs['To Min'].default_value=.012
    remap.inputs['To Max'].default_value=.46
    remap.clamp=True
    L(w.outputs['Fresnel'],remap.inputs['Value'])
    m2=n.new('ShaderNodeMixShader')
    L(remap.outputs[0],m2.inputs[0])
    L(tr.outputs[0],m2.inputs[1]);L(sh.outputs[0],m2.inputs[2])
    L(m2.outputs[0],out.inputs[0])
    return m

def studio(theme):
    sc=bpy.context.scene
    world=bpy.data.worlds.new('ORBIS / STUDIO / '+theme)
    world.use_nodes=True
    back=world.node_tree.nodes.get('Background')
    back.inputs['Color'].default_value=((.018,.011,.016,1) if theme=='dark' else (.52,.45,.43,1))
    back.inputs['Strength'].default_value=.45 if theme=='dark' else .8
    sc.world=world
    def area(name,location,power,sx,sy,rgb):
        light=bpy.data.lights.new(name,'AREA');light.energy=power
        light.shape='ELLIPSE';light.size=sx;light.size_y=sy;light.color=rgb
        ob=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(ob)
        ob.location=location;ob.rotation_euler=(Vector((0,0,0))-ob.location).to_track_quat('-Z','Y').to_euler()
    # Broad soft gradients; avoid old bright rectangular hotspots.
    strength=1 if theme=='dark' else .86
    area('softbox A left upper rim',(-3.,-4.1,3.8),290*strength,3.7,2.1,(1.,.90,.84))
    area('softbox B right tall',(2.7,-3.3,1.3),220*strength,.72,3.1,(1.,.78,.74))
    area('softbox C high rear',(.5,2.1,3.4),380*strength,3.3,1.8,(1.,.80,.73))
    area('softbox D warm under',(-1.0,-3.7,-3.1),155*strength,3.6,.6,(1.,.69,.67))
    area('softbox E bordeaux fill',(1.0,-1.,-.5),32*strength,1.8,1.2,(.9,.12,.25))

def build(theme,quality,mode):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU'
    sc.cycles.samples=quality;sc.cycles.max_bounces=6
    sc.cycles.transparent_max_bounces=10;sc.cycles.transmission_bounces=3
    if hasattr(sc.cycles,'use_denoising'):sc.cycles.use_denoising=False
    for v in sc.view_layers:
        if hasattr(v.cycles,'use_denoising'):v.cycles.use_denoising=False
    sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGB'
    sc.view_settings.exposure=-.08 if theme=='dark' else -.18
    try:sc.view_settings.view_transform='AgX'
    except Exception:sc.view_settings.view_transform='Filmic'
    studio(theme)
    edge=emissive('soft warm edge / IVORY',(.89,.73,.68),1.35)
    dim=emissive('near invisible surface grain',(.45,.32,.32),.14)
    ruby=emissive('burgundy luminous contour',(.95,.067,.135),2.1)
    for i,d in enumerate(PROFILES):
        ob=mk_mesh(d)
        ob.data.materials.append(mat_translucent(d['name']+'/optical silk',d['family'],d['alpha']))
        edge_lights(d,i,edge,dim,ruby)
        if mode=='clay':
            # Geometry QA: independent hues and surfaces, no glass.
            c={'ivory':(.70,.62,.56),'pearl':(.47,.48,.54),
               'smoke':(.20,.24,.28),'wine':(.49,.07,.17)}[d['family']]
            mat=emissive('Clay / '+d['name'],c,.75)
            ob.data.materials.clear();ob.data.materials.append(mat)
    if mode!='clay':
        bpy.ops.mesh.primitive_uv_sphere_add(segments=176,ring_count=96,radius=R)
        orb=bpy.context.object;orb.name='SHELL / TRUE 3D GLASS SPHERE'
        for p in orb.data.polygons:p.use_smooth=True
        orb.data.materials.append(glass_mat())
    # Reference-free stage backdrop, minimal non-reflective shadow.
    ground=bpy.data.materials.new('Background floor');ground.use_nodes=True
    p=ground.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(.023,.015,.022,1) if theme=='dark' else (.56,.49,.46,1)
    p.inputs['Roughness'].default_value=.80
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-1.64))
    bpy.context.object.name='STUDIO / quiet floor';bpy.context.object.data.materials.append(ground)
    camdata=bpy.data.cameras.new('ORTHOGRAPHIC / registered crop')
    cam=bpy.data.objects.new('Camera',camdata);bpy.context.collection.objects.link(cam)
    cam.location=(0,-8,0)
    cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler()
    camdata.type='ORTHO';camdata.ortho_scale=3.35;sc.camera=cam
    sc.frame_start=1;sc.frame_end=1;sc.frame_set(1)
    return sc

def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',default='out/orbis-source-sculpt')
    ap.add_argument('--theme',choices=['dark','light'],default='dark')
    ap.add_argument('--mode',choices=['beauty','clay'],default='beauty')
    ap.add_argument('--size',type=int,default=660)
    ap.add_argument('--samples',type=int,default=80)
    opt=ap.parse_args(args)
    out=Path(opt.out).resolve();out.mkdir(parents=True,exist_ok=True)
    sc=build(opt.theme,opt.samples,opt.mode)
    sc.render.resolution_x=opt.size;sc.render.resolution_y=opt.size
    sc.render.resolution_percentage=100
    filename=opt.theme+'_'+opt.mode
    bpy.ops.wm.save_as_mainfile(filepath=str(out/('orbis_'+filename+'.blend')))
    sc.render.filepath=str(out/('orbis_'+filename+'.png'))
    print('RENDER / '+str(sc.render.filepath),flush=True)
    bpy.ops.render.render(write_still=True)
    print('DONE / shapes=%d'%(len(PROFILES)),flush=True)

if __name__=='__main__':main()
