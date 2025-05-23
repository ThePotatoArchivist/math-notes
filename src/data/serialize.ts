import {
    BlockData,
    EmbedBlockData,
    NoteBlockData,
    Segment,
    TableBlockData,
} from './notes';
import { KeyedArray, addKey } from './keys';

type SerializedBlocks = (
    | (Omit<NoteBlockData, 'content'> & { content: Segment[] })
    | TableBlockData
    | EmbedBlockData
)[];

type SerializedDocument = {
    title: string;
    meta?: string;
    blocks: SerializedBlocks;
    version: 3;
};

function serializeBlocks(blocks: KeyedArray<BlockData>) {
    return blocks.map(block => {
        const output = omit(block, 'key');

        if (block.type === 'NOTE') {
            const segments = block.content.map(e => omit(e, 'key'));
            return { ...output, content: segments };
        }

        return output;
    }) as SerializedBlocks;
}

function serializeDocument(
    title: string,
    blocks: KeyedArray<BlockData>
): SerializedDocument {
    return {
        title,
        meta: `Open this document at ${window.location.href}`,
        blocks: serializeBlocks(blocks),
        version: 3,
    };
}

function deserializeDocument(
    serialized: SerializedBlocks
): KeyedArray<BlockData> {
    return serialized
        .map(e =>
            e.type === 'NOTE' ? { ...e, content: e.content.map(addKey) } : e
        )
        .map(addKey);
}

function rep(text: string, count: number) {
    return Array(count).fill(text).join('');
}

function latexFix(latex: string) {
    return latex
        .replace(/\\lim_/g, '\\lim\\limits_')
        .replace(/\\int_{ }\^{ }(?=[A-Za-z])/g, '\\int ')
        .replace(/\\int_{ }\^{ }(?![A-Za-z])/g, '\\int')
        .replace(/\\mid_/g, '\\bigg\\rvert_')
        .replace(/(=|<|>|\\ne|\\ge|\\le)\^\?/g, '\\stackrel{?}{$1}')
        .replace(/\\cup_/g, '\\bigcup_')
        .replace(/\\cap_/g, '\\bigcap_')
        .replace(/#/g, '\\#');
}

function matrix(cells: string[][], prefix: string, firstLinePrefix = prefix) {
    return (
        `${firstLinePrefix}\\begin{bmatrix}\n` +
        cells.map(row => `${prefix}${row.join(' & ')}`).join('\\\\\n') + '\n' +
        `${prefix}\\end{bmatrix}`
    )
}

function documentToMarkdown(
    title: string,
    blocks: KeyedArray<BlockData>,
    appendJson: boolean = false,
): string {
    return (
        (title ? `# ${title}\n\n` : '') +
        blocks
            .map(block => {
                const indentSpaces = rep('  ', block.indent);

                switch (block.type) {
                    case 'NOTE': {
                        const mathBlock = block.content.every(
                            segment =>
                                segment.type === 'MATH' ||
                                segment.content === ''
                        )

                        return `${indentSpaces}- ${
                            block.isAnswer ? '> ' : ''
                        }${block.content
                            .map(e =>
                                e.type === 'MATH'
                                    ? e.content === '' 
                                        ? ' ' 
                                        : mathBlock
                                            ? `$$${latexFix(e.content)}$$`
                                            : `$${latexFix(e.content)}$`
                                    : e.content
                            )
                            .join('')}`;
                    }
                    case 'TABLE':
                        return (
                            `${indentSpaces}- ` +
                            rep('|     ', block.cells[0].length) +
                            '|\n' +
                            `${indentSpaces}  ` +
                            rep('| --- ', block.cells[0].length) +
                            '|\n' +
                            block.cells
                                .map(
                                    e =>
                                        `${indentSpaces}  |${e
                                            .map(f => ` $$${f}$$ `)
                                            .join('|')}|`
                                )
                                .join('\n')
                        );
                    case 'MATRIX':
                        return '- $$' + matrix(block.cells, indentSpaces + '  ', '') + '$$'
                    case 'MATMUL':
                        return (
                            `${indentSpaces}- $$\\begin{array}{}\n` + 
                            `${indentSpaces}  &\n` +
                            matrix(block.second, indentSpaces + '  ') + '\n' +
                            `${indentSpaces}  \\\\ \\\\\n` +
                            matrix(block.first, indentSpaces + '  ') + '\n' +
                            `${indentSpaces}  &\n` +
                            matrix(block.result, indentSpaces + '  ') + '\n' +
                            `${indentSpaces}  \\end{array}$$`
                        )
                    case 'EMBED':
                        return `${indentSpaces}- <iframe src=${block.url} width=900 height=500 style="border: none;" />`;
                }
            })
            .join('\n') +
        (appendJson ? `\n- \`\`\`json\n  ${JSON.stringify(serializeDocument(title, blocks))}\n  \`\`\`` : '')
    );
}

function omit<T extends object, K extends keyof T>(
    object: T,
    prop: K
): Omit<T, K> {
    const result: Partial<T> = {};
    (Object.keys(object) as (keyof T)[]).forEach(e => {
        if (e === prop) return;
        result[e] = object[e];
    });
    return result as Omit<T, K>;
}

export type { SerializedDocument, SerializedBlocks };
export {
    serializeBlocks,
    serializeDocument,
    deserializeDocument,
    documentToMarkdown,
};
