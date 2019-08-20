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
        './mesh.js',
        './proton.js',
        './proton-renderer.js',
      ],
    },
  };
};
