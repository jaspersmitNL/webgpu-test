struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
}

@vertex
fn vs_main(
  @location(0) vertexPosition: vec2<f32>,
  @location(1) vertexColor: vec4<f32>
  ) -> VSOutput {
  var output: VSOutput;
  output.position = vec4<f32>(vertexPosition, 0.0, 1.0);
  output.color = vertexColor;
  return output;
}


@fragment
fn fs_main(vsOut: VSOutput) -> @location(0) vec4f {
  return vsOut.color;
}