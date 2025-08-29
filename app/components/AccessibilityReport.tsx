interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AccessibilityReport {
  url: string;
  violations: AccessibilityViolation[];
  passes: Array<{
    id: string;
    description: string;
    help: string;
  }>;
  incomplete: AccessibilityViolation[];
  timestamp: string;
}

interface AccessibilityReportProps {
  report: AccessibilityReport;
}

const impactColors = {
  minor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  moderate: 'bg-orange-100 text-orange-800 border-orange-200',
  serious: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-red-200 text-red-900 border-red-300'
};

const impactIcons = {
  minor: '⚠️',
  moderate: '🟠',
  serious: '🔴',
  critical: '🚨'
};

export default function AccessibilityReport({ report }: AccessibilityReportProps) {
  const totalIssues = report.violations.length;
  const criticalIssues = report.violations.filter(v => v.impact === 'critical').length;
  const seriousIssues = report.violations.filter(v => v.impact === 'serious').length;
  const moderateIssues = report.violations.filter(v => v.impact === 'moderate').length;
  const minorIssues = report.violations.filter(v => v.impact === 'minor').length;

  const getWcagLevel = (tags: string[]) => {
    if (tags.includes('wcag2aaa')) return 'AAA';
    if (tags.includes('wcag2aa')) return 'AA';
    if (tags.includes('wcag2a')) return 'A';
    return 'N/A';
  };

  const getWcagCriteria = (tags: string[]) => {
    const criteria = tags.filter(tag => tag.match(/wcag\d+/));
    return criteria.map(c => c.replace('wcag', 'WCAG ').replace(/(\d)(\d)(\d)/, '$1.$2.$3')).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Accessibility Test Results
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalIssues}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total Issues</div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {criticalIssues}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Critical</div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {seriousIssues}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">Serious</div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {moderateIssues}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Moderate</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {minorIssues}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Minor</div>
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span className="font-medium">URL:</span> {report.url}
          <br />
          <span className="font-medium">Tested on:</span> {new Date(report.timestamp).toLocaleString()}
        </div>
      </div>

      {totalIssues === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-4xl mr-4">🎉</div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-400">
                Congratulations!
              </h3>
              <p className="text-green-700 dark:text-green-300">
                No accessibility violations were found on this page.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Accessibility Violations
          </h3>
          
          {report.violations.map((violation, index) => (
            <div 
              key={violation.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border-red-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{impactIcons[violation.impact]}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {violation.help}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${impactColors[violation.impact]}`}>
                          {violation.impact.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded">
                          {getWcagLevel(violation.tags)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <a
                    href={violation.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Learn more →
                  </a>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {violation.description}
                </p>

                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    WCAG Criteria:
                  </h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getWcagCriteria(violation.tags) || 'Not specified'}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Affected Elements ({violation.nodes.length}):
                  </h5>
                  <div className="space-y-2">
                    {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                      <div 
                        key={nodeIndex}
                        className="bg-gray-50 dark:bg-gray-700 p-3 rounded border"
                      >
                        <div className="text-sm font-mono text-gray-800 dark:text-gray-200 mb-1">
                          Selector: {node.target.join(', ')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {node.failureSummary}
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                            View HTML
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                            <code>{node.html}</code>
                          </pre>
                        </details>
                      </div>
                    ))}
                    {violation.nodes.length > 3 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ... and {violation.nodes.length - 3} more elements
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {report.passes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">
            ✅ Passed Tests ({report.passes.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {report.passes.slice(0, 10).map((pass, index) => (
              <div key={pass.id} className="text-sm text-gray-600 dark:text-gray-400">
                • {pass.help}
              </div>
            ))}
            {report.passes.length > 10 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 col-span-2">
                ... and {report.passes.length - 10} more passed tests
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}