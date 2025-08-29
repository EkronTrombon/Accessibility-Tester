export default function DemoPage() {
  return (
    <html lang="en">
      <head>
        <title>Accessibility Test Demo Page</title>
        <meta name="description" content="A demo page with various accessibility issues for testing" />
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', margin: '20px', lineHeight: '1.6' }}>
        <h1>Accessibility Test Demo Page</h1>
        
        <p>This page contains various accessibility issues for demonstration purposes.</p>
        
        {/* Missing alt text */}
        <img src="/next.svg" width="100" height="50" />
        
        {/* Poor color contrast */}
        <div style={{ background: '#ffff00', color: '#ffffff', padding: '10px', margin: '10px 0' }}>
          This text has poor color contrast
        </div>
        
        {/* Missing label for input */}
        <div style={{ margin: '20px 0' }}>
          <p>Enter your name:</p>
          <input type="text" placeholder="Name" />
        </div>
        
        {/* Non-semantic button */}
        <div 
          style={{ 
            background: '#007bff', 
            color: 'white', 
            padding: '10px 20px', 
            cursor: 'pointer',
            display: 'inline-block',
            margin: '10px 0'
          }}
          onClick={() => alert('Clicked!')}
        >
          Click Me (This should be a button)
        </div>
        
        {/* Missing heading hierarchy */}
        <h4>This is an h4 without h2 or h3</h4>
        <p>Heading levels should not skip levels.</p>
        
        {/* Link without descriptive text */}
        <p>
          <a href="https://example.com">Click here</a> to learn more.
        </p>
        
        {/* Empty link */}
        <a href="https://example.com"></a>
        
        {/* Form without fieldset/legend */}
        <form style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc' }}>
          <div>
            <input type="radio" id="option1" name="options" />
            <label htmlFor="option1">Option 1</label>
          </div>
          <div>
            <input type="radio" id="option2" name="options" />
            <label htmlFor="option2">Option 2</label>
          </div>
        </form>
        
        {/* Table without headers */}
        <table style={{ borderCollapse: 'collapse', margin: '20px 0' }}>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Name</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>Age</td>
          </tr>
          <tr>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>John</td>
            <td style={{ border: '1px solid #ccc', padding: '8px' }}>30</td>
          </tr>
        </table>
        
        {/* Good examples for contrast */}
        <h2>Some Good Examples</h2>
        
        <img src="/globe.svg" alt="Globe icon representing worldwide accessibility" width="50" height="50" />
        
        <form style={{ margin: '20px 0' }}>
          <fieldset>
            <legend>Choose your preferred contact method</legend>
            <div>
              <input type="radio" id="email" name="contact" />
              <label htmlFor="email">Email</label>
            </div>
            <div>
              <input type="radio" id="phone" name="contact" />
              <label htmlFor="phone">Phone</label>
            </div>
          </fieldset>
        </form>
        
        <button type="button" style={{ 
          background: '#28a745', 
          color: 'white', 
          border: 'none',
          padding: '10px 20px',
          cursor: 'pointer'
        }}>
          Properly Accessible Button
        </button>
        
        <p style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
          This demo page is designed to test accessibility features. 
          Use it with the accessibility tester to see how various issues are detected.
        </p>
      </body>
    </html>
  );
}