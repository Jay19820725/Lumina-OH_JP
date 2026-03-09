import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SEOSettings } from '../core/types';

export const SEOManager: React.FC = () => {
  const { data: seo } = useQuery<SEOSettings>({
    queryKey: ['settings', 'seo'],
    queryFn: async () => {
      const response = await fetch('/api/settings/seo');
      if (!response.ok) throw new Error('Failed to fetch SEO settings');
      return response.json();
    }
  });

  useEffect(() => {
    if (!seo) return;

    // Update Title
    document.title = seo.title;

    // Update Meta Tags
    const updateMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('description', seo.description);
    updateMeta('keywords', seo.keywords);
    updateMeta('robots', seo.index_enabled ? 'index, follow' : 'noindex, nofollow');

    // Open Graph
    updateMeta('og:title', seo.title, 'property');
    updateMeta('og:description', seo.description, 'property');
    updateMeta('og:image', seo.og_image, 'property');
    updateMeta('og:type', 'website', 'property');

    // Google Analytics (Simplified injection)
    const isIframe = window.self !== window.top;
    if (seo.google_analytics_id && !window.location.hostname.includes('localhost') && !isIframe) {
      const scriptId = 'ga-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${seo.google_analytics_id}`;
        document.head.appendChild(script);

        const inlineScript = document.createElement('script');
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${seo.google_analytics_id}');
        `;
        document.head.appendChild(inlineScript);
      }
    }

    // Google Search Console Verification
    if (seo.search_console_id) {
      updateMeta('google-site-verification', seo.search_console_id);
    }

  }, [seo]);

  return null;
};
