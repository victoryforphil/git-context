"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, FileText, Folder, Copy, Download } from "lucide-react"

// Mock data for demonstration
const mockFileTree = {
  name: "ray-ray",
  type: "folder",
  children: [
    {
      name: "snek_notebook",
      type: "folder",
      children: [
        { name: "main.py", type: "file", url: "https://raw.githubusercontent.com/victoryforphil/ray-ray/main/snek_notebook/main.py" },
        { name: "config.json", type: "file", url: "https://raw.githubusercontent.com/victoryforphil/ray-ray/main/snek_notebook/config.json" },
        { name: "utils.py", type: "file", url: "https://raw.githubusercontent.com/victoryforphil/ray-ray/main/snek_notebook/utils.py" }
      ]
    },
    { name: "README.md", type: "file", url: "https://raw.githubusercontent.com/victoryforphil/ray-ray/main/README.md" },
    { name: "package.json", type: "file", url: "https://raw.githubusercontent.com/victoryforphil/ray-ray/main/package.json" }
  ]
}

const mockMarkdown = `# GitHub Repository Context

## Repository Structure

### snek_notebook/
- **main.py**: [Raw URL](https://raw.githubusercontent.com/victoryforphil/ray-ray/main/snek_notebook/main.py)
- **config.json**: [Raw URL](https://raw.githubusercontent.com/victoryforphil/ray-ray/main/snek_notebook/config.json)  
- **utils.py**: [Raw URL](https://raw.githubusercontent.com/victoryforphil/ray-ray/main/snek_notebook/utils.py)

### Root Files
- **README.md**: [Raw URL](https://raw.githubusercontent.com/victoryforphil/ray-ray/main/README.md)
- **package.json**: [Raw URL](https://raw.githubusercontent.com/victoryforphil/ray-ray/main/package.json)

## Usage Instructions for AI Agents

This context provides direct access to repository files via raw GitHub URLs. Use these links to:
1. Analyze code structure and dependencies
2. Understand project architecture
3. Access specific file contents for detailed analysis

Total files indexed: 5
Repository depth: 2 levels`

interface FileNode {
  name: string
  type: "file" | "folder"
  url?: string
  children?: FileNode[]
}

const FileTreeItem = ({ node, depth = 0 }: { node: FileNode; depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  
  return (
    <div className={`ml-${depth * 4}`}>
      <div className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded px-2">
        {node.type === "folder" ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Folder className="h-4 w-4" />
            </Button>
            <span className="font-medium">{node.name}</span>
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 ml-6" />
            <span>{node.name}</span>
            {node.url && (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
      {node.type === "folder" && isExpanded && node.children && (
        <div className="ml-4">
          {node.children.map((child, index) => (
            <FileTreeItem key={index} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [githubUrl, setGithubUrl] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileTree, setFileTree] = useState<FileNode | null>(null)
  const [generatedMarkdown, setGeneratedMarkdown] = useState("")

  const handleProcess = async () => {
    if (!githubUrl.trim()) return
    
    setIsProcessing(true)
    // Simulate processing time
    setTimeout(() => {
      setFileTree(mockFileTree)
      setGeneratedMarkdown(mockMarkdown)
      setIsProcessing(false)
    }, 2000)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMarkdown)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Github className="h-10 w-10" />
            GitHub Repository Indexer
          </h1>
          <p className="text-muted-foreground text-lg">
            Generate AI-friendly markdown context from GitHub repositories
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Repository Input</CardTitle>
            <CardDescription>
              Enter a GitHub repository URL or specific path to index files and generate context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="https://github.com/user/repo or https://github.com/user/repo/tree/main/folder"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleProcess} 
                disabled={!githubUrl.trim() || isProcessing}
                className="min-w-[120px]"
              >
                {isProcessing ? "Processing..." : "Index Repository"}
              </Button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="mb-2">Supported URL formats:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Repository root: https://github.com/user/repo</li>
                <li>Specific folder: https://github.com/user/repo/tree/branch/folder</li>
                <li>Specific file: https://github.com/user/repo/blob/branch/file.ext</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {fileTree && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  File Tree
                </CardTitle>
                <CardDescription>
                  Repository structure with raw file links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <FileTreeItem node={fileTree} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Context
                </CardTitle>
                <CardDescription>
                  AI-friendly markdown for agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={copyToClipboard} size="sm" className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {generatedMarkdown}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!fileTree && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Github className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter a GitHub URL above to start indexing</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}