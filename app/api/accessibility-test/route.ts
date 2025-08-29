import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';
import FirecrawlApp from '@mendable/firecrawl-js';

// TypeScript interfaces for accessibility check results
interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary: string;
}

interface AccessibilityViolation {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AccessibilityNode[];
}

interface AccessibilityPass {
  id: string;
  description: string;
  help: string;
}

interface AccessibilityResult {
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  incomplete: AccessibilityViolation[];
}

// Utility functions for color contrast analysis
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  
  const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getContrastRatio(color1: { r: number, g: number, b: number }, color2: { r: number, g: number, b: number }): number {
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

function parseColor(colorStr: string): { r: number, g: number, b: number } | null {
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr);
  }
  
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3])
      };
    }
  }
  
  // Handle named colors (basic set)
  const namedColors: { [key: string]: { r: number, g: number, b: number } } = {
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 255, g: 255, b: 255 },
    'red': { r: 255, g: 0, b: 0 },
    'green': { r: 0, g: 128, b: 0 },
    'blue': { r: 0, g: 0, b: 255 },
    'yellow': { r: 255, g: 255, b: 0 },
    'gray': { r: 128, g: 128, b: 128 },
    'grey': { r: 128, g: 128, b: 128 }
  };
  
  return namedColors[colorStr.toLowerCase()] || null;
}

// Comprehensive accessibility checks based on WCAG guidelines (WAVE-like analysis)
function runAccessibilityChecks(document: Document): AccessibilityResult {
  const violations: AccessibilityViolation[] = [];
  const passes: AccessibilityPass[] = [];
  const incomplete: AccessibilityViolation[] = [];

  // Check 1: Images without alt text (WCAG 1.1.1)
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt: AccessibilityNode[] = [];
  const decorativeImages: AccessibilityNode[] = [];
  
  images.forEach((img, index) => {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    
    if (alt === null) {
      imagesWithoutAlt.push({
        html: img.outerHTML,
        target: [`img:nth-child(${index + 1})`],
        failureSummary: 'Image does not have an alt attribute'
      });
    } else if (alt === '' && role !== 'presentation') {
      decorativeImages.push({
        html: img.outerHTML,
        target: [`img:nth-child(${index + 1})`],
        failureSummary: 'Image appears to be decorative but lacks role="presentation"'
      });
    }
  });

  if (imagesWithoutAlt.length > 0) {
    violations.push({
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternative text',
      help: 'Images must have alternate text',
      helpUrl: 'https://webaim.org/techniques/alttext/',
      tags: ['wcag2a', 'wcag111', 'cat.text-alternatives'],
      nodes: imagesWithoutAlt
    });
  }

  // Check 2: Comprehensive form validation (WCAG 1.3.1, 3.3.2, 4.1.2)
  const formElements = document.querySelectorAll('input, textarea, select');
  const elementsWithoutLabels: AccessibilityNode[] = [];
  const elementsWithoutRequiredIndicator: AccessibilityNode[] = [];
  const elementsWithPoorLabels: AccessibilityNode[] = [];

  formElements.forEach((element, index) => {
    const tagName = element.tagName.toLowerCase();
    const type = element.getAttribute('type') || 'text';
    
    // Skip certain input types that don't need labels
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) {
      return;
    }

    const id = element.getAttribute('id');
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = element.getAttribute('aria-label');
    const hasAriaLabelledby = element.getAttribute('aria-labelledby');
    const placeholder = element.getAttribute('placeholder');
    const required = element.hasAttribute('required');
    
    // Check for missing labels
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
      elementsWithoutLabels.push({
        html: element.outerHTML,
        target: [`${tagName}:nth-child(${index + 1})`],
        failureSummary: `${tagName} element does not have an accessible label`
      });
    }
    
    // Check for placeholder-only labeling (poor practice)
    if (placeholder && !hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
      elementsWithPoorLabels.push({
        html: element.outerHTML,
        target: [`${tagName}:nth-child(${index + 1})`],
        failureSummary: 'Form element relies only on placeholder text for labeling'
      });
    }
    
    // Check required fields without indication
    if (required) {
      const label = hasLabel ? document.querySelector(`label[for="${id}"]`) : null;
      const labelText = label?.textContent || hasAriaLabel || '';
      
      if (!labelText.includes('*') && !labelText.toLowerCase().includes('required')) {
        elementsWithoutRequiredIndicator.push({
          html: element.outerHTML,
          target: [`${tagName}:nth-child(${index + 1})`],
          failureSummary: 'Required form field lacks clear required indicator'
        });
      }
    }
  });

  if (elementsWithoutLabels.length > 0) {
    violations.push({
      id: 'label',
      impact: 'critical',
      description: 'Form elements must have labels',
      help: 'Form elements must have labels',
      helpUrl: 'https://webaim.org/techniques/forms/controls',
      tags: ['wcag2a', 'wcag412', 'wcag131', 'cat.forms'],
      nodes: elementsWithoutLabels
    });
  }

  if (elementsWithPoorLabels.length > 0) {
    violations.push({
      id: 'placeholder-as-label',
      impact: 'serious',
      description: 'Placeholder text should not be used as the only form of labeling',
      help: 'Placeholder text cannot replace proper labels',
      helpUrl: 'https://webaim.org/techniques/forms/advanced#placeholder',
      tags: ['wcag2a', 'wcag131', 'cat.forms'],
      nodes: elementsWithPoorLabels
    });
  }

  // Check 3: Empty buttons and poor button text (WCAG 4.1.2, 2.4.4)
  const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="reset"]');
  const buttonsWithoutText: AccessibilityNode[] = [];
  const buttonsWithPoorText: AccessibilityNode[] = [];

  buttons.forEach((button, index) => {
    const text = button.textContent?.trim();
    const value = button.getAttribute('value')?.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const ariaLabelledby = button.getAttribute('aria-labelledby');
    // Note: ariaLabelledby would be used for more complex labeling scenarios
    const title = button.getAttribute('title');
    
    const accessibleText = text || value || ariaLabel || title;
    
    if (!accessibleText) {
      buttonsWithoutText.push({
        html: button.outerHTML,
        target: [`button:nth-child(${index + 1})`],
        failureSummary: 'Button does not have accessible text'
      });
    } else if (accessibleText && ['click', 'here', 'more', 'link', 'button'].includes(accessibleText.toLowerCase())) {
      buttonsWithPoorText.push({
        html: button.outerHTML,
        target: [`button:nth-child(${index + 1})`],
        failureSummary: `Button text "${accessibleText}" is not descriptive`
      });
    }
  });

  if (buttonsWithoutText.length > 0) {
    violations.push({
      id: 'button-name',
      impact: 'critical',
      description: 'Buttons must have discernible text',
      help: 'Buttons must have discernible text',
      helpUrl: 'https://webaim.org/techniques/forms/controls#button',
      tags: ['wcag2a', 'wcag412', 'cat.name-role-value'],
      nodes: buttonsWithoutText
    });
  }

  if (buttonsWithPoorText.length > 0) {
    violations.push({
      id: 'button-text-quality',
      impact: 'moderate',
      description: 'Button text should be descriptive',
      help: 'Button text should clearly describe the button\'s function',
      helpUrl: 'https://webaim.org/techniques/hypertext/hypertext_links#link_text',
      tags: ['wcag2a', 'wcag244', 'cat.name-role-value'],
      nodes: buttonsWithPoorText
    });
  }

  // Check 4: Link quality analysis (WCAG 2.4.4)
  const links = document.querySelectorAll('a[href]');
  const linksWithoutText: AccessibilityNode[] = [];
  const linksWithPoorText: AccessibilityNode[] = [];
  const linksWithSameText: AccessibilityNode[] = [];
  const linkTexts = new Map();

  links.forEach((link, index) => {
    const text = link.textContent?.trim();
    const ariaLabel = link.getAttribute('aria-label');
    const ariaLabelledby = link.getAttribute('aria-labelledby');
    // Note: ariaLabelledby would be used for more complex labeling scenarios
    const title = link.getAttribute('title');
    const href = link.getAttribute('href');
    
    const accessibleText = text || ariaLabel || title;
    
    if (!accessibleText) {
      linksWithoutText.push({
        html: link.outerHTML,
        target: [`a:nth-child(${index + 1})`],
        failureSummary: 'Link does not have accessible text'
      });
    } else {
      // Check for poor link text
      const poorLinkPhrases = ['click here', 'here', 'more', 'read more', 'link', 'continue'];
      if (poorLinkPhrases.includes(accessibleText.toLowerCase())) {
        linksWithPoorText.push({
          html: link.outerHTML,
          target: [`a:nth-child(${index + 1})`],
          failureSummary: `Link text "${accessibleText}" is not descriptive`
        });
      }
      
      // Check for duplicate link text with different destinations
      if (linkTexts.has(accessibleText)) {
        const existingHref = linkTexts.get(accessibleText);
        if (existingHref !== href) {
          linksWithSameText.push({
            html: link.outerHTML,
            target: [`a:nth-child(${index + 1})`],
            failureSummary: `Multiple links with same text "${accessibleText}" lead to different destinations`
          });
        }
      } else {
        linkTexts.set(accessibleText, href);
      }
    }
  });

  if (linksWithoutText.length > 0) {
    violations.push({
      id: 'link-name',
      impact: 'serious',
      description: 'Links must have discernible text',
      help: 'Links must have discernible text',
      helpUrl: 'https://webaim.org/techniques/hypertext/hypertext_links#link_text',
      tags: ['wcag2a', 'wcag244', 'wcag412', 'cat.name-role-value'],
      nodes: linksWithoutText
    });
  }

  if (linksWithPoorText.length > 0) {
    violations.push({
      id: 'link-text-quality',
      impact: 'moderate',
      description: 'Link text should be descriptive',
      help: 'Link text should clearly describe the link\'s destination or function',
      helpUrl: 'https://webaim.org/techniques/hypertext/hypertext_links#link_text',
      tags: ['wcag2a', 'wcag244', 'cat.name-role-value'],
      nodes: linksWithPoorText
    });
  }

  // Check 5: Basic color contrast estimation (WCAG 1.4.3, 1.4.6)
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button, label, li');
  const contrastIssues: AccessibilityNode[] = [];

  textElements.forEach((element, index) => {
    const computedStyle = element.getAttribute('style') || '';
    const text = element.textContent?.trim();
    
    if (!text) return;
    
    // Basic color extraction from inline styles
    const colorMatch = computedStyle.match(/color:\s*([^;]+)/);
    const bgColorMatch = computedStyle.match(/background-color:\s*([^;]+)/);
    
    if (colorMatch && bgColorMatch) {
      const textColor = parseColor(colorMatch[1].trim());
      const bgColor = parseColor(bgColorMatch[1].trim());
      
      if (textColor && bgColor) {
        const contrast = getContrastRatio(textColor, bgColor);
        const fontSize = element.getAttribute('style')?.match(/font-size:\s*(\d+)px/) || ['', '14'];
        const size = parseInt(fontSize[1]) || 14;
        
        const isLargeText = size >= 18 || (size >= 14 && computedStyle.includes('font-weight: bold'));
        const minContrast = isLargeText ? 3 : 4.5;
        
        if (contrast < minContrast) {
          contrastIssues.push({
            html: element.outerHTML,
            target: [`${element.tagName.toLowerCase()}:nth-child(${index + 1})`],
            failureSummary: `Text has insufficient color contrast (${contrast.toFixed(2)}:1, requires ${minContrast}:1)`
          });
        }
      }
    }
  });

  if (contrastIssues.length > 0) {
    violations.push({
      id: 'color-contrast',
      impact: 'serious',
      description: 'Text must have sufficient color contrast',
      help: 'Text must have a contrast ratio of at least 4.5:1 (3:1 for large text)',
      helpUrl: 'https://webaim.org/articles/contrast/',
      tags: ['wcag2aa', 'wcag143', 'cat.color'],
      nodes: contrastIssues.slice(0, 10) // Limit to prevent overwhelming reports
    });
  }

  // Check 6: Missing page structure elements
  const title = document.querySelector('title');
  const h1s = document.querySelectorAll('h1');
  const htmlElement = document.documentElement;
  const metaViewport = document.querySelector('meta[name="viewport"]');
  const skipLinks = document.querySelectorAll('a[href^="#"]');
  // Note: skipLinks could be used for additional navigation checks

  if (!title || !title.textContent?.trim()) {
    violations.push({
      id: 'document-title',
      impact: 'serious',
      description: 'Documents must have a title to aid in navigation',
      help: 'Documents must have <title> element to aid in navigation',
      helpUrl: 'https://webaim.org/techniques/pagetitles/',
      tags: ['wcag2a', 'wcag242', 'cat.text-alternatives'],
      nodes: [{
        html: title ? title.outerHTML : '<title></title>',
        target: ['title'],
        failureSummary: 'Document does not have a title'
      }]
    });
  }

  if (h1s.length === 0) {
    violations.push({
      id: 'page-has-heading-one',
      impact: 'moderate',
      description: 'Page should have a heading structure that starts with h1',
      help: 'Page must contain a level-one heading',
      helpUrl: 'https://webaim.org/techniques/semanticstructure/',
      tags: ['wcag2a', 'wcag131', 'cat.semantics'],
      nodes: [{
        html: '<body>',
        target: ['body'],
        failureSummary: 'Page does not contain a heading (h1)'
      }]
    });
  } else if (h1s.length > 1) {
    violations.push({
      id: 'multiple-h1',
      impact: 'moderate',
      description: 'Page should not have more than one h1 heading',
      help: 'Page should have only one main heading (h1)',
      helpUrl: 'https://webaim.org/techniques/semanticstructure/',
      tags: ['wcag2a', 'wcag131', 'cat.semantics'],
      nodes: Array.from(h1s).slice(1).map((h1, index) => ({
        html: h1.outerHTML,
        target: [`h1:nth-child(${index + 2})`],
        failureSummary: 'Multiple h1 headings found'
      }))
    });
  }

  if (!htmlElement.getAttribute('lang')) {
    violations.push({
      id: 'html-has-lang',
      impact: 'serious',
      description: 'The html element must have a lang attribute',
      help: '<html> element must have a lang attribute',
      helpUrl: 'https://webaim.org/techniques/language/',
      tags: ['wcag2a', 'wcag311', 'cat.language'],
      nodes: [{
        html: htmlElement.outerHTML.split('>')[0] + '>',
        target: ['html'],
        failureSummary: 'The <html> element does not have a lang attribute'
      }]
    });
  }

  if (!metaViewport) {
    violations.push({
      id: 'meta-viewport',
      impact: 'moderate',
      description: 'Viewport meta tag should be present for responsive design',
      help: 'Viewport meta tag should be included for mobile accessibility',
      helpUrl: 'https://webaim.org/articles/mobile/',
      tags: ['wcag2a', 'cat.mobile'],
      nodes: [{
        html: '<head>',
        target: ['head'],
        failureSummary: 'Viewport meta tag is missing'
      }]
    });
  }

  // Check 7: Heading hierarchy (WCAG 1.3.1)
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels: number[] = [];
  const skippedHeadings: AccessibilityNode[] = [];
  const emptyHeadings: AccessibilityNode[] = [];
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1));
    const text = heading.textContent?.trim();
    
    if (!text) {
      emptyHeadings.push({
        html: heading.outerHTML,
        target: [heading.tagName.toLowerCase()],
        failureSummary: 'Heading is empty'
      });
    }
    
    headingLevels.push(level);
    
    if (index > 0) {
      const previous = headingLevels[index - 1];
      if (level > previous + 1) {
        skippedHeadings.push({
          html: heading.outerHTML,
          target: [heading.tagName.toLowerCase()],
          failureSummary: `Heading level skips from h${previous} to h${level}`
        });
      }
    }
  });

  if (skippedHeadings.length > 0) {
    violations.push({
      id: 'heading-order',
      impact: 'moderate',
      description: 'Heading levels should only increase by one',
      help: 'Heading levels should only increase by one',
      helpUrl: 'https://webaim.org/techniques/semanticstructure/',
      tags: ['wcag2a', 'wcag131', 'cat.semantics'],
      nodes: skippedHeadings
    });
  }

  if (emptyHeadings.length > 0) {
    violations.push({
      id: 'empty-heading',
      impact: 'serious',
      description: 'Headings must not be empty',
      help: 'Headings must contain text',
      helpUrl: 'https://webaim.org/techniques/semanticstructure/',
      tags: ['wcag2a', 'wcag131', 'cat.semantics'],
      nodes: emptyHeadings
    });
  }

  // Check 8: Table accessibility (WCAG 1.3.1)
  const tables = document.querySelectorAll('table');
  const tablesWithoutHeaders: AccessibilityNode[] = [];
  const tablesWithoutCaption: AccessibilityNode[] = [];

  tables.forEach((table, index) => {
    const headers = table.querySelectorAll('th');
    const caption = table.querySelector('caption');
    
    if (headers.length === 0) {
      tablesWithoutHeaders.push({
        html: table.outerHTML.substring(0, 200) + '...',
        target: [`table:nth-child(${index + 1})`],
        failureSummary: 'Data table does not have header cells'
      });
    }
    
    if (!caption) {
      tablesWithoutCaption.push({
        html: table.outerHTML.substring(0, 200) + '...',
        target: [`table:nth-child(${index + 1})`],
        failureSummary: 'Data table does not have a caption'
      });
    }
  });

  if (tablesWithoutHeaders.length > 0) {
    violations.push({
      id: 'table-headers',
      impact: 'serious',
      description: 'Data tables should have table headers',
      help: 'Data tables should have table headers (th elements)',
      helpUrl: 'https://webaim.org/techniques/tables/data',
      tags: ['wcag2a', 'wcag131', 'cat.tables'],
      nodes: tablesWithoutHeaders
    });
  }

  // Add comprehensive passes
  const passChecks = [
    { condition: images.length > 0 && imagesWithoutAlt.length === 0, id: 'image-alt', desc: 'Images have alternative text' },
    { condition: title && title.textContent?.trim(), id: 'document-title', desc: 'Document has a title' },
    { condition: htmlElement.getAttribute('lang'), id: 'html-has-lang', desc: 'HTML element has lang attribute' },
    { condition: h1s.length === 1, id: 'page-has-heading-one', desc: 'Page has exactly one h1 heading' },
    { condition: metaViewport, id: 'meta-viewport', desc: 'Viewport meta tag is present' },
    { condition: formElements.length > 0 && elementsWithoutLabels.length === 0, id: 'form-labels', desc: 'Form elements have proper labels' },
    { condition: buttons.length > 0 && buttonsWithoutText.length === 0, id: 'button-names', desc: 'Buttons have accessible names' },
    { condition: links.length > 0 && linksWithoutText.length === 0, id: 'link-names', desc: 'Links have accessible names' },
    { condition: headings.length > 0 && skippedHeadings.length === 0, id: 'heading-structure', desc: 'Heading structure is logical' }
  ];

  passChecks.forEach(check => {
    if (check.condition) {
      passes.push({
        id: check.id,
        description: check.desc,
        help: check.desc
      });
    }
  });

  return {
    violations,
    passes,
    incomplete
  };
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log('Fetching URL:', url);

    let html: string;
    
    // Try Firecrawl first, fallback to regular fetch
    try {
      if (process.env.FIRECRAWL_API_KEY) {
        console.log('Using Firecrawl to fetch content...');
        const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
        
        const scrapeResult = await app.scrapeUrl(url, {
          formats: ['html'],
          onlyMainContent: false, // Keep full page for accessibility testing
          waitFor: 3000, // Wait for JS to render
          timeout: 30000
        });
        
        if (scrapeResult.success && scrapeResult.html) {
          html = scrapeResult.html;
          console.log('HTML fetched via Firecrawl, length:', html.length);
        } else {
          throw new Error('Firecrawl failed to scrape the URL');
        }
      } else {
        throw new Error('Firecrawl API key not configured');
      }
    } catch (firecrawlError) {
      console.log('Firecrawl failed, falling back to direct fetch:', firecrawlError);
      
      // Fallback to original fetch method
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Unable to fetch the URL. Server responded with status: ${response.status}` },
          { status: 400 }
        );
      }

      html = await response.text();
      console.log('HTML fetched via direct fetch, length:', html.length);
    }

    // Create JSDOM instance
    const dom = new JSDOM(html, {
      url: url,
      pretendToBeVisual: true,
      resources: 'usable'
    });

    const { document } = dom.window;

    console.log('Running accessibility checks...');

    // Run our custom accessibility checks
    const results = runAccessibilityChecks(document);

    console.log('Accessibility test completed. Violations:', results.violations.length);

    // Format the response
    const report = {
      url: url,
      crawlMethod: process.env.FIRECRAWL_API_KEY ? 'firecrawl' : 'direct-fetch',
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: violation.tags,
        nodes: violation.nodes.map((node) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary || ''
        })).slice(0, 5) // Limit to first 5 nodes per violation
      })),
      passes: results.passes.map((pass) => ({
        id: pass.id,
        description: pass.description,
        help: pass.help
      })),
      incomplete: results.incomplete.map((incomplete) => ({
        id: incomplete.id,
        impact: incomplete.impact,
        description: incomplete.description,
        help: incomplete.help,
        helpUrl: incomplete.helpUrl,
        tags: incomplete.tags,
        nodes: incomplete.nodes.map((node) => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary || ''
        })).slice(0, 5)
      })),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(report);

  } catch (error) {
    console.error('Accessibility test error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'Unable to reach the specified URL. Please check if the URL is accessible and allows server requests.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'The page took too long to load. Please try again or check if the URL is responsive.' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { error: `Error testing accessibility: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while testing accessibility. Please try again.' },
      { status: 500 }
    );
  }
}