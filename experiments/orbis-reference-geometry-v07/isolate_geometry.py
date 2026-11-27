"""Diagnostic only — show the actual authored 3D surfaces, not glass/reflections."""
import bpy,sys
from pathlib import Path
out=Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else Path('geometry.png')
out=out.resolve();out.parent.mkdir(parents=True,exist_ok=True)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=720;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.image_settings.color_mode='RGB'
scene.view_settings.exposure=0
for obj in bpy.data.objects:
    if obj.name.startswith('SHELL /') or obj.name.startswith('STUDIO /') or obj.type=='LIGHT':
        obj.hide_render=True
    if obj.type=='CURVE' and obj.name.startswith(('Micrograin','PEARL')):
        obj.hide_render=True
for obj in bpy.data.objects:
    if obj.type!='MESH' or not obj.name.startswith(('A_','B_','C_','D_')):continue
    c={
      'A_':(.39,.42,.49),'B_':(.88,.81,.69),
      'C_':(.60,.065,.16),'D_':(.75,.73,.68)
    }
    color=next(v for p,v in c.items() if obj.name.startswith(p))
    mat=bpy.data.materials.new('DIAG / '+obj.name);mat.use_nodes=True
    nodes=mat.node_tree.nodes;nodes.clear();links=mat.node_tree.links
    o=nodes.new('ShaderNodeOutputMaterial')
    tr=nodes.new('ShaderNodeBsdfTransparent')
    e=nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value=(*color,1);e.inputs['Strength'].default_value=1
    mix=nodes.new('ShaderNodeMixShader')
    mix.inputs[0].default_value=.67
    links.new(tr.outputs[0],mix.inputs[1]);links.new(e.outputs[0],mix.inputs[2])
    links.new(mix.outputs[0],o.inputs['Surface'])
    obj.data.materials.clear();obj.data.materials.append(mat)
scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.025,.022,.028,1)
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=1.
scene.render.filepath=str(out)
bpy.ops.render.render(write_still=True)
print('GEOMETRY_PASS='+str(out))
