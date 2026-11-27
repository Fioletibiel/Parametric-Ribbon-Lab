"""
Experimental OPTICAL grading of the existing reference-matched mesh source.
Loads the editable Blender file from v07. Replaces the high-noise physical
glass lighting with low-opacity optical shell + smooth studio environment.
Genuine 3D surfaces remain untouched. This is diagnostic, not approved art.
"""
import bpy
import math
import sys
from pathlib import Path
from mathutils import Vector

def setinp(node,names,value):
 for name in names:
  o=node.inputs.get(name)
  if o is not None:o.default_value=value;return

def make_world(scene):
 world=bpy.data.worlds.new("World / broad continuous optical studio")
 world.use_nodes=True;n=world.node_tree.nodes;n.clear();link=world.node_tree.links.new
 out=n.new('ShaderNodeOutputWorld')
 bg=n.new('ShaderNodeBackground');bg.inputs['Color'].default_value=(.022,.015,.022,1)
 bg.inputs['Strength'].default_value=1.
 img=bpy.data.images.new("Continuous elongated studio reflection",width=512,height=256,float_buffer=True)
 pixels=[]
 lights=[
   (.27,.32,.21,.17,3.8,(1.,.84,.77)),
   (.68,.35,.08,.28,2.4,(1.,.75,.71)),
   (.84,.68,.18,.10,2.1,(1.,.67,.65)),
   (.51,.86,.27,.055,2.7,(1.,.83,.77))
 ]
 for yi in range(256):
  v=yi/256
  for xi in range(512):
   u=xi/512
   R,G,B=.08,.045,.055
   for cx,cy,sx,sy,power,tint in lights:
    du=min(abs(u-cx),1-abs(u-cx))/sx
    dv=(v-cy)/sy
    z=power*math.exp(-.78*(du*du+dv*dv))
    R+=z*tint[0];G+=z*tint[1];B+=z*tint[2]
   pixels.extend((R,G,B,1.0))
 img.pixels.foreach_set(pixels)
 env=n.new('ShaderNodeTexEnvironment');env.image=img
 glossy_bg=n.new('ShaderNodeBackground')
 glossy_bg.inputs['Strength'].default_value=1.0
 link(env.outputs['Color'],glossy_bg.inputs['Color'])
 path=n.new('ShaderNodeLightPath')
 mix=n.new('ShaderNodeMixShader')
 link(path.outputs['Is Glossy Ray'],mix.inputs[0])
 link(bg.outputs['Background'],mix.inputs[1]);link(glossy_bg.outputs['Background'],mix.inputs[2])
 link(mix.outputs[0],out.inputs['Surface'])
 scene.world=world
 return img

def shell_shader():
 m=bpy.data.materials.new('SHELL / transparent Fresnel optical reconstruction')
 m.use_nodes=True;n=m.node_tree.nodes;n.clear();link=m.node_tree.links.new
 o=n.new('ShaderNodeOutputMaterial')
 tr=n.new('ShaderNodeBsdfTransparent')
 tr.inputs['Color'].default_value=(.98,.96,.96,1)
 glossy=n.new('ShaderNodeBsdfGlossy')
 glossy.inputs['Color'].default_value=(.86,.74,.72,1)
 glossy.inputs['Roughness'].default_value=.21
 layer=n.new('ShaderNodeLayerWeight');layer.inputs['Blend'].default_value=.17
 fac=n.new('ShaderNodeMapRange')
 fac.inputs['From Min'].default_value=0.;fac.inputs['From Max'].default_value=1.
 fac.inputs['To Min'].default_value=.06;fac.inputs['To Max'].default_value=.62
 fac.clamp=True
 link(layer.outputs['Fresnel'],fac.inputs['Value'])
 mix=n.new('ShaderNodeMixShader')
 link(fac.outputs['Result'],mix.inputs[0])
 link(tr.outputs[0],mix.inputs[1]);link(glossy.outputs[0],mix.inputs[2])
 link(mix.outputs[0],o.inputs['Surface'])
 return m

def film_shader(kind):
 red=kind=='wine';rear=kind=='rear'
 m=bpy.data.materials.new('OPTICAL SHEET / '+kind);m.use_nodes=True
 n=m.node_tree.nodes;n.clear();link=m.node_tree.links.new
 out=n.new('ShaderNodeOutputMaterial')
 tr=n.new('ShaderNodeBsdfTransparent')
 p=n.new('ShaderNodeBsdfPrincipled')
 setinp(p,('Base Color',),(.18,.012,.029,1) if red else (.67,.50,.48,1) if rear else (.82,.66,.59,1))
 setinp(p,('Roughness',),.21 if red else .26)
 setinp(p,('Metallic',),.06)
 setinp(p,('Transmission Weight','Transmission'),0.0)
 setinp(p,('Coat Weight','Clearcoat'),.18)
 facing=n.new('ShaderNodeLayerWeight');facing.inputs['Blend'].default_value=.29
 mapping=n.new('ShaderNodeMapRange')
 mapping.inputs['From Min'].default_value=0.;mapping.inputs['From Max'].default_value=1.
 mapping.inputs['To Min'].default_value=.35 if rear else .48
 mapping.inputs['To Max'].default_value=.64 if red else .70
 mapping.clamp=True
 link(facing.outputs['Fresnel'],mapping.inputs['Value'])
 mix=n.new('ShaderNodeMixShader')
 link(mapping.outputs['Result'],mix.inputs[0])
 link(tr.outputs[0],mix.inputs[1]);link(p.outputs[0],mix.inputs[2])
 link(mix.outputs[0],out.inputs['Surface'])
 return m

def main():
 a=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
 out=Path(a[0]) if a else Path('output/orbis_v07_grade_01.png')
 out=out.resolve();out.parent.mkdir(parents=True,exist_ok=True)
 scene=bpy.context.scene
 scene.cycles.samples=88
 scene.cycles.max_bounces=8
 scene.cycles.transmission_bounces=4
 scene.cycles.transparent_max_bounces=8
 scene.render.resolution_x=600;scene.render.resolution_y=600
 scene.render.resolution_percentage=100
 scene.render.image_settings.file_format='PNG'
 scene.render.image_settings.color_mode='RGB'
 scene.view_settings.exposure=-.08

 make_world(scene)
 for ob in bpy.data.objects:
  if ob.name.startswith('SHELL /') and ob.type=='MESH':
   ob.data.materials.clear();ob.data.materials.append(shell_shader())
   for modifier in ob.modifiers:
    if modifier.type=='SOLIDIFY':modifier.show_render=False
  if ob.type=='MESH':
   p=ob.name[:2]
   if p in ['A_','B_','C_','D_']:
    kind='wine' if p=='C_' else 'rear' if p=='A_' else 'ivory'
    ob.data.materials.clear();ob.data.materials.append(film_shader(kind))
  if ob.type=='LIGHT':
   if 'muted burgundy bounce' in ob.name:ob.data.energy=0
   else:ob.data.energy *=.22
 bg=bpy.data.objects.get('STUDIO / quiet floor')
 if bg:bg.hide_render=True
 scene.render.filepath=str(out)
 bpy.ops.wm.save_as_mainfile(filepath=str(out.with_suffix('.blend')))
 bpy.ops.render.render(write_still=True)
 print('OPTICAL_REVISION='+str(out),flush=True)

if __name__=='__main__':main()
