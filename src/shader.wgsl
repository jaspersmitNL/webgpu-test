
struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}


struct Uniforms {
  scale: vec2f,
}
@binding(0) @group(0) var<uniform> uniforms : Uniforms;



@vertex
fn vs_main(
  @location(0) vertexPosition: vec2<f32>
  ) -> VSOutput {
  var output: VSOutput;


  output.position = vec4<f32>(uniforms.scale * vertexPosition, 0.0, 1.0);
  output.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
  return output;
}


@fragment
fn fs_main(vsOut: VSOutput) -> @location(0) vec4f {
  return vsOut.color;
}