import sveltePreprocess from "svelte-preprocess";

export default {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  compilerOptions: {
    enableSourcemap: true,
  },
  preprocess: sveltePreprocess({
    sourceMap: true,
  }),
};
