const yaml = require("js-yaml");
const { DateTime } = require("luxon");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const htmlmin = require("html-minifier");
const Image = require("@11ty/eleventy-img");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const embedYouTube = require("eleventy-plugin-youtube-embed");
const md = require("markdown-it")();
const pluginWebc = require("@11ty/eleventy-plugin-webc");
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const litPlugin = require("@lit-labs/eleventy-plugin-lit");

async function imageShortcode(
    src,
    alt,
    small = false,
    classes = "object-cover h-full w-full",
    sizes = "100vw"
) {
  if (alt === undefined) {
    // You bet we throw an error on missing alt (alt="" works okay)
    throw new Error(`Missing \`alt\` on responsiveimage from: ${src}`);
  }

  const widths = small ? [300, 600] : [300, 600, 800, 1600];

  let metadata = await Image(src, {
    widths: widths,
    formats: ["webp", "jpeg"],
    outputDir: "./_site/img/",
  });

  let lowsrc = metadata.jpeg[0];

  return `<picture>
    ${Object.values(metadata)
      .map((imageFormat) => {
        return `  <source type="${
            imageFormat[0].sourceType
        }" srcset="${imageFormat
            .map((entry) => entry.srcset)
            .join(", ")}" sizes="${sizes}">`;
      })
      .join("\n")}
      <img
        src="${lowsrc.url}"
        width="${lowsrc.width}"
        height="${lowsrc.height}"
        alt="${alt}"
        loading="lazy"
        decoding="async"
        class="${classes}">
    </picture>`;
}

module.exports = function (eleventyConfig) {
  // Also copy images if they exist alongside content
  eleventyConfig.addTemplateFormats(["jpg", "png"]);

  // Disable automatic use of your .gitignore
  eleventyConfig.setUseGitIgnore(false);

  // Merge data instead of overriding
  eleventyConfig.setDataDeepMerge(true);

  // human readable date
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
        "LLL d, yyyy"
    );
  });

  eleventyConfig.addNunjucksFilter("feedEncode", function (value) {
    return value ? md.render(value) : "";
  });

  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    excerpt_alias: "feed_excerpt",
  });

  // Syntax Highlighting for Code blocks
  eleventyConfig.addPlugin(syntaxHighlight);

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(embedYouTube);

  eleventyConfig.addPlugin(EleventyRenderPlugin);

  eleventyConfig.addPlugin(pluginWebc, {
    // Glob to find no-import global components
    components: "src/_includes/components/**/*.webc",
  });

  eleventyConfig.addPlugin(litPlugin, {
    mode: "worker",
    componentModules: ["node_modules/@gdwc/components/container.js"],
  });

  // To Support .yaml Extension in _data
  // You may remove this if you can use JSON
  eleventyConfig.addDataExtension("yaml", (contents) =>
      yaml.safeLoad(contents)
  );

  // 11ty Image Config
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addLiquidShortcode("image", imageShortcode);
  eleventyConfig.addJavaScriptFunction("image", imageShortcode);

  // Add Tailwind Output CSS as Watch Target
  eleventyConfig.addWatchTarget("./_tmp/static/css/style.css");

  // Copy Static Files to /_Site
  eleventyConfig.addPassthroughCopy({
    "./_tmp/static/css/style.css": "./static/css/style.css",
    "./src/admin/config.yml": "./admin/config.yml",
    "./node_modules/alpinejs/dist/alpine.js": "./static/js/alpine.js",
    "./node_modules/prismjs/themes/prism-tomorrow.css":
        "./static/css/prism-tomorrow.css",
    "./node_modules/@gdwc/components/dist/components.js":
        "./static/js/gdwc-components.js",
    "./node_modules/@gdwc/components/dist/style.css":
        "./static/css/gdwc-styles.css",
  });

  // Copy Image Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/static/img");

  // Copy Components Folder to /_site
  eleventyConfig.addPassthroughCopy("./src/components");

  // Copy favicon to route of /_site
  eleventyConfig.addPassthroughCopy("./src/favicon.ico");

  // Minify HTML
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    // Eleventy 1.0+: use this.inputPath and this.outputPath instead
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  // Let Eleventy transform HTML files as nunjucks
  // So that we can use .html instead of .njk
  return {
    dir: {
      input: "src",
    },
    htmlTemplateEngine: "njk",
  };
};
