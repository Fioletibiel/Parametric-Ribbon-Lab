"""High-quality controlled rerender of an existing Orbis .blend.
No changes to mesh, materials, lighting or camera. Two outputs from ONE
render: denoised baseline and restrained compositor glare. Blender 4.5 LTS.
"""
import bpy,sys,json
from pathlib import Path
p=sys.argv[sys.argv.index('--')+1:]
out=Path(p[0]).resolve();out.mkdir(parents=True,exist_ok=True)
theme=p[1]
sc=bpy.context.scene
sc.render.engine='CYCLES'
sc.cycles.device='CPU'
sc.cycles.samples=512
sc.cycles.use_adaptive_sampling=True
sc.cycles.adaptive_threshold=.015
sc.cycles.adaptive_min_samples=64
sc.cycles.use_denoising=True
sc.cycles.denoiser='OPENIMAGEDENOISE'
sc.render.resolution_x=2048
sc.render.resolution_y=2048
sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'
sc.render.image_settings.color_mode='RGB'
sc.render.image_settings.color_depth='8'
# Preserve all optical parameters, including bounce limits, to isolate quality.
sc.render.film_transparent=False
sc.use_nodes=True
tree=sc.node_tree
tree.nodes.clear()
r=tree.nodes.new('CompositorNodeRLayers')
c=tree.nodes.new('CompositorNodeComposite')
tree.links.new(r.outputs['Image'],c.inputs['Image'])
g=tree.nodes.new('CompositorNodeGlare')
g.glare_type='FOG_GLOW'
g.quality='HIGH'
# Blender 4.5 uses socket controls. No screen-space deformation.
for key,value in [('Threshold',1.5),('Strength',.18),('Size',.20)]:
    socket=g.inputs.get(key)
    if socket is not None:socket.default_value=value
tree.links.new(r.outputs['Image'],g.inputs['Image'])
f=tree.nodes.new('CompositorNodeOutputFile')
f.base_path=str(out)
f.format.file_format='PNG'
f.format.color_mode='RGB'
f.format.color_depth='8'
f.file_slots[0].path=theme+'_glow_'
tree.links.new(g.outputs['Image'],f.inputs[0])
sc.render.filepath=str(out/(theme+'_clean.png'))
bpy.ops.wm.save_as_mainfile(filepath=str(out/(theme+'_hq.blend')))
print('QUALITY_CONFIG',json.dumps({'blender':bpy.app.version_string,'samples':sc.cycles.samples,'threshold':sc.cycles.adaptive_threshold,'denoiser':sc.cycles.denoiser,'resolution':[2048,2048],'geometry_objects':sum(o.type=='MESH' for o in sc.objects),'camera':sc.camera.name}),flush=True)
bpy.ops.render.render(write_still=True)
print('COMPLETE',theme,flush=True)
