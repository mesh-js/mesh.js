/* globals Proton */
function parseColor(hex) {
  return hex.match(/#(\w\w)(\w\w)(\w\w)/im).slice(1, 6).map(s => parseInt(s, 16) / 255);
}

function getColorParticle(particle) {
  let rgb;
  if(particle.transform.rgb) {
    rgb = particle.transform.rgb;
    rgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  } else {
    rgb = parseColor(particle.color);
  }
  return [...rgb, particle.alpha];
}

class MeshRenderer extends Proton.CustomRenderer {
  constructor(element) {
    super(element);
    this.name = 'MeshRenderer';
    this.meshes = [];
  }

  resize(width, height) {
    super.resize(width, height);
    const canvas = this.element.canvas;
    canvas.width = width;
    canvas.height = height;
    this.meshes.forEach((mesh) => {
      mesh.setResolution(width, height);
    });
  }

  drawMesh(particle) {
    const mesh = particle.body;
    if(particle.color) {
      mesh.setFill({
        color: getColorParticle(particle),
      });
    }
    const {x, y} = particle.p;
    mesh.setTransform(1, 0, 0, 1, x, y);
    if(!mesh.uniforms.u_texSampler && Number.isFinite(particle.radius)) {
      const r = particle.radius * 2;
      mesh.scale(r, r, [x, y]);
    }
    if(Number.isFinite(particle.rotation)) {
      mesh.rotate(Math.PI * particle.rotation / 180, [x, y]);
    }
    if(Number.isFinite(particle.scale)) {
      mesh.scale(particle.scale, particle.scale, [x, y]);
    }
  }

  onParticleCreated(particle) {
    // console.log(particle);
    if(particle.body instanceof meshjs.Figure2D) {
      const figure = particle.body;
      const mesh = new meshjs.Mesh2D(figure, this.element.canvas);
      particle.body = mesh;
      this.meshes.push(mesh);
      this.drawMesh(particle);
    } else { // textures
      const figure = new meshjs.Figure2D();
      const texture = particle.body;
      const {width, height} = texture._img;
      figure.rect(-width / 2, -height / 2, width, height);
      const mesh = new meshjs.Mesh2D(figure, this.element.canvas);
      particle.body = mesh;
      this.meshes.push(mesh);
      mesh.setTexture(texture, {
        rect: [-width / 2, -height / 2],
      });
      this.drawMesh(particle);
      // console.log(texture);
    }
  }

  onParticleDead(particle) {
    const mesh = particle.body;
    if(mesh) {
      const idx = this.meshes.indexOf(mesh);
      if(idx >= 0) this.meshes.splice(idx, 1);
    }
    particle.body = null;
  }

  onParticleUpdate(particle) {
    const mesh = particle.body;
    if(mesh) {
      this.drawMesh(particle);
    }
  }

  onProtonUpdate() {
    this.element.drawMeshes(this.meshes);
  }
}