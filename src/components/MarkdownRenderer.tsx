import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize the rendering of links to open in a new tab
          a: ({ node, ...props }) => (
            <a 
              {...props} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-venice-coral hover:underline"
            />
          ),
          // Customize code blocks
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <div className="my-2 rounded-md overflow-hidden">
                <div className="bg-gray-100 px-4 py-1 text-xs text-gray-600 font-mono">
                  {match ? match[1] : 'code'}
                </div>
                <pre className="bg-gray-50 p-4 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          },
          // Customize blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote 
              className="border-l-4 border-venice-coral/50 pl-4 py-1 my-2 text-gray-600"
              {...props} 
            />
          ),
          // Customize lists
          ul: ({ node, ordered, ...props }) => (
            <ul className="list-disc pl-6 my-2 space-y-1" {...props} />
          ),
          ol: ({ node, ordered, ...props }) => (
            <ol className="list-decimal pl-6 my-2 space-y-1" {...props} />
          ),
          // Customize headings
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold my-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold my-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold my-2" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
