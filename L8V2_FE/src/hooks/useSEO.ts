import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const useSEO = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}: SEOProps) => {
  useEffect(() => {
    const baseTitle = 'L8 Events';
    const baseDescription = 'L8 Events skaber events med fokus på vækstlaget i dansk musik og agerer som booker for spirrende artister. Kom for koncerterne, bliv for festen. Dont be L8!';
    const baseUrl = 'https://l8events.dk';
    
    const finalTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const finalDescription = description || baseDescription;
    const finalUrl = url ? `${baseUrl}${url}` : baseUrl;
    // Handle both relative and absolute image URLs
    const finalImage = image 
      ? (image.startsWith('http') ? image : `${baseUrl}${image}`)
      : `${baseUrl}/l8logo.webp`;

    // Update document title
    document.title = finalTitle;

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', finalDescription);
    }

    // Update meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update Open Graph tags
    const ogTags = {
      'og:title': finalTitle,
      'og:description': finalDescription,
      'og:url': finalUrl,
      'og:image': finalImage,
      'og:type': type
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    });

    // Update Twitter tags
    const twitterTags = {
      'twitter:title': finalTitle,
      'twitter:description': finalDescription,
      'twitter:url': finalUrl,
      'twitter:image': finalImage,
      'twitter:card': 'summary_large_image'
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    });

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalUrl);

    // Add language meta tag
    const langTag = document.querySelector('html');
    if (langTag && !langTag.getAttribute('lang')) {
      langTag.setAttribute('lang', 'da');
    }

    // Add additional Open Graph tags for better social sharing
    const additionalOgTags = {
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': finalTitle,
      'og:locale': 'da_DK',
      'og:site_name': 'L8 Events'
    };

    Object.entries(additionalOgTags).forEach(([property, content]) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        document.head.appendChild(metaTag);
      }
      metaTag.setAttribute('content', content);
    });

    // Add article meta tags if type is article or profile
    if (type === 'article' || type === 'profile') {
      const articleTags = {
        'article:author': 'L8 Events',
        'article:publisher': 'https://www.facebook.com/l8events'
      };

      Object.entries(articleTags).forEach(([property, content]) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', property);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
      });
    }

  }, [title, description, keywords, image, url, type]);
};
