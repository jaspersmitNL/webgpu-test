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

  const uniformBuffer = device.createBuffer({
    size: 2 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    mappedAtCreation: false,
  });

  device.queue.writeBuffer(
    vertexBuffer,
    0,
    positions.buffer,
    0,
    positions.byteLength
  );

  const uiformValues = new Float32Array([0.5, 0.5]);
  device.queue.writeBuffer(
    uniformBuffer,
    0,
    uiformValues.buffer,
    0,
    uiformValues.byteLength
  );

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

  const unfiromBindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: uniformBuffer,
        },
      },
    ],
  });

  const frame = () => {
    const time = performance.now() / 1000;
    const sinTime = Math.sin(time);
    uiformValues[0] = sinTime;
    uiformValues[1] = sinTime;

    device.queue.writeBuffer(
      uniformBuffer,
      0,
      uiformValues.buffer,
      0,
      uiformValues.byteLength
    );

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
    passEncoder.setBindGroup(0, unfiromBindGroup);
    passEncoder.draw(3, 1, 0, 0);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  };

  frame();
}

main();
