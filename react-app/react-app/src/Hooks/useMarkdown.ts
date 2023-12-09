// useMarkdown.ts

import { useState, useEffect } from 'react';
import { marked, Lexer, Tokens, Token } from 'marked';
import DOMPurify from 'dompurify';
import Prism from 'prismjs';
import '../MarkdownStyles.css';
window.Prism = Prism;
require('prismjs/themes/prism.css');

// Token型が見出しであることを確認する型ガード
const isHeadingToken = (token: Tokens.Generic): token is Tokens.Heading => {
  return token.type === 'heading';
};

// 言語モジュールを動的にロードする関数
const loadLanguage = async (lang: string) => {
  if (!lang) return; // 言語が指定されていない場合は何もしない

  try {
    // PrismJSの言語ファイルを動的にロードする
    await require(`prismjs/components/prism-${lang}.js`);
  } catch (e) {
    console.warn(`Language '${lang}' not found in PrismJS`);
  }
};

// トークンから言語を抽出し、それに応じてハイライト処理を行う関数
const highlightCode = async (tokens: Token[]) => {
  for (const token of tokens) {
    if (token.type === 'code') {
      await loadLanguage(token.lang); // 言語モジュールをロード
      // ここでハイライト処理を実行する
      // Prism.highlightAll();
    }
  }
};

// マークダウンをHTMLに変換するカスタムフック
const useMarkdown = (markdown: string) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [toc, setToc] = useState<string[]>([]);

  useEffect(() => {
    const convertMarkdownToHtml = async () => {
      // マークダウンを解析してトークンを取得
      const tokens = marked.lexer(markdown);
      // トークンから言語を抽出してハイライト処理
      await highlightCode(tokens);

      // トークンから見出しをフィルタリングして目次を生成
      const headers = tokens
        .filter(isHeadingToken)
        .map(heading => heading.text);
      setToc(headers); // 目次を状態にセット

      // マークダウンをHTMLに変換してサニタイズ
      const unsafeHtml = marked.parser(tokens);
      const safeHtml = DOMPurify.sanitize(unsafeHtml);
      setHtmlContent(safeHtml); // サニタイズされたHTMLを状態にセット
    };

    convertMarkdownToHtml();
  }, [markdown]);

  useEffect(() => {
    Prism.highlightAll();
  }, [htmlContent]);

  return { htmlContent, toc };
};

export default useMarkdown;
