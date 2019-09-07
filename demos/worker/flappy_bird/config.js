export default async () => {
  const javascript = await import('!raw-loader!../index.js');
  const html = await import('!raw-loader!../index.html');
  const css = await import('!raw-loader!../style.css');
  const rawdata = await import('!!raw-loader!./worker.js');

  return {
    rawdata: {
      tabName: 'Worker',
      code: rawdata,
      transformer: 'javascript',
      visible: true,
    },
    javascript: {
      tabName: 'MainThread',
      code: javascript,
      transformer: 'javascript',
      visible: true,
      transform(code) {
        // eslint-disable-next-line quotes
        const prefix = `(function() {let code = document.querySelector('script[type="text/x-rawdata"]').textContent;
          code = code.replace(/importScripts\\(['"]mesh.js['"]\\)/img, "importScripts('${location.protocol}//${location.host}${location.pathname}mesh.js')");
          const blob = new Blob([code], {type: 'text/javascript'});      
          return new Worker(URL.createObjectURL(blob));
        }());`;
        code = code.replace(/new Worker\(.*?\)/img, prefix);
        return code;
      },
    },
    html: {
      code: html,
    },
    css: {
      code: css,
    },
  };
};