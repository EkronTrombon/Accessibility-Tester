# Accessibility Tester

A comprehensive web accessibility testing tool built with Next.js that analyzes websites for WCAG compliance issues. This tool can test both static HTML and JavaScript-rendered content using Firecrawl integration.

## Features

- **Comprehensive WCAG Testing**: Tests for 15+ accessibility violations including images without alt text, form labels, color contrast, heading structure, and more
- **JavaScript-Enabled Testing**: Uses Firecrawl API to test fully rendered pages including SPAs and dynamic content
- **Fallback Support**: Automatically falls back to direct HTML fetch if Firecrawl is unavailable
- **Detailed Reports**: Provides actionable insights with links to WCAG documentation
- **Modern UI**: Clean, responsive interface with dark/light mode support

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firecrawl (Optional but Recommended)

To enable JavaScript-rendered content testing:

1. Get a Firecrawl API key from [firecrawl.dev](https://firecrawl.dev)
2. Add it to your `.env.local` file:

```bash
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
