extends Node
class_name SpriteSheetExporter

# 配置区域
@export var animation_player: AnimationPlayer
@export var target_viewport: SubViewport
@export var output_path: String = "res://output_spritesheet.png"

# 网格配置 (3x2, 5x2 etc)
@export var rows: int = 2
@export var columns: int = 5
@export var frame_width: int = 128
@export var frame_height: int = 128

func _ready():
	print("SpriteSheetExporter ready. Call export_sheet() to start.")

func export_sheet():
	if not animation_player or not target_viewport:
		push_error("Please assign AnimationPlayer and SubViewport!")
		return

	var img = Image.create(columns * frame_width, rows * frame_height, false, Image.FORMAT_RGBA8)
	var anim_list = animation_player.get_animation_list()
	
	print("Starting export...")
	
	# 这里简单示例：假设就把第一个动画按时间切分导出
	# 实际使用时，通常是一个动画对应一行，或者把所有动作平铺
	
	# 示例逻辑：
	# 遍历每一行（代表不同动作或同一动作的不同阶段）
	var current_anim = anim_list[0] # 默认取第一个
	var anim_len = animation_player.get_animation(current_anim).length
	var total_frames = rows * columns
	var step = anim_len / float(total_frames)
	
	animation_player.play(current_anim)
	animation_player.stop() # 暂停以便手动控制进度
	
	for y in range(rows):
		for x in range(columns):
			var frame_idx = y * columns + x
			var time_sec = frame_idx * step
			
			animation_player.seek(time_sec, true)
			# 等待渲染一帧 (在编辑器里可能需要 yield，但简单脚本直接取也可以尝试)
			await get_tree().process_frame
			await get_tree().process_frame 
			
			var frame_tex = target_viewport.get_texture()
			var frame_img = frame_tex.get_image()
			
			# 截取中心或者缩放？这里假设 Viewport 大小刚好设置为了 frame_width/height
			# 复制到大图
			var src_rect = Rect2i(0, 0, frame_width, frame_height)
			var dst_pos = Vector2i(x * frame_width, y * frame_height)
			
			img.blit_rect(frame_img, src_rect, dst_pos)
			print("Captured frame: ", frame_idx)

	img.save_png(output_path)
	print("Export complete: ", output_path)
