/* globals Proton */
const {Mesh2D} = meshjs;

function parseColor(hex) {
  return hex.match(/#(\w\w)(\w\w)(\w\w)/im).slice(1, 6).map(s => parseInt(s, 16) / 255);
}

function getColorParticle(particle) {
  let rgb;
  if(particle.transform.rgb) {
    rgb = particle.transform.rgb;
    rgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  } else {
    rgb = parseColor(particle.color || '#ff0000');
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
    if(this.element.context) {
      const canvas = this.element.context.canvas;
      canvas.width = width;
      canvas.height = height;
    }
  }

  drawMesh(particle) {
    const mesh = particle.body;
    mesh.setFill({
      color: getColorParticle(particle),
    });
    mesh.setTransform(1, 0, 0, 1, particle.p.x, particle.p.y);
    if(particle.rotation) {
      if(Number.isFinite(particle.rotation)) {
        mesh.rotate(Math.PI * particle.rotation / 180, [particle.p.x, particle.p.y]);
      }
    }
    if(particle.scale) {
      if(Number.isFinite(particle.scale)) {
        mesh.scale(particle.scale, particle.scale, [particle.p.x, particle.p.y]);
      }
    }
  }

  onParticleCreated(particle) {
    // console.log(particle);
    const figure = particle.body;
    const mesh = new Mesh2D(figure, this.element.context.canvas);
    particle.body = mesh;
    this.meshes.push(mesh);
    this.drawMesh(particle);
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