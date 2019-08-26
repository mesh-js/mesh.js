export default async () => {
  const javascript = await import('!raw-loader!./index.js');
  const html = await import('!raw-loader!../index.html');
  const css = await import('!raw-loader!../style.css');

  return {
    javascript,
    html: {
      code: html,
    },
    css: {
      code: css,
    },
    packages: {
      js: [
        '//lib.baomitu.com/dat-gui/0.7.2/dat.gui.min.js',
        './mesh.js',
      ],
    },
  };
};