import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "discourse-twitter-native-embed",
  initialize() {
    withPluginApi("1.0.0", (api) => {
      function getTwitterScript() {
        if (document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) return;
        const scriptnode = document.createElement("script");
        scriptnode.setAttribute("async", "");
        scriptnode.setAttribute("src", "https://platform.twitter.com/widgets.js");
        scriptnode.setAttribute("charset", "utf-8");
        document.head.appendChild(scriptnode);
      }

      api.decorateCookedElement(
        (el) => {
          let hasQuote = false;

          // Detect both domains: twitter.com and x.com
          for (const domain of ["twitter.com", "x.com"]) {
            const links = el.querySelectorAll(`a.onebox[href^="https://${domain}/"][href*="status"]`);
            for (const link of links) {
              const tweetUrl = link.href.replace("https://x.com", "https://twitter.com");
              const blockquote = document.createElement("blockquote");
              blockquote.classList.add("twitter-tweet");

              const a = document.createElement("a");
              a.href = tweetUrl;
              a.rel = "nofollow";
              blockquote.appendChild(a);

              link.replaceWith(blockquote);
              hasQuote = true;
            }
          }

          if (hasQuote) getTwitterScript();
        },
        {
          id: "discourse-twitter-native-embed",
          afterAdopt: true,
          onlyStream: true,
        }
      );
    });
  },
};
