import React, { useState } from "react";
import { AlertCircle, Code2, History, Upload, Loader2, Shield, FileText, GitCompare, Check } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type CodeAnalysis } from "@shared/schema";
import { CodeEditor } from "@/components/code-editor";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const { toast } = useToast();

  const recentAnalysesQuery = useQuery({
    queryKey: ["/api/analyses"],
    queryFn: async () => {
      const res = await fetch("/api/analyses");
      if (!res.ok) throw new Error("Failed to fetch recent analyses");
      return res.json() as Promise<CodeAnalysis[]>;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }
      return response.json() as Promise<CodeAnalysis>;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      recentAnalysesQuery.refetch();
      toast({
        title: "Analysis Complete",
        description: "Your code has been successfully analyzed!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      setCode(data.code);
      setLanguage(data.language);

      toast({
        title: "Upload Successful",
        description: "File has been successfully uploaded and processed!",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Code Analysis Platform</h1>
          <p className="text-gray-500 mt-1">Analyze, optimize, and understand your code with AI insights.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Code Editor</CardTitle>
              <select 
                className="border p-2 rounded bg-background"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </CardHeader>
            <CardContent>
              <CodeEditor
                language={language}
                onChange={setCode}
                value={code}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  className="px-4 py-2 border rounded hover:bg-muted" 
                  onClick={() => setCode("")}
                >
                  Clear
                </button>
                <button 
                  className="px-4 py-2 bg-primary text-primary-foreground rounded flex items-center gap-2 disabled:opacity-50 hover:bg-primary/90" 
                  onClick={() => analyzeMutation.mutate()}
                  disabled={!code || analyzeMutation.isPending}
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Code2 className="h-4 w-4" />
                      Analyze Code
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {analysis && analysis.analysis && (
            <Tabs defaultValue="metrics" className="space-y-6">
              <TabsList className="grid grid-cols-4 gap-4">
                <TabsTrigger value="metrics">Metrics & Complexity</TabsTrigger>
                <TabsTrigger value="explanation">Code Explanation</TabsTrigger>
                <TabsTrigger value="optimization">Optimization</TabsTrigger>
                <TabsTrigger value="security">Security & Best Practices</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="text-blue-600 font-semibold">Cyclomatic Complexity</div>
                      <div className="text-2xl font-bold">{analysis.analysis.metrics?.cyclomaticComplexity}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50">
                    <CardContent className="pt-6">
                      <div className="text-green-600 font-semibold">Maintainability</div>
                      <div className="text-2xl font-bold">{analysis.analysis.metrics?.maintainabilityIndex}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50">
                    <CardContent className="pt-6">
                      <div className="text-purple-600 font-semibold">Lines of Code</div>
                      <div className="text-2xl font-bold">{analysis.analysis.metrics?.linesOfCode}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Time Complexity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">{analysis.analysis.explanation?.timeComplexity?.description}</div>
                      <div className="font-mono text-primary">{analysis.analysis.explanation?.timeComplexity?.bigO}</div>
                      <div className="text-sm">{analysis.analysis.explanation?.timeComplexity?.explanation}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Space Complexity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">{analysis.analysis.explanation?.spaceComplexity?.description}</div>
                      <div className="font-mono text-primary">{analysis.analysis.explanation?.spaceComplexity?.bigO}</div>
                      <div className="text-sm">{analysis.analysis.explanation?.spaceComplexity?.explanation}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="explanation">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Explanation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold">Overview</h3>
                      <p>{analysis.analysis.explanation?.overview}</p>

                      <h3 className="text-lg font-semibold mt-6">Implementation Details</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        {analysis.analysis.explanation?.bestPractices?.map((practice, i) => (
                          <li key={i} className="text-gray-700">{practice}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="optimization">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitCompare className="h-5 w-5" />
                      Code Optimization
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-2">Original Code</h3>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Optimized Code</h3>
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                          <code>{analysis.analysis.optimizedCode}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Improvement Suggestions</h3>
                      {analysis.analysis.suggestions.map((suggestion, i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              suggestion.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                              suggestion.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {suggestion.priority} Priority
                            </span>
                            <h4 className="font-medium">{suggestion.title}</h4>
                          </div>
                          <p className="text-muted-foreground mb-2">{suggestion.description}</p>
                          {suggestion.codeExample && (
                            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                              <code>{suggestion.codeExample}</code>
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security Considerations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.analysis.explanation?.securityConsiderations?.map((security, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{security}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code2 className="h-5 w-5" />
                        Best Practices
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.analysis.explanation?.bestPractices?.map((practice, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                            <span className="text-gray-700">{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Code
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="py-6 border-2 border-dashed rounded-lg hover:border-primary/50 transition-colors">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Upload code file or handwritten image</p>
                <input
                  type="file"
                  accept=".py,.js,.java,.cpp,image/*"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileUpload}
                />
                <label 
                  htmlFor="file-upload" 
                  className="mt-4 px-4 py-2 border rounded block mx-auto w-max cursor-pointer hover:bg-muted"
                >
                  Choose File
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentAnalysesQuery.data?.slice(0, 5).map((analysis) => (
                  <button
                    key={analysis.id}
                    onClick={() => {
                      setCode(analysis.code);
                      setLanguage(analysis.language);
                      setAnalysis(analysis);
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-muted rounded-md text-left"
                  >
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {analysis.code.split('\n')[0].substring(0, 30)}...
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}