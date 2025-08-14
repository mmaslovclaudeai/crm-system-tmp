// src/components/client-card/components/MarkdownRenderer.jsx
import { useMemo } from 'react';

const MarkdownRenderer = ({ content, className = "" }) => {
  // Простой парсер Markdown для поддерживаемых элементов
  const parseMarkdown = useMemo(() => {
    if (!content) return '';

    let html = content;

    // Заголовки (# ## ###)
    html = html.replace(/^### (.+$)/gim, '<h3 class="text-md font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.+$)/gim, '<h2 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.+$)/gim, '<h1 class="text-xl font-bold text-gray-900 mt-4 mb-3">$1</h1>');

    // Жирный текст (**text**)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

    // Курсив (*text*)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');

    // Встроенный код (`code`)
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Блоки кода (```code```)
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 border border-gray-200 rounded-md p-3 my-2 overflow-x-auto"><code class="text-sm font-mono text-gray-800">$1</code></pre>');

    // Ссылки [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

    // Неупорядоченные списки (- item или * item)
    html = html.replace(/^[\-\*] (.+$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li class="ml-4">.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1 my-2">$1</ul>');

    // Упорядоченные списки (1. item)
    html = html.replace(/^\d+\. (.+$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li class="ml-4">.*<\/li>)/s, '<ol class="list-decimal list-inside space-y-1 my-2">$1</ol>');

    // Переносы строк
    html = html.replace(/\n\n/g, '</p><p class="mb-2">');
    html = html.replace(/\n/g, '<br />');

    // Оборачиваем в параграф, если нет других блочных элементов
    if (!html.includes('<h1') && !html.includes('<h2') && !html.includes('<h3') && !html.includes('<ul') && !html.includes('<ol') && !html.includes('<pre')) {
      html = `<p class="mb-2">${html}</p>`;
    } else {
      html = `<div>${html}</div>`;
    }

    return html;
  }, [content]);

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown }}
    />
  );
};

export default MarkdownRenderer;