import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

// Manual accessibility checks based on WCAG guidelines
function runAccessibilityChecks(document: Document): any {
  const violations: any[] = [];
  const passes: any[] = [];

  // Check 1: Images without alt text (WCAG 1.1.1)
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt: any[] = [];
  images.forEach((img, index) => {
    if (!img.getAttribute('alt') && img.getAttribute('alt') !== '') {
      imagesWithoutAlt.push({
        html: img.outerHTML,
        target: [`img:nth-child(${index + 1})`],
        failureSummary: 'Image does not have an alt attribute'
      });
    }
  });

  if (imagesWithoutAlt.length > 0) {
    violations.push({
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternative text',
      help: 'Images must have alternate text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
      tags: ['wcag2a', 'wcag111', 'cat.text-alternatives'],
      nodes: imagesWithoutAlt
    });
  }

  // Check 2: Form inputs without labels (WCAG 1.3.1, 3.3.2)
  const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="url"], textarea');
  const inputsWithoutLabels: any[] = [];
  inputs.forEach((input, index) => {
    const id = input.getAttribute('id');
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.getAttribute('aria-label');
    const hasAriaLabelledby = input.getAttribute('aria-labelledby');
    
    if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
      inputsWithoutLabels.push({
        html: input.outerHTML,
        target: [`input:nth-child(${index + 1})`],
        failureSummary: 'Form input does not have an accessible label'
      });
    }
  });

  if (inputsWithoutLabels.length > 0) {
    violations.push({
      id: 'label',
      impact: 'critical',
      description: 'Form elements must have labels',
      help: 'Form elements must have labels',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/label',
      tags: ['wcag2a', 'wcag412', 'wcag131', 'cat.forms'],
      nodes: inputsWithoutLabels
    });
  }

  // Check 3: Missing page title (WCAG 2.4.2)
  const title = document.querySelector('title');
  if (!title || !title.textContent?.trim()) {
    violations.push({
      id: 'document-title',
      impact: 'serious',
      description: 'Documents must have a title to aid in navigation',
      help: 'Documents must have <title> element to aid in navigation',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/document-title',
      tags: ['wcag2a', 'wcag242', 'cat.text-alternatives'],
      nodes: [{
        html: title ? title.outerHTML : '<title></title>',
        target: ['title'],
        failureSummary: 'Document does not have a title'
      }]
    });
  }

  // Check 4: Missing lang attribute on html element (WCAG 3.1.1)
  const htmlElement = document.documentElement;
  if (!htmlElement.getAttribute('lang')) {
    violations.push({
      id: 'html-has-lang',
      impact: 'serious',
      description: 'The html element must have a lang attribute',
      help: '<html> element must have a lang attribute',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/html-has-lang',
      tags: ['wcag2a', 'wcag311', 'cat.language'],
      nodes: [{
        html: htmlElement.outerHTML.split('>')[0] + '>',
        target: ['html'],
        failureSummary: 'The <html> element does not have a lang attribute'
      }]
    });
  }

  // Check 5: Links without accessible names (WCAG 2.4.4)
  const links = document.querySelectorAll('a[href]');
  const linksWithoutText: any[] = [];
  links.forEach((link, index) => {
    const text = link.textContent?.trim();
    const ariaLabel = link.getAttribute('aria-label');
    const ariaLabelledby = link.getAttribute('aria-labelledby');
    const title = link.getAttribute('title');
    
    if (!text && !ariaLabel && !ariaLabelledby && !title) {
      linksWithoutText.push({
        html: link.outerHTML,
        target: [`a:nth-child(${index + 1})`],
        failureSummary: 'Link does not have accessible text'
      });
    }
  });

  if (linksWithoutText.length > 0) {
    violations.push({
      id: 'link-name',
      impact: 'serious',
      description: 'Links must have discernible text',
      help: 'Links must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/link-name',
      tags: ['wcag2a', 'wcag244', 'wcag412', 'cat.name-role-value'],
      nodes: linksWithoutText
    });
  }

  // Check 6: Button elements without accessible names (WCAG 4.1.2)
  const buttons = document.querySelectorAll('button');
  const buttonsWithoutText: any[] = [];
  buttons.forEach((button, index) => {
    const text = button.textContent?.trim();
    const ariaLabel = button.getAttribute('aria-label');
    const ariaLabelledby = button.getAttribute('aria-labelledby');
    
    if (!text && !ariaLabel && !ariaLabelledby) {
      buttonsWithoutText.push({
        html: button.outerHTML,
        target: [`button:nth-child(${index + 1})`],
        failureSummary: 'Button does not have accessible text'
      });
    }
  });

  if (buttonsWithoutText.length > 0) {
    violations.push({
      id: 'button-name',
      impact: 'critical',
      description: 'Buttons must have discernible text',
      help: 'Buttons must have discernible text',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/button-name',
      tags: ['wcag2a', 'wcag412', 'cat.name-role-value'],
      nodes: buttonsWithoutText
    });
  }

  // Check 7: Headings in logical order (WCAG 1.3.1)
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels: number[] = [];
  const skippedHeadings: any[] = [];
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    headingLevels.push(level);
  });

  for (let i = 1; i < headingLevels.length; i++) {
    const current = headingLevels[i];
    const previous = headingLevels[i - 1];
    
    if (current > previous + 1) {
      skippedHeadings.push({
        html: headings[i].outerHTML,
        target: [headings[i].tagName.toLowerCase()],
        failureSummary: `Heading level skips from h${previous} to h${current}`
      });
    }
  }

  if (skippedHeadings.length > 0) {
    violations.push({
      id: 'heading-order',
      impact: 'moderate',
      description: 'Heading levels should only increase by one',
      help: 'Heading levels should only increase by one',
      helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/heading-order',
      tags: ['wcag2a', 'wcag131', 'cat.semantics'],
      nodes: skippedHeadings
    });
  }

  // Add some passes for successful checks
  if (images.length > 0 && imagesWithoutAlt.length === 0) {
    passes.push({
      id: 'image-alt',
      description: 'Images have alternative text',
      help: 'Images must have alternate text'
    });
  }

  if (title && title.textContent?.trim()) {
    passes.push({
      id: 'document-title',
      description: 'Document has a title',
      help: 'Documents must have <title> element to aid in navigation'
    });
  }

  if (htmlElement.getAttribute('lang')) {
    passes.push({
      id: 'html-has-lang',
      description: 'The html element has a lang attribute',
      help: '<html> element must have a lang attribute'
    });
  }

  return {
    violations,
    passes,
    incomplete: []
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

    // Fetch the HTML content directly
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 15000
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Unable to fetch the URL. Server responded with status: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    console.log('HTML fetched, length:', html.length);

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
      violations: results.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: violation.tags,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary || ''
        })).slice(0, 5) // Limit to first 5 nodes per violation
      })),
      passes: results.passes.map(pass => ({
        id: pass.id,
        description: pass.description,
        help: pass.help
      })),
      incomplete: results.incomplete.map(incomplete => ({
        id: incomplete.id,
        impact: incomplete.impact,
        description: incomplete.description,
        help: incomplete.help,
        helpUrl: incomplete.helpUrl,
        tags: incomplete.tags,
        nodes: incomplete.nodes.map(node => ({
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