
const applyInlineFormatting = (str: string): string => {
    if (!str) return '';
    return str
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, (_, code) => `<code class="bg-slate-700/60 px-1.5 py-1 rounded text-sm font-mono">${(code || '').trim()}</code>`)
        .replace(/==(.*?)==/g, '<mark class="bg-yellow-500/20 text-yellow-200 px-0.5 rounded border border-yellow-500/30">$1</mark>');
};

export const parseMarkdown = (text: string, options?: { handleLatex?: boolean }): string => {
    if (!text) return '';

    let processedText = text;
    const latexExpressions: string[] = [];
    
    if (options?.handleLatex) {
        let placeholderIndex = 0;
        processedText = text.replace(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g, (match) => {
            latexExpressions.push(match);
            return `__LATEX_PLACEHOLDER_${placeholderIndex++}__`;
        });
    }

    let html = processedText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Safely trim code blocks. The code capture group might be empty or whitespace.
    html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-slate-700/60 p-3 rounded-md my-2 text-sm text-slate-200 whitespace-pre-wrap font-mono"><code>${(code || '').trim()}</code></pre>`);

    const lines = html.split('\n');
    let resultHtml = '';
    let inList = false;
    let listType = '';

    for (const line of lines) {
        if (line.startsWith('<pre')) {
            if (inList) {
                resultHtml += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
            }
            resultHtml += line;
            continue;
        }

        const headingMatch = line.match(/^(#{1,3})\s(.*)/);
        if (headingMatch) {
            if (inList) {
                resultHtml += listType === 'ul' ? '</ul>' : '</ol>';
                inList = false;
            }
            const level = headingMatch[1].length;
            const content = applyInlineFormatting(headingMatch[2]);
            let className = '';
            if (level === 1) className = "text-2xl font-extrabold mt-6 mb-4";
            if (level === 2) className = "text-xl font-bold mt-5 mb-3";
            if (level === 3) className = "text-lg font-semibold mt-4 mb-2";
            resultHtml += `<h${level} class="${className}">${content}</h${level}>`;
            continue;
        }

        const ulMatch = line.match(/^(\s*)(\*|-)\s(.*)/);
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                if (inList) resultHtml += '</ol>';
                resultHtml += '<ul>';
                inList = true;
                listType = 'ul';
            }
            resultHtml += `<li>${applyInlineFormatting(ulMatch[3])}</li>`;
            continue;
        }

        const olMatch = line.match(/^(\s*)\d+\.\s(.*)/);
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                if (inList) resultHtml += '</ul>';
                resultHtml += '<ol>';
                inList = true;
                listType = 'ol';
            }
            resultHtml += `<li>${applyInlineFormatting(olMatch[2])}</li>`;
            continue;
        }

        if (inList) {
            resultHtml += listType === 'ul' ? '</ul>' : '</ol>';
            inList = false;
        }

        if (line.trim()) {
            resultHtml += `<p>${applyInlineFormatting(line)}</p>`;
        }
    }

    if (inList) {
        resultHtml += listType === 'ul' ? '</ul>' : '</ol>';
    }
    
    let finalHtml = resultHtml.replace(/<p><\/p>/g, '');

    if (options?.handleLatex) {
        finalHtml = finalHtml.replace(/__LATEX_PLACEHOLDER_(\d+)__/g, (_, index) => {
            const rawLatex = latexExpressions[parseInt(index, 10)];
            return rawLatex.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        });
    }
    
    return finalHtml;
};
