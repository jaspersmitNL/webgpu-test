import shaderSource from "./shader.wgsl?raw";
const width = 800;
const height = 600;

async function main() {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  document.getElementById("app")!.appendChild(canvas);

  const adapter = await navigator.gpu?.requestAdapter();

  if (!adapter) {
    alert("WebGPU not supported");
    return;
  }

  const device = await adapter.requestDevice();
  if (!device) {
    alert("No device found");
    return;
  }

  const ctx = canvas.getContext("webgpu") as GPUCanvasContext;

  const positions = new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]);
  const colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);

  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  console.log("presentationFormat", presentationFormat);

  ctx.configure({
    device,
    format: presentationFormat,
    alphaMode: "premultiplied",
  });

  const vertexBuffer = device.createBuffer({
    size: positions.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });
  const colorBuffer = device.createBuffer({
    size: colors.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });

  device.queue.writeBuffer(
    vertexBuffer,
    0,
    positions.buffer,
    0,
    positions.byteLength
  );

  device.queue.writeBuffer(colorBuffer, 0, colors.buffer, 0, colors.byteLength);

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: device.createShaderModule({ code: shaderSource }),
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 2 * 4, // 2 floats * 4 bytes each
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x2",
            },
          ],
        },
        {
          arrayStride: 4 * 4, // 4 floats * 4 bytes each
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: "float32x4",
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({ code: shaderSource }),
      entryPoint: "fs_main",
      targets: [{ format: presentationFormat }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  const frame = () => {
    const commandEncoder = device.createCommandEncoder();
    const textureView = ctx.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setVertexBuffer(1, colorBuffer);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  };

  frame();
}

main();
