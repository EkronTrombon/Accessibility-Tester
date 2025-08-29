import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

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
  crawlMethod?: string;
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

const impactConfig = {
  minor: { 
    variant: 'secondary' as const, 
    icon: AlertTriangle, 
    color: 'text-yellow-600' 
  },
  moderate: { 
    variant: 'default' as const, 
    icon: AlertCircle, 
    color: 'text-orange-600' 
  },
  serious: { 
    variant: 'destructive' as const, 
    icon: XCircle, 
    color: 'text-red-600' 
  },
  critical: { 
    variant: 'destructive' as const, 
    icon: XCircle, 
    color: 'text-red-700' 
  }
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
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Test Results</CardTitle>
          <CardDescription>
            URL: {report.url} • Tested on: {new Date(report.timestamp).toLocaleString()}
            {report.crawlMethod && (
              <span className="ml-2">
                • Method: <Badge variant={report.crawlMethod === 'firecrawl' ? 'default' : 'secondary'}>
                  {report.crawlMethod === 'firecrawl' ? 'JavaScript-enabled' : 'Static HTML'}
                </Badge>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{totalIssues}</div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{criticalIssues}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{seriousIssues}</div>
                <div className="text-sm text-muted-foreground">Serious</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{moderateIssues}</div>
                <div className="text-sm text-muted-foreground">Moderate</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{minorIssues}</div>
                <div className="text-sm text-muted-foreground">Minor</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {totalIssues === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="font-semibold">
            🎉 Congratulations! No accessibility violations were found on this page.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Accessibility Violations
          </h3>
          
          {report.violations.map((violation) => {
            const ImpactIcon = impactConfig[violation.impact].icon;
            return (
              <Card key={violation.id} className="border-l-4 border-l-destructive">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <ImpactIcon className={`h-6 w-6 ${impactConfig[violation.impact].color}`} />
                      <div>
                        <CardTitle className="text-lg">{violation.help}</CardTitle>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={impactConfig[violation.impact].variant}>
                            {violation.impact.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            WCAG {getWcagLevel(violation.tags)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <a
                      href={violation.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-medium text-primary hover:text-primary/80"
                    >
                      Learn more <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {violation.description}
                  </p>

                  <div className="mb-4">
                    <h5 className="font-medium mb-2">WCAG Criteria:</h5>
                    <p className="text-sm text-muted-foreground">
                      {getWcagCriteria(violation.tags) || 'Not specified'}
                    </p>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h5 className="font-medium mb-2">
                      Affected Elements ({violation.nodes.length}):
                    </h5>
                    <div className="space-y-2">
                      {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                        <Card key={nodeIndex} className="bg-muted/50">
                          <CardContent className="pt-3">
                            <div className="text-sm font-mono mb-1">
                              <span className="font-medium">Selector:</span> {node.target.join(', ')}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {node.failureSummary}
                            </div>
                            <details className="text-xs">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View HTML
                              </summary>
                              <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                <code>{node.html}</code>
                              </pre>
                            </details>
                          </CardContent>
                        </Card>
                      ))}
                      {violation.nodes.length > 3 && (
                        <div className="text-sm text-muted-foreground">
                          ... and {violation.nodes.length - 3} more elements
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {report.passes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              Passed Tests ({report.passes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {report.passes.slice(0, 10).map((pass) => (
                <div key={pass.id} className="text-sm text-muted-foreground flex items-center">
                  <CheckCircle className="mr-2 h-3 w-3 text-green-600 flex-shrink-0" />
                  {pass.help}
                </div>
              ))}
              {report.passes.length > 10 && (
                <div className="text-sm text-muted-foreground col-span-2">
                  ... and {report.passes.length - 10} more passed tests
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}